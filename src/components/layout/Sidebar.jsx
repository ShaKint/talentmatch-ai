import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, Zap, Github } from 'lucide-react';

const navItems = [
  { label: 'דשבורד', icon: LayoutDashboard, path: '/' },
  { label: 'משרות', icon: Briefcase, path: '/jobs' },
  { label: 'מועמדים', icon: Users, path: '/candidates' },
  { label: 'GitHub Sourcing', icon: Github, path: '/sourcing' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-card border-l border-border flex flex-col z-50">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">SourceAI</h1>
            <p className="text-xs text-muted-foreground">מנוע סורסינג חכם</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-4 py-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">גרסה 1.0</p>
          <p className="text-xs text-primary font-medium">AI-Powered Sourcing</p>
        </div>
      </div>
    </aside>
  );
}