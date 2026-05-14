import { useState } from 'react';

export function useToast() {
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showError = (message: string, duration = 3000) => {
    setErrorToast(message);
    setTimeout(() => setErrorToast(null), duration);
  };

  const showSuccess = (message: string, duration = 4000) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), duration);
  };

  return { errorToast, successToast, showError, showSuccess };
}