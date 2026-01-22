"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@kairn/ui";

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Title displayed in the drawer header */
  title?: string;
  /** Content to display in the drawer */
  children: ReactNode;
  /** Width of the drawer */
  width?: "sm" | "md" | "lg" | "xl" | "full";
  /** Position of the drawer */
  position?: "left" | "right";
  /** Custom class names for the drawer content */
  className?: string;
  /** Footer content (buttons, etc.) */
  footer?: ReactNode;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Accent color for styling */
  accentColor?: string;
}

const WIDTH_CLASSES = {
  sm: "w-80",
  md: "w-96",
  lg: "w-[32rem]",
  xl: "w-[40rem]",
  full: "w-full sm:w-[90vw] max-w-5xl",
};

/**
 * Drawer - Slide-out panel for forms and detail views
 *
 * @example
 * ```tsx
 * <Drawer
 *   open={showDrawer}
 *   onClose={() => setShowDrawer(false)}
 *   title="Edit Item"
 *   width="lg"
 *   footer={
 *     <div className="flex gap-2">
 *       <Button onClick={() => setShowDrawer(false)}>Cancel</Button>
 *       <Button variant="primary" onClick={handleSave}>Save</Button>
 *     </div>
 *   }
 * >
 *   <YourFormContent />
 * </Drawer>
 * ```
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = "md",
  position = "right",
  className,
  footer,
  showCloseButton = true,
  accentColor = "gold",
}: DrawerProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  const positionClasses = {
    left: {
      container: "justify-start",
      panel: open ? "translate-x-0" : "-translate-x-full",
    },
    right: {
      container: "justify-end",
      panel: open ? "translate-x-0" : "translate-x-full",
    },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer container */}
      <div
        className={cn(
          "fixed inset-0 z-[70] flex transition-opacity duration-300",
          positionClasses[position].container,
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
      >
        {/* Drawer panel */}
        <div
          className={cn(
            "flex h-full flex-col bg-night/95 shadow-xl transition-transform duration-300 ease-in-out",
            WIDTH_CLASSES[width],
            positionClasses[position].panel,
            className
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={cn("flex items-center justify-between border-b border-night/40 p-4")}>
              {title && (
                <h2
                  id="drawer-title"
                  className={cn("text-lg font-semibold", `text-${accentColor}`)}
                >
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    "rounded-md p-2 text-ivory/70 transition",
                    "hover:bg-night/60 hover:text-ivory",
                    `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${accentColor}/70`
                  )}
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-night/40 p-4">{footer}</div>
          )}
        </div>
      </div>
    </>
  );
}
