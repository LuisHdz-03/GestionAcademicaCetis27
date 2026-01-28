'use client';

import React from 'react';
import { useToast } from '@/hooks/useToast';
import { Toast, ToastClose, ToastDescription, ToastTitle } from './toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            className="mb-2"
          >
            <div className="grid gap-1">
              {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
            <ToastClose onClick={() => dismiss(toast.id)} />
          </Toast>
        ))}
      </div>
    </>
  );
}
