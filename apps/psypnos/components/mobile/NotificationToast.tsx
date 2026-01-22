// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface NotificationToastProps {
  id: string;
  type: 'drop' | 'spike' | 'error' | 'slow';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: number;
}

export function NotificationToast({
  id,
  type,
  severity,
  title,
  message,
  onClose,
  autoClose = 5000
}: NotificationToastProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'spike':
        return TrendingUp;
      case 'drop':
        return TrendingDown;
      case 'error':
        return AlertCircle;
      case 'slow':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const getColor = () => {
    switch (severity) {
      case 'high':
        return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'medium':
        return 'border-gold/30 bg-gold/10 text-gold';
      case 'low':
        return 'border-green-500/30 bg-green-500/10 text-green-400';
      default:
        return 'border-gold/30 bg-gold/10 text-gold';
    }
  };

  const Icon = getIcon();
  const colorClass = getColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`fixed top-4 left-4 right-4 z-50 border rounded-xl p-4 shadow-lg backdrop-blur-lg ${colorClass}`}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          <p className="text-xs opacity-90">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-black/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

interface NotificationToastContainerProps {
  notifications: Array<{
    id: string;
    type: 'drop' | 'spike' | 'error' | 'slow';
    severity: 'low' | 'medium' | 'high';
    title: string;
    message: string;
  }>;
  onDismiss: (id: string) => void;
}

export function NotificationToastContainer({
  notifications,
  onDismiss
}: NotificationToastContainerProps) {
  return (
    <AnimatePresence>
      {notifications.map((notification, index) => (
        <motion.div
          key={notification.id}
          style={{ top: `${4 + index * 90}px` }}
          className="absolute inset-x-0"
        >
          <NotificationToast
            {...notification}
            onClose={() => onDismiss(notification.id)}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
