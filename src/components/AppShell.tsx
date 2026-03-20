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
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medications', label: 'Medications', icon: Pill },
  { href: '/blood-tests', label: 'Blood Tests', icon: TestTubes },
  { href: '/mood', label: 'Mood', icon: SmilePlus },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/events', label: 'Timeline', icon: CalendarHeart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function Navigation() {
  const pathname = usePathname();

  React.useEffect(() => {
    startReminderChecker();
  }, []);

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
          {navItems.map((item) => (
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
          {navItems.slice(0, 5).map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <button
                  className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
                >
                  <item.icon size={22} />
                  <span>{item.label}</span>
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
