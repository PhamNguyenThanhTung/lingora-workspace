import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RegisterForm } from '../../../src/app/register/RegisterForm';
import { LoginForm } from '../../../src/app/login/LoginForm';
import { VerifyForm } from '../../../src/app/auth/verify/VerifyForm';
import { ResendConfirmationForm } from '../../../src/app/_components/ResendConfirmationForm';

const TOKEN_HASH_REGEX = /^[A-Za-z0-9_-]{1,512}$/;

function App() {
  const [view, setView] = useState<'register' | 'login' | 'verify'>('register');
  const [tokenHash, setTokenHash] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    if (path.includes('/verify') || search.get('view') === 'verify') {
      setView('verify');
      setTokenHash(search.get('token_hash') || '');
      setType(search.get('type') || '');
    } else if (path.includes('/login') || search.get('view') === 'login' || search.has('error') || search.has('confirmed')) {
      setView('login');
    } else {
      setView('register');
    }
  }, []);

  if (view === 'login') return <LoginForm />;
  if (view === 'verify') {
    const isTypeValid = type === 'email' || type === 'signup';
    const isTokenValid = TOKEN_HASH_REGEX.test(tokenHash);
    const isValid = isTypeValid && isTokenValid;
    return (
      <main id="authView" className="login-view-wrapper">
        <div className="login-form-wrap" style={{ width: '100%', maxWidth: '440px', boxSizing: 'border-box' }}>
          <div className="login-brand-title">Lingora</div>
          <h1 className="login-heading">Xác nhận email</h1>
          {isValid ? (
            <>
              <p className="login-subheading" style={{ marginBottom: '16px' }}>
                Vui lòng nhấn nút bên dưới để hoàn tất việc xác thực địa chỉ email cho tài khoản của bạn.
              </p>
              <VerifyForm tokenHash={tokenHash} type={type} />
            </>
          ) : (
            <>
              <div id="verifyErrorAlert" className="login-alert" role="alert" style={{ marginBottom: '16px' }}>
                Liên kết xác thực không hợp lệ hoặc thiếu thông tin cần thiết. Vui lòng yêu cầu gửi lại liên kết mới bên dưới.
              </div>
              <ResendConfirmationForm />
            </>
          )}
          <div className="login-footer" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            <a href="/login" id="toLoginLink" className="login-link" style={{ color: 'var(--primary-color, #2563eb)', textDecoration: 'underline', fontWeight: 500 }}>
              ← Quay lại trang Đăng nhập
            </a>
          </div>
        </div>
      </main>
    );
  }
  return <RegisterForm />;
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
