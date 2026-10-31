import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyLearnerIdentity } from '../../server/auth/index.ts';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const authResult = await verifyLearnerIdentity({
    cookieStore,
  });

  if (authResult.ok) {
    redirect('/home');
  }

  return <LoginForm />;
}
