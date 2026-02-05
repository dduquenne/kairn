'use client';

import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { usePWA } from './PWAProvider';

export interface NotificationBellProps {
  className?: string;
  topics?: string[];
  showLabel?: boolean;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
}

export function NotificationBell({
  className = '',
  topics = ['all'],
  showLabel = false,
  onSubscribe,
  onUnsubscribe,
}: NotificationBellProps) {
  const {
    isPushSupported,
    pushPermission,
    isSubscribedToPush,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePWA();

  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isPushSupported) {
    return null;
  }

  const handleClick = async () => {
    setIsLoading(true);

    try {
      if (isSubscribedToPush) {
        const success = await unsubscribeFromPush();
        if (success) {
          onUnsubscribe?.();
        }
      } else {
        const success = await subscribeToPush(topics);
        if (success) {
          onSubscribe?.();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }

    if (pushPermission === 'denied') {
      return <BellOff className="h-5 w-5 opacity-50" />;
    }

    if (isSubscribedToPush) {
      return <BellRing className="h-5 w-5" />;
    }

    return <Bell className="h-5 w-5" />;
  };

  const getLabel = () => {
    if (pushPermission === 'denied') {
      return 'Notifications bloquées';
    }

    if (isSubscribedToPush) {
      return 'Notifications activées';
    }

    return 'Activer les notifications';
  };

  const getTooltip = () => {
    if (pushPermission === 'denied') {
      return 'Les notifications sont bloquées. Autorisez-les dans les paramètres de votre navigateur.';
    }

    if (isSubscribedToPush) {
      return 'Cliquez pour désactiver les notifications';
    }

    return 'Cliquez pour recevoir des notifications sur les nouveaux articles et séminaires';
  };

  const isDisabled = isLoading || pushPermission === 'denied';

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center gap-2 rounded-full p-2 transition-all
          ${isSubscribedToPush ? 'bg-[#c7a962]/20 text-[#c7a962]' : 'text-white/70 hover:text-white'}
          ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-white/10'}
          ${className}
        `}
        aria-label={getLabel()}
      >
        {getIcon()}
        {showLabel && <span className="text-sm">{getLabel()}</span>}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#252542] px-3 py-2 text-xs text-white shadow-lg">
          {getTooltip()}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#252542]" />
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
