'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptTeacherInvite } from '@/components/teacherInvite';

export default function ActivateTeacherPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [teacherDisplayName, setTeacherDisplayName] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const checkingRef = useRef<Promise<any> | null>(null);
  const submittingRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    if (!checkingRef.current) checkingRef.current = (async () => {
      await acceptTeacherInvite();
      const response = await fetch('/api/auth/teacher-activation', { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error?.message || 'Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.');
      return data;
    })();
    checkingRef.current.then((data) => {
      if (cancelled) return;
      setTeacherEmail(data.email || null);
      setTeacherDisplayName(data.displayName || null);
      setIsEligible(true);
      setIsChecking(false);
      setTimeout(() => passwordInputRef.current?.focus(), 0);
    }).catch((error) => {
      if (cancelled) return;
      setErrorMessage(error.message || 'Không thể xác nhận lời mời.');
      setIsEligible(false);
      setIsChecking(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !isEligible) return;

    setPasswordError(null);

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới.');
      passwordInputRef.current?.focus();
      return;
    }

    if (password.length < 8) {
      setPasswordError('Mật khẩu phải có ít nhất 8 ký tự.');
      passwordInputRef.current?.focus();
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setPasswordError('Mật khẩu quá dài. Vui lòng rút ngắn mật khẩu.');
      passwordInputRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu không khớp.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/teacher-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({ password }),
      });

      // Clear password from state immediately after dispatch per R9
      setPassword('');
      setConfirmPassword('');

      const resJson = await res.json().catch(() => null);

      if (!res.ok) {
        submittingRef.current = false;
        setIsSubmitting(false);
        setPasswordError(
          resJson?.error?.message || 'Kích hoạt tài khoản không thành công. Vui lòng thử lại.'
        );
        passwordInputRef.current?.focus();
        return;
      }

      // Success -> navigate to holding view
      router.push('/holding');
      router.refresh();
    } catch {
      submittingRef.current = false;
      setIsSubmitting(false);
      setPassword('');
      setConfirmPassword('');
      setPasswordError('Lỗi kết nối máy chủ khi kích hoạt. Vui lòng thử lại.');
      passwordInputRef.current?.focus();
    }
  };

  return (
    <main className="holding-view-wrapper">
      <div className="holding-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="holding-brand">Lingora</div>

        {isChecking ? (
          <div>
            <h1 className="holding-title" style={{ fontSize: '20px' }}>
              Đang kiểm tra thông tin kích hoạt...
            </h1>
            <p className="holding-desc">Vui lòng chờ trong giây lát.</p>
          </div>
        ) : !isEligible ? (
          <div>
            <h1 className="holding-title" style={{ color: 'var(--danger-red, #dc2626)', fontSize: '20px' }}>
              Không thể kích hoạt tài khoản
            </h1>
            <p className="holding-desc">
              {errorMessage || 'Liên kết thư mời không hợp lệ, đã hết hạn hoặc tài khoản không tồn tại.'}
            </p>
            <div style={{ marginTop: '24px' }}>
              <a href="/login" className="btn btn-secondary" style={{ display: 'inline-block' }}>
                Quay lại trang Đăng nhập
              </a>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="holding-title" style={{ fontSize: '22px', marginBottom: '8px' }}>
              Kích hoạt tài khoản Giáo viên
            </h1>
            <p className="holding-desc" style={{ marginBottom: '20px' }}>
              Xin chào {teacherDisplayName ? <strong>{teacherDisplayName}</strong> : 'Giáo viên'}
              {teacherEmail && ` (${teacherEmail})`}. Vui lòng thiết lập mật khẩu để hoàn tất kích hoạt tài khoản.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {passwordError && (
                <div
                  className="alert alert-danger"
                  id="activationErrorMsg"
                  role="alert"
                  style={{ marginBottom: '16px', fontSize: '13px' }}
                >
                  {passwordError}
                </div>
              )}

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label htmlFor="newPassword" className="form-label" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Mật khẩu mới (tối thiểu 8 ký tự) <span style={{ color: 'var(--danger-red)' }}>*</span>
                </label>
                <input
                  ref={passwordInputRef}
                  type="password"
                  id="newPassword"
                  className={`form-input ${passwordError ? 'is-error' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'activationErrorMsg' : undefined}
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label htmlFor="confirmPassword" className="form-label" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Xác nhận lại mật khẩu <span style={{ color: 'var(--danger-red)' }}>*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`form-input ${passwordError ? 'is-error' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'activationErrorMsg' : undefined}
                />
              </div>

              <button
                type="submit"
                id="btnSubmitActivation"
                className="btn btn-primary"
                style={{ width: '100%', height: '44px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang kích hoạt tài khoản...' : 'Kích hoạt tài khoản'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
