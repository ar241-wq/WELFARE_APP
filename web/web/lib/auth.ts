import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireRole(role: 'employer' | 'provider') {
  const cookieStore = await cookies();
  const access = cookieStore.get('access')?.value;
  const storedRole = cookieStore.get('role')?.value;

  if (!access) redirect('/login');
  if (storedRole && storedRole !== role) {
    redirect(storedRole === 'employer' ? '/employer/dashboard' : '/provider/dashboard');
  }
}

export async function getServerRole() {
  const cookieStore = await cookies();
  return cookieStore.get('role')?.value ?? null;
}
