"use client";

import { useToastStore } from "@/store/useToastStore";
import { X, CheckCircle2, AlertCircle, Info, Flame } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let colorClasses = "border-white/10 text-white bg-zinc-950/80";

        if (toast.type === "success") {
          Icon = CheckCircle2;
          colorClasses = "border-emerald-500/30 text-emerald-400 bg-emerald-950/20";
        } else if (toast.type === "error") {
          Icon = AlertCircle;
          colorClasses = "border-red-500/30 text-red-400 bg-red-950/20";
        } else if (toast.type === "warning") {
          Icon = AlertCircle;
          colorClasses = "border-amber-500/30 text-amber-400 bg-amber-950/20";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 ${colorClasses}`}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={16} className="shrink-0" />
              <p className="text-xs font-bold font-sans tracking-wide">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-80 transition-opacity p-0.5 rounded-md hover:bg-white/5 cursor-pointer text-current/60 hover:text-current"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
