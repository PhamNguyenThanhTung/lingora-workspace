import React from 'react';

const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  languages: 'M3 5h12 M9 3v2 M5 5c0 6 5 10 10 12 M13 5c0 5-4 10-10 12 M14 21l4-10 4 10 M16 17h4',
  frameworks: 'M12 3 2 8l10 5 10-5-10-5z M2 12l10 5 10-5 M2 16l10 5 10-5',
  courses: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 3H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-14A2.5 2.5 0 0 1 6.5 3z M8 7h8 M8 11h6',
  teachers: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-3.87',
  assessments: 'M9 5h11 M9 12h11 M9 19h11 M3 5h1 M3 12h1 M3 19h1',
  review: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  audit: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h6',
  panel: 'M3 4h18v16H3z M9 4v16 M14 9l3 3-3 3',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'M6 6l12 12 M6 18 18 6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M9 5l7 7-7 7',
} as const;

export type NavigationIconName = keyof typeof paths;

export function NavigationIcon({ name, className = '' }: { name: NavigationIconName; className?: string }) {
  return <svg className={`nav-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
