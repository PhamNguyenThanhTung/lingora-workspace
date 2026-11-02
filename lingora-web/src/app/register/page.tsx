import { cookies } from 'next/headers.js';
import { redirect } from 'next/navigation.js';
import { verifyLearnerIdentity } from '../../server/auth/index.ts';
import { RegisterForm } from './RegisterForm.tsx';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const authResult = await verifyLearnerIdentity({
    cookieStore,
  });

  if (authResult.ok) {
    redirect('/home');
  }

  return <RegisterForm />;
}
