import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }) {
  const auth = await getAuthUser();
  if (!auth) redirect('/masuk');

  const userResult = await query(
    'SELECT id, name, email, avatar FROM users WHERE id = $1',
    [auth.id]
  ).catch(() => ({ rows: [{ name: auth.name, email: auth.email }] }));

  const user = userResult.rows[0] || { name: auth.name, email: auth.email };

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
