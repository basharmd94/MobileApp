import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Card } from '../components';
import { useCurrentUser } from '../hooks/useCurrentUser';
import FullPageLoader from '../components/FullPageLoader';
import MobileBottomNav from '../components/navigation/MobileBottomNav';

export default function Profile() {
  const { user, loading, handleLogout } = useCurrentUser();
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    if (tab === 'dashboard') {
      navigate('/');
    } else if (tab === 'send_orders') {
      navigate('/');
    } else if (tab === 'sales') {
      navigate('/');
    }
  };

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-[100dvh] bg-bg-base flex flex-col pb-16 relative max-w-md mx-auto shadow-2xl overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 pt-8 pb-3 bg-base shadow-[0_2px_10px_rgb(0,0,0,0.02)] z-10 rounded-b-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Profile</p>
            <h1 className="text-[13px] font-bold text-text-main leading-tight truncate max-w-[120px]">
              {user?.username || 'User'}
            </h1>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="text-[11px] font-bold text-primary">
          Back
        </button>
      </header>

      {/* Profile Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 pb-4">
          <Card className="!p-4 !rounded-[16px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-[20px] font-bold shadow-md shadow-primary/20">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-text-main leading-tight mb-0.5">{user?.username || 'User'}</h3>
                <p className="text-[11px] text-text-muted">{user?.email || 'No email provided'}</p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-success/10 border border-success/20 text-[9px] font-bold text-success uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mr-1"></div>
                    {user?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="!p-3 !rounded-[16px]">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Contact Info</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center bg-bg-base p-2.5 rounded-[12px] border border-ui-border/50">
                <span className="text-[11px] text-text-muted font-medium">Mobile</span>
                <span className="text-[12px] font-semibold text-text-main">{user?.mobile || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center bg-bg-base p-2.5 rounded-[12px] border border-ui-border/50">
                <span className="text-[11px] text-text-muted font-medium">Email</span>
                <span className="text-[12px] font-semibold text-text-main">{user?.email || 'N/A'}</span>
              </div>
            </div>
          </Card>
          
          <Card className="!p-3 !rounded-[16px]">
            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Account Details</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-bg-base p-2.5 rounded-[12px] border border-ui-border/50">
                <p className="text-[9px] text-text-muted font-medium mb-0.5">User ID</p>
                <p className="text-[11px] font-semibold text-primary truncate">{user?.user_id || 'N/A'}</p>
              </div>
              <div className="bg-bg-base p-2.5 rounded-[12px] border border-ui-border/50">
                <p className="text-[9px] text-text-muted font-medium mb-0.5">Role</p>
                <p className="text-[11px] font-semibold capitalize text-text-main truncate">{user?.is_admin || 'N/A'}</p>
              </div>
              <div className="bg-bg-base p-2.5 rounded-[12px] border border-ui-border/50">
                <p className="text-[9px] text-text-muted font-medium mb-0.5">Business ID</p>
                <p className="text-[11px] font-semibold text-text-main truncate">{user?.businessId || 'N/A'}</p>
              </div>
              <div className="bg-bg-base p-2.5 rounded-[12px] border border-ui-border/50">
                <p className="text-[9px] text-text-muted font-medium mb-0.5">Terminal</p>
                <p className="text-[11px] font-semibold text-text-main truncate">{user?.terminal || 'N/A'}</p>
              </div>
            </div>
          </Card>
          
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-error/10 text-error font-bold text-[12px] transition-colors hover:bg-error/20 active:scale-[0.98] mt-4">
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </main>

      <MobileBottomNav 
        activeTab="profile"
        onTabChange={handleTabChange}
        pendingCount={0}
      />
    </div>
  );
}