"use client";

import * as React from "react";
import { X, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast, ToastType } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const ToastIcon = ({ type }: { type: ToastType }) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };
  return icons[type];
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-0 right-0 z-[999] w-full max-w-sm p-4 space-y-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 border border-border bg-white p-4",
              "hover:border-foreground"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              <ToastIcon type={toast.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
