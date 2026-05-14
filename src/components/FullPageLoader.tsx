import { Loader2 } from 'lucide-react';

/**
 * Full-page centered loading spinner.
 * Replaces duplicate loading screens in Home.tsx and Profile.tsx.
 */
export default function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );
}
