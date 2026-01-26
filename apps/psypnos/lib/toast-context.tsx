"use client";

// Re-export toast context from @kairn/ui through a single client entry point
// This ensures a single instance of the context is used across the application
export { ToastProvider, useToast } from "@kairn/ui";
export type { Toast, ToastVariant, ToastProviderProps } from "@kairn/ui";
