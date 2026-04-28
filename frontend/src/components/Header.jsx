import React from 'react';
import { LogOut, User, Sun, Moon } from 'lucide-react';
import api from '../api';

const Header = ({ user }) => {
  const [isLight, setIsLight] = React.useState(document.documentElement.classList.contains('light-mode'));

  const toggleTheme = () => {
    const newIsLight = !isLight;
    setIsLight(newIsLight);
    if (newIsLight) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };
  const handleLogout = async () => {
    try {
      await api.post('/logout');
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 glass border-b border-white/5 px-6 flex items-center justify-between">
      <div>
        {/* Project Context can go here */}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
          title="Toggle Theme"
        >
          {isLight ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-slate-200">{user?.name}</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
