import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import Sidebar from '../../components/Sidebar';
import Topbar from '../../components/Topbar';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'afrifoundry-command-center-secret-2026'
);

async function getRole() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('cc_token')?.value;
    if (!token) return 'admin';
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role || 'admin';
  } catch {
    return 'admin';
  }
}

export default async function DashboardLayout({ children }) {
  const role = await getRole();

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col md:ml-52 min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
