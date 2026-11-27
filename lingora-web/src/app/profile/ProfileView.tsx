'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LearnerProfileDto } from '../../server/profile/dto.ts';
import { languageBadgeStyle, languageName } from '../../components/learner/helpers.ts';
import styles from './profile.module.css';

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function joinedText(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10).split('-').reverse().join('/');
}

interface ProfileViewProps {
  profile?: LearnerProfileDto;
  /** Learner-local "today" (YYYY-MM-DD), the last cell of the 28-day calendar. */
  today?: string | null;
  errorMessage?: string;
}

export function ProfileView({ profile, today, errorMessage }: ProfileViewProps) {
  const router = useRouter();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [rowVersion, setRowVersion] = useState(profile?.rowVersion ?? '');
  const [savedName, setSavedName] = useState(profile?.displayName ?? null);
  const [saving, setSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // After router.refresh() (409 or a save elsewhere) the server sends the current row version.
  useEffect(() => {
    if (profile) setRowVersion(profile.rowVersion);
  }, [profile?.rowVersion]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { Origin: window.location.origin } });
      if (!response.ok) throw new Error('Logout failed');
      router.push('/login');
      router.refresh();
    } catch {
      setLogoutError('Chưa thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setLoggingOut(false);
    }
  };

  if (!profile) {
    return (
      <div id="errorBox" className="alert-box is-warning" role="alert">
        <h1 className="alert-title warning">Không thể tải hồ sơ</h1>
        <p className="alert-message">{errorMessage}</p>
        <div className="alert-actions">
          <a href="/home" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về trang chủ</a>
          <button type="button" id="logoutBtn" className="btn btn-secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </button>
        </div>
      </div>
    );
  }

  const uiLocale = profile.uiLocale || 'vi';
  const trimmed = name.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 40;

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setNameMsg(null);
    try {
      const response = await fetch('/api/learner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Origin: window.location.origin },
        body: JSON.stringify({ displayName: trimmed, expectedRowVersion: rowVersion }),
      });
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (response.status === 409) {
        router.refresh();
        setNameMsg({ ok: false, text: 'Hồ sơ vừa được cập nhật ở nơi khác. Đã tải lại phiên bản mới, vui lòng bấm Lưu lần nữa.' });
        return;
      }
      if (!response.ok) throw new Error('save failed');
      const json = await response.json();
      setRowVersion(json.data.rowVersion);
      setSavedName(json.data.displayName);
      setName(json.data.displayName);
      setNameMsg({ ok: true, text: 'Đã lưu tên hiển thị.' });
      router.refresh();
    } catch {
      setNameMsg({ ok: false, text: 'Chưa thể lưu tên hiển thị. Vui lòng thử lại sau.' });
    } finally {
      setSaving(false);
    }
  };

  const joined = joinedText(profile.activatedAt);
  const activeDays = new Set(profile.calendar28);

  const todayKey = today;

  return (
    <div id="profileView" className={styles.root}>
      <div className={styles.head}>
        <div className={styles.avatar} aria-hidden="true">{initials(savedName)}</div>
        <div>
          <h1 id="profileName" className={styles.name}>{savedName || 'Học viên'}</h1>
          {joined && <p id="profileJoined" className={styles.muted}>Tham gia từ {joined}</p>}
          <p className={styles.muted}>Ngôn ngữ giao diện: {uiLocale} · Múi giờ: {profile.timezone}</p>
        </div>
      </div>

      <section className={styles.card} aria-labelledby="profileNameTitle">
        <h2 id="profileNameTitle" className={styles.cardTitle}>Tên hiển thị</h2>
        <form className={styles.form} onSubmit={saveName}>
          <label htmlFor="displayNameInput" className="sr-only">Tên hiển thị</label>
          <input
            id="displayNameInput"
            className={styles.input}
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!valid}
          />
          <button type="submit" id="saveDisplayNameBtn" className="btn btn-primary" disabled={!valid || saving}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </form>
        {!valid && <p className={styles.error} role="alert">Tên phải có từ 1 đến 40 ký tự.</p>}
        {nameMsg && (
          <p role="status" className={nameMsg.ok ? styles.muted : styles.error}>{nameMsg.text}</p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="profileStatsTitle">
        <h2 id="profileStatsTitle" className={styles.cardTitle}>Thành tích</h2>
        <ul className={styles.stats}>
          <li className={styles.stat}><span className={styles.statValue}>{profile.streak.current} ngày</span>Chuỗi hiện tại</li>
          <li className={styles.stat}><span className={styles.statValue}>{profile.streak.longest} ngày</span>Chuỗi dài nhất</li>
          <li className={styles.stat}><span className={styles.statValue}>{profile.totals.xp} XP</span>Tổng điểm</li>
          <li className={styles.stat}><span className={styles.statValue}>{profile.totals.gems}</span>Đá quý</li>
          <li className={styles.stat}><span className={styles.statValue}>{profile.totals.lessonsCompleted}</span>Bài đã hoàn thành</li>
          <li className={styles.stat}><span className={styles.statValue}>{profile.totals.srsCards}</span>Thẻ từ vựng</li>
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="profileLangTitle">
        <h2 id="profileLangTitle" className={styles.cardTitle}>Lộ trình học</h2>
        {profile.contexts.length === 0 ? (
          <p className={styles.muted}>Bạn chưa có lộ trình học.</p>
        ) : (
          <ul className={styles.langs}>
            {profile.contexts.map((ctx) => (
              <li key={ctx.id} className={styles.lang} style={languageBadgeStyle(ctx.targetLanguage.code)}>
                {languageName(ctx, uiLocale)} · {ctx.levelCode || 'Chưa xếp lớp'}
                {ctx.status === 'PAUSED' ? ' (tạm dừng)' : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      {(
        <section className={styles.card} aria-labelledby="profileCalTitle">
          <h2 id="profileCalTitle" className={styles.cardTitle}>Lịch học 28 ngày</h2>
          {todayKey ? (
            <ul id="streakCalendar" className={styles.calendar} aria-label="Lịch học 28 ngày">
              {Array.from({ length: 28 }, (_, index) => {
                const date = new Date(todayKey + 'T00:00:00.000Z');
                date.setUTCDate(date.getUTCDate() - 27 + index);
                const key = date.toISOString().slice(0, 10);
                const active = activeDays.has(key);
                return (
                  <li
                    key={key}
                    title={key}
                    aria-label={key + (active ? ' đã học' : ' chưa học')}
                    className={`${styles.day}${active ? ` ${styles.dayOn}` : ''}`}
                  >
                    {key.slice(-2)} {active ? '✓' : '·'}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.muted}>Chưa có dữ liệu lịch học.</p>
          )}
        </section>
      )}

      <section className={styles.card} aria-labelledby="profileAchTitle">
        <h2 id="profileAchTitle" className={styles.cardTitle}>Huy hiệu</h2>
        <ul className={styles.badges} id="achievementGrid">
          {profile.achievements.map((a) => (
            <li key={a.code} id={`achievement-${a.code}`} data-unlocked={a.isUnlocked ? 'true' : 'false'} className={`${styles.badge}${a.isUnlocked ? '' : ` ${styles.badgeOff}`}`}>
              <strong>{a.isUnlocked ? '🏅' : '🔒'} {a.title}</strong>
              <p className={styles.muted}>{a.description}</p>
              <p className={styles.muted}>{a.isUnlocked ? `Đạt được ${joinedText(a.awardedAt) ?? ''}`.trim() : 'Chưa đạt được'}</p>
            </li>
          ))}
        </ul>
      </section>

      <div>
        {logoutError && <p id="logoutAlert" role="alert" className="login-alert">{logoutError}</p>}
        <button type="button" id="logoutBtn" className="btn btn-secondary" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </div>
    </div>
  );
}
