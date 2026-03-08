export type ToastType = "success" | "error" | "warning" | "info";

export interface AppToast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

let listeners: ((toasts: AppToast[]) => void)[] = [];
let toasts: AppToast[] = [];
let counter = 0;

function addToast(t: Omit<AppToast, "id">) {
  const id = String(++counter);
  const item: AppToast = { ...t, id };
  toasts = [item, ...toasts].slice(0, 5);
  listeners.forEach((l) => l([...toasts]));
  setTimeout(() => removeToast(id), 4000);
  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((l) => l([...toasts]));
}

export function subscribe(listener: (toasts: AppToast[]) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// Unified toast API — supports both sonner-style and useToast-style calls
export const toast = Object.assign(
  (opts: string | { title?: string; description?: string; variant?: string }) => {
    if (typeof opts === "string") {
      addToast({ title: opts, type: "success" });
    } else {
      addToast({
        title: opts.title || "",
        description: opts.description,
        type: opts.variant === "destructive" ? "error" : "success",
      });
    }
  },
  {
    success: (msg: string) => addToast({ title: msg, type: "success" }),
    error: (msg: string) => addToast({ title: msg, type: "error" }),
    info: (msg: string) => addToast({ title: msg, type: "info" }),
    warning: (msg: string) => addToast({ title: msg, type: "warning" }),
  }
);
