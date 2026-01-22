"use client";

import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface FormSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Number of columns (1 or 2) */
  columns?: 1 | 2;
  /** Custom class name */
  className?: string;
  /** Section content (form fields) */
  children: ReactNode;
  /** Custom title class name */
  titleClassName?: string;
  /** Custom description class name */
  descriptionClassName?: string;
  /** Custom content container class name */
  contentClassName?: string;
}

/**
 * Form section component for grouping related form fields
 *
 * @example
 * ```tsx
 * <FormSection
 *   title="Contact Information"
 *   description="Please provide your contact details"
 *   columns={2}
 * >
 *   <FormField name="firstName" ... />
 *   <FormField name="lastName" ... />
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  columns = 1,
  className,
  children,
  titleClassName,
  descriptionClassName,
  contentClassName,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Section header */}
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3
              className={cn(
                "text-lg font-semibold text-ivory",
                titleClassName
              )}
            >
              {title}
            </h3>
          )}
          {description && (
            <p
              className={cn(
                "text-sm text-ivory/70",
                descriptionClassName
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Section content */}
      <div
        className={cn(
          columns === 2 && "grid gap-4 sm:grid-cols-2",
          columns === 1 && "space-y-4",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

