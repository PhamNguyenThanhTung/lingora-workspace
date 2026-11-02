'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('confirmed') === '1' || params.get('confirmed') === 'true') {
        setInfoMessage('Xác thực email thành công! Vui lòng đăng nhập bằng mật khẩu của bạn.');
      } else if (params.get('error') === 'confirmation_failed') {
        setErrorMessage('Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
      } else if (params.get('error') === 'invalid_confirmation_type') {
        setErrorMessage('Loại liên kết xác thực không hợp lệ.');
      } else if (params.get('error') === 'missing_confirmation_token') {
        setErrorMessage('Thiếu mã xác thực trong liên kết.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setErrorMessage(null);
    setInfoMessage(null);

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

        {infoMessage && (
          <div id="loginInfoAlert" className="login-alert is-success" role="status" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}>
            {infoMessage}
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

          <div className="login-footer" style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-muted, #666)' }}>Chưa có tài khoản? </span>
            <Link
              href="/register"
              id="toRegisterLink"
              className="login-link"
              style={{ color: 'var(--primary-green, #10b981)', textDecoration: 'underline', fontWeight: 500 }}
            >
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
