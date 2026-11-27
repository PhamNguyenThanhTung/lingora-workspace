'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeLanguageCode } from '@lingora/lesson-content';
import type { LanguageDto } from '@/server/languages';
import type {
  CharacterCatalogueItemDto,
  WritingScriptType,
} from '@/server/characters';
import {
  WRITING_SCRIPT_TYPES,
  getAllowedScriptsForLanguageCode,
  validateAndNormalizeGlyph,
} from '@/server/characters/validator';
import { SessionLostModal } from './SessionLostModal';
import { useModalInertAndFocusRestore } from './focusRestore';

const SCRIPT_LABELS: Record<WritingScriptType, string> = {
  HIRAGANA: 'Hiragana',
  KATAKANA: 'Katakana',
  KANJI: 'Kanji',
  HANZI_SIMPLIFIED: 'Hán tự Giản thể',
  HANZI_TRADITIONAL: 'Hán tự Phồn thể',
};

const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const HSK_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const DEFAULT_PAGE_LIMIT = 20;

export interface CharacterCatalogueProps {
  initialCharacters?: CharacterCatalogueItemDto[];
  initialTotal?: number;
  initialLimit?: number;
  initialOffset?: number;
  initialLanguages?: LanguageDto[];
  initialError?: string | null;
  isLoading?: boolean;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

function getLanguageDisplayName(lang: { code: string | null; names: Record<string, string> | null }): string {
  const vi = lang.names?.vi;
  const en = lang.names?.en;
  if (vi && lang.code) return `${vi} (${lang.code})`;
  if (vi) return vi;
  if (en && lang.code) return `${en} (${lang.code})`;
  return lang.code || 'Không rõ';
}

function resolveGlyphLangTag(languageCode: string | null, scriptType: WritingScriptType): string | undefined {
  const normalized = normalizeLanguageCode(languageCode);
  if (normalized) return normalized;
  if (scriptType === 'HIRAGANA' || scriptType === 'KATAKANA' || scriptType === 'KANJI') {
    return 'ja';
  }
  if (scriptType === 'HANZI_SIMPLIFIED') return 'zh-Hans';
  if (scriptType === 'HANZI_TRADITIONAL') return 'zh-Hant';
  return undefined;
}

function splitCommaValues(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatCodePoints(glyph: string): string {
  return Array.from(glyph)
    .map((ch) => {
      const cp = ch.codePointAt(0);
      return cp !== undefined ? `U+${cp.toString(16).toUpperCase().padStart(4, '0')}` : '';
    })
    .filter(Boolean)
    .join(' ');
}

interface PendingCharacterPayload {
  languageId: string;
  languageLabel: string;
  languageCode: string;
  glyph: string;
  scriptType: WritingScriptType;
  strokeCount: number;
  meaning: string | null;
  primaryReading: string | null;
  romanization: string | null;
  metadata: Record<string, unknown>;
}

interface CharacterFormModalProps {
  isOpen: boolean;
  languages: LanguageDto[];
  defaultLanguageId?: string;
  triggerElement?: HTMLElement | null;
  onClose: () => void;
  onSuccess: (created: CharacterCatalogueItemDto) => void;
  onForbidden: (message?: string) => void;
  onSessionExpired: () => void;
}

function CharacterFormModal({
  isOpen,
  languages,
  defaultLanguageId,
  triggerElement,
  onClose,
  onSuccess,
  onForbidden,
  onSessionExpired,
}: CharacterFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState<'edit' | 'confirm'>('edit');

  const scriptSupportedLanguages = useMemo(
    () => languages.filter((lang) => getAllowedScriptsForLanguageCode(lang.code).length > 0),
    [languages]
  );

  const [languageId, setLanguageId] = useState('');
  const [scriptType, setScriptType] = useState<WritingScriptType>('KANJI');
  const [glyph, setGlyph] = useState('');
  const [strokeCount, setStrokeCount] = useState('1');
  const [meaning, setMeaning] = useState('');
  const [primaryReading, setPrimaryReading] = useState('');
  const [romanization, setRomanization] = useState('');
  const [jlptLevel, setJlptLevel] = useState('');
  const [onyomiInput, setOnyomiInput] = useState('');
  const [kunyomiInput, setKunyomiInput] = useState('');
  const [pinyinInput, setPinyinInput] = useState('');
  const [hskLevel, setHskLevel] = useState('');
  const [notes, setNotes] = useState('');

  const [pendingPayload, setPendingPayload] = useState<PendingCharacterPayload | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const glyphInputRef = useRef<HTMLInputElement>(null);
  const languageSelectRef = useRef<HTMLSelectElement>(null);
  const isPendingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  const selectedLanguage = useMemo(
    () => scriptSupportedLanguages.find((l) => l.id === languageId) || null,
    [scriptSupportedLanguages, languageId]
  );

  const allowedScripts = useMemo(() => {
    if (!selectedLanguage) return [] as readonly WritingScriptType[];
    return getAllowedScriptsForLanguageCode(selectedLanguage.code);
  }, [selectedLanguage]);

  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      setStep('edit');
      setPendingPayload(null);
      setFieldErrors({});
      setGeneralError(null);
      setIsPending(false);
      isPendingRef.current = false;
      return;
    }

    const preferredLang =
      scriptSupportedLanguages.find((l) => l.id === defaultLanguageId) ||
      scriptSupportedLanguages.find((l) => l.code.toLowerCase() === 'ja') ||
      scriptSupportedLanguages[0] ||
      null;

    const initialLangId = preferredLang?.id || '';
    const initialScripts = preferredLang ? getAllowedScriptsForLanguageCode(preferredLang.code) : [];
    const initialScript: WritingScriptType = initialScripts.includes('KANJI')
      ? 'KANJI'
      : initialScripts[0] || 'KANJI';

    setStep('edit');
    setLanguageId(initialLangId);
    setScriptType(initialScript);
    setGlyph('');
    setStrokeCount('1');
    setMeaning('');
    setPrimaryReading('');
    setRomanization('');
    setJlptLevel('');
    setOnyomiInput('');
    setKunyomiInput('');
    setPinyinInput('');
    setHskLevel('');
    setNotes('');
    setPendingPayload(null);
    setFieldErrors({});
    setGeneralError(null);
    setIsPending(false);
    isPendingRef.current = false;
    setInitialized(true);

    const timer = window.setTimeout(() => {
      if (glyphInputRef.current) {
        glyphInputRef.current.focus();
      } else {
        languageSelectRef.current?.focus();
      }
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isOpen, defaultLanguageId, scriptSupportedLanguages]);

  const handleDismiss = useCallback(() => {
    if (isPendingRef.current) return;
    onClose();
    window.setTimeout(() => {
      if (triggerElement && typeof triggerElement.focus === 'function') {
        triggerElement.focus();
      }
    }, 50);
  }, [onClose, triggerElement]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPendingRef.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        handleDismiss();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  const handleLanguageChange = (nextLangId: string) => {
    setLanguageId(nextLangId);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.languageId;
      delete next.scriptType;
      return next;
    });
    const nextLang = scriptSupportedLanguages.find((l) => l.id === nextLangId);
    if (nextLang) {
      const allowed = getAllowedScriptsForLanguageCode(nextLang.code);
      if (!allowed.includes(scriptType) && allowed.length > 0) {
        setScriptType(allowed[0]);
      }
    }
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingRef.current) return;

    const errors: Record<string, string> = {};
    setGeneralError(null);

    if (!languageId || !selectedLanguage) {
      errors.languageId = 'Vui lòng chọn ngôn ngữ hỗ trợ bảng ký tự.';
    }

    if (!allowedScripts.includes(scriptType)) {
      errors.scriptType = 'Loại chữ không phù hợp với ngôn ngữ đã chọn.';
    }

    const trimmedGlyph = glyph.trim();
    const glyphCheck = validateAndNormalizeGlyph(trimmedGlyph);
    if (!glyphCheck.valid) {
      errors.glyph =
        !trimmedGlyph
          ? 'Ký tự không được để trống.'
          : 'Ký tự phải là đúng 1 ký tự Unicode hợp lệ (không nhiều ký tự).';
    }

    const parsedStrokeCount = Number(strokeCount);
    if (!Number.isInteger(parsedStrokeCount) || parsedStrokeCount < 1 || parsedStrokeCount > 128) {
      errors.strokeCount = 'Số nét phải là số nguyên từ 1 đến 128.';
    }

    const trimmedMeaning = meaning.trim();
    if (trimmedMeaning.length > 500) {
      errors.meaning = 'Nghĩa tối đa 500 ký tự.';
    }

    const trimmedReading = primaryReading.trim();
    if (trimmedReading.length > 255) {
      errors.primaryReading = 'Cách đọc tối đa 255 ký tự.';
    }

    const trimmedRomanization = romanization.trim();
    if (trimmedRomanization.length > 255) {
      errors.romanization = 'Phiên âm Latin tối đa 255 ký tự.';
    }

    if (Object.keys(errors).length > 0 || !glyphCheck.valid || !selectedLanguage) {
      setFieldErrors(errors);
      if (errors.glyph) {
        glyphInputRef.current?.focus();
      }
      return;
    }

    const metadata: Record<string, unknown> = {};
    if (scriptType === 'KANJI') {
      if (jlptLevel) metadata.jlptLevel = jlptLevel;
      const onyomi = splitCommaValues(onyomiInput);
      if (onyomi.length > 0) metadata.onyomi = onyomi;
      const kunyomi = splitCommaValues(kunyomiInput);
      if (kunyomi.length > 0) metadata.kunyomi = kunyomi;
    } else if (scriptType === 'HANZI_SIMPLIFIED' || scriptType === 'HANZI_TRADITIONAL') {
      const pinyin = splitCommaValues(pinyinInput);
      if (pinyin.length > 0) metadata.pinyin = pinyin;
      if (hskLevel) metadata.hskLevel = Number(hskLevel);
    }

    const trimmedNotes = notes.trim();
    if (trimmedNotes) {
      metadata.notes = trimmedNotes;
    }

    setFieldErrors({});
    setPendingPayload({
      languageId: selectedLanguage.id,
      languageLabel: getLanguageDisplayName({
        code: selectedLanguage.code,
        names: selectedLanguage.names,
      }),
      languageCode: selectedLanguage.code,
      glyph: glyphCheck.glyph,
      scriptType,
      strokeCount: parsedStrokeCount,
      meaning: trimmedMeaning || null,
      primaryReading: trimmedReading || null,
      romanization: trimmedRomanization || null,
      metadata,
    });
    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    if (isPendingRef.current || !pendingPayload) return;

    setIsPending(true);
    isPendingRef.current = true;
    setGeneralError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify({
          languageId: pendingPayload.languageId,
          glyph: pendingPayload.glyph,
          scriptType: pendingPayload.scriptType,
          strokeCount: pendingPayload.strokeCount,
          meaning: pendingPayload.meaning,
          primaryReading: pendingPayload.primaryReading,
          romanization: pendingPayload.romanization,
          metadata: pendingPayload.metadata,
        }),
      });

      if (res.status === 401) {
        setIsPending(false);
        isPendingRef.current = false;
        onSessionExpired();
        return;
      }

      if (res.status === 403) {
        const json = await res.json().catch(() => null);
        setIsPending(false);
        isPendingRef.current = false;
        onForbidden(json?.error?.message);
        return;
      }

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const serverFields: Record<string, string> = json?.error?.fields || {};
        const message =
          json?.error?.message ||
          (res.status === 409
            ? 'Ký tự này đã tồn tại trong danh mục của ngôn ngữ đã chọn.'
            : 'Không thể lưu ký tự mới. Vui lòng kiểm tra lại.');

        setIsPending(false);
        isPendingRef.current = false;
        setStep('edit');
        setFieldErrors(serverFields);
        setGeneralError(message);

        if (res.status === 409 || serverFields.glyph) {
          window.setTimeout(() => glyphInputRef.current?.focus(), 20);
        }
        return;
      }

      const created: CharacterCatalogueItemDto = json.data;
      setIsPending(false);
      isPendingRef.current = false;
      onSuccess(created);
    } catch {
      setIsPending(false);
      isPendingRef.current = false;
      setGeneralError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    }
  };

  if (!mounted || !isOpen) return null;

  const isKanji = scriptType === 'KANJI';
  const isHanzi = scriptType === 'HANZI_SIMPLIFIED' || scriptType === 'HANZI_TRADITIONAL';

  const modalContent = (
    <div
      id="characterFormModal"
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="characterModalTitle"
      data-initialized={initialized ? 'true' : 'false'}
      data-step={step}
    >
      <div className="modal-dialog" ref={modalRef}>
        <div className="modal-header">
          <div>
            <h2 id="characterModalTitle" className="modal-title">
              {step === 'edit' ? 'Thêm ký tự mới' : 'Xác nhận lưu ký tự'}
            </h2>
            <p className="modal-subtitle">
              {step === 'edit'
                ? 'Nhập thông tin cơ bản cho ký tự. Hệ thống tự chuẩn hóa Unicode NFC.'
                : 'Kiểm tra kỹ thông tin trước khi lưu vào danh mục dùng chung.'}
            </p>
          </div>
          <button
            type="button"
            id="btnCloseCharModal"
            className="modal-close-btn"
            aria-label="Đóng hộp thoại"
            onClick={handleDismiss}
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        {step === 'edit' ? (
          <form onSubmit={handleProceedToConfirm} noValidate>
            <div className="modal-body">
              {generalError && (
                <div
                  id="charFormGeneralError"
                  className="login-alert"
                  role="alert"
                  style={{ marginBottom: 0 }}
                >
                  {generalError}
                </div>
              )}

              {scriptSupportedLanguages.length === 0 ? (
                <div className="login-alert" role="alert" style={{ marginBottom: 0 }}>
                  Chưa có ngôn ngữ hỗ trợ ký tự (Tiếng Nhật `ja` hoặc Tiếng Trung `zh`). Vui lòng khai báo ngôn ngữ trước.
                </div>
              ) : (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="charLanguageSelect" className="form-label">
                        Ngôn ngữ <span className="required-star">*</span>
                      </label>
                      <select
                        id="charLanguageSelect"
                        ref={languageSelectRef}
                        className={`form-input ${fieldErrors.languageId ? 'is-error' : ''}`}
                        value={languageId}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={isPending}
                        aria-invalid={Boolean(fieldErrors.languageId)}
                      >
                        {scriptSupportedLanguages.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {getLanguageDisplayName({ code: lang.code, names: lang.names })}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.languageId && (
                        <div className="form-error-msg" role="alert">
                          {fieldErrors.languageId}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="charScriptSelect" className="form-label">
                        Loại chữ <span className="required-star">*</span>
                      </label>
                      <select
                        id="charScriptSelect"
                        className={`form-input ${fieldErrors.scriptType ? 'is-error' : ''}`}
                        value={scriptType}
                        onChange={(e) => {
                          setScriptType(e.target.value as WritingScriptType);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.scriptType;
                            return next;
                          });
                        }}
                        disabled={isPending}
                        aria-invalid={Boolean(fieldErrors.scriptType)}
                      >
                        {allowedScripts.map((st) => (
                          <option key={st} value={st}>
                            {SCRIPT_LABELS[st]}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.scriptType && (
                        <div className="form-error-msg" role="alert">
                          {fieldErrors.scriptType}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="charGlyphInput" className="form-label">
                        Ký tự <span className="required-star">*</span>
                      </label>
                      <input
                        id="charGlyphInput"
                        ref={glyphInputRef}
                        type="text"
                        className={`form-input ${fieldErrors.glyph ? 'is-error' : ''}`}
                        value={glyph}
                        onChange={(e) => {
                          setGlyph(e.target.value);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.glyph;
                            return next;
                          });
                        }}
                        disabled={isPending}
                        placeholder="Ví dụ: 日"
                        autoComplete="off"
                        lang={selectedLanguage ? normalizeLanguageCode(selectedLanguage.code) : undefined}
                        aria-invalid={Boolean(fieldErrors.glyph)}
                      />
                      <span className="form-hint">
                        Nhập đúng 1 ký tự (chuẩn hóa NFC tự động).
                      </span>
                      {fieldErrors.glyph && (
                        <div id="charGlyphError" className="form-error-msg" role="alert">
                          {fieldErrors.glyph}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="charStrokeCountInput" className="form-label">
                        Số nét <span className="required-star">*</span>
                      </label>
                      <input
                        id="charStrokeCountInput"
                        type="number"
                        min={1}
                        max={128}
                        step={1}
                        className={`form-input ${fieldErrors.strokeCount ? 'is-error' : ''}`}
                        value={strokeCount}
                        onChange={(e) => {
                          setStrokeCount(e.target.value);
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.strokeCount;
                            return next;
                          });
                        }}
                        disabled={isPending}
                        aria-invalid={Boolean(fieldErrors.strokeCount)}
                      />
                      <span className="form-hint">Số nguyên từ 1 đến 128.</span>
                      {fieldErrors.strokeCount && (
                        <div className="form-error-msg" role="alert">
                          {fieldErrors.strokeCount}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="charMeaningInput" className="form-label">
                      Nghĩa <span className="optional-tag">(Tùy chọn)</span>
                    </label>
                    <input
                      id="charMeaningInput"
                      type="text"
                      className={`form-input ${fieldErrors.meaning ? 'is-error' : ''}`}
                      value={meaning}
                      onChange={(e) => setMeaning(e.target.value)}
                      disabled={isPending}
                      placeholder="Ví dụ: ngày, mặt trời"
                      autoComplete="off"
                    />
                    {fieldErrors.meaning && (
                      <div className="form-error-msg" role="alert">
                        {fieldErrors.meaning}
                      </div>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="charPrimaryReadingInput" className="form-label">
                        Cách đọc chính <span className="optional-tag">(Tùy chọn)</span>
                      </label>
                      <input
                        id="charPrimaryReadingInput"
                        type="text"
                        className={`form-input ${fieldErrors.primaryReading ? 'is-error' : ''}`}
                        value={primaryReading}
                        onChange={(e) => setPrimaryReading(e.target.value)}
                        disabled={isPending}
                        placeholder={isHanzi ? 'Ví dụ: rì' : 'Ví dụ: にち'}
                        autoComplete="off"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="charRomanizationInput" className="form-label">
                        Phiên âm Latin <span className="optional-tag">(Tùy chọn)</span>
                      </label>
                      <input
                        id="charRomanizationInput"
                        type="text"
                        className={`form-input ${fieldErrors.romanization ? 'is-error' : ''}`}
                        value={romanization}
                        onChange={(e) => setRomanization(e.target.value)}
                        disabled={isPending}
                        placeholder={isHanzi ? 'Ví dụ: ri' : 'Ví dụ: nichi'}
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {isKanji && (
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="charJlptSelect" className="form-label">
                          Cấp độ JLPT <span className="optional-tag">(Tùy chọn)</span>
                        </label>
                        <select
                          id="charJlptSelect"
                          className="form-input"
                          value={jlptLevel}
                          onChange={(e) => setJlptLevel(e.target.value)}
                          disabled={isPending}
                        >
                          <option value="">Không chọn</option>
                          {JLPT_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="charOnyomiInput" className="form-label">
                          Onyomi <span className="optional-tag">(phân tách dấu phẩy)</span>
                        </label>
                        <input
                          id="charOnyomiInput"
                          type="text"
                          className="form-input"
                          value={onyomiInput}
                          onChange={(e) => setOnyomiInput(e.target.value)}
                          disabled={isPending}
                          placeholder="Ví dụ: ニチ, ジツ"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="charKunyomiInput" className="form-label">
                          Kunyomi <span className="optional-tag">(phân tách dấu phẩy)</span>
                        </label>
                        <input
                          id="charKunyomiInput"
                          type="text"
                          className="form-input"
                          value={kunyomiInput}
                          onChange={(e) => setKunyomiInput(e.target.value)}
                          disabled={isPending}
                          placeholder="Ví dụ: ひ, -び, -か"
                        />
                      </div>
                    </div>
                  )}

                  {isHanzi && (
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="charPinyinInput" className="form-label">
                          Pinyin <span className="optional-tag">(phân tách dấu phẩy)</span>
                        </label>
                        <input
                          id="charPinyinInput"
                          type="text"
                          className="form-input"
                          value={pinyinInput}
                          onChange={(e) => setPinyinInput(e.target.value)}
                          disabled={isPending}
                          placeholder="Ví dụ: rì"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="charHskSelect" className="form-label">
                          Cấp độ HSK <span className="optional-tag">(Tùy chọn)</span>
                        </label>
                        <select
                          id="charHskSelect"
                          className="form-input"
                          value={hskLevel}
                          onChange={(e) => setHskLevel(e.target.value)}
                          disabled={isPending}
                        >
                          <option value="">Không chọn</option>
                          {HSK_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              HSK {lvl}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="charNotesInput" className="form-label">
                      Ghi chú <span className="optional-tag">(Tùy chọn)</span>
                    </label>
                    <input
                      id="charNotesInput"
                      type="text"
                      className="form-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isPending}
                      placeholder="Ghi chú nội bộ cho giáo viên và quản trị viên"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                id="btnCancelCharForm"
                className="btn btn-secondary"
                onClick={handleDismiss}
                disabled={isPending}
              >
                Hủy
              </button>
              <button
                type="submit"
                id="btnProceedCharConfirm"
                className="btn btn-primary"
                disabled={isPending || scriptSupportedLanguages.length === 0}
              >
                Tiếp tục xác nhận
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="modal-body">
              {generalError && (
                <div
                  id="charConfirmError"
                  className="login-alert"
                  role="alert"
                  style={{ marginBottom: 0 }}
                >
                  {generalError}
                </div>
              )}

              {pendingPayload && (
                <div
                  id="characterConfirmSummary"
                  style={{
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    backgroundColor: '#F8FAFD',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span
                      lang={normalizeLanguageCode(pendingPayload.languageCode)}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: '60px',
                        height: '60px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--surface-bg)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '32px',
                        fontWeight: 700,
                      }}
                    >
                      {pendingPayload.glyph}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>
                        {pendingPayload.languageLabel} · {SCRIPT_LABELS[pendingPayload.scriptType]}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sub)', color: 'var(--text-muted)' }}>
                        {pendingPayload.strokeCount} nét · Unicode {formatCodePoints(pendingPayload.glyph)}
                      </div>
                    </div>
                  </div>

                  <dl
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '130px 1fr',
                      gap: '6px 12px',
                      fontSize: 'var(--font-size-sub)',
                    }}
                  >
                    <dt style={{ color: 'var(--text-muted)' }}>Nghĩa:</dt>
                    <dd>{pendingPayload.meaning || '—'}</dd>
                    <dt style={{ color: 'var(--text-muted)' }}>Cách đọc chính:</dt>
                    <dd lang={normalizeLanguageCode(pendingPayload.languageCode)}>
                      {pendingPayload.primaryReading || '—'}
                    </dd>
                    <dt style={{ color: 'var(--text-muted)' }}>Phiên âm Latin:</dt>
                    <dd>{pendingPayload.romanization || '—'}</dd>
                    <dt style={{ color: 'var(--text-muted)' }}>Nét chữ:</dt>
                    <dd>Chưa có nét chữ, chỉ hiển thị tĩnh</dd>
                  </dl>
                </div>
              )}

              <div
                role="note"
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: 'var(--font-size-sub)',
                }}
              >
                <strong>Lưu ý:</strong> Hiện chưa hỗ trợ chỉnh sửa hoặc xóa ký tự sau khi tạo, và không hỗ trợ tải lên nét chữ. Vui lòng kiểm tra kỹ thông tin trước khi lưu.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                id="btnBackCharForm"
                className="btn btn-secondary"
                onClick={() => {
                  setGeneralError(null);
                  setStep('edit');
                }}
                disabled={isPending}
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                id="btnConfirmCharSubmit"
                className="btn btn-primary"
                onClick={handleConfirmSubmit}
                disabled={isPending}
              >
                {isPending ? 'Đang lưu...' : 'Xác nhận lưu ký tự'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modalRoot') || document.body;
  return createPortal(modalContent, modalRoot);
}

export function CharacterCatalogue({
  initialCharacters,
  initialTotal,
  initialLimit = DEFAULT_PAGE_LIMIT,
  initialOffset = 0,
  initialLanguages,
  initialError,
  isLoading: propIsLoading,
  account,
}: CharacterCatalogueProps) {
  const [characters, setCharacters] = useState<CharacterCatalogueItemDto[]>(initialCharacters || []);
  const [total, setTotal] = useState<number>(initialTotal ?? (initialCharacters ? initialCharacters.length : 0));
  const [limit, setLimit] = useState<number>(initialLimit);
  const [offset, setOffset] = useState<number>(initialOffset);
  const [languages, setLanguages] = useState<LanguageDto[]>(initialLanguages || []);

  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [scriptFilter, setScriptFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(
    propIsLoading !== undefined ? propIsLoading : (!initialCharacters && !initialError)
  );
  const [isFetchingPage, setIsFetchingPage] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(initialError || null);
  const [forbiddenBanner, setForbiddenBanner] = useState<string | null>(null);
  const [mutationStatus, setMutationStatus] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSessionLostOpen, setIsSessionLostOpen] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const openCreateBtnRef = useRef<HTMLButtonElement>(null);
  const requestSeqRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchDebounceRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);

  const anyModalOpen = isFormModalOpen || isSessionLostOpen;
  const scheduleFocusRestore = useModalInertAndFocusRestore(anyModalOpen);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const fetchCharacters = useCallback(
    async (params: {
      languageId: string;
      scriptType: string;
      search: string;
      limit: number;
      offset: number;
      showSkeleton?: boolean;
    }) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const reqId = ++requestSeqRef.current;

      if (params.showSkeleton) {
        setIsLoading(true);
      } else {
        setIsFetchingPage(true);
      }
      setFetchError(null);
      setForbiddenBanner(null);

      try {
        const query = new URLSearchParams();
        if (params.languageId) query.set('languageId', params.languageId);
        if (params.scriptType) query.set('scriptType', params.scriptType);
        if (params.search.trim()) query.set('search', params.search.trim());
        query.set('limit', String(params.limit));
        query.set('offset', String(params.offset));

        const res = await fetch(`/api/characters?${query.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        // Ignore stale or superseded responses
        if (reqId !== requestSeqRef.current) return;

        if (res.status === 401) {
          setIsLoading(false);
          setIsFetchingPage(false);
          setIsSessionLostOpen(true);
          return;
        }

        if (res.status === 403) {
          const json = await res.json().catch(() => null);
          if (reqId !== requestSeqRef.current) return;
          setCharacters([]);
          setTotal(0);
          setIsLoading(false);
          setIsFetchingPage(false);
          setForbiddenBanner(json?.error?.message || 'Bạn không có quyền truy cập danh mục ký tự.');
          return;
        }

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          if (reqId !== requestSeqRef.current) return;
          setIsLoading(false);
          setIsFetchingPage(false);
          setFetchError(json?.error?.message || 'Không thể tải danh mục ký tự.');
          return;
        }

        const json = await res.json();
        if (reqId !== requestSeqRef.current) return;

        setCharacters(Array.isArray(json.data) ? json.data : []);
        setTotal(typeof json.total === 'number' ? json.total : 0);
        setLimit(typeof json.limit === 'number' ? json.limit : params.limit);
        setOffset(typeof json.offset === 'number' ? json.offset : params.offset);
        setLanguageFilter(params.languageId);
        setScriptFilter(params.scriptType);
        setActiveSearch(params.search.trim());
        setIsLoading(false);
        setIsFetchingPage(false);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') {
          return;
        }
        if (reqId !== requestSeqRef.current) return;
        setIsLoading(false);
        setIsFetchingPage(false);
        setFetchError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
      }
    },
    []
  );

  useEffect(() => {
    if (propIsLoading === undefined && !initialCharacters && !initialError) {
      fetchCharacters({
        languageId: '',
        scriptType: '',
        search: '',
        limit: DEFAULT_PAGE_LIMIT,
        offset: 0,
        showSkeleton: true,
      });
    }
  }, [initialCharacters, initialError, propIsLoading, fetchCharacters]);

  useEffect(() => {
    if (initialLanguages !== undefined) return;
    let cancelled = false;
    fetch('/api/languages', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && Array.isArray(json?.data)) {
          setLanguages(json.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialLanguages]);

  const filterScriptOptions = useMemo(() => {
    if (!languageFilter) return WRITING_SCRIPT_TYPES;
    const selectedLang = languages.find((l) => l.id === languageFilter);
    if (!selectedLang) return WRITING_SCRIPT_TYPES;
    const allowed = getAllowedScriptsForLanguageCode(selectedLang.code);
    return allowed.length > 0 ? allowed : WRITING_SCRIPT_TYPES;
  }, [languageFilter, languages]);

  const handleLanguageFilterChange = (nextLanguageId: string) => {
    setMutationStatus(null);
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    let nextScript = scriptFilter;
    if (nextLanguageId && nextScript) {
      const lang = languages.find((l) => l.id === nextLanguageId);
      if (lang) {
        const allowed = getAllowedScriptsForLanguageCode(lang.code);
        if (allowed.length > 0 && !allowed.includes(nextScript as WritingScriptType)) {
          nextScript = '';
        }
      }
    }

    setLanguageFilter(nextLanguageId);
    setScriptFilter(nextScript);
    fetchCharacters({
      languageId: nextLanguageId,
      scriptType: nextScript,
      search: searchInput,
      limit,
      offset: 0,
    });
  };

  const handleScriptFilterChange = (nextScript: string) => {
    setMutationStatus(null);
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setScriptFilter(nextScript);
    fetchCharacters({
      languageId: languageFilter,
      scriptType: nextScript,
      search: searchInput,
      limit,
      offset: 0,
    });
  };

  const triggerSearch = (queryValue: string) => {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    fetchCharacters({
      languageId: languageFilter,
      scriptType: scriptFilter,
      search: queryValue,
      limit,
      offset: 0,
    });
  };

  const handleSearchInputChange = (val: string) => {
    setMutationStatus(null);
    setSearchInput(val);
    if (isComposingRef.current) return;
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      fetchCharacters({
        languageId: languageFilter,
        scriptType: scriptFilter,
        search: val,
        limit,
        offset: 0,
      });
    }, 250);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isComposingRef.current) return;
    setMutationStatus(null);
    triggerSearch(searchInput);
  };

  const handleResetFilters = () => {
    setMutationStatus(null);
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setLanguageFilter('');
    setScriptFilter('');
    setSearchInput('');
    fetchCharacters({
      languageId: '',
      scriptType: '',
      search: '',
      limit,
      offset: 0,
    });
  };

  const handlePrevPage = () => {
    if (offset <= 0 || isLoading || isFetchingPage) return;
    setMutationStatus(null);
    const nextOffset = Math.max(0, offset - limit);
    fetchCharacters({
      languageId: languageFilter,
      scriptType: scriptFilter,
      search: activeSearch,
      limit,
      offset: nextOffset,
    });
  };

  const handleNextPage = () => {
    if (offset + characters.length >= total || isLoading || isFetchingPage) return;
    setMutationStatus(null);
    const nextOffset = offset + limit;
    fetchCharacters({
      languageId: languageFilter,
      scriptType: scriptFilter,
      search: activeSearch,
      limit,
      offset: nextOffset,
    });
  };

  const handleOpenCreate = (e?: React.MouseEvent) => {
    setMutationStatus(null);
    triggerRef.current = (e?.currentTarget as HTMLElement) || openCreateBtnRef.current;
    setIsFormModalOpen(true);
  };

  const handleCreateSuccess = (created: CharacterCatalogueItemDto) => {
    setIsFormModalOpen(false);
    setMutationStatus(`Đã thêm ký tự "${created.glyph}" vào danh mục.`);
    fetchCharacters({
      languageId: languageFilter,
      scriptType: scriptFilter,
      search: activeSearch,
      limit,
      offset: 0,
    });
    scheduleFocusRestore(() => openCreateBtnRef.current);
  };

  const handleForbidden = (msg?: string) => {
    setIsFormModalOpen(false);
    setForbiddenBanner(msg || 'Bạn không có quyền thực hiện thao tác quản trị này.');
  };

  const handleSessionExpired = () => {
    setIsFormModalOpen(false);
    setIsSessionLostOpen(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Origin: window.location.origin },
      });
    } catch {}
    window.location.href = '/login';
  };

  const hasActiveFilters = Boolean(languageFilter || scriptFilter || activeSearch);
  const canPrev = offset > 0 && !isLoading && !isFetchingPage;
  const canNext = offset + characters.length < total && !isLoading && !isFetchingPage;
  const rangeStart = total === 0 || characters.length === 0 ? 0 : offset + 1;
  const rangeEnd = offset + characters.length;

  return (
    <>
      <main className="page-content">
        {forbiddenBanner && (
          <div
            id="forbiddenBanner"
            style={{
              padding: '14px 18px',
              backgroundColor: '#FDF2F2',
              border: '1px solid #F87171',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
            role="alert"
          >
            <div style={{ color: 'var(--danger-red)', fontSize: 'var(--font-size-sub)' }}>
              <strong>Truy cập bị từ chối:</strong> {forbiddenBanner}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ height: '36px', padding: '0 12px' }}
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Danh mục ký tự</h1>
            <p className="page-description">
              Quản lý ký tự (kana, kanji, hanzi) dùng cho bài học và từ vựng. Hiện chỉ hỗ trợ xem, tìm kiếm và thêm ký tự mới; chưa hỗ trợ sửa, xóa hoặc tải lên dữ liệu nét chữ.
            </p>
          </div>
          <button
            type="button"
            id="openCreateCharacterBtn"
            ref={openCreateBtnRef}
            className="btn btn-primary"
            onClick={handleOpenCreate}
          >
            + Thêm ký tự
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <form className="toolbar" onSubmit={handleSearchSubmit} role="search" aria-label="Tìm kiếm và lọc ký tự">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <select
              id="filterLanguageSelect"
              className="form-input"
              aria-label="Lọc theo ngôn ngữ"
              value={languageFilter}
              onChange={(e) => handleLanguageFilterChange(e.target.value)}
              style={{ width: '210px' }}
            >
              <option value="">Tất cả ngôn ngữ</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {getLanguageDisplayName({ code: lang.code, names: lang.names })}
                </option>
              ))}
            </select>

            <select
              id="filterScriptSelect"
              className="form-input"
              aria-label="Lọc theo loại chữ"
              value={scriptFilter}
              onChange={(e) => handleScriptFilterChange(e.target.value)}
              style={{ width: '200px' }}
            >
              <option value="">Tất cả loại chữ</option>
              {filterScriptOptions.map((st) => (
                <option key={st} value={st}>
                  {SCRIPT_LABELS[st]}
                </option>
              ))}
            </select>

            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                id="searchCharacterInput"
                className="search-input"
                placeholder="Tìm ký tự, nghĩa, cách đọc..."
                aria-label="Tìm kiếm ký tự"
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onCompositionStart={() => {
                  isComposingRef.current = true;
                }}
                onCompositionEnd={(e) => {
                  isComposingRef.current = false;
                  handleSearchInputChange(e.currentTarget.value);
                }}
              />
            </div>

            <button type="submit" id="btnSearchCharacters" className="btn btn-secondary">
              Tìm
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                id="btnResetCharacterFilters"
                className="btn btn-secondary"
                onClick={handleResetFilters}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </form>

        {/* Table / States */}
        <div className="table-wrap">
          {isLoading ? (
            <div id="loadingCharactersView" style={{ paddingTop: '8px' }}>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '48px' }} />
                <div className="skeleton-bar" style={{ width: '140px' }} />
                <div className="skeleton-bar" style={{ width: '110px' }} />
                <div className="skeleton-bar" style={{ width: '180px' }} />
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '48px' }} />
                <div className="skeleton-bar" style={{ width: '140px' }} />
                <div className="skeleton-bar" style={{ width: '110px' }} />
                <div className="skeleton-bar" style={{ width: '180px' }} />
              </div>
              <div className="skeleton-row">
                <div className="skeleton-bar" style={{ width: '48px' }} />
                <div className="skeleton-bar" style={{ width: '140px' }} />
                <div className="skeleton-bar" style={{ width: '110px' }} />
                <div className="skeleton-bar" style={{ width: '180px' }} />
              </div>
            </div>
          ) : fetchError ? (
            <div id="fetchErrorCharactersView" className="empty-state-open">
              <h2 className="empty-title" style={{ color: 'var(--danger-red)' }}>
                Lỗi kết nối máy chủ
              </h2>
              <p className="empty-desc">{fetchError}</p>
              <button
                type="button"
                id="fetchCharactersRetryBtn"
                className="btn btn-secondary"
                onClick={() =>
                  fetchCharacters({
                    languageId: languageFilter,
                    scriptType: scriptFilter,
                    search: activeSearch,
                    limit,
                    offset,
                    showSkeleton: true,
                  })
                }
              >
                Thử tải lại
              </button>
            </div>
          ) : characters.length === 0 ? (
            <div id="emptyCharactersView" className="empty-state-open">
              <h2 className="empty-title">
                {hasActiveFilters ? 'Không tìm thấy ký tự phù hợp' : 'Chưa có ký tự nào trong danh mục'}
              </h2>
              <p className="empty-desc">
                {hasActiveFilters
                  ? 'Thử thay đổi bộ lọc ngôn ngữ, loại chữ hoặc từ khóa tìm kiếm.'
                  : 'Bắt đầu bằng cách thêm ký tự mới vào danh mục dùng chung.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {hasActiveFilters && (
                  <button
                    type="button"
                    id="emptyResetFiltersBtn"
                    className="btn btn-secondary"
                    onClick={handleResetFilters}
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <button
                  type="button"
                  id="emptyCreateCharacterBtn"
                  className="btn btn-primary"
                  onClick={handleOpenCreate}
                >
                  + Thêm ký tự
                </button>
              </div>
            </div>
          ) : (
            <table id="charactersTable" className="data-table">
              <caption
                style={{
                  textAlign: 'left',
                  padding: '12px 20px',
                  fontSize: 'var(--font-size-ref)',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Danh mục ký tự dùng chung (hiển thị {rangeStart}–{rangeEnd} / {total} ký tự)
              </caption>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Ký tự</th>
                  <th style={{ width: '160px' }}>Ngôn ngữ</th>
                  <th style={{ width: '160px' }}>Loại chữ</th>
                  <th style={{ width: '90px' }}>Số nét</th>
                  <th style={{ minWidth: '220px' }}>Cách đọc &amp; Nghĩa</th>
                  <th style={{ width: '240px' }}>Trạng thái nét chữ</th>
                </tr>
              </thead>
              <tbody>
                {characters.map((item) => {
                  const glyphLang = resolveGlyphLangTag(item.languageCode, item.scriptType);
                  const langDisplay = getLanguageDisplayName({
                    code: item.languageCode,
                    names: item.languageNames,
                  });
                  return (
                    <tr key={item.id} data-character-id={item.id}>
                      <td>
                        <span
                          lang={glyphLang}
                          style={{
                            fontSize: '26px',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            display: 'inline-block',
                          }}
                        >
                          {item.glyph}
                        </span>
                      </td>
                      <td>{langDisplay}</td>
                      <td>
                        <span className="level-badge" style={{ whiteSpace: 'nowrap' }}>
                          {SCRIPT_LABELS[item.scriptType] || item.scriptType}
                        </span>
                      </td>
                      <td>{item.strokeCount} nét</td>
                      <td>
                        <div className="col-names">
                          <span className="name-vi">
                            {item.primaryReading ? (
                              <span lang={glyphLang}>{item.primaryReading}</span>
                            ) : (
                              '—'
                            )}
                            {item.romanization ? ` (${item.romanization})` : ''}
                          </span>
                          <span className="name-en">{item.meaning || 'Chưa có nghĩa'}</span>
                        </div>
                      </td>
                      <td>
                        {item.hasStrokes ? (
                          <span className="flag-yes">Có nét chữ</span>
                        ) : (
                          <span className="flag-no">Chưa có nét chữ, chỉ hiển thị tĩnh</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary & Pagination */}
        {!isLoading && !fetchError && (
          <div className="table-summary-bar" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div id="charactersTableSummary" className="table-summary">
                {total === 0
                  ? '0 ký tự'
                  : `Hiển thị ${rangeStart}–${rangeEnd} / ${total} ký tự`}
                {isFetchingPage ? ' · Đang cập nhật...' : ''}
              </div>
              {mutationStatus && (
                <div
                  id="characterMutationStatus"
                  className="table-mutation-status"
                  role="status"
                  aria-live="polite"
                >
                  {mutationStatus}
                </div>
              )}
            </div>

            <div className="pagination-controls" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                id="btnCharactersPrev"
                className="btn btn-secondary"
                onClick={handlePrevPage}
                disabled={!canPrev}
              >
                Trang trước
              </button>
              <button
                type="button"
                id="btnCharactersNext"
                className="btn btn-secondary"
                onClick={handleNextPage}
                disabled={!canNext}
              >
                Trang tiếp
              </button>
            </div>
          </div>
        )}
      </main>

      <CharacterFormModal
        isOpen={isFormModalOpen}
        languages={languages}
        defaultLanguageId={languageFilter || undefined}
        triggerElement={triggerRef.current}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleCreateSuccess}
        onForbidden={handleForbidden}
        onSessionExpired={handleSessionExpired}
      />

      <SessionLostModal
        isOpen={isSessionLostOpen}
        hasSavedDraft={false}
      />
    </>
  );
}
