import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export function InstallBanner() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg"
      style={{
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: 448,
        background: 'linear-gradient(135deg, #722F37, #4A1520)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)' }}
      >
        <Download size={20} color="#fff" />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
          Установить Vino
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.3 }}>
          Добавьте на главный экран
        </p>
      </div>
      <button
        onClick={install}
        className="rounded-xl px-3 py-1.5 flex-shrink-0"
        style={{ background: '#E8A838', color: '#fff', fontSize: 12, fontWeight: 700 }}
      >
        Установить
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1"
        aria-label="Закрыть"
      >
        <X size={16} color="rgba(255,255,255,0.6)" />
      </button>
    </div>
  );
}
