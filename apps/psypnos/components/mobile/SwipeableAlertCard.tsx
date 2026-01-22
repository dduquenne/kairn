// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { AlertTriangle, TrendingDown, TrendingUp, Clock, Check, Eye, Trash2 } from "lucide-react";
import { useState } from "react";

interface Alert {
  id: string;
  type: "anomaly" | "spike" | "drop" | "info";
  title: string;
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  read?: boolean;
}

interface SwipeableAlertCardProps {
  alert: Alert;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  index: number;
}

export function SwipeableAlertCard({
  alert,
  onMarkRead,
  onDelete,
  onView,
  index,
}: SwipeableAlertCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const x = useMotionValue(0);

  // Transform x position to reveal actions
  const leftActionOpacity = useTransform(x, [0, 80], [0, 1]);
  const rightActionOpacity = useTransform(x, [-80, 0], [1, 0]);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;

    if (info.offset.x > threshold) {
      // Swipe right - mark as read
      onMarkRead(alert.id);
    } else if (info.offset.x < -threshold) {
      // Swipe left - delete
      setIsDeleting(true);
      setTimeout(() => onDelete(alert.id), 300);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "spike":
        return TrendingUp;
      case "drop":
        return TrendingDown;
      case "anomaly":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return {
          border: "border-red-500/30",
          bg: "bg-red-500/10",
          icon: "text-red-400",
          accent: "#f87171",
        };
      case "medium":
        return {
          border: "border-gold/30",
          bg: "bg-gold/10",
          icon: "text-gold",
          accent: "#C9A961",
        };
      default:
        return {
          border: "border-green-500/30",
          bg: "bg-green-500/10",
          icon: "text-green-400",
          accent: "#34d399",
        };
    }
  };

  const Icon = getAlertIcon(alert.type);
  const colors = getSeverityColor(alert.severity);

  if (isDeleting) {
    return (
      <motion.div
        initial={{ height: "auto", opacity: 1 }}
        animate={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Left action (mark as read) */}
      <motion.div
        style={{ opacity: leftActionOpacity }}
        className="absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-green-500/20 rounded-l-xl"
      >
        <Check className="h-6 w-6 text-green-400" />
      </motion.div>

      {/* Right action (delete) */}
      <motion.div
        style={{ opacity: rightActionOpacity }}
        className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-500/20 rounded-r-xl"
      >
        <Trash2 className="h-6 w-6 text-red-400" />
      </motion.div>

      {/* Main card */}
      <motion.div
        style={{ x, scale }}
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => onView(alert.id)}
        className={`relative rounded-xl p-4 border ${colors.border} ${colors.bg} ${
          alert.read ? "opacity-60" : ""
        } cursor-pointer active:opacity-80 transition-opacity`}
      >
        {/* Unread indicator */}
        {!alert.read && (
          <div
            className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
        )}

        <div className="flex items-start gap-3 pr-4">
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.icon}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-ivory mb-1 pr-4">{alert.title}</h3>
            <p className="text-sm text-ivory/70 mb-2 line-clamp-2">{alert.message}</p>
            <p className="text-xs text-ivory/50">
              {new Date(alert.timestamp).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Severity indicator bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
          style={{ backgroundColor: colors.accent }}
        />
      </motion.div>
    </div>
  );
}
