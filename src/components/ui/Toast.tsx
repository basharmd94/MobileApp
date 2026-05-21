import { X, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  error: string | null;
  success: string | null;
}

export default function Toast({ error, success }: ToastProps) {
  return (
    <>
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] z-[100] bg-error text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <X className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] z-[100] bg-success text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
    </>
  );
}