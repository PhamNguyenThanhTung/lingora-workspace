'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có ít nhất 8 ký tự.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          displayName: displayName.trim() || undefined,
        }),
      });

      const resJson = await response.json().catch(() => null);

      if (!response.ok) {
        setIsPending(false);
        setPassword('');
        setErrorMessage(
          resJson?.error?.message ||
            'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.'
        );
        setTimeout(() => {
          passwordInputRef.current?.focus();
        }, 50);
        return;
      }

      setIsPending(false);
      setPassword('');
      setSuccessMessage(
        resJson?.message ||
          'Đăng ký thành công! Vui lòng kiểm tra hộp thư email của bạn để xác thực tài khoản trước khi đăng nhập.'
      );
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
        <h1 className="login-heading">Đăng ký tài khoản Học viên</h1>
        <p className="login-subheading">
          Tạo tài khoản để bắt đầu học ngoại ngữ cùng Lingora.
        </p>

        {errorMessage && (
          <div id="registerAlert" className="login-alert" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage ? (
          <div
            id="registerSuccess"
            className="login-alert is-success"
            role="status"
            style={{
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              borderColor: '#a7f3d0',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              marginTop: '16px',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>{successMessage}</p>
            <p style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>
              Sau khi xác thực email thông qua liên kết được gửi, bạn có thể đăng nhập bằng mật khẩu vừa tạo.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link
                href="/login"
                id="loginLink"
                className="btn btn-primary"
                style={{ display: 'block', textAlign: 'center', width: '100%', textDecoration: 'none' }}
              >
                Đến trang Đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form className="login-form" method="POST" action="javascript:void(0);" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="registerEmail">
                Email
              </label>
              <input
                type="email"
                id="registerEmail"
                ref={emailInputRef}
                className="form-input"
                placeholder="hocvien@lingora.edu.vn"
                autoComplete="email"
                disabled={isPending}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="registerPassword">
                Mật khẩu (tối thiểu 8 ký tự)
              </label>
              <input
                type="password"
                id="registerPassword"
                ref={passwordInputRef}
                className={`form-input ${errorMessage ? 'is-error' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isPending}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="registerDisplayName">
                Tên hiển thị (không bắt buộc)
              </label>
              <input
                type="text"
                id="registerDisplayName"
                className="form-input"
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                disabled={isPending}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setErrorMessage(null);
                }}
              />
            </div>

            <button
              type="submit"
              id="registerSubmitBtn"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={isPending}
            >
              {isPending ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            <div className="login-footer" style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: 'var(--text-muted, #666)' }}>Đã có tài khoản? </span>
                <Link
                  href="/login"
                  id="toLoginLink"
                  className="login-link"
                  style={{ color: 'var(--primary-green, #10b981)', textDecoration: 'underline', fontWeight: 500 }}
                >
                  Đăng nhập
                </Link>
              </div>
              <div>
                <Link
                  href="/"
                  id="toHomeLandingLink"
                  style={{ color: 'var(--text-muted, #666)', fontSize: '13px', textDecoration: 'none' }}
                >
                  ← Quay lại trang giới thiệu
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
