'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import {
  LayoutDashboard,
  Pill,
  TestTubes,
  SmilePlus,
  Target,
  CalendarHeart,
  Settings,
  Heart,
} from 'lucide-react';
import { startReminderChecker } from '@/lib/notifications';

const navItems = [
  { href: '/', label: 'Dashboard', mobileLabel: 'Dash', icon: LayoutDashboard },
  { href: '/medications', label: 'Medications', mobileLabel: 'Meds', icon: Pill },
  { href: '/blood-tests', label: 'Blood Tests', mobileLabel: 'Tests', icon: TestTubes },
  { href: '/mood', label: 'Mood', mobileLabel: 'Mood', icon: SmilePlus },
  { href: '/goals', label: 'Goals', mobileLabel: 'Goals', icon: Target },
  { href: '/events', label: 'Timeline', mobileLabel: 'Events', icon: CalendarHeart },
  { href: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings },
];

function Navigation() {
  const pathname = usePathname();
  const [enabledModules, setEnabledModules] = React.useState({
    bloodTests: true,
    mood: true,
    goals: true,
    events: true,
  });

  React.useEffect(() => {
    startReminderChecker();
    
    const updateModules = () => {
      setEnabledModules({
        bloodTests: localStorage.getItem('hrt_enable_blood_tests') !== 'false',
        mood: localStorage.getItem('hrt_enable_mood') !== 'false',
        goals: localStorage.getItem('hrt_enable_goals') !== 'false',
        events: localStorage.getItem('hrt_enable_events') !== 'false',
      });
    };
    
    updateModules();
    window.addEventListener('storage', updateModules);
    window.addEventListener('hrt_settings_changed', updateModules);
    return () => {
      window.removeEventListener('storage', updateModules);
      window.removeEventListener('hrt_settings_changed', updateModules);
    };
  }, []);

  const visibleNavItems = navItems.filter((item) => {
    if (item.href === '/blood-tests' && !enabledModules.bloodTests) return false;
    if (item.href === '/mood' && !enabledModules.mood) return false;
    if (item.href === '/goals' && !enabledModules.goals) return false;
    if (item.href === '/events' && !enabledModules.events) return false;
    return true;
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Heart size={22} />
          </div>
          <span className="sidebar-logo-text">HRT Tracker</span>
        </div>

        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <ul className="bottom-nav-items">
          {visibleNavItems.map((item) => (
            <li key={item.href} style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
              <Link href={item.href} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <button
                  className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px 4px' }}
                >
                  <item.icon size={22} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{item.mobileLabel}</span>
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="app-layout">
        <Navigation />
        <div className="glow-bg" />
        <main className="main-content animate-fade-in">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
