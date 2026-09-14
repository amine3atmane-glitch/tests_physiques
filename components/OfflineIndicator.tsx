import React, { useEffect, useState } from 'react';
import { useLanguage } from '../utils/i18n';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const { language } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-500 text-white px-4 py-2.5 text-xs font-black shadow-xl border border-amber-400/30 animate-bounce">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>
        {language === 'ar' 
          ? 'وضع العمل دون اتصال — يتم حفظ البيانات محلياً وسيتم تحديثها تلقائياً' 
          : 'Mode Hors-ligne — Données stockées localement en toute sécurité'}
      </span>
    </div>
  );
};
