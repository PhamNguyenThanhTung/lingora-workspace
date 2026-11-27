'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HomeDto } from '../../server/context/home-dto.ts';
import { contextLevelCode, languageBadgeStyle, languageName } from '../../components/learner/helpers.ts';
import styles from './profile.module.css';

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileView({ data, errorMessage }: { data?: HomeDto; errorMessage?: string }) {
  const router = useRouter();
  const [name, setName] = useState(data?.learner.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

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

  if (!data) {
    return (
      <div id="errorBox" className="alert-box is-warning" role="alert">
        <h1 className="alert-title warning">Không thể tải hồ sơ</h1>
        <p className="alert-message">{errorMessage}</p>
        <div className="alert-actions">
          <a href="/home" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về trang chủ</a>
        </div>
      </div>
    );
  }

  const uiLocale = data.learner.uiLocale || 'vi';
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
        body: JSON.stringify({ displayName: trimmed }),
      });
      if (!response.ok) throw new Error('save failed');
      setNameMsg({ ok: true, text: 'Đã lưu tên hiển thị.' });
      router.refresh();
    } catch {
      setNameMsg({ ok: false, text: 'Chưa thể lưu tên hiển thị. Vui lòng thử lại sau.' });
    } finally {
      setSaving(false);
    }
  };

  const streak = data.streak;
  const todayKey = streak.today;

  return (
    <div id="profileView" className={styles.root}>
      <div className={styles.head}>
        <div className={styles.avatar} aria-hidden="true">{initials(data.learner.displayName)}</div>
        <div>
          <h1 id="profileName" className={styles.name}>{data.learner.displayName || 'Học viên'}</h1>
          <p className={styles.muted}>Ngôn ngữ giao diện: {uiLocale}</p>
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
          <li className={styles.stat}><span className={styles.statValue}>{streak.currentStreak} ngày</span>Chuỗi hiện tại</li>
          <li className={styles.stat}><span className={styles.statValue}>{streak.longestStreak} ngày</span>Chuỗi dài nhất</li>
          <li className={styles.stat}><span className={styles.statValue}>{data.totalXp} XP</span>Tổng điểm</li>
          <li className={styles.stat}>
            <span className={styles.statValue}>{data.gamificationStatus === 'UNAVAILABLE' || data.totalGems == null ? '—' : data.totalGems}</span>
            Đá quý
          </li>
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="profileLangTitle">
        <h2 id="profileLangTitle" className={styles.cardTitle}>Lộ trình học</h2>
        {data.contexts.length === 0 ? (
          <p className={styles.muted}>Bạn chưa có lộ trình học.</p>
        ) : (
          <ul className={styles.langs}>
            {data.contexts.map((ctx) => (
              <li key={ctx.id} className={styles.lang} style={languageBadgeStyle(ctx.targetLanguage.code)}>
                {languageName(ctx, uiLocale)} · {contextLevelCode(ctx) || 'Chưa xếp lớp'}
                {ctx.status === 'PAUSED' ? ' (tạm dừng)' : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.gamificationStatus !== 'UNAVAILABLE' && (
        <section className={styles.card} aria-labelledby="profileCalTitle">
          <h2 id="profileCalTitle" className={styles.cardTitle}>Lịch học 28 ngày</h2>
          {todayKey ? (
            <ul id="streakCalendar" className={styles.calendar} aria-label="Lịch học 28 ngày">
              {Array.from({ length: 28 }, (_, index) => {
                const date = new Date(todayKey + 'T00:00:00.000Z');
                date.setUTCDate(date.getUTCDate() - 27 + index);
                const key = date.toISOString().slice(0, 10);
                const active = streak.activeDays.includes(key);
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
        {data.recentAchievement ? (
          <ul className={styles.badges}>
            <li className={`${styles.badge}${data.recentAchievement.isUnlocked ? '' : ` ${styles.badgeOff}`}`}>
              <strong>🏅 {data.recentAchievement.title}</strong>
              <p className={styles.muted}>{data.recentAchievement.description}</p>
            </li>
          </ul>
        ) : (
          <p className={styles.muted}>Chưa có huy hiệu nào. Hoàn thành bài học để nhận huy hiệu đầu tiên.</p>
        )}
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
