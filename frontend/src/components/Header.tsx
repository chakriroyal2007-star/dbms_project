import React, { useState, useEffect } from 'react';
import { 
  Radio, RefreshCw, User as UserIcon, LogOut, 
  CheckCircle2, Shield, Search, Bell, Sparkles, Terminal, Activity
} from 'lucide-react';
import api, { authApi } from '../services/api';
import { User } from '../types';
import { CommandPalette } from './ui/CommandPalette';
import { NotificationCenter } from './ui/NotificationCenter';

interface HeaderProps {
  user: User | null;
  onUserChange?: (user: User) => void;
  onLogout: () => void;
  onLoadScenario: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onUserChange, 
  onLogout, 
  onLoadScenario,
  onNavigateTab
}) => {
  const [loadingScenario, setLoadingScenario] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);

  // Poll alert count for notification bell badge
  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const res = await api.get('/dashboard/alerts').catch(() => ({ data: [] }));
        setActiveAlertCount((res.data || []).length);
      } catch (e) {
        /* ignore */
      }
    };
    checkAlerts();
    const interval = setInterval(checkAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const userRole = user?.role?.toUpperCase() || 'REPORTER';

  return (
    <>
      <header className="h-14 bg-[#121215] border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 z-30 select-none font-mono text-zinc-100">
        {/* Brand & System Mode */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-zinc-900 text-sm shadow-sm">
              T
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-zinc-100 flex items-center space-x-1.5">
                <span>TERA</span>
                <span className="text-[10px] font-medium text-zinc-400 font-sans">
                  Operations
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2 pl-3 border-l border-zinc-800 text-[11px] text-zinc-400">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-zinc-300">PostgreSQL Relational Core</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger Button */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer shadow-inner w-56 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              <span>Search / Command</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Immutable Authenticated Role Badge + Notification Bell + Exit */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Non-interactive Authoritative Role Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] select-none">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold tracking-wide text-zinc-200">{userRole}</span>
            {user?.username && (
              <span className="text-zinc-500 font-normal">({user.username})</span>
            )}
          </div>


          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all relative cursor-pointer"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeAlertCount}
                </span>
              )}
            </button>

            <NotificationCenter
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onNavigateTab={(tab) => {
                if (onNavigateTab) onNavigateTab(tab);
              }}
            />
          </div>

          {/* User Profile & Logout */}
          <button
            onClick={onLogout}
            title="Return to Landing Overview"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Exit</span>
          </button>
        </div>
      </header>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-xs text-zinc-200 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(tab) => {
          if (onNavigateTab) onNavigateTab(tab);
        }}
      />
    </>
  );
};
