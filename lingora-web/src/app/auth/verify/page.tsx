import type { Metadata } from 'next';
import Link from 'next/link';
import { ResendConfirmationForm } from '../../_components/ResendConfirmationForm.tsx';
import { VerifyForm } from './VerifyForm.tsx';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Xác nhận email | Lingora',
  robots: {
    index: false,
    follow: false,
  },
};

const TOKEN_HASH_REGEX = /^[A-Za-z0-9_-]{1,512}$/;

interface VerifyPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VerifyPage(props: VerifyPageProps) {
  const searchParams = props?.searchParams ? await props.searchParams : undefined;
  const tokenHash = typeof searchParams?.token_hash === 'string' ? searchParams.token_hash : '';
  const type = typeof searchParams?.type === 'string' ? searchParams.type : '';

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
          <Link
            href="/login"
            id="toLoginLink"
            className="login-link"
            style={{ color: 'var(--primary-green, #10b981)', textDecoration: 'underline', fontWeight: 500 }}
          >
            ← Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
