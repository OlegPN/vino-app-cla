import {
  User,
  Settings,
  Bell,
  HelpCircle,
  Star,
  Globe,
  LogOut,
  ChevronRight,
  Shield,
  Download,
  CheckCircle,
} from 'lucide-react';
import { usePWAInstall } from '../components/usePWAInstall';

const menuItems = [
  {
    section: 'Аккаунт',
    items: [
      { icon: User, label: 'Профиль', desc: 'Настройки профиля' },
      { icon: Bell, label: 'Уведомления', desc: 'Управление уведомлениями' },
      { icon: Shield, label: 'Конфиденциальность', desc: 'Приватность и безопасность' },
    ],
  },
  {
    section: 'Приложение',
    items: [
      { icon: Globe, label: 'Язык', desc: 'Русский' },
      { icon: Settings, label: 'Настройки', desc: 'Общие настройки' },
      { icon: Star, label: 'Оценить приложение', desc: 'Помогите нам стать лучше' },
    ],
  },
  {
    section: 'Поддержка',
    items: [
      { icon: HelpCircle, label: 'Справка', desc: 'Часто задаваемые вопросы' },
    ],
  },
];

export default function More() {
  const { canInstall, isInstalled, install } = usePWAInstall();

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: '#fff', borderBottom: '1px solid #f0ebe8' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Ещё</h1>
      </div>

      {/* User profile card */}
      <div className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div
          className="rounded-full flex items-center justify-center text-white flex-shrink-0"
          style={{ width: 56, height: 56, background: '#722F37', fontSize: 18, fontWeight: 700 }}
        >
          АП
        </div>
        <div className="flex-1">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Александр Петров</p>
          <p style={{ fontSize: 13, color: '#888' }}>alexander.petrov@email.com</p>
        </div>
        <ChevronRight size={18} color="#bbb" />
      </div>

      {/* Vivino Premium Banner */}
      <div
        className="mx-4 mt-4 rounded-2xl p-4 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #722F37, #4A1520)',
          boxShadow: '0 4px 12px rgba(114,47,55,0.3)',
        }}
      >
        <div>
          <p style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>Vivino Premium</p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
            Откройте эксклюзивные функции
          </p>
        </div>
        <button
          className="rounded-full px-4 py-2"
          style={{ background: '#E8A838', color: '#fff', fontSize: 13, fontWeight: 700 }}
        >
          Попробовать
        </button>
      </div>

      {/* Menu sections */}
      <div className="mt-4 flex flex-col gap-4 px-4">
        {menuItems.map((section) => (
          <div key={section.section}>
            <p style={{ fontSize: 12, color: '#aaa', fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
              {section.section}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                      <div
                        className="rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ width: 36, height: 36, background: '#f5f0ee' }}
                      >
                        <Icon size={18} color="#722F37" />
                      </div>
                      <div className="flex-1 text-left">
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{item.label}</p>
                        <p style={{ fontSize: 12, color: '#aaa' }}>{item.desc}</p>
                      </div>
                      <ChevronRight size={16} color="#ccc" />
                    </button>
                    {idx < section.items.length - 1 && (
                      <div style={{ height: 1, background: '#f5f0ee', marginLeft: 64 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Install PWA */}
        {!isInstalled && (
          <button
            onClick={canInstall ? install : undefined}
            disabled={!canInstall}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{
              background: canInstall
                ? 'linear-gradient(135deg, #722F37, #4A1520)'
                : '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              opacity: canInstall ? 1 : 0.6,
            }}
          >
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                background: canInstall ? 'rgba(255,255,255,0.2)' : '#f5f0ee',
              }}
            >
              <Download size={18} color={canInstall ? '#fff' : '#722F37'} />
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontSize: 14, fontWeight: 600, color: canInstall ? '#fff' : '#1a1a1a' }}>
                Установить приложение
              </p>
              <p style={{ fontSize: 12, color: canInstall ? 'rgba(255,255,255,0.7)' : '#aaa' }}>
                {canInstall ? 'Добавить на главный экран' : 'Откройте в браузере для установки'}
              </p>
            </div>
          </button>
        )}

        {isInstalled && (
          <div
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ width: 36, height: 36, background: '#f0fff4' }}
            >
              <CheckCircle size={18} color="#22c55e" />
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Приложение установлено</p>
              <p style={{ fontSize: 12, color: '#aaa' }}>Vino на вашем устройстве</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl mt-1"
          style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <LogOut size={18} color="#E8473A" />
          <span style={{ color: '#E8473A', fontSize: 15, fontWeight: 700 }}>Выйти</span>
        </button>

        <p style={{ textAlign: 'center', color: '#ccc', fontSize: 12, paddingBottom: 8 }}>
          Vivino Clone v1.0.0
        </p>
      </div>
    </div>
  );
}