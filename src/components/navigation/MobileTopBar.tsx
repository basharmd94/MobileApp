import { Bell, LogOut, User } from 'lucide-react';

interface MobileTopBarProps {
  user: any;
  onLogout: () => void;
}

export default function MobileTopBar({ user, onLogout }: MobileTopBarProps) {
  return (
    <header className="flex items-center justify-between px-4 pt-8 pb-3 bg-base shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Welcome</p>
          <h1 className="text-[13px] font-bold text-text-main leading-tight truncate max-w-[120px]">
            {user?.username || 'User'}
          </h1>
          <h2 className="text-[10px] font-bold text-purple-600 leading-tight truncate max-w-[120px]">
            {user?.user_id || 'User'}
          </h2>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-base text-text-secondary relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full outline outline-[1.5px] outline-bg-base"></span>
        </button>
        <button
          onClick={onLogout}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-error/10 text-error"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}