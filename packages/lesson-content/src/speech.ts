'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getBaseLanguageCode, normalizeLanguageCode } from './language.ts';

const h = React.createElement;

const DEFAULT_SPEECH_RATE = 0.9;

const DEFAULT_SPEECH_LANG_BY_BASE: Record<string, string> = {
  ja: 'ja-JP',
  zh: 'zh-CN',
  en: 'en-US',
  fr: 'fr-FR',
};

const LANGUAGE_LABEL_VI: Record<string, string> = {
  ja: 'tiếng Nhật',
  zh: 'tiếng Trung',
  en: 'tiếng Anh',
  fr: 'tiếng Pháp',
};

const REGION_SUBTAG_IN_BCP47_RE =
  /^[A-Za-z]{2,3}(?:-[A-Za-z]{4})?-([A-Za-z]{2}|\d{3})(?:-|$)/;

export interface SpeechVoiceLike {
  lang: string;
  name?: string;
  voiceURI?: string;
  default?: boolean;
  localService?: boolean;
}

export interface SpeakButtonProps {
  text: string;
  languageCode?: string | null;
  ariaLabel?: string;
  className?: string;
  rate?: number;
  disabled?: boolean;
  title?: string;
}

/**
 * Resolves a course/content language code into a BCP-47 speech tag.
 * Preserves explicit regional tags (e.g. `ja_JP` -> `ja-JP`, `en-GB` -> `en-GB`)
 * and defaults base/script tags to standard locales (`ja` -> `ja-JP`,
 * `zh` -> `zh-CN`, `en` -> `en-US`, `fr` -> `fr-FR`).
 */
export function resolveSpeechLang(code?: string | null): string | undefined {
  const normalized = normalizeLanguageCode(code);
  if (!normalized) return undefined;

  if (REGION_SUBTAG_IN_BCP47_RE.test(normalized)) {
    return normalized;
  }

  const base = getBaseLanguageCode(normalized);
  if (base && DEFAULT_SPEECH_LANG_BY_BASE[base]) {
    return DEFAULT_SPEECH_LANG_BY_BASE[base];
  }

  return normalized;
}

/**
 * Picks the first voice matching `lang` exactly (normalized BCP-47), falling back
 * to the first voice sharing the same base language subtag. Returns `null` when
 * no matching voice exists so speech never falls back to a wrong-language voice.
 */
export function pickVoice<T extends SpeechVoiceLike>(
  voices: ReadonlyArray<T> | null | undefined,
  lang?: string | null
): T | null {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const targetNormalized = normalizeLanguageCode(lang);
  if (!targetNormalized) return null;

  const targetLower = targetNormalized.toLowerCase();
  const targetBase = getBaseLanguageCode(targetNormalized);

  for (const voice of voices) {
    if (!voice || typeof voice.lang !== 'string') continue;
    const voiceNormalized = normalizeLanguageCode(voice.lang);
    if (voiceNormalized && voiceNormalized.toLowerCase() === targetLower) {
      return voice;
    }
  }

  if (targetBase) {
    for (const voice of voices) {
      if (!voice || typeof voice.lang !== 'string') continue;
      const voiceBase = getBaseLanguageCode(voice.lang);
      if (voiceBase && voiceBase === targetBase) {
        return voice;
      }
    }
  }

  return null;
}

function getUtteranceConstructor(): typeof SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
  };
  if (typeof SpeechSynthesisUtterance === 'function') {
    return SpeechSynthesisUtterance;
  }
  if (typeof win.SpeechSynthesisUtterance === 'function') {
    return win.SpeechSynthesisUtterance;
  }
  return null;
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    speechSynthesis?: Partial<SpeechSynthesis>;
  };
  const synth = win.speechSynthesis;
  if (
    !synth ||
    typeof synth.speak !== 'function' ||
    typeof synth.cancel !== 'function' ||
    typeof synth.getVoices !== 'function'
  ) {
    return null;
  }
  if (!getUtteranceConstructor()) {
    return null;
  }
  return synth as SpeechSynthesis;
}

/**
 * SSR-safe check for browser Web Speech API (`speechSynthesis` + `SpeechSynthesisUtterance`).
 */
export function isSpeechSupported(): boolean {
  return getSpeechSynthesis() !== null;
}

export function getUnavailableSpeechMessage(code?: string | null): string {
  const base = getBaseLanguageCode(code);
  const label = base ? LANGUAGE_LABEL_VI[base] : undefined;
  if (label) {
    return `Thiết bị chưa có giọng đọc ${label}`;
  }
  const resolved = resolveSpeechLang(code);
  return resolved
    ? `Thiết bị chưa có giọng đọc (${resolved})`
    : 'Thiết bị chưa có giọng đọc phù hợp';
}

function renderSpeakerIcon(state: 'idle' | 'speaking' | 'unavailable'): React.ReactNode {
  return h(
    'svg',
    {
      width: 16,
      height: 16,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true',
    },
    h('polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }),
    state === 'unavailable'
      ? h('line', { x1: 22, y1: 9, x2: 16, y2: 15 })
      : h('path', { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' }),
    state === 'unavailable'
      ? h('line', { x1: 16, y1: 9, x2: 22, y2: 15 })
      : state === 'speaking'
        ? h('path', { d: 'M19.07 4.93a10 10 0 0 1 0 14.14' })
        : null
  );
}

/**
 * Client-only button that pronounces `text` via the browser Web Speech API.
 * Hidden when Web Speech API is unavailable; disabled with localized guidance
 * when the device lacks a voice matching `languageCode`.
 */
export function SpeakButton({
  text,
  languageCode,
  ariaLabel,
  className,
  rate = DEFAULT_SPEECH_RATE,
  disabled = false,
  title,
}: SpeakButtonProps): React.ReactElement | null {
  const trimmedText = typeof text === 'string' ? text.trim() : '';
  const speechLang = resolveSpeechLang(languageCode);

  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);

    const synth = getSpeechSynthesis();
    if (!synth) {
      setSupported(false);
      setVoices([]);
      return () => {
        isMountedRef.current = false;
      };
    }

    setSupported(true);

    const syncVoices = () => {
      if (!isMountedRef.current) return;
      try {
        const list = synth.getVoices();
        setVoices(Array.isArray(list) ? list : []);
      } catch {
        setVoices([]);
      }
    };

    syncVoices();

    let cleanupListener: (() => void) | undefined;
    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', syncVoices);
      cleanupListener = () => {
        synth.removeEventListener?.('voiceschanged', syncVoices);
      };
    } else if ('onvoiceschanged' in synth) {
      const prevHandler = synth.onvoiceschanged;
      synth.onvoiceschanged = (event: Event) => {
        syncVoices();
        if (typeof prevHandler === 'function') {
          prevHandler.call(synth, event);
        }
      };
      cleanupListener = () => {
        if (synth.onvoiceschanged !== prevHandler) {
          synth.onvoiceschanged = prevHandler ?? null;
        }
      };
    }

    return () => {
      isMountedRef.current = false;
      cleanupListener?.();
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current = null;
        try {
          synth.cancel();
        } catch {
          // ignore cleanup cancel failure
        }
      }
    };
  }, []);

  useEffect(() => {
    if (activeUtteranceRef.current) {
      activeUtteranceRef.current = null;
      setIsSpeaking(false);
      try {
        getSpeechSynthesis()?.cancel();
      } catch {
        // ignore cancel failure when switching items
      }
    }
  }, [trimmedText, speechLang]);

  if (!trimmedText || !speechLang || !mounted || !supported) {
    return null;
  }

  const matchedVoice = pickVoice(voices, speechLang);
  const hasVoice = matchedVoice !== null;
  const isDisabled = Boolean(disabled) || !hasVoice;
  const speechState: 'idle' | 'speaking' | 'unavailable' = !hasVoice
    ? 'unavailable'
    : isSpeaking
      ? 'speaking'
      : 'idle';

  const unavailableMessage = getUnavailableSpeechMessage(speechLang);
  const activeLabel = ariaLabel ?? `Nghe phát âm: ${trimmedText}`;
  const buttonAriaLabel = !hasVoice ? unavailableMessage : activeLabel;
  const buttonTitle = !hasVoice
    ? unavailableMessage
    : title ?? (isSpeaking ? 'Đang phát âm...' : activeLabel);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isDisabled) return;

    const synth = getSpeechSynthesis();
    const UtteranceCtor = getUtteranceConstructor();
    if (!synth || !UtteranceCtor) return;

    const latestVoices = (() => {
      try {
        const list = synth.getVoices();
        return Array.isArray(list) ? list : voices;
      } catch {
        return voices;
      }
    })();

    const voiceToUse = pickVoice(latestVoices, speechLang) ?? matchedVoice;
    if (!voiceToUse) {
      setVoices(latestVoices);
      return;
    }

    try {
      synth.cancel();
    } catch {
      // ignore cancel failure before speaking
    }

    const utterance = new UtteranceCtor(trimmedText);
    utterance.lang = speechLang;
    utterance.voice = voiceToUse;
    utterance.rate =
      typeof rate === 'number' && Number.isFinite(rate) && rate > 0
        ? rate
        : DEFAULT_SPEECH_RATE;

    activeUtteranceRef.current = utterance;
    setIsSpeaking(true);

    const clearIfActive = () => {
      if (!isMountedRef.current) return;
      if (activeUtteranceRef.current === utterance) {
        activeUtteranceRef.current = null;
        setIsSpeaking(false);
      }
    };

    utterance.onend = clearIfActive;
    utterance.onerror = clearIfActive;

    try {
      synth.speak(utterance);
    } catch {
      clearIfActive();
    }
  };

  const buttonClasses = [
    'lingora-speak-btn',
    isSpeaking ? 'lingora-speak-btn--speaking' : '',
    !hasVoice ? 'lingora-speak-btn--unavailable' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return h(
    'button',
    {
      type: 'button',
      className: buttonClasses,
      onClick: handleClick,
      disabled: isDisabled,
      'aria-label': buttonAriaLabel,
      'aria-pressed': hasVoice ? isSpeaking : undefined,
      'data-speech-lang': speechLang,
      'data-speech-state': speechState,
      title: buttonTitle,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '34px',
        minHeight: '34px',
        padding: '6px',
        borderRadius: '9999px',
        border: isSpeaking
          ? '1px solid var(--primary-color, #2563eb)'
          : '1px solid var(--border-subtle, #cbd5e1)',
        backgroundColor: isSpeaking
          ? 'var(--primary-soft, #eff6ff)'
          : 'var(--surface-bg, #ffffff)',
        color: isDisabled
          ? 'var(--text-muted, #94a3b8)'
          : 'var(--primary-color, #2563eb)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        flexShrink: 0,
      },
    },
    renderSpeakerIcon(speechState)
  );
}
