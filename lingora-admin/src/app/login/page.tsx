import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ANY',
  });

  if (authResult.ok) {
    if (authResult.account.role === 'TEACHER') {
      redirect('/holding');
    }
    redirect('/languages');
  }

  return <LoginForm />;
}
