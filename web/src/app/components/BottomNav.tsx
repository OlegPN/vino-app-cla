import { Home, Search, Wine, BookOpen, MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import type { ElementType } from 'react';

const navItems = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/explore', icon: Search, label: 'Исследование' },
  { path: '/my-wines', icon: Wine, label: 'Мои вина' },
  { path: '/journal', icon: BookOpen, label: 'Журнал' },
  { path: '/more', icon: MoreHorizontal, label: 'Больше' },
];

interface NavButtonProps {
  path: string;
  icon: ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ icon: Icon, label, isActive, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 flex-1 py-2 transition-all"
      style={{ opacity: isActive ? 1 : 0.55 }}
    >
      <div
        className="flex items-center justify-center rounded-full transition-all"
        style={{
          width: 40,
          height: 28,
          background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
        }}
      >
        <Icon size={20} color="#fff" />
      </div>
      <span
        style={{
          color: '#fff',
          fontSize: 10,
          lineHeight: 1.2,
          fontWeight: isActive ? 700 : 400,
        }}
      >
        {label}
      </span>
    </button>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 440,
      }}
    >
      <nav
        className="flex items-center"
        style={{
          background: '#722F37',
          borderRadius: 32,
          padding: '6px 4px',
          boxShadow: '0 8px 32px rgba(114,47,55,0.45)',
        }}
      >
        {navItems.map((item) => (
          <NavButton
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            isActive={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>
    </div>
  );
}
