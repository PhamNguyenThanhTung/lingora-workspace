'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      emailInputRef.current?.focus();
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const resJson = await response.json().catch(() => null);

      if (!response.ok) {
        setIsPending(false);
        setPassword('');
        setErrorMessage(
          resJson?.error?.message ||
            'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.'
        );
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 50);
        return;
      }

      setIsPending(false);
      router.push('/home');
      router.refresh();
    } catch {
      setIsPending(false);
      setPassword('');
      setErrorMessage('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <main id="authView" className="login-view-wrapper">
      <div className="login-form-wrap">
        <div className="login-brand-title">Lingora</div>
        <h1 className="login-heading">Đăng nhập Học viên</h1>
        <p className="login-subheading">
          Nền tảng học ngoại ngữ trực tuyến Lingora.
        </p>

        {errorMessage && (
          <div id="loginAlert" className="login-alert" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="login-form" method="POST" action="javascript:void(0);" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">
              Email
            </label>
            <input
              type="email"
              id="loginEmail"
              ref={emailInputRef}
              className="form-input"
              placeholder="hocvien@lingora.edu.vn"
              autoComplete="username"
              disabled={isPending}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loginPassword">
              Mật khẩu
            </label>
            <input
              type="password"
              id="loginPassword"
              ref={passwordInputRef}
              className={`form-input ${errorMessage ? 'is-error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isPending}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
            />
          </div>

          <button
            type="submit"
            id="loginSubmitBtn"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={isPending}
          >
            {isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </main>
  );
}
