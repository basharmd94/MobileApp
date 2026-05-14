import { Bell, LogOut } from 'lucide-react';

interface MobileTopBarProps {
  user: any;
  onLogout: () => void;
}

export default function MobileTopBar({ user, onLogout }: MobileTopBarProps) {
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="flex items-center justify-between px-4 pt-10 pb-4 bg-white z-10 shrink-0 rounded-b-[28px] shadow-[0_6px_24px_rgba(249,115,22,0.13)] border-b border-primary-100">

      {/* Left: Avatar + User Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-md shadow-primary/30">
          {initials}
        </div>
        <div>
          <p className="text-[9.5px] font-semibold text-text-muted uppercase tracking-widest leading-none mb-0.5">
            Welcome back
          </p>
          <h1 className="text-[14px] font-bold text-text-main leading-tight truncate max-w-[160px]">
            {user?.username || 'User'}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-primary-50 border border-primary-200 text-primary-600 transition-all active:scale-90 hover:bg-primary-100">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error outline outline-[2px] outline-white" />
        </button>

        <button
          onClick={onLogout}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-500 transition-all active:scale-90 hover:bg-red-100"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}