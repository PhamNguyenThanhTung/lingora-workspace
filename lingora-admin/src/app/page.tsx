import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyStaffIdentity } from '@/server/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const cookieStore = await cookies();
  const authResult = await verifyStaffIdentity({
    cookieStore,
    requiredRole: 'ANY',
  });

  if (!authResult.ok) {
    redirect('/login');
  }

  if (authResult.account.role === 'TEACHER') {
    redirect('/holding');
  }

  redirect('/languages');
}
