'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  account: {
    id: string;
    role: string;
    status: string;
    displayName: string | null;
  };
  children: React.ReactNode;
}

export function AppShell({ account, children }: AppShellProps) {
  return (
    <>
      <div id="appContainer" className="app-container">
        <Sidebar account={account} />
        <div className="app-main">
          {children}
        </div>
      </div>
      <div id="modalRoot" />
    </>
  );
}
