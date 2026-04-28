import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, Settings, Rocket, Calendar } from 'lucide-react';

const Sidebar = () => {
  const { projectId } = useParams();

  const navItems = [
    { name: 'Board', icon: LayoutDashboard, path: `/dashboard/${projectId}` },
    { name: 'Timeline', icon: Calendar, path: `/timeline/${projectId}` },
    { name: 'Analytics', icon: BarChart3, path: `/analytics/${projectId}` },
    { name: 'Members', icon: Users, path: `/members/${projectId}` },
  ];

  if (!projectId) return (
    <aside className="w-64 glass border-r border-white/5 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="bg-primary p-2 rounded-xl">
          <Rocket className="text-white" size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight">SprintAI</h1>
      </div>
      <p className="text-slate-400 text-sm px-2">Select a project to see more options.</p>
    </aside>
  );

  return (
    <aside className="w-64 glass border-r border-white/5 flex flex-col p-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="bg-primary p-2 rounded-xl">
          <Rocket className="text-white" size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight">SprintAI</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/5 pt-4">
        <NavLink
          to="/projects"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <Settings size={20} />
          <span className="font-medium">All Projects</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
