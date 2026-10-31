'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SessionLostModal } from './SessionLostModal';
import { AccessDeniedView } from './AccessDeniedView';
import type {
  LessonDetailDto,
  TeacherLessonDetailDto,
  TeacherExerciseDto,
  TeacherVocabularyDto,
  VocabularyOptionDto,
} from '@/server/lessons';
import type { ExerciseType } from '@/server/lessons/content';

function isValidAudioReferenceUrl(rawUrl: string): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    if (parsed.search || parsed.hash) return false;
    if (parsed.port && parsed.port !== '443') return false;

    const hostname = parsed.hostname.toLowerCase();
    if (
      !hostname.includes('.') ||
      hostname.endsWith('.') ||
      hostname.startsWith('.') ||
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[') || hostname.endsWith(']')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export interface LessonDraftEditorProps {
  initialLesson: LessonDetailDto | TeacherLessonDetailDto;
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
}

export interface StagedExercise {
  localId: string;
  sourceExerciseId?: string;
  position: number;
  isCore: boolean;
  type: ExerciseType;
  promptData: any;
  gradingData: any;
  feedbackData?: { explanation?: string };
}

export interface StagedVocabulary {
  localId: string;
  sourceLinkId?: string;
  vocabularyId?: string;
  create?: {
    canonicalForm: string;
    senseKey: string;
    meaningLabels: { vi?: string; en?: string };
    phonetic?: string;
    partOfSpeech?: string;
    example?: string;
  };
  position: number;
  isCore: boolean;
  displayInfo: {
    canonicalForm: string;
    senseKey?: string | null;
    meaningVi?: string | null;
    meaningEn?: string | null;
    phonetic?: string | null;
    partOfSpeech?: string | null;
    example?: string | null;
  };
}

export function LessonDraftEditor({
  initialLesson,
  account,
}: LessonDraftEditorProps) {
  const [lesson, setLesson] = useState<TeacherLessonDetailDto>(initialLesson as TeacherLessonDetailDto);

  // Form input state initialized from currentDraft
  const initialTitle = initialLesson.currentDraft?.title || {};
  const [titleVi, setTitleVi] = useState(initialTitle.vi || '');
  const [titleEn, setTitleEn] = useState(initialTitle.en || '');

  const initialBlocks = initialLesson.currentDraft?.contentBlocks || [];
  const [paragraphs, setParagraphs] = useState<Array<{ type: 'paragraph'; text: string }>>(
    initialBlocks.map((b) => ({ type: 'paragraph', text: b.text }))
  );

  // Staged Exercises & Vocabulary
  const initExercises = (initialLesson as TeacherLessonDetailDto).exercises || [];
  const [exercises, setExercises] = useState<StagedExercise[]>(() =>
    initExercises.map((ex) => ({
      localId: ex.id || Math.random().toString(),
      sourceExerciseId: ex.id,
      position: ex.position,
      isCore: ex.isCore,
      type: ex.type,
      promptData: ex.promptData ? JSON.parse(JSON.stringify(ex.promptData)) : {},
      gradingData: ex.gradingData ? JSON.parse(JSON.stringify(ex.gradingData)) : {},
      feedbackData: ex.feedbackData ? JSON.parse(JSON.stringify(ex.feedbackData)) : undefined,
    }))
  );

  const initVocabulary = (initialLesson as TeacherLessonDetailDto).vocabulary || [];
  const [vocabulary, setVocabulary] = useState<StagedVocabulary[]>(() =>
    initVocabulary.map((v) => ({
      localId: v.id || Math.random().toString(),
      sourceLinkId: v.id,
      position: v.position,
      isCore: v.isCore,
      displayInfo: {
        canonicalForm: v.displaySnapshot?.canonicalForm || '',
        senseKey: v.displaySnapshot?.senseKey || 'default',
        meaningVi: v.displaySnapshot?.meaningLabels?.vi,
        meaningEn: v.displaySnapshot?.meaningLabels?.en,
        phonetic: v.displaySnapshot?.phonetic,
        partOfSpeech: v.displaySnapshot?.partOfSpeech,
        example: v.displaySnapshot?.example,
      },
    }))
  );

  const [changeSummary, setChangeSummary] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isStaleConflict, setIsStaleConflict] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sessionLost, setSessionLost] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Exercise Modal State
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [exType, setExType] = useState<ExerciseType>('MCQ');
  const [exPosition, setExPosition] = useState(1);
  const [exIsCore, setExIsCore] = useState(true);
  const [exPrompt, setExPrompt] = useState('');
  const [exExplanation, setExExplanation] = useState('');
  // MCQ state
  const [mcqOptions, setMcqOptions] = useState<Array<{ id: string; text: string }>>([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
  ]);
  const [mcqCorrectId, setMcqCorrectId] = useState('opt_1');
  // FILL_BLANK state
  const [fbSentence, setFbSentence] = useState('');
  const [fbAnswers, setFbAnswers] = useState('');
  const [fbCaseSensitive, setFbCaseSensitive] = useState(false);
  // REORDER state
  const [roCorrectOrder, setRoCorrectOrder] = useState('');
  const [roTokens, setRoTokens] = useState<Array<{ id: string; text: string }>>([
    { id: 'tok_1', text: '' },
    { id: 'tok_2', text: '' },
  ]);
  // LISTENING state
  const [lisAudioUrl, setLisAudioUrl] = useState('');
  const [lisOptions, setLisOptions] = useState<Array<{ id: string; text: string }>>([
    { id: 'opt_1', text: '' },
    { id: 'opt_2', text: '' },
  ]);
  const [lisCorrectId, setLisCorrectId] = useState('opt_1');
  const [lisTranscript, setLisTranscript] = useState('');
  // GRAMMAR state
  const [grSource, setGrSource] = useState('');
  const [grTarget, setGrTarget] = useState('');
  const [grAnswers, setGrAnswers] = useState('');
  const [grCaseSensitive, setGrCaseSensitive] = useState(false);
  const [exerciseModalError, setExerciseModalError] = useState<string | null>(null);

  // Vocabulary Modal State
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [vocabTab, setVocabTab] = useState<'search' | 'create'>('search');
  const [vocabPosition, setVocabPosition] = useState(1);
  const [vocabIsCore, setVocabIsCore] = useState(true);
  // Search tab
  const [vocabSearchQuery, setVocabSearchQuery] = useState('');
  const [vocabSearchResults, setVocabSearchResults] = useState<VocabularyOptionDto[]>([]);
  const [isSearchingVocab, setIsSearchingVocab] = useState(false);
  const vocabSearchGeneration = useRef(0);
  const searchingVocabRef = useRef(false);
  const [selectedVocabId, setSelectedVocabId] = useState<string | null>(null);
  const [selectedVocabOption, setSelectedVocabOption] = useState<VocabularyOptionDto | null>(null);
  // Create tab
  const [vocabCanonicalForm, setVocabCanonicalForm] = useState('');
  const [vocabSenseKey, setVocabSenseKey] = useState('default');
  const [vocabMeaningVi, setVocabMeaningVi] = useState('');
  const [vocabMeaningEn, setVocabMeaningEn] = useState('');
  const [vocabPhonetic, setVocabPhonetic] = useState('');
  const [vocabPartOfSpeech, setVocabPartOfSpeech] = useState('');
  const [vocabExample, setVocabExample] = useState('');
  const [vocabModalError, setVocabModalError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLost) return;
    const container = document.getElementById('appContainer');
    container?.setAttribute('inert', '');
    return () => container?.removeAttribute('inert');
  }, [sessionLost]);

  useEffect(() => {
    if ((!exerciseModalOpen && !vocabModalOpen) || sessionLost || forbidden) return;
    const dialog = document.getElementById(exerciseModalOpen ? 'exerciseModal' : 'vocabModal');
    const previous = document.activeElement as HTMLElement | null;
    const selector = 'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)';
    (dialog?.querySelector(selector) as HTMLElement | null)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPendingRef.current) { event.preventDefault(); setExerciseModalOpen(false); setVocabModalOpen(false); }
      if (event.key !== 'Tab') return;
      const elements = Array.from(dialog?.querySelectorAll<HTMLElement>(selector) || []);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [exerciseModalOpen, vocabModalOpen, sessionLost, forbidden]);

  const isPendingRef = useRef(false);
  useEffect(() => {
    isPendingRef.current = isPending || isReloading;
  }, [isPending, isReloading]);

  const courseName = lesson.courseContext.names.vi || lesson.courseContext.names.en || 'Khóa học';
  const unitName = lesson.unitContext.names.vi || lesson.unitContext.names.en || lesson.unitContext.code;

  const handleAddParagraph = () => {
    if (paragraphs.length >= 50) return;
    setParagraphs((prev) => [...prev, { type: 'paragraph', text: '' }]);
  };

  const handleRemoveParagraph = (index: number) => {
    setParagraphs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParagraphChange = (index: number, text: string) => {
    setParagraphs((prev) => {
      const next = [...prev];
      next[index] = { type: 'paragraph', text };
      return next;
    });
  };

  const authFailed = (res: Response) => {
    if (res.status === 401) { setSessionLost(true); return true; }
    if (res.status === 403) { setForbidden(true); return true; }
    return false;
  };

  const reconcile = (next: TeacherLessonDetailDto) => {
    if (!next || next.id !== lesson.id || !Array.isArray(next.revisions)) throw new Error('Invalid lesson response');
    setLesson(next);
    setTitleVi(next.currentDraft?.title.vi || '');
    setTitleEn(next.currentDraft?.title.en || '');
    setParagraphs(next.currentDraft?.contentBlocks.map((block) => ({ ...block })) || []);
    setChangeSummary('');

    if (Array.isArray(next.exercises)) {
      setExercises(
        next.exercises.map((ex) => ({
          localId: ex.id,
          sourceExerciseId: ex.id,
          position: ex.position,
          isCore: ex.isCore,
          type: ex.type,
          promptData: ex.promptData ? JSON.parse(JSON.stringify(ex.promptData)) : {},
          gradingData: ex.gradingData ? JSON.parse(JSON.stringify(ex.gradingData)) : {},
          feedbackData: ex.feedbackData ? JSON.parse(JSON.stringify(ex.feedbackData)) : undefined,
        }))
      );
    }
    if (Array.isArray(next.vocabulary)) {
      setVocabulary(
        next.vocabulary.map((v) => ({
          localId: v.id,
          sourceLinkId: v.id,
          position: v.position,
          isCore: v.isCore,
          displayInfo: {
            canonicalForm: v.displaySnapshot?.canonicalForm || '',
            senseKey: v.displaySnapshot?.senseKey || 'default',
            meaningVi: v.displaySnapshot?.meaningLabels?.vi,
            meaningEn: v.displaySnapshot?.meaningLabels?.en,
            phonetic: v.displaySnapshot?.phonetic,
            partOfSpeech: v.displaySnapshot?.partOfSpeech,
            example: v.displaySnapshot?.example,
          },
        }))
      );
    }
  };

  const handleReloadLatestToken = async () => {
    if (isPendingRef.current) return;
    isPendingRef.current = true;
    setIsReloading(true);
    setGeneralError(null);

    try {
      const res = await fetch(`/api/teacher/lessons/${lesson.id}`, {
        method: 'GET',
        headers: { Origin: window.location.origin },
      });

      if (authFailed(res)) return;
      if (!res.ok) {
        setGeneralError('Không thể tải dữ liệu mới nhất. Vui lòng thử lại sau.');
        setIsReloading(false);
        return;
      }

      const data = await res.json();
      const updatedLesson: TeacherLessonDetailDto = data.data;

      reconcile(updatedLesson);
      setIsStaleConflict(false);
      setGeneralError(null);
      setIsReloading(false);
      setSuccessMessage('Đã tải nội dung mới nhất. Hãy kiểm tra và chỉnh sửa trước khi lưu.');
    } catch {
      setGeneralError('Lỗi kết nối khi đồng bộ phiên bản mới nhất.');
      setIsReloading(false);
    } finally {
      isPendingRef.current = false;
      setIsReloading(false);
    }
  };

  // --- Exercise Handlers ---
  const handleOpenAddExercise = () => {
    if (isPendingRef.current || !lesson.isEditable) return;
    setEditingExerciseIndex(null);
    setExType('MCQ');
    setRoCorrectOrder('');
    setExPosition(exercises.length + 1);
    setExIsCore(true);
    setExPrompt('');
    setExExplanation('');
    setMcqOptions([
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
    ]);
    setMcqCorrectId('opt_1');
    setExerciseModalError(null);
    setExerciseModalOpen(true);
  };

  const handleOpenEditExercise = (index: number) => {
    if (isPendingRef.current || !lesson.isEditable) return;
    const ex = exercises[index];
    setEditingExerciseIndex(index);
    setExType(ex.type);
    setExPosition(ex.position);
    setExIsCore(ex.isCore);
    setExPrompt(ex.promptData?.prompt || '');
    setExExplanation(ex.feedbackData?.explanation || '');
    setExerciseModalError(null);

    // Populate type-specific fields
    if (ex.type === 'MCQ') {
      setMcqOptions(ex.promptData?.options || [{ id: 'opt_1', text: '' }, { id: 'opt_2', text: '' }]);
      setMcqCorrectId(ex.gradingData?.correctOptionId || 'opt_1');
    } else if (ex.type === 'FILL_BLANK') {
      setFbSentence(ex.promptData?.sentence || '');
      setFbAnswers(Array.isArray(ex.gradingData?.acceptedAnswers) ? ex.gradingData.acceptedAnswers.join('\n') : '');
      setFbCaseSensitive(!!ex.gradingData?.caseSensitive);
    } else if (ex.type === 'REORDER') {
      setRoTokens(ex.promptData?.tokens || [{ id: 'tok_1', text: '' }, { id: 'tok_2', text: '' }]);
      setRoCorrectOrder((ex.gradingData?.correctOrder || []).join('\n'));
    } else if (ex.type === 'LISTENING') {
      setLisAudioUrl(ex.promptData?.audioUrl || '');
      setLisOptions(ex.promptData?.options || [{ id: 'opt_1', text: '' }, { id: 'opt_2', text: '' }]);
      setLisCorrectId(ex.gradingData?.correctOptionId || 'opt_1');
      setLisTranscript(ex.gradingData?.transcript || '');
    } else if (ex.type === 'GRAMMAR') {
      setGrSource(ex.promptData?.sourceSentence || '');
      setGrTarget(ex.promptData?.targetPattern || '');
      setGrAnswers(Array.isArray(ex.gradingData?.acceptedAnswers) ? ex.gradingData.acceptedAnswers.join('\n') : '');
      setGrCaseSensitive(!!ex.gradingData?.caseSensitive);
    }

    setExerciseModalOpen(true);
  };

  const handleSwitchExerciseType = (newType: ExerciseType) => {
    setExType(newType);
    setRoCorrectOrder('');
    setExerciseModalError(null);
    // Reset type specific fields completely to avoid submitting stale fields
    if (newType === 'MCQ') {
      setMcqOptions([
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
      ]);
      setMcqCorrectId('opt_1');
    } else if (newType === 'FILL_BLANK') {
      setFbSentence('');
      setFbAnswers('');
      setFbCaseSensitive(false);
    } else if (newType === 'REORDER') {
      setRoTokens([
        { id: 'tok_1', text: '' },
        { id: 'tok_2', text: '' },
      ]);
    } else if (newType === 'LISTENING') {
      setLisAudioUrl('');
      setLisOptions([
        { id: 'opt_1', text: '' },
        { id: 'opt_2', text: '' },
      ]);
      setLisCorrectId('opt_1');
      setLisTranscript('');
    } else if (newType === 'GRAMMAR') {
      setGrSource('');
      setGrTarget('');
      setGrAnswers('');
      setGrCaseSensitive(false);
    }
  };

  const handleRemoveExercise = (index: number) => {
    if (isPendingRef.current || !lesson.isEditable) return;
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveExerciseModal = (e: React.FormEvent) => {
    e.preventDefault();
    setExerciseModalError(null);

    const trimmedPrompt = exPrompt.trim();
    if (!trimmedPrompt) {
      setExerciseModalError('Vui lòng nhập câu hỏi / yêu cầu bài tập.');
      return;
    }

    let promptData: any = {};
    let gradingData: any = {};

    if (exType === 'MCQ') {
      if (mcqOptions.length < 2 || mcqOptions.length > 10) {
        setExerciseModalError('Bài tập trắc nghiệm cần có từ 2 đến 10 lựa chọn.');
        return;
      }
      for (const opt of mcqOptions) {
        if (!opt.text.trim()) {
          setExerciseModalError('Tất cả các lựa chọn trắc nghiệm phải có nội dung.');
          return;
        }
      }
      if (!mcqOptions.some((o) => o.id === mcqCorrectId)) {
        setExerciseModalError('Vui lòng chọn đáp án đúng.');
        return;
      }
      promptData = {
        prompt: trimmedPrompt,
        options: mcqOptions.map((o) => ({ id: o.id, text: o.text.trim() })),
      };
      gradingData = {
        correctOptionId: mcqCorrectId,
      };
    } else if (exType === 'FILL_BLANK') {
      const sentence = fbSentence.trim();
      const occurrences = (sentence.match(/____/g) || []).length;
      if (occurrences !== 1) {
        setExerciseModalError('Câu điền chỗ trống phải chứa đúng một ký tự ____ (4 dấu gạch dưới).');
        return;
      }
      const answers = fbAnswers
        .split(/\n/)
        .map((a) => a.trim())
        .filter(Boolean);
      if (answers.length === 0) {
        setExerciseModalError('Vui lòng nhập ít nhất một đáp án được chấp nhận.');
        return;
      }
      promptData = {
        prompt: trimmedPrompt,
        sentence,
      };
      gradingData = {
        acceptedAnswers: answers,
        caseSensitive: fbCaseSensitive,
      };
    } else if (exType === 'REORDER') {
      if (roTokens.length < 2 || roTokens.length > 30) {
        setExerciseModalError('Bài tập sắp xếp cần từ 2 đến 30 từ/cụm từ.');
        return;
      }
      for (const tok of roTokens) {
        if (!tok.text.trim()) {
          setExerciseModalError('Tất cả các thành phần sắp xếp phải có nội dung.');
          return;
        }
      }
      promptData = {
        prompt: trimmedPrompt,
        tokens: roTokens.map((t) => ({ id: t.id, text: t.text.trim() })),
      };
      const order = roCorrectOrder.trim() ? roCorrectOrder.split(/\n/).map(s => s.trim()).filter(Boolean) : roTokens.map(t => t.id);
      if (order.length !== roTokens.length || new Set(order).size !== roTokens.length || !roTokens.every(t => order.includes(t.id))) {
        setExerciseModalError('Thứ tự đáp án phải chứa mỗi mã token đúng một lần.');
        return;
      }
      gradingData = { correctOrder: order };
    } else if (exType === 'LISTENING') {
      const audioUrl = lisAudioUrl.trim();
      if (!isValidAudioReferenceUrl(audioUrl)) {
        setExerciseModalError('Liên kết âm thanh phải là URL HTTPS công khai hợp lệ (không kèm cổng tùy chỉnh, tham số truy vấn hoặc IP).');
        return;
      }
      if (lisOptions.length < 2 || lisOptions.length > 10) {
        setExerciseModalError('Bài tập nghe cần có từ 2 đến 10 lựa chọn.');
        return;
      }
      for (const opt of lisOptions) {
        if (!opt.text.trim()) {
          setExerciseModalError('Tất cả các lựa chọn phải có nội dung.');
          return;
        }
      }
      if (!lisOptions.some((o) => o.id === lisCorrectId)) {
        setExerciseModalError('Vui lòng chọn đáp án đúng.');
        return;
      }
      promptData = {
        prompt: trimmedPrompt,
        audioUrl,
        options: lisOptions.map((o) => ({ id: o.id, text: o.text.trim() })),
      };
      gradingData = {
        correctOptionId: lisCorrectId,
        ...(lisTranscript.trim() ? { transcript: lisTranscript.trim() } : {}),
      };
    } else if (exType === 'GRAMMAR') {
      const sourceSentence = grSource.trim();
      const targetPattern = grTarget.trim();
      if (!sourceSentence || !targetPattern) {
        setExerciseModalError('Vui lòng nhập câu gốc và mẫu câu ngữ pháp.');
        return;
      }
      const answers = grAnswers
        .split(/\n/)
        .map((a) => a.trim())
        .filter(Boolean);
      if (answers.length === 0) {
        setExerciseModalError('Vui lòng nhập ít nhất một đáp án đúng cho bài tập ngữ pháp.');
        return;
      }
      promptData = {
        prompt: trimmedPrompt,
        sourceSentence,
        targetPattern,
      };
      gradingData = {
        acceptedAnswers: answers,
        caseSensitive: grCaseSensitive,
      };
    }

    const stagedItem: StagedExercise = {
      localId:
        editingExerciseIndex !== null
          ? exercises[editingExerciseIndex].localId
          : Math.random().toString(),
      sourceExerciseId:
        editingExerciseIndex !== null
          ? exercises[editingExerciseIndex].sourceExerciseId
          : undefined,
      position: Number(exPosition) || exercises.length + 1,
      isCore: exIsCore,
      type: exType,
      promptData,
      gradingData,
      feedbackData: exExplanation.trim() ? { explanation: exExplanation.trim() } : undefined,
    };

    if (editingExerciseIndex !== null) {
      setExercises((prev) => {
        const next = [...prev];
        next[editingExerciseIndex] = stagedItem;
        return next;
      });
    } else {
      setExercises((prev) => [...prev, stagedItem]);
    }

    setExerciseModalOpen(false);
  };

  // --- Vocabulary Handlers ---
  const handleOpenAddVocabulary = () => {
    if (isPendingRef.current || !lesson.isEditable) return;
    vocabSearchGeneration.current++;
    setVocabTab('search');
    setVocabPosition(vocabulary.length + 1);
    setVocabIsCore(true);
    setVocabSearchQuery('');
    setVocabSearchResults([]);
    setSelectedVocabId(null);
    setSelectedVocabOption(null);
    setVocabCanonicalForm('');
    setVocabSenseKey('default');
    setVocabMeaningVi('');
    setVocabMeaningEn('');
    setVocabPhonetic('');
    setVocabPartOfSpeech('');
    setVocabExample('');
    setVocabModalError(null);
    setVocabModalOpen(true);
  };

  const handleSearchVocabulary = async () => {
    const q = vocabSearchQuery.trim();
    if (!q || searchingVocabRef.current) return;
    const generation = ++vocabSearchGeneration.current;
    searchingVocabRef.current = true;
    setSelectedVocabId(null); setSelectedVocabOption(null); setVocabSearchResults([]);
    setIsSearchingVocab(true);
    setVocabModalError(null);
    try {
      const res = await fetch(
        `/api/teacher/lessons/${lesson.id}/vocabulary-options?q=${encodeURIComponent(q)}`,
        { headers: { Origin: window.location.origin } }
      );
      if (authFailed(res)) return;
      if (!res.ok) {
        setVocabModalError('Không thể tìm kiếm từ vựng. Vui lòng thử lại.');
        return;
      }
      const data = await res.json();
      if (generation === vocabSearchGeneration.current) setVocabSearchResults(Array.isArray(data.data) ? data.data : []);
    } catch {
      setVocabModalError('Lỗi kết nối khi tìm kiếm từ vựng.');
    } finally {
      searchingVocabRef.current = false;
      setIsSearchingVocab(false);
    }
  };

  const handleRemoveVocabulary = (index: number) => {
    if (isPendingRef.current || !lesson.isEditable) return;
    setVocabulary((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveVocabularyModal = (e: React.FormEvent) => {
    e.preventDefault();
    setVocabModalError(null);

    const pos = Number(vocabPosition) || vocabulary.length + 1;

    if (vocabTab === 'search') {
      if (!selectedVocabId || !selectedVocabOption) {
        setVocabModalError('Vui lòng tìm kiếm và chọn một từ vựng có sẵn.');
        return;
      }
      const item: StagedVocabulary = {
        localId: Math.random().toString(),
        vocabularyId: selectedVocabId,
        position: pos,
        isCore: vocabIsCore,
        displayInfo: {
          canonicalForm: selectedVocabOption.canonicalForm,
          senseKey: selectedVocabOption.senseKey,
          meaningVi: selectedVocabOption.meaningLabels?.vi,
          meaningEn: selectedVocabOption.meaningLabels?.en,
          phonetic: selectedVocabOption.phonetic || undefined,
          partOfSpeech: selectedVocabOption.partOfSpeech || undefined,
          example: selectedVocabOption.example || undefined,
        },
      };
      setVocabulary((prev) => [...prev, item]);
      setVocabModalOpen(false);
    } else {
      const canonicalForm = vocabCanonicalForm.trim();
      const senseKey = vocabSenseKey.trim() || 'default';
      const vi = vocabMeaningVi.trim();
      const en = vocabMeaningEn.trim();

      if (!canonicalForm) {
        setVocabModalError('Vui lòng nhập từ / cụm từ gốc.');
        return;
      }
      if (!vi && !en) {
        setVocabModalError('Vui lòng nhập ít nhất một nghĩa (tiếng Việt hoặc tiếng Anh).');
        return;
      }

      const item: StagedVocabulary = {
        localId: Math.random().toString(),
        create: {
          canonicalForm,
          senseKey,
          meaningLabels: {
            ...(vi ? { vi } : {}),
            ...(en ? { en } : {}),
          },
          phonetic: vocabPhonetic.trim() || undefined,
          partOfSpeech: vocabPartOfSpeech.trim() || undefined,
          example: vocabExample.trim() || undefined,
        },
        position: pos,
        isCore: vocabIsCore,
        displayInfo: {
          canonicalForm,
          senseKey,
          meaningVi: vi || undefined,
          meaningEn: en || undefined,
          phonetic: vocabPhonetic.trim() || undefined,
          partOfSpeech: vocabPartOfSpeech.trim() || undefined,
          example: vocabExample.trim() || undefined,
        },
      };
      setVocabulary((prev) => [...prev, item]);
      setVocabModalOpen(false);
    }
  };

  // --- Submit All Draft Content ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPendingRef.current || isStaleConflict || sessionLost || forbidden || !lesson.isEditable) return;

    setGeneralError(null);
    setTitleError(null);
    setSuccessMessage(null);
    setIsStaleConflict(false);

    const trimmedVi = titleVi.trim();
    const trimmedEn = titleEn.trim();

    if (!trimmedVi && !trimmedEn) {
      setTitleError('Ít nhất một ngôn ngữ (tiếng Việt hoặc tiếng Anh) phải có tiêu đề.');
      return;
    }

    setIsPending(true);
    isPendingRef.current = true;

    try {
      const payloadTitle = { vi: trimmedVi, en: trimmedEn };

      const payload = {
        title: payloadTitle,
        contentBlocks: paragraphs.map((p) => ({
          type: 'paragraph' as const,
          text: p.text,
        })),
        changeSummary: changeSummary.trim() || undefined,
        expectedRowVersion: lesson.rowVersion,
        expectedRevisionId: lesson.highestRevision?.id || null,
        exercises: exercises.map((ex) => {
          const item: any = {
            position: ex.position,
            isCore: ex.isCore,
            type: ex.type,
            promptData: ex.promptData,
            gradingData: ex.gradingData,
          };
          if (ex.sourceExerciseId) {
            item.sourceExerciseId = ex.sourceExerciseId;
          }
          if (ex.feedbackData?.explanation) {
            item.feedbackData = { explanation: ex.feedbackData.explanation };
          }
          return item;
        }),
        vocabulary: vocabulary.map((v) => {
          const item: any = {
            position: v.position,
            isCore: v.isCore,
          };
          if (v.sourceLinkId) {
            item.sourceLinkId = v.sourceLinkId;
          } else if (v.vocabularyId) {
            item.vocabularyId = v.vocabularyId;
          } else if (v.create) {
            item.create = v.create;
          }
          return item;
        }),
      };

      const res = await fetch(`/api/teacher/lessons/${lesson.id}/draft`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Origin: window.location.origin,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (authFailed(res)) { setIsPending(false); isPendingRef.current = false; return; }
      if (!res.ok) {
        setIsPending(false);
        isPendingRef.current = false;
        const errCode = data?.error?.code;
        const errMsg = data?.error?.message || 'Có lỗi xảy ra khi lưu bản nháp.';

        if (errCode === 'STALE_LESSON' || errCode === 'REVISION_CONFLICT') {
          setIsStaleConflict(true);
          setGeneralError('Dữ liệu bài học đã bị thay đổi bởi phiên làm việc khác. Vui lòng tải lại phiên bản mới nhất trước khi lưu.');
        } else if (errCode === 'UNSUPPORTED_DRAFT_CONTENT') {
          setGeneralError(errMsg);
          setLesson((previous) => ({ ...previous, isEditable: false, editabilityReason: errMsg }));
        } else if (errCode === 'DRAFT_NOT_EDITABLE') {
          setGeneralError(errMsg);
          setLesson((previous) => ({ ...previous, isEditable: false, editabilityReason: errMsg }));
        } else {
          setGeneralError(errMsg);
        }
        return;
      }

      const updated: TeacherLessonDetailDto = data.data;
      reconcile(updated);
      setIsPending(false);
      isPendingRef.current = false;

      const newRevNo = updated.highestRevision?.revisionNo || 1;
      setSuccessMessage(`Đã lưu bản nháp thành công (Bản sửa đổi #${newRevNo}).`);
    } catch {
      setIsPending(false);
      isPendingRef.current = false;
      setGeneralError('Lỗi kết nối máy chủ khi lưu bản nháp. Vui lòng thử lại.');
    }
  };

  if (forbidden) return <AccessDeniedView accountId={account.id} message="Tài khoản không còn quyền truy cập bài học. Vui lòng đăng xuất." />;

  return (
    <div className="page-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Return link */}
      <nav className="catalog-breadcrumbs" style={{ marginBottom: '16px' }}>
        <a
          href="/my-lessons"
          className="breadcrumb-link"
          id="btnBackToMyLessons"
          aria-disabled={isPending || isReloading}
          onClick={(e) => {
            if (isPendingRef.current) e.preventDefault();
          }}
        >
          &larr; Quay lại danh sách bài học
        </a>
      </nav>

      {/* Header & context info */}
      <div
        className="editor-header"
        style={{
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Khóa học: {courseName}
          </span>
          <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
            Đơn vị: {lesson.unitContext.code}
          </span>
          <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }} id="badgeLessonToken">
            Phiên bản: #{lesson.rowVersion}
          </span>
        </div>

        <h1 className="page-title" id="draftEditorTitle" style={{ fontSize: '24px' }}>
          Soạn thảo nội dung — Bài học #{lesson.position}
        </h1>
        <p className="page-description" style={{ margin: 0 }}>
          {unitName}. Soạn các đoạn văn, bài tập và từ vựng, sau đó lưu bản nháp nguyên khối.
        </p>
      </div>

      {/* Read-only Alert when !isEditable */}
      {!lesson.isEditable && (
        <div
          className="form-error-banner"
          role="alert"
          id="readOnlyReasonBanner"
          style={{
            background: '#fffbeb',
            borderColor: '#f59e0b',
            color: '#b45309',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Bản nháp ở chế độ chỉ đọc
          </div>
          <div>{lesson.editabilityReason || 'Bản nháp hiện tại không thể chỉnh sửa.'}</div>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div
          role="status"
          id="draftSaveSuccess"
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error Banner with Stale Reload option */}
      {generalError && (
        <div
          className="form-error-banner"
          role="alert"
          id="draftSaveError"
          style={{
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ marginBottom: isStaleConflict ? '12px' : 0 }}>{generalError}</div>
          {isStaleConflict && (
            <button
              type="button"
              className="btn btn-secondary"
              id="btnReloadLessonToken"
              onClick={handleReloadLatestToken}
              disabled={isReloading || isPending}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              {isReloading ? 'Đang tải lại...' : 'Tải nội dung mới nhất (thay nội dung đang soạn)'}
            </button>
          )}
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} id="lessonDraftForm">
        {/* Title Section */}
        <div
          className="form-section"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
            1. Tiêu đề bài học
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="inputDraftTitleVi" className="form-label">
                Tiêu đề tiếng Việt
              </label>
              <input
                type="text"
                id="inputDraftTitleVi"
                className="form-input"
                value={titleVi}
                onChange={(e) => {
                  setTitleVi(e.target.value);
                  setTitleError(null);
                }}
                maxLength={300}
                placeholder="Nhập tiêu đề tiếng Việt..."
                disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inputDraftTitleEn" className="form-label">
                Tiêu đề tiếng Anh
              </label>
              <input
                type="text"
                id="inputDraftTitleEn"
                className="form-input"
                value={titleEn}
                onChange={(e) => {
                  setTitleEn(e.target.value);
                  setTitleError(null);
                }}
                maxLength={300}
                placeholder="Nhập tiêu đề tiếng Anh..."
                disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
              />
            </div>
          </div>

          {titleError && (
            <div
              className="field-error-message"
              role="alert"
              id="errorDraftTitle"
              style={{ marginTop: '8px' }}
            >
              {titleError}
            </div>
          )}
        </div>

        {/* Content Paragraphs Section */}
        <div
          className="form-section"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                2. Nội dung bài học (Các đoạn văn)
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Tổng số: {paragraphs.length} / 50 đoạn văn
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              id="btnAddParagraph"
              onClick={handleAddParagraph}
              disabled={isPending || isReloading || sessionLost || !lesson.isEditable || paragraphs.length >= 50}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              + Thêm đoạn văn
            </button>
          </div>

          {paragraphs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '6px',
                color: '#64748b',
                fontStyle: 'italic',
                fontSize: '14px',
              }}
              id="emptyParagraphsNotice"
            >
              Chưa có đoạn văn nào. Bạn có thể nhấn &quot;Thêm đoạn văn&quot; hoặc lưu bản nháp chỉ có tiêu đề.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {paragraphs.map((p, idx) => (
                <div
                  key={idx}
                  id={`paragraphItem-${idx}`}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <label
                      htmlFor={`inputParagraph-${idx}`}
                      style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}
                    >
                      Đoạn văn #{idx + 1}
                    </label>
                    <button
                      type="button"
                      className="btn-text-action btn-text-delete"
                      id={`btnRemoveParagraph-${idx}`}
                      onClick={() => handleRemoveParagraph(idx)}
                      disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
                      style={{ fontSize: '12px' }}
                    >
                      Xóa đoạn
                    </button>
                  </div>
                  <textarea
                    id={`inputParagraph-${idx}`}
                    className="form-input"
                    rows={4}
                    value={p.text}
                    onChange={(e) => handleParagraphChange(idx, e.target.value)}
                    maxLength={20000}
                    placeholder="Nhập nội dung đoạn văn..."
                    disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {p.text.length} / 20.000 ký tự
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Bài tập (Exercises) Section */}
        <div
          className="form-section"
          id="exercisesSection"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                3. Bài tập (Exercises)
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Tổng số: {exercises.length} / 100 bài tập
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              id="btnAddExercise"
              onClick={handleOpenAddExercise}
              disabled={isPending || isReloading || sessionLost || !lesson.isEditable || exercises.length >= 100}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              + Thêm bài tập
            </button>
          </div>

          {exercises.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '6px',
                color: '#64748b',
                fontStyle: 'italic',
                fontSize: '14px',
              }}
              id="emptyExercisesNotice"
            >
              Chưa có bài tập nào được thêm vào bản nháp này.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" id="exercisesTable" aria-label="Danh sách bài tập trong bản nháp">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '60px' }}>Vị trí</th>
                    <th scope="col" style={{ width: '120px' }}>Loại bài tập</th>
                    <th scope="col" style={{ width: '100px' }}>Phân loại</th>
                    <th scope="col">Câu hỏi / Yêu cầu</th>
                    <th scope="col" style={{ width: '150px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((ex, idx) => (
                    <tr key={ex.localId} id={`exerciseRow-${idx}`}>
                      <td style={{ fontWeight: 600 }} id={`exercisePos-${idx}`}>
                        #{ex.position}
                      </td>
                      <td id={`exerciseType-${idx}`}>
                        <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '12px' }}>
                          {ex.type}
                        </span>
                      </td>
                      <td id={`exerciseCore-${idx}`}>
                        <span
                          className="badge"
                          style={{
                            background: ex.isCore ? '#fef3c7' : '#f1f5f9',
                            color: ex.isCore ? '#92400e' : '#475569',
                            fontSize: '12px',
                          }}
                        >
                          {ex.isCore ? 'Cốt lõi' : 'Mở rộng'}
                        </span>
                      </td>
                      <td id={`exercisePrompt-${idx}`}>
                        <div style={{ fontWeight: 500 }}>{ex.promptData?.prompt || '—'}</div>
                        {ex.type === 'LISTENING' && ex.promptData?.audioUrl && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Âm thanh: {ex.promptData.audioUrl}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-text-action"
                          id={`btnEditExercise-${idx}`}
                          onClick={() => handleOpenEditExercise(idx)}
                          disabled={isPending || isReloading || !lesson.isEditable}
                          style={{ marginRight: '8px' }}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="btn-text-action btn-text-delete"
                          id={`btnRemoveExercise-${idx}`}
                          onClick={() => handleRemoveExercise(idx)}
                          disabled={isPending || isReloading || !lesson.isEditable}
                        >
                          Gỡ khỏi bản nháp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Từ vựng (Vocabulary) Section */}
        <div
          className="form-section"
          id="vocabularySection"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                4. Từ vựng (Vocabulary)
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Tổng số: {vocabulary.length} / 100 từ vựng
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              id="btnAddVocabulary"
              onClick={handleOpenAddVocabulary}
              disabled={isPending || isReloading || sessionLost || !lesson.isEditable || vocabulary.length >= 100}
              style={{ fontSize: '13px', padding: '6px 12px' }}
            >
              + Thêm từ vựng
            </button>
          </div>

          {vocabulary.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '6px',
                color: '#64748b',
                fontStyle: 'italic',
                fontSize: '14px',
              }}
              id="emptyVocabularyNotice"
            >
              Chưa có từ vựng nào được liên kết vào bản nháp này.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" id="vocabularyTable" aria-label="Danh sách từ vựng trong bản nháp">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '60px' }}>Vị trí</th>
                    <th scope="col" style={{ width: '100px' }}>Phân loại</th>
                    <th scope="col" style={{ width: '160px' }}>Từ / Cụm từ</th>
                    <th scope="col" style={{ width: '100px' }}>Nét nghĩa</th>
                    <th scope="col">Ý nghĩa</th>
                    <th scope="col" style={{ width: '150px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {vocabulary.map((v, idx) => (
                    <tr key={v.localId} id={`vocabRow-${idx}`}>
                      <td style={{ fontWeight: 600 }} id={`vocabPos-${idx}`}>
                        <input id={`inputVocabPositionRow-${idx}`} type="number" min={1} max={2147483647}
                          aria-label={`Vị trí từ vựng ${idx + 1}`} className="form-input" value={v.position} style={{width: '80px', minWidth: '80px', padding: '6px 8px'}}
                          disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
                          onChange={e => { const position = Number(e.target.value); setVocabulary(prev => prev.map((item, i) => i === idx ? {...item, position} : item)); }} />
                      </td>
                      <td id={`vocabCore-${idx}`}>
                        <input id={`inputVocabCoreRow-${idx}`} type="checkbox" checked={v.isCore} aria-label={`Từ vựng cốt lõi ${idx + 1}`}
                          disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
                          onChange={e => { const isCore = e.target.checked; setVocabulary(prev => prev.map((item, i) => i === idx ? {...item, isCore} : item)); }} />
                        <span
                          className="badge"
                          style={{
                            background: v.isCore ? '#fef3c7' : '#f1f5f9',
                            color: v.isCore ? '#92400e' : '#475569',
                            fontSize: '12px',
                          }}
                        >
                          {v.isCore ? 'Cốt lõi' : 'Mở rộng'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }} id={`vocabTerm-${idx}`}>
                        {v.displayInfo.canonicalForm}
                        {v.displayInfo.phonetic && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 400 }}>
                            {v.displayInfo.phonetic}
                          </span>
                        )}
                      </td>
                      <td id={`vocabSense-${idx}`}>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px' }}>
                          {v.displayInfo.senseKey}
                        </span>
                      </td>
                      <td id={`vocabMeaning-${idx}`}>
                        {v.displayInfo.meaningVi && <div>vi: {v.displayInfo.meaningVi}</div>}
                        {v.displayInfo.meaningEn && <div style={{ color: '#475569' }}>en: {v.displayInfo.meaningEn}</div>}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="btn-text-action btn-text-delete"
                          id={`btnRemoveVocab-${idx}`}
                          onClick={() => handleRemoveVocabulary(idx)}
                          disabled={isPending || isReloading || !lesson.isEditable}
                        >
                          Gỡ khỏi bản nháp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change Summary Section */}
        <div
          className="form-section"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
            5. Tóm tắt thay đổi (tùy chọn)
          </h2>
          <textarea
            id="inputDraftChangeSummary"
            className="form-input"
            rows={2}
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            maxLength={500}
            placeholder="Ghi chú ngắn về các thay đổi trong lần lưu này (tối đa 500 ký tự)..."
            disabled={isPending || isReloading || sessionLost || !lesson.isEditable}
          />
        </div>

        {/* Submit action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '32px' }}>
          <a
            href="/my-lessons"
            className="btn btn-secondary"
            id="btnCancelDraft"
            aria-disabled={isPending || isReloading}
            onClick={(e) => {
              if (isPendingRef.current) e.preventDefault();
            }}
          >
            Hủy / Quay lại
          </a>
          <button
            type="submit"
            className="btn btn-primary"
            id="btnSaveDraft"
            disabled={isPending || isReloading || isStaleConflict || sessionLost || !lesson.isEditable}
            style={{ minWidth: '140px' }}
          >
            {isPending ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>
        </div>
      </form>

      {/* Revision History Section */}
      <div
        className="revision-history-section"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}
        id="revisionHistorySection"
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
          Lịch sử bản sửa đổi
        </h2>

        {lesson.revisions.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: '#94a3b8',
              fontStyle: 'italic',
            }}
            id="emptyRevisionHistory"
          >
            Chưa có bản sửa đổi nào được lưu.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table" aria-label="Lịch sử bản sửa đổi bài học">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '90px' }}>Bản số</th>
                  <th scope="col" style={{ width: '160px' }}>Tác giả</th>
                  <th scope="col" style={{ width: '180px' }}>Thời gian</th>
                  <th scope="col">Tóm tắt thay đổi</th>
                  <th scope="col" style={{ width: '120px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {lesson.revisions.map((rev) => (
                  <tr key={rev.id} id={`row-revision-${rev.revisionNo}`}>
                    <td style={{ fontWeight: 600 }}>#{rev.revisionNo}</td>
                    <td>{rev.author.displayName || 'Giáo viên'}</td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {new Date(rev.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td>{rev.changeSummary || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <span
                        className="level-badge"
                        style={{
                          background: rev.status === 'DRAFT' ? '#eff6ff' : '#f1f5f9',
                          color: rev.status === 'DRAFT' ? '#1d4ed8' : '#475569',
                        }}
                      >
                        {rev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exercise Modal */}
      {exerciseModalOpen && (
        <div
          id="exerciseModalBackdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPendingRef.current) setExerciseModalOpen(false);
          }}
        >
          <div
            id="exerciseModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exerciseModalTitle"
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 id="exerciseModalTitle" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
              {editingExerciseIndex !== null ? 'Chỉnh sửa bài tập' : 'Thêm bài tập mới vào bản nháp'}
            </h2>

            {exerciseModalError && (
              <div
                className="form-error-banner"
                role="alert"
                id="errorExerciseModal"
                style={{
                  background: '#fef2f2',
                  borderColor: '#fca5a5',
                  color: '#b91c1c',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                {exerciseModalError}
              </div>
            )}

            <form onSubmit={handleSaveExerciseModal} id="exerciseForm">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label htmlFor="selectExerciseType" className="form-label">
                    Loại bài tập
                  </label>
                  <select
                    id="selectExerciseType"
                    className="form-input"
                    value={exType}
                    onChange={(e) => handleSwitchExerciseType(e.target.value as ExerciseType)}
                  >
                    <option value="MCQ">MCQ (Trắc nghiệm)</option>
                    <option value="FILL_BLANK">FILL_BLANK (Điền từ)</option>
                    <option value="REORDER">REORDER (Sắp xếp từ)</option>
                    <option value="LISTENING">LISTENING (Luyện nghe)</option>
                    <option value="GRAMMAR">GRAMMAR (Ngữ pháp)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="inputExercisePosition" className="form-label">
                    Vị trí
                  </label>
                  <input
                    type="number"
                    id="inputExercisePosition"
                    className="form-input"
                    value={exPosition}
                    min={1}
                    onChange={(e) => setExPosition(parseInt(e.target.value, 10) || 1)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Phân loại
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="inputExerciseIsCore"
                      checked={exIsCore}
                      onChange={(e) => setExIsCore(e.target.checked)}
                    />
                    Cốt lõi
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label htmlFor="inputExercisePrompt" className="form-label">
                  Câu hỏi / Yêu cầu đề bài *
                </label>
                <textarea
                  id="inputExercisePrompt"
                  className="form-input"
                  rows={2}
                  value={exPrompt}
                  onChange={(e) => setExPrompt(e.target.value)}
                  maxLength={4000}
                  placeholder="Nhập yêu cầu bài tập..."
                />
              </div>

              {/* Type Specific Fields */}
              {exType === 'MCQ' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Các lựa chọn (chọn nút tròn để đánh dấu đáp án đúng):</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      id="btnAddMcqOption"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      disabled={mcqOptions.length >= 10}
                      onClick={() => {
                        const newId = `opt_${Date.now()}`;
                        setMcqOptions((prev) => [...prev, { id: newId, text: '' }]);
                      }}
                    >
                      + Thêm lựa chọn
                    </button>
                  </div>
                  {mcqOptions.map((opt, optIdx) => (
                    <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <input
                        type="radio"
                        name="mcqCorrect"
                        id={`radioMcqCorrectOption-${optIdx}`}
                        checked={mcqCorrectId === opt.id}
                        onChange={() => setMcqCorrectId(opt.id)}
                        aria-label={`Đáp án đúng ${optIdx + 1}`}
                      />
                      <input
                        type="text"
                        className="form-input"
                        id={`inputMcqOptionText-${optIdx}`}
                        value={opt.text}
                        maxLength={500}
                        placeholder={`Nội dung lựa chọn ${optIdx + 1}...`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMcqOptions((prev) => {
                            const next = [...prev];
                            next[optIdx] = { ...next[optIdx], text: val };
                            return next;
                          });
                        }}
                      />
                      {mcqOptions.length > 2 && (
                        <button
                          type="button"
                          className="btn-text-action btn-text-delete"
                          id={`btnRemoveMcqOption-${optIdx}`}
                          onClick={() => {
                            setMcqOptions((prev) => prev.filter((_, i) => i !== optIdx));
                            if (mcqCorrectId === opt.id) {
                              const remaining = mcqOptions.filter((_, i) => i !== optIdx);
                              if (remaining[0]) setMcqCorrectId(remaining[0].id);
                            }
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {exType === 'FILL_BLANK' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputFillBlankSentence" className="form-label">
                      Câu điền chỗ trống (phải chứa đúng 1 ký tự ____)
                    </label>
                    <input
                      type="text"
                      id="inputFillBlankSentence"
                      className="form-input"
                      value={fbSentence}
                      onChange={(e) => setFbSentence(e.target.value)}
                      placeholder="Ví dụ: She ____ to school every day."
                      maxLength={4000}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputFillBlankAnswers" className="form-label">
                      Các đáp án được chấp nhận (mỗi đáp án một dòng)
                    </label>
                    <textarea
                      rows={3}
                      id="inputFillBlankAnswers"
                      className="form-input"
                      value={fbAnswers}
                      onChange={(e) => setFbAnswers(e.target.value)}
                      placeholder="goes, walks"
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="checkFillBlankCaseSensitive"
                      checked={fbCaseSensitive}
                      onChange={(e) => setFbCaseSensitive(e.target.checked)}
                    />
                    Phân biệt chữ hoa / chữ thường
                  </label>
                </div>
              )}

              {exType === 'REORDER' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Thành phần sắp xếp theo đúng thứ tự:</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      id="btnAddReorderToken"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      disabled={roTokens.length >= 30}
                      onClick={() => {
                        const newId = `tok_${Date.now()}`;
                        setRoTokens((prev) => [...prev, { id: newId, text: '' }]);
                      }}
                    >
                      + Thêm từ
                    </button>
                  </div>
                  {roTokens.map((tok, tokIdx) => (
                    <div key={tok.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', width: '20px', color: '#64748b' }}>#{tokIdx + 1}</span>
                      <input
                        type="text"
                        className="form-input"
                        id={`inputReorderToken-${tokIdx}`}
                        value={tok.text}
                        maxLength={500}
                        placeholder={`Từ / cụm từ ${tokIdx + 1}...`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRoTokens((prev) => {
                            const next = [...prev];
                            next[tokIdx] = { ...next[tokIdx], text: val };
                            return next;
                          });
                        }}
                      />
                      {roTokens.length > 2 && (
                        <button
                          type="button"
                          className="btn-text-action btn-text-delete"
                          id={`btnRemoveReorderToken-${tokIdx}`}
                          onClick={() => setRoTokens((prev) => prev.filter((_, i) => i !== tokIdx))}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {exType === 'REORDER' && (
                <div className="form-group">
                  <label htmlFor="inputReorderCorrectOrder">Thứ tự đáp án (mỗi mã token một dòng; bỏ trống để dùng thứ tự nhập)</label>
                  <p>{roTokens.map(t => `${t.id}: ${t.text}`).join(' · ')}</p>
                  <textarea id="inputReorderCorrectOrder" className="form-input" rows={3} value={roCorrectOrder} onChange={e => setRoCorrectOrder(e.target.value)} />
                </div>
              )}

              {exType === 'LISTENING' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputListeningAudioUrl" className="form-label">
                      Liên kết âm thanh HTTPS công khai *
                    </label>
                    <input
                      type="url"
                      id="inputListeningAudioUrl"
                      className="form-input"
                      value={lisAudioUrl}
                      onChange={(e) => setLisAudioUrl(e.target.value)}
                      placeholder="https://cdn.example.com/audio/lesson-01.mp3"
                      maxLength={2048}
                    />
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Liên kết âm thanh tham chiếu tác giả. Hệ thống chỉ lưu tham chiếu URL hợp lệ, không tải về hoặc lưu trữ tệp.
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputListeningTranscript" className="form-label">
                      Bản ghi lời thoại (tùy chọn)
                    </label>
                    <textarea
                      id="inputListeningTranscript"
                      className="form-input"
                      rows={2}
                      value={lisTranscript}
                      onChange={(e) => setLisTranscript(e.target.value)}
                      placeholder="Lời thoại của đoạn ghi âm..."
                      maxLength={4000}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Các lựa chọn trả lời:</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      id="btnAddListeningOption"
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      disabled={lisOptions.length >= 10}
                      onClick={() => {
                        const newId = `opt_${Date.now()}`;
                        setLisOptions((prev) => [...prev, { id: newId, text: '' }]);
                      }}
                    >
                      + Thêm lựa chọn
                    </button>
                  </div>
                  {lisOptions.map((opt, optIdx) => (
                    <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <input
                        type="radio"
                        name="lisCorrect"
                        id={`radioListeningCorrectOption-${optIdx}`}
                        checked={lisCorrectId === opt.id}
                        onChange={() => setLisCorrectId(opt.id)}
                        aria-label={`Đáp án đúng ${optIdx + 1}`}
                      />
                      <input
                        type="text"
                        className="form-input"
                        id={`inputListeningOptionText-${optIdx}`}
                        value={opt.text}
                        maxLength={500}
                        placeholder={`Lựa chọn ${optIdx + 1}...`}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLisOptions((prev) => {
                            const next = [...prev];
                            next[optIdx] = { ...next[optIdx], text: val };
                            return next;
                          });
                        }}
                      />
                      {lisOptions.length > 2 && (
                        <button
                          type="button"
                          className="btn-text-action btn-text-delete"
                          onClick={() => {
                            setLisOptions((prev) => prev.filter((_, i) => i !== optIdx));
                            if (lisCorrectId === opt.id) {
                              const remaining = lisOptions.filter((_, i) => i !== optIdx);
                              if (remaining[0]) setLisCorrectId(remaining[0].id);
                            }
                          }}
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {exType === 'GRAMMAR' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputGrammarSourceSentence" className="form-label">
                      Câu nguồn / Câu ban đầu *
                    </label>
                    <input
                      type="text"
                      id="inputGrammarSourceSentence"
                      className="form-input"
                      value={grSource}
                      onChange={(e) => setGrSource(e.target.value)}
                      placeholder="She has read this book."
                      maxLength={4000}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputGrammarTargetPattern" className="form-label">
                      Mẫu câu / Cấu trúc ngữ pháp đích *
                    </label>
                    <input
                      type="text"
                      id="inputGrammarTargetPattern"
                      className="form-input"
                      value={grTarget}
                      onChange={(e) => setGrTarget(e.target.value)}
                      placeholder="This book has been read by her."
                      maxLength={4000}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputGrammarAnswers" className="form-label">
                      Các đáp án được chấp nhận (mỗi đáp án một dòng)
                    </label>
                    <textarea
                      rows={3}
                      id="inputGrammarAnswers"
                      className="form-input"
                      value={grAnswers}
                      onChange={(e) => setGrAnswers(e.target.value)}
                      placeholder="This book has been read by her."
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="checkGrammarCaseSensitive"
                      checked={grCaseSensitive}
                      onChange={(e) => setGrCaseSensitive(e.target.checked)}
                    />
                    Phân biệt chữ hoa / chữ thường
                  </label>
                </div>
              )}

              {/* Optional explanation */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="inputExerciseExplanation" className="form-label">
                  Giải thích đáp án (tùy chọn)
                </label>
                <textarea
                  id="inputExerciseExplanation"
                  className="form-input"
                  rows={2}
                  value={exExplanation}
                  onChange={(e) => setExExplanation(e.target.value)}
                  maxLength={4000}
                  placeholder="Giải thích tại sao đáp án này đúng..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  id="btnCancelExerciseModal"
                  onClick={() => setExerciseModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btnSaveExerciseModal"
                >
                  Xác nhận bài tập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vocabulary Modal */}
      {vocabModalOpen && (
        <div
          id="vocabModalBackdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPendingRef.current) setVocabModalOpen(false);
          }}
        >
          <div
            id="vocabModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vocabModalTitle"
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 id="vocabModalTitle" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#0f172a' }}>
              Thêm từ vựng vào bản nháp
            </h2>

            {/* Mode tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <button
                type="button"
                id="tabVocabSearch"
                onClick={() => setVocabTab('search')}
                style={{
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderBottom: vocabTab === 'search' ? '2px solid #2563eb' : 'none',
                  color: vocabTab === 'search' ? '#2563eb' : '#64748b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                1. Tra cứu từ có sẵn
              </button>
              <button
                type="button"
                id="tabVocabCreate"
                onClick={() => setVocabTab('create')}
                style={{
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderBottom: vocabTab === 'create' ? '2px solid #2563eb' : 'none',
                  color: vocabTab === 'create' ? '#2563eb' : '#64748b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                2. Tạo từ vựng mới
              </button>
            </div>

            {vocabModalError && (
              <div
                className="form-error-banner"
                role="alert"
                id="errorVocabModal"
                style={{
                  background: '#fef2f2',
                  borderColor: '#fca5a5',
                  color: '#b91c1c',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                {vocabModalError}
              </div>
            )}

            <form onSubmit={handleSaveVocabularyModal} id="vocabForm">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label htmlFor="inputVocabPosition" className="form-label">
                    Vị trí trong bài học
                  </label>
                  <input
                    type="number"
                    id="inputVocabPosition"
                    className="form-input"
                    value={vocabPosition}
                    min={1}
                    onChange={(e) => setVocabPosition(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>
                    Phân loại
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      id="inputVocabIsCore"
                      checked={vocabIsCore}
                      onChange={(e) => setVocabIsCore(e.target.checked)}
                    />
                    Từ vựng cốt lõi
                  </label>
                </div>
              </div>

              {vocabTab === 'search' ? (
                <div style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label htmlFor="inputVocabSearch" className="form-label">
                      Nhập từ cần tìm (ngôn ngữ đích của khóa học)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        id="inputVocabSearch"
                        className="form-input"
                        value={vocabSearchQuery}
                        onChange={(e) => setVocabSearchQuery(e.target.value)}
                        placeholder="Ví dụ: hello, learn..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchVocabulary();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        id="btnSearchVocab"
                        onClick={handleSearchVocabulary}
                        disabled={isSearchingVocab}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {isSearchingVocab ? 'Đang tìm...' : 'Tìm kiếm'}
                      </button>
                    </div>
                  </div>

                  {vocabSearchResults.length > 0 && (
                    <div id="vocabSearchResults" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      {vocabSearchResults.map((opt, idx) => (
                        <div
                          key={opt.id}
                          style={{
                            padding: '10px 12px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: selectedVocabId === opt.id ? '#eff6ff' : 'transparent',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600 }}>{opt.canonicalForm}</span>
                            <span className="badge" style={{ marginLeft: '6px', fontSize: '11px', background: '#e2e8f0' }}>
                              {opt.senseKey}
                            </span>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {opt.meaningLabels?.vi && `vi: ${opt.meaningLabels.vi} `}
                              {opt.meaningLabels?.en && `en: ${opt.meaningLabels.en}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            id={`btnSelectVocabOption-${idx}`}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            onClick={() => {
                              setSelectedVocabId(opt.id);
                              setSelectedVocabOption(opt);
                            }}
                          >
                            {selectedVocabId === opt.id ? 'Đã chọn' : 'Chọn'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedVocabOption && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '13px' }}>
                      Đã chọn: <strong>{selectedVocabOption.canonicalForm}</strong> ({selectedVocabOption.senseKey})
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label htmlFor="inputVocabCanonical" className="form-label">
                        Từ / Cụm từ gốc *
                      </label>
                      <input
                        type="text"
                        id="inputVocabCanonical"
                        className="form-input"
                        value={vocabCanonicalForm}
                        onChange={(e) => setVocabCanonicalForm(e.target.value)}
                        placeholder="Ví dụ: resilient"
                        maxLength={300}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="inputVocabSenseKey" className="form-label">
                        Nét nghĩa (senseKey)
                      </label>
                      <input
                        type="text"
                        id="inputVocabSenseKey"
                        className="form-input"
                        value={vocabSenseKey}
                        onChange={(e) => setVocabSenseKey(e.target.value)}
                        placeholder="default"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label htmlFor="inputVocabMeaningVi" className="form-label">
                        Ý nghĩa tiếng Việt *
                      </label>
                      <input
                        type="text"
                        id="inputVocabMeaningVi"
                        className="form-input"
                        value={vocabMeaningVi}
                        onChange={(e) => setVocabMeaningVi(e.target.value)}
                        placeholder="kiên cường, bền bỉ"
                        maxLength={2000}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="inputVocabMeaningEn" className="form-label">
                        Ý nghĩa tiếng Anh
                      </label>
                      <input
                        type="text"
                        id="inputVocabMeaningEn"
                        className="form-input"
                        value={vocabMeaningEn}
                        onChange={(e) => setVocabMeaningEn(e.target.value)}
                        placeholder="able to withstand difficulty"
                        maxLength={2000}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label htmlFor="inputVocabPhonetic" className="form-label">
                        Phiên âm (tùy chọn)
                      </label>
                      <input
                        type="text"
                        id="inputVocabPhonetic"
                        className="form-input"
                        value={vocabPhonetic}
                        onChange={(e) => setVocabPhonetic(e.target.value)}
                        placeholder="/rɪˈzɪliənt/"
                        maxLength={300}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="inputVocabPartOfSpeech" className="form-label">
                        Từ loại (tùy chọn)
                      </label>
                      <input
                        type="text"
                        id="inputVocabPartOfSpeech"
                        className="form-input"
                        value={vocabPartOfSpeech}
                        onChange={(e) => setVocabPartOfSpeech(e.target.value)}
                        placeholder="adj"
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inputVocabExample" className="form-label">
                      Ví dụ minh họa (tùy chọn)
                    </label>
                    <textarea
                      id="inputVocabExample"
                      className="form-input"
                      rows={2}
                      value={vocabExample}
                      onChange={(e) => setVocabExample(e.target.value)}
                      placeholder="She is resilient in the face of adversity."
                      maxLength={4000}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  id="btnCancelVocabModal"
                  onClick={() => setVocabModalOpen(false)}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="btnSaveVocabModal"
                >
                  Thêm vào bản nháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SessionLostModal isOpen={sessionLost} />
    </div>
  );
}
