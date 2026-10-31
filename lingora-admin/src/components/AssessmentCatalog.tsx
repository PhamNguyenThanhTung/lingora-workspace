'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AssessmentBlueprintDto, AssessmentVersionDto, EligibleAssessmentItemDto } from '@/server/assessments/types';
import type { ExerciseType } from '@/server/lessons/content';

type CourseChoice = { id: string; frameworkId: string; names: Record<string, string>; language?: { code: string } };
type LevelChoice = { id: string; code: string; position: number; label: Record<string, string> };
type BlueprintForm = {
  courseId: string;
  purpose: 'PLACEMENT' | 'LEVEL_UP';
  targetLevelId: string;
  nextLevelId: string;
  itemCount: string;
  exerciseTypes: ExerciseType[];
  minimumItemsByType: Partial<Record<ExerciseType, number>>;
  shuffleItems: boolean;
  shuffleOptions: boolean;
};

const EXERCISE_TYPES: ExerciseType[] = ['MCQ', 'FILL_BLANK', 'REORDER', 'LISTENING', 'GRAMMAR'];
const freshForm = (): BlueprintForm => ({
  courseId: '', purpose: 'PLACEMENT', targetLevelId: '', nextLevelId: '', itemCount: '1',
  exerciseTypes: ['MCQ'], minimumItemsByType: {}, shuffleItems: false, shuffleOptions: false,
});
const optionLabel = (names: Record<string, string> | undefined, fallback: string) => names?.vi || names?.en || fallback;
const resultBody = async (response: Response) => response.json().catch(() => ({}));

export function AssessmentCatalog() {
  const [courses, setCourses] = useState<CourseChoice[]>([]);
  const [blueprints, setBlueprints] = useState<AssessmentBlueprintDto[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState('');
  const selectedBlueprintIdRef = useRef('');
  const [form, setForm] = useState<BlueprintForm>(freshForm);
  const [levels, setLevels] = useState<LevelChoice[]>([]);
  const [levelsError, setLevelsError] = useState<string | null>(null);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [eligibleItems, setEligibleItems] = useState<EligibleAssessmentItemDto[]>([]);
  const [versions, setVersions] = useState<AssessmentVersionDto[]>([]);
  const [selectedItemRevisionIds, setSelectedItemRevisionIds] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<AssessmentVersionDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assemblyError, setAssemblyError] = useState<string | null>(null);
  const [assemblyLoadError, setAssemblyLoadError] = useState<string | null>(null);
  const [assemblyReloadToken, setAssemblyReloadToken] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [assemblyLoading, setAssemblyLoading] = useState(false);
  const [assembling, setAssembling] = useState(false);
  const catalogLoaded = useRef(false);

  const selectedBlueprint = blueprints.find((blueprint) => blueprint.id === selectedBlueprintId) || null;
  const selectedCourse = courses.find((course) => course.id === form.courseId) || null;
  const scopeLocked = Boolean(selectedBlueprint && (selectedBlueprint.versionCount || 0) > 0);

  const hydrateForm = useCallback((blueprint: AssessmentBlueprintDto) => {
    setForm({
      courseId: blueprint.courseId,
      purpose: blueprint.purpose,
      targetLevelId: blueprint.targetLevelId || '',
      nextLevelId: blueprint.nextLevelId || '',
      itemCount: String(blueprint.coverage.itemCount),
      exerciseTypes: [...blueprint.coverage.exerciseTypes],
      minimumItemsByType: { ...blueprint.requirements.minimumItemsByType },
      shuffleItems: blueprint.config.shuffleItems,
      shuffleOptions: blueprint.config.shuffleOptions,
    });
    selectedBlueprintIdRef.current = blueprint.id;
    setSelectedBlueprintId(blueprint.id);
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseResponse, blueprintResponse] = await Promise.all([
        fetch('/api/courses', { cache: 'no-store' }),
        fetch('/api/assessment-blueprints', { cache: 'no-store' }),
      ]);
      const [courseBody, blueprintBody] = await Promise.all([resultBody(courseResponse), resultBody(blueprintResponse)]);
      if (!courseResponse.ok || !blueprintResponse.ok) {
        setError(courseBody?.error?.message || blueprintBody?.error?.message || 'Không thể tải danh mục đánh giá.');
        return;
      }
      const courseRows = Array.isArray(courseBody?.data) ? courseBody.data : [];
      const blueprintRows = Array.isArray(blueprintBody?.data) ? blueprintBody.data : [];
      setCourses(courseRows);
      setBlueprints(blueprintRows);
      const nextSelectedBlueprintId = selectedBlueprintId && blueprintRows.some((bp: AssessmentBlueprintDto) => bp.id === selectedBlueprintId)
        ? selectedBlueprintId
        : '';
      selectedBlueprintIdRef.current = nextSelectedBlueprintId;
      setSelectedBlueprintId(nextSelectedBlueprintId);
      if (!nextSelectedBlueprintId && blueprintRows[0]) hydrateForm(blueprintRows[0]);
      else if (!nextSelectedBlueprintId && courseRows[0]) setForm((current) => ({ ...current, courseId: current.courseId || courseRows[0].id }));
    } catch {
      setError('Lỗi kết nối khi tải danh mục đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [hydrateForm, selectedBlueprintId]);

  const loadLevels = useCallback(async (frameworkId: string, isActive: () => boolean = () => true) => {
    setLevelsLoading(true);
    setLevelsError(null);
    try {
      const response = await fetch(`/api/frameworks/${frameworkId}/levels`, { cache: 'no-store' });
      const body = await resultBody(response);
      if (!isActive()) return;
      if (!response.ok || !Array.isArray(body?.data)) {
        setLevels([]);
        setLevelsError(body?.error?.message || 'Không thể tải danh sách cấp độ.');
        return;
      }
      setLevels(body.data);
    } catch {
      if (isActive()) {
        setLevels([]);
        setLevelsError('Lỗi kết nối khi tải danh sách cấp độ.');
      }
    } finally {
      if (isActive()) setLevelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (catalogLoaded.current) return;
    catalogLoaded.current = true;
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    let active = true;
    if (!selectedCourse?.frameworkId) {
      setLevels([]);
      setLevelsError(null);
      setLevelsLoading(false);
      return () => { active = false; };
    }
    void loadLevels(selectedCourse.frameworkId, () => active);
    return () => { active = false; };
  }, [loadLevels, selectedCourse?.frameworkId]);

  useEffect(() => {
    let active = true;
    if (!selectedBlueprint) {
      setEligibleItems([]); setVersions([]); setSelectedItemRevisionIds([]); setSelectedVersion(null); setAssemblyLoadError(null);
      return () => { active = false; };
    }
    setAssemblyLoading(true);
    setAssemblyLoadError(null);
    setSelectedItemRevisionIds([]);
    setSelectedVersion(null);
    Promise.all([
      fetch(`/api/assessment-blueprints/${selectedBlueprint.id}/eligible-items`, { cache: 'no-store' }),
      fetch(`/api/assessment-blueprints/${selectedBlueprint.id}/versions`, { cache: 'no-store' }),
    ]).then(async ([itemResponse, versionResponse]) => {
      const [itemBody, versionBody] = await Promise.all([resultBody(itemResponse), resultBody(versionResponse)]);
      if (!active) return;
      const failures: string[] = [];
      if (itemResponse.ok && Array.isArray(itemBody?.data)) setEligibleItems(itemBody.data);
      else failures.push(itemBody?.error?.message || 'Không thể tải bài tập hợp lệ.');
      if (versionResponse.ok && Array.isArray(versionBody?.data)) setVersions(versionBody.data);
      else failures.push(versionBody?.error?.message || 'Không thể tải phiên bản đã lắp ghép.');
      if (failures.length) setAssemblyLoadError(failures.join(' '));
    }).catch(() => { if (active) setAssemblyLoadError('Lỗi kết nối khi tải dữ liệu lắp ghép.'); })
      .finally(() => { if (active) setAssemblyLoading(false); });
    return () => { active = false; };
  }, [selectedBlueprint?.id, selectedBlueprint?.generation, assemblyReloadToken]);

  const toggleType = (type: ExerciseType) => {
    setForm((current) => {
      if (!current.exerciseTypes.includes(type)) return { ...current, exerciseTypes: [...current.exerciseTypes, type] };
      const minimumItemsByType = { ...current.minimumItemsByType };
      delete minimumItemsByType[type];
      return { ...current, exerciseTypes: current.exerciseTypes.filter((entry) => entry !== type), minimumItemsByType };
    });
  };

  const makePayload = () => ({
    courseId: form.courseId,
    purpose: form.purpose,
    targetLevelId: form.targetLevelId || null,
    nextLevelId: form.nextLevelId || null,
    coverage: { itemCount: Number(form.itemCount), exerciseTypes: form.exerciseTypes },
    requirements: { minimumItemsByType: form.minimumItemsByType },
    config: { shuffleItems: form.shuffleItems, shuffleOptions: form.shuffleOptions },
  });

  const refreshBlueprint = async (blueprintId: string) => {
    try {
      const response = await fetch(`/api/assessment-blueprints/${blueprintId}`, { cache: 'no-store' });
      const body = await resultBody(response);
      if (!response.ok || !body?.data || body.data.id !== blueprintId) return false;
      const refreshed = body.data as AssessmentBlueprintDto;
      setBlueprints((current) => current.map((entry) => entry.id === blueprintId ? refreshed : entry));
      if (selectedBlueprintIdRef.current === blueprintId && (refreshed.versionCount || 0) > 0) {
        setForm((current) => ({
          ...current,
          courseId: refreshed.courseId,
          purpose: refreshed.purpose,
          targetLevelId: refreshed.targetLevelId || '',
          nextLevelId: refreshed.nextLevelId || '',
        }));
      }
      return true;
    } catch {
      return false;
    }
  };

  const saveBlueprint = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(null); setNotice(null);
    try {
      const payload = makePayload();
      const { courseId: _courseId, ...updatePayload } = payload;
      const response = await fetch(selectedBlueprint ? `/api/assessment-blueprints/${selectedBlueprint.id}` : '/api/assessment-blueprints', {
        method: selectedBlueprint ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify(selectedBlueprint ? { ...updatePayload, expectedRowVersion: selectedBlueprint.rowVersion } : payload),
      });
      const body = await resultBody(response);
      if (!response.ok || !body?.data) {
        const message = body?.error?.message || 'Không thể lưu khung đánh giá.';
        if (response.status === 409 && selectedBlueprint) {
          const refreshed = await refreshBlueprint(selectedBlueprint.id);
          setError(refreshed ? `${message} Đã tải row version mới; hãy lưu lại để thử.` : message);
        } else {
          setError(message);
        }
        return;
      }
      const saved = body.data as AssessmentBlueprintDto;
      setBlueprints((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      hydrateForm(saved);
      setNotice('Đã lưu Blueprint. Biểu mẫu đã được đồng bộ với dữ liệu máy chủ.');
    } catch {
      setError('Lỗi kết nối khi lưu khung đánh giá. Dữ liệu nhập vẫn được giữ lại.');
    } finally {
      setPending(false);
    }
  };

  const deleteSelectedBlueprint = async () => {
    if (!selectedBlueprint || pending) return;
    setPending(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/assessment-blueprints/${selectedBlueprint.id}`, {
        method: 'DELETE', headers: { Origin: window.location.origin },
      });
      const body = await resultBody(response);
      if (!response.ok) { setError(body?.error?.message || 'Không thể xóa Blueprint.'); return; }
      setBlueprints((current) => current.filter((entry) => entry.id !== selectedBlueprint.id));
      selectedBlueprintIdRef.current = '';
      setSelectedBlueprintId(''); setForm(freshForm()); setNotice('Đã xóa Blueprint chưa được sử dụng.');
    } catch { setError('Lỗi kết nối khi xóa Blueprint.'); }
    finally { setPending(false); }
  };

  const toggleItem = (item: EligibleAssessmentItemDto) => {
    setSelectedItemRevisionIds((current) => current.includes(item.itemRevisionId)
      ? current.filter((id) => id !== item.itemRevisionId)
      : [...current, item.itemRevisionId]);
  };

  const moveItem = (index: number, offset: -1 | 1) => {
    setSelectedItemRevisionIds((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const loadVersionDetail = async (versionId: string) => {
    try {
      const response = await fetch(`/api/assessment-versions/${versionId}`, { cache: 'no-store' });
      const body = await resultBody(response);
      if (!response.ok || !body?.data) { setAssemblyError(body?.error?.message || 'Không thể tải phiên bản đã ghim.'); return; }
      setSelectedVersion(body.data as AssessmentVersionDto);
      setAssemblyError(null);
    } catch { setAssemblyError('Lỗi kết nối khi tải chi tiết phiên bản.'); }
  };

  const assembleVersion = async () => {
    if (!selectedBlueprint || selectedItemRevisionIds.length === 0 || assembling) return;
    setAssembling(true); setAssemblyError(null);
    try {
      const response = await fetch(`/api/assessment-blueprints/${selectedBlueprint.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify({ expectedBlueprintGeneration: selectedBlueprint.generation, itemRevisionIds: selectedItemRevisionIds }),
      });
      const body = await resultBody(response);
      if (!response.ok || !body?.data) {
        const message = body?.error?.message || 'Không thể lắp ghép phiên bản. Các lựa chọn vẫn được giữ lại.';
        setAssemblyError(message);
        if (response.status === 409 && body?.error?.code === 'STALE_BLUEPRINT_GENERATION') {
          const refreshed = await refreshBlueprint(selectedBlueprint.id);
          setAssemblyReloadToken((current) => current + 1);
          setNotice(refreshed
            ? `${message} Blueprint và danh sách bài tập đã được tải lại; hãy chọn revision cho generation mới.`
            : `${message} Không tải được Blueprint mới; hãy thử tải lại dữ liệu lắp ghép.`);
        }
        return;
      }
      const created = body.data as AssessmentVersionDto;
      setVersions((current) => [created, ...current.filter((entry) => entry.id !== created.id)]);
      setBlueprints((current) => current.map((entry) => entry.id === selectedBlueprint.id
        ? { ...entry, versionCount: (entry.versionCount || 0) + 1 }
        : entry));
      await Promise.all([loadVersionDetail(created.id), refreshBlueprint(selectedBlueprint.id)]);
      setNotice(`Đã tạo phiên bản #${created.versionNo} và tải lại các revision ID đã ghim.`);
    } catch { setAssemblyError('Lỗi kết nối khi lắp ghép phiên bản. Các lựa chọn vẫn được giữ lại.'); }
    finally { setAssembling(false); }
  };

  const selectedItems = useMemo(() => selectedItemRevisionIds.map((id) => eligibleItems.find((item) => item.itemRevisionId === id)).filter(Boolean) as EligibleAssessmentItemDto[], [eligibleItems, selectedItemRevisionIds]);
  const selectedTypeCounts = selectedItems.reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.type]: (counts[item.type] || 0) + 1 }), {});

  if (loading) return <main className="page-container"><p>Đang tải danh mục đánh giá…</p></main>;

  return (
    <main className="page-container" id="assessmentCatalog">
      <header className="page-header"><h1>Đánh giá</h1><p>Quản lý Blueprint, kiểm tra bài tập đã nộp và ghép phiên bản cố định.</p></header>
      {error && <div role="alert" className="form-error-banner">{error} <button type="button" className="btn btn-secondary" disabled={loading} onClick={() => void loadCatalog()}>Tải lại danh mục</button></div>}
      {notice && <div role="status" style={{ background: '#ecfdf5', color: '#166534', padding: '10px 12px', borderRadius: 6, marginBottom: 16 }}>{notice}</div>}

      <section className="form-section" aria-labelledby="blueprintHeading">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><h2 id="blueprintHeading">Assessment Blueprint</h2><p>Blueprint không có tiêu đề riêng; nhận diện theo mục đích, khóa học và mã ngắn.</p></div>
          <label>Blueprint hiện có
            <select className="form-input" value={selectedBlueprintId} onChange={(event) => {
              const match = blueprints.find((entry) => entry.id === event.target.value);
              if (match) hydrateForm(match);
              else { selectedBlueprintIdRef.current = ''; setSelectedBlueprintId(''); setForm((current) => ({ ...freshForm(), courseId: current.courseId })); }
              setError(null); setNotice(null);
            }}>
              <option value="">Tạo Blueprint mới</option>
              {blueprints.map((bp) => <option key={bp.id} value={bp.id}>{bp.purpose} · {optionLabel(bp.course?.names, bp.courseId.slice(0, 8))} · {bp.id.slice(0, 8)}</option>)}
            </select>
          </label>
        </div>

        <form onSubmit={saveBlueprint} style={{ marginTop: 18 }}>
          <div className="form-grid">
            <label className="form-group">Khóa học *
              <select className="form-input" value={form.courseId} disabled={Boolean(selectedBlueprint) || pending} onChange={(event) => setForm((current) => ({ ...current, courseId: event.target.value, targetLevelId: '', nextLevelId: '' }))} required>
                <option value="">Chọn khóa học</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{optionLabel(course.names, course.id)}{course.language?.code ? ` · ${course.language.code}` : ''}</option>)}
              </select>
            </label>
            <label className="form-group">Mục đích *
              <select className="form-input" value={form.purpose} disabled={scopeLocked || pending} onChange={(event) => setForm((current) => ({ ...current, purpose: event.target.value as BlueprintForm['purpose'] }))}>
                <option value="PLACEMENT">PLACEMENT</option><option value="LEVEL_UP">LEVEL_UP</option>
              </select>
            </label>
            <label className="form-group">Target level
              <select className="form-input" value={form.targetLevelId} disabled={scopeLocked || pending} onChange={(event) => setForm((current) => ({ ...current, targetLevelId: event.target.value }))}>
                <option value="">Không đặt</option>{levels.map((level) => <option key={level.id} value={level.id}>{level.code} · {optionLabel(level.label, `#${level.position}`)}</option>)}
              </select>
            </label>
            <label className="form-group">Next level
              <select className="form-input" value={form.nextLevelId} disabled={scopeLocked || pending} onChange={(event) => setForm((current) => ({ ...current, nextLevelId: event.target.value }))}>
                <option value="">Không đặt</option>{levels.map((level) => <option key={level.id} value={level.id}>{level.code} · {optionLabel(level.label, `#${level.position}`)}</option>)}
              </select>
            </label>
            <label className="form-group">Số câu *
              <input className="form-input" type="number" min={1} step={1} value={form.itemCount} onChange={(event) => setForm((current) => ({ ...current, itemCount: event.target.value }))} required />
            </label>
          </div>
          {levelsError && <div role="alert" className="form-error-banner">{levelsError} <button type="button" className="btn btn-secondary" disabled={levelsLoading || !selectedCourse?.frameworkId} onClick={() => selectedCourse?.frameworkId && void loadLevels(selectedCourse.frameworkId)}>Tải lại cấp độ</button></div>}

          {scopeLocked && <p role="status">Mục đích và level đã khóa vì Blueprint có phiên bản. Có thể cập nhật composition và config để sinh generation mới.</p>}
          <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 12, margin: '14px 0' }}>
            <legend>Kiểu bài tập được phép *</legend>
            {EXERCISE_TYPES.map((type) => <label key={type} style={{ display: 'inline-flex', gap: 6, alignItems: 'center', margin: '4px 14px 4px 0' }}><input id={`includeType-${type}`} type="checkbox" checked={form.exerciseTypes.includes(type)} onChange={() => toggleType(type)} />{type}</label>)}
          </fieldset>
          <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 12, margin: '14px 0' }}>
            <legend>Số lượng tối thiểu theo kiểu (tùy chọn)</legend>
            <div className="form-grid">{form.exerciseTypes.map((type) => <label key={type} className="form-group">{type}
              <input id={`minimum-${type}`} className="form-input" type="number" min={0} step={1} value={form.minimumItemsByType[type] ?? ''} onChange={(event) => setForm((current) => {
                const minimumItemsByType = { ...current.minimumItemsByType };
                if (event.target.value === '') delete minimumItemsByType[type];
                else minimumItemsByType[type] = Number(event.target.value);
                return { ...current, minimumItemsByType };
              })} />
            </label>)}</div>
          </fieldset>
          <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 12, margin: '14px 0' }}>
            <legend>Cấu hình trộn</legend>
            <label style={{ marginRight: 20 }}><input type="checkbox" checked={form.shuffleItems} onChange={(event) => setForm((current) => ({ ...current, shuffleItems: event.target.checked }))} /> Trộn câu hỏi</label>
            <label><input type="checkbox" checked={form.shuffleOptions} onChange={(event) => setForm((current) => ({ ...current, shuffleOptions: event.target.checked }))} /> Trộn lựa chọn</label>
          </fieldset>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" disabled={pending}>{pending ? 'Đang lưu…' : selectedBlueprint ? 'Lưu Blueprint' : 'Tạo Blueprint'}</button>
            <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => { selectedBlueprintIdRef.current = ''; setSelectedBlueprintId(''); setForm(freshForm()); setError(null); setNotice(null); }}>Mẫu mới</button>
            {selectedBlueprint && <button type="button" className="btn btn-secondary" disabled={pending || Boolean(selectedBlueprint.versionCount || 0)} onClick={deleteSelectedBlueprint}>Xóa chưa sử dụng</button>}
          </div>
          {selectedBlueprint && <p style={{ color: '#64748b' }}>Generation {selectedBlueprint.generation} · Row version {selectedBlueprint.rowVersion} · Versions {selectedBlueprint.versionCount ?? 0}</p>}
        </form>
      </section>

      {selectedBlueprint && <section className="form-section" aria-labelledby="assemblyHeading" style={{ marginTop: 20 }}>
        <h2 id="assemblyHeading">Bài tập đã nộp và lắp ghép phiên bản</h2>
        <p>Chọn đúng {selectedBlueprint.coverage.itemCount} định danh bài tập; thứ tự chọn được dùng làm vị trí và có thể sắp xếp lại.</p>
        {assemblyError && <div role="alert" className="form-error-banner">{assemblyError}</div>}
        {assemblyLoadError && <div role="alert" className="form-error-banner">{assemblyLoadError} <button type="button" className="btn btn-secondary" disabled={assemblyLoading || assembling} onClick={async () => {
          await refreshBlueprint(selectedBlueprint.id);
          setAssemblyReloadToken((current) => current + 1);
        }}>Tải lại dữ liệu lắp ghép</button></div>}
        {assemblyLoading ? <p>Đang tải bài tập hợp lệ…</p> : <>
          <div className="table-wrap"><table className="data-table" aria-label="Bài tập đánh giá đã nộp">
            <thead><tr><th scope="col">Chọn</th><th scope="col">Kiểu</th><th scope="col">Câu hỏi</th><th scope="col">Bản học</th><th scope="col">Revision ID</th></tr></thead>
            <tbody>{eligibleItems.map((item) => {
              const allowed = selectedBlueprint.coverage.exerciseTypes.includes(item.type);
              return <tr key={item.itemRevisionId}>
                <td><input type="checkbox" aria-label={`Chọn ${item.itemRevisionId}`} disabled={!allowed || assembling} checked={selectedItemRevisionIds.includes(item.itemRevisionId)} onChange={() => toggleItem(item)} /></td>
                <td>{item.type}</td><td>{(item.promptData as any)?.prompt || '—'}</td>
                <td>{item.unitCode} · #{item.lessonPosition} · r{item.sourceLessonRevisionNo}</td>
                <td><code>{item.itemRevisionId}</code></td>
              </tr>;
            })}</tbody>
          </table></div>
          {eligibleItems.length === 0 && <p>Chưa có bài tập cùng Blueprint đã được nộp qua luồng Teacher.</p>}
          <div style={{ marginTop: 12 }}>
            <h3>Lựa chọn và vị trí</h3>
            {selectedItems.length === 0 ? <p>Chưa chọn bài tập.</p> : <ol>{selectedItems.map((item, index) => <li key={item.itemRevisionId} style={{ marginBottom: 6 }}>
              {item.type} — {(item.promptData as any)?.prompt || item.itemRevisionId} · <code>{item.itemRevisionId}</code>
              <button type="button" className="btn-text-action" disabled={index === 0 || assembling} onClick={() => moveItem(index, -1)}>Lên</button>
              <button type="button" className="btn-text-action" disabled={index === selectedItems.length - 1 || assembling} onClick={() => moveItem(index, 1)}>Xuống</button>
            </li>)}</ol>}
            <p>Đang chọn {selectedItems.length}/{selectedBlueprint.coverage.itemCount}. {Object.entries(selectedBlueprint.requirements.minimumItemsByType).map(([type, minimum]) => `${type}: ${selectedTypeCounts[type] || 0}/${minimum} tối thiểu`).join(' · ')}</p>
            <button type="button" className="btn btn-primary" disabled={assembling || selectedItems.length === 0} onClick={assembleVersion}>{assembling ? 'Đang lắp ghép…' : 'Lắp ghép phiên bản IN_REVIEW'}</button>
          </div>
        </>}

        <div style={{ marginTop: 24 }}>
          <h3>Phiên bản đã tạo</h3>
          {versions.length === 0 ? <p>Chưa có phiên bản.</p> : <ul>{versions.map((version) => <li key={version.id}>
            <button type="button" className="btn-text-action" onClick={() => loadVersionDetail(version.id)}>#{version.versionNo} · {version.status} · {version.itemCount ?? '—'} câu · {version.id.slice(0, 8)}</button>
          </li>)}</ul>}
          {selectedVersion && <div id="selectedAssessmentVersion" style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: 14, marginTop: 12 }}>
            <h4>Phiên bản #{selectedVersion.versionNo} · {selectedVersion.status}</h4>
            <p>Hash: <code>{selectedVersion.assemblyInputHash}</code></p>
            <p>Blueprint generation: {selectedVersion.blueprintGeneration}; snapshot generation: {String(selectedVersion.blueprintSnapshot.blueprint_generation)}; catalog generation: {String(selectedVersion.blueprintSnapshot.coverage_catalog_generation)}</p>
            <ol>{(selectedVersion.items || []).map((item) => <li key={item.id}>
              Vị trí {item.position}: item <code>{item.itemId}</code>, revision <code>{item.itemRevisionId}</code>, source r{item.sourceLessonRevision.revisionNo} — {(item.itemRevision.promptData as any)?.prompt || item.itemRevision.type}
            </li>)}</ol>
          </div>}
        </div>
      </section>}
    </main>
  );
}
