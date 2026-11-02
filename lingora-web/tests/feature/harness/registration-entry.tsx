import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RegisterForm } from '../../../src/app/register/RegisterForm';
import { LoginForm } from '../../../src/app/login/LoginForm';

function App() {
  const [view, setView] = useState<'register' | 'login'>('register');

  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/login') || search.includes('view=login')) {
      setView('login');
    } else {
      setView('register');
    }
  }, []);

  return view === 'login' ? <LoginForm /> : <RegisterForm />;
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
