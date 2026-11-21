'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ResendConfirmationFormProps {
  initialEmail?: string;
}

export function ResendConfirmationForm({ initialEmail = '' }: ResendConfirmationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending || cooldown > 0) return;

    setMessage(null);
    setIsError(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setIsError(true);
      setMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const resJson = await response.json().catch(() => null);

      if (response.status === 429) {
        setIsError(true);
        setMessage(resJson?.error?.message || 'Yêu cầu gửi quá nhanh. Vui lòng thử lại sau giây lát.');
        setIsPending(false);
        return;
      }

      if (!response.ok) {
        setIsError(true);
        setMessage(resJson?.error?.message || 'Không thể gửi lại email xác nhận. Vui lòng thử lại sau.');
        setIsPending(false);
        return;
      }

      setIsError(false);
      setMessage(
        resJson?.message ||
          'Nếu email đã đăng ký và chưa xác thực, chúng tôi đã gửi lại liên kết xác nhận. Vui lòng kiểm tra hộp thư.'
      );
      setCooldown(60);
      setIsPending(false);
    } catch {
      setIsError(true);
      setMessage('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.');
      setIsPending(false);
    }
  };

  return (
    <div className="resend-confirmation-container" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {message && (
        <div
          id="resendAlert"
          className={`login-alert ${isError ? '' : 'is-success'}`}
          role={isError ? 'alert' : 'status'}
          style={
            isError
              ? undefined
              : { backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }
          }
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label" htmlFor="resendEmail" style={{ fontSize: '13px' }}>
            Email nhận liên kết xác nhận
          </label>
          <input
            type="email"
            id="resendEmail"
            className="form-input"
            placeholder="ban@example.com"
            disabled={isPending || cooldown > 0}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage(null);
            }}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          id="resendSubmitBtn"
          className="btn btn-secondary"
          disabled={isPending || cooldown > 0}
          style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center' }}
        >
          {isPending
            ? 'Đang gửi...'
            : cooldown > 0
            ? `Gửi lại sau (${cooldown}s)`
            : 'Gửi lại email xác nhận'}
        </button>
      </form>
    </div>
  );
}
