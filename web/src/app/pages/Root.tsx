import { Outlet } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { InstallBanner } from '../components/InstallBanner';

export default function Root() {
  return (
    <div
      className="relative"
      style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f4f2' }}
    >
      <Outlet />
      <BottomNav />
      <InstallBanner />
    </div>
  );
}
