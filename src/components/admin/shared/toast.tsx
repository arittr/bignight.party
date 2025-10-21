"use client";

import { toast as sonnerToast } from "sonner";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export const toast = {
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(options?.title ?? message, {
      description: options?.description,
      duration: options?.duration ?? 6000,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(options?.title ?? message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(options?.title ?? message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(options?.title ?? message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
    });
  },
};
