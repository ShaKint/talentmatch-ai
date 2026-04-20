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
    <aside className="fixed right-0 top-0 h-screen w-56 flex flex-col z-50" style={{backgroundColor: '#1A2332', borderLeft: '1px solid #243044'}}>
      <div className="p-5 border-b" style={{borderColor: '#243044'}}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{backgroundColor: '#14B8A6'}}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">SourceAI</h1>
            <p className="text-xs" style={{color: '#7A8FA6'}}>מנוע סורסינג חכם</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`}
              style={isActive 
                ? {backgroundColor: '#243044', color: 'white'} 
                : {color: '#7A8FA6'}
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4" style={{borderTop: '1px solid #243044'}}>
        <p className="text-xs px-4 mb-0.5" style={{color: '#7A8FA6'}}>גרסה 1.0</p>
        <p className="text-xs px-4 font-medium" style={{color: '#14B8A6'}}>AI-Powered Sourcing</p>
      </div>
    </aside>
  );
}