import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Tractor,
  Droplets,
  Sprout,
  Microscope,
  ScanSearch,
  BrainCircuit,
  CloudSun,
  Waves,
  FlaskConical,
  ShieldCheck,
  Bell,
  FileBarChart2,
  UserCircle,
  ShieldAlert,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAgri } from '../context/AgriContext';
import { sendEmailVerification } from '../firebase';

interface NavGroup {
  heading: string;
  items: { to: string; label: string; icon: React.ReactNode }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Farm Operations',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: '/farms', label: 'Farms & Plots', icon: <Tractor className="w-4 h-4" /> },
      { to: '/land-mapping', label: '7/12 Land Map', icon: <MapPin className="w-4 h-4" /> },
      { to: '/crops', label: 'Crop Lifecycle', icon: <Sprout className="w-4 h-4" /> },
    ],
  },
  {
    heading: 'Sensors & Weather',
    items: [
      { to: '/soil', label: 'Soil & Arduino IoT', icon: <Droplets className="w-4 h-4" /> },
      { to: '/weather', label: 'Weather Advisory', icon: <CloudSun className="w-4 h-4" /> },
      { to: '/irrigation', label: 'Irrigation', icon: <Waves className="w-4 h-4" /> },
      { to: '/fertilizer', label: 'Fertilizer & Inputs', icon: <FlaskConical className="w-4 h-4" /> },
    ],
  },
  {
    heading: 'AI Diagnostics',
    items: [
      { to: '/disease-detection', label: 'CNN Disease Scan', icon: <Microscope className="w-4 h-4" /> },
      { to: '/damage-detection', label: 'YOLOv8 Damage', icon: <ScanSearch className="w-4 h-4" /> },
      { to: '/crop-recommendation', label: 'Crop Recommender', icon: <BrainCircuit className="w-4 h-4" /> },
    ],
  },
  {
    heading: 'Trust & Governance',
    items: [
      { to: '/blockchain', label: 'Blockchain Verify', icon: <ShieldCheck className="w-4 h-4" /> },
      { to: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      { to: '/reports', label: 'Reports & Export', icon: <FileBarChart2 className="w-4 h-4" /> },
      { to: '/profile', label: 'Farmer Profile', icon: <UserCircle className="w-4 h-4" /> },
      { to: '/admin', label: 'Admin Console', icon: <ShieldAlert className="w-4 h-4" /> },
    ],
  },
];

export function WorkspaceLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { isDemoMode, firebaseUser, profile, notifications, exitSession } = useAgri();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await exitSession();
    navigate('/');
  };

  const handleResendVerification = async () => {
    if (!firebaseUser) return;
    try {
      await sendEmailVerification(firebaseUser);
      setVerifyMsg('Verification email sent. Please check your inbox and reload.');
    } catch {
      setVerifyMsg('Unable to send verification email right now. Please try again shortly.');
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F7F5] text-[#263238]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#E0E0E0] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-[#E0E0E0] flex items-center justify-between shrink-0">
          <Link to="/" className="font-display font-bold text-lg text-[#2E7D32] tracking-tight whitespace-nowrap">
            AgriVision AI
          </Link>
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-[#546E7A] hover:bg-[#F5F7F5]"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Workspace navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="px-3 mb-1.5 text-xs font-semibold text-[#546E7A] tracking-wide">
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : 'text-[#263238] hover:bg-[#F5F7F5]'
                      }`
                    }
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.to === '/notifications' && unreadCount > 0 && (
                      <span className="text-xs font-mono tabular-nums text-[#2E7D32] font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E0E0E0] space-y-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={profile?.photoUrl || '/src/assets/images/farmer_avatar_1794662768649.jpg'}
              alt={profile?.fullName || 'Farmer profile'}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-[#E0E0E0] bg-[#E8F5E9]"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#263238] truncate">
                {profile?.fullName || 'Farmer Account'}
              </p>
              <p className="text-xs text-[#546E7A] truncate">
                {isDemoMode ? 'Demo Sandbox' : 'Firebase Synced'} · {profile?.role === 'admin' ? 'Admin' : 'Farmer'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#263238] bg-[#F5F7F5] hover:bg-[#E8F5E9] hover:text-[#2E7D32] border border-[#E0E0E0] rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Exit Demo Session' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-[#E0E0E0] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border border-[#E0E0E0] text-[#263238] hover:bg-[#F5F7F5]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg sm:text-xl text-[#263238] truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[#546E7A] truncate hidden sm:block">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/notifications"
              className="px-3 py-1.5 text-xs font-medium border border-[#E0E0E0] rounded-lg hover:bg-[#F5F7F5] text-[#263238] whitespace-nowrap"
            >
              Alerts ({unreadCount})
            </Link>
            {isDemoMode && (
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628] transition-colors whitespace-nowrap"
              >
                Sign In with Google
              </Link>
            )}
          </div>
        </header>

        {isDemoMode && (
          <div className="bg-[#FFF8E1] border-b border-[#FFE082] px-4 sm:px-6 py-2 text-xs text-[#6D4C00] flex flex-col sm:flex-row sm:items-center justify-between gap-2 no-print">
            <span>
              Demo Sandbox Mode — sample Maharashtra farms and simulated Arduino telemetry are clearly labeled.
            </span>
            <Link to="/login" className="font-semibold underline hover:text-[#2E7D32] whitespace-nowrap shrink-0">
              Switch to Firebase Account
            </Link>
          </div>
        )}

        {firebaseUser && !firebaseUser.emailVerified && (
          <div className="bg-[#FFF8E1] border-b border-[#FFE082] px-4 sm:px-6 py-2 text-xs text-[#6D4C00] flex flex-wrap items-center justify-between gap-2 no-print">
            <span>
              Email verification pending — Firestore security rules require a verified email before saving cloud writes.
              {verifyMsg && <strong className="ml-2">{verifyMsg}</strong>}
            </span>
            <button
              type="button"
              onClick={handleResendVerification}
              className="px-2.5 py-1 bg-[#2E7D32] text-white rounded font-medium hover:bg-[#246628]"
            >
              Resend Verification Email
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
