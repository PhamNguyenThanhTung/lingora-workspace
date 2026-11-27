import React from 'react';
import { QuestPanel } from '../../components/learner/QuestPanel.tsx';
import type { ShellData } from '../../components/learner/types.ts';

/** Mobile "Nhiệm vụ" tab; desktop shows the same panel as the right column of other pages. */
export function QuestsView({ shell, errorMessage }: { shell?: ShellData; errorMessage?: string }) {
  if (!shell) {
    return (
      <main className="content-area">
        <div id="errorBox" className="alert-box is-warning" role="alert">
          <h1 className="alert-title warning">Không thể tải nhiệm vụ</h1>
          <p className="alert-message">{errorMessage}</p>
          <div className="alert-actions">
            <a href="/home" className="btn btn-primary" style={{ textDecoration: 'none' }}>Về trang chủ</a>
          </div>
        </div>
      </main>
    );
  }
  return (
    <div id="questsView">
      <h1 style={{ fontSize: 'var(--font-size-title)', fontWeight: 800, marginBottom: 14 }}>Nhiệm vụ</h1>
      <QuestPanel shell={shell} />
    </div>
  );
}
