import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Users, ChevronRight } from 'lucide-react';
import api from '../api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name: newName, team_name: newTeam, start_date: startDate, end_date: endDate });
      setNewName('');
      setNewTeam('');
      setStartDate('');
      setEndDate('');
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your Projects</h1>
          <p className="text-slate-400 mt-2 text-lg">Manage and switch between your sprint workspaces.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <Plus size={20} />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 glass-card animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Folder size={64} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold">No projects yet</h2>
          <p className="text-slate-400 mt-2">Create your first project to get started.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary mt-8 px-8"
          >
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link 
              key={project.id} 
              to={`/dashboard/${project.id}`}
              className="glass-card p-6 flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 p-3 rounded-2xl group-hover:bg-primary/20 transition-all">
                  <Folder className="text-primary" size={24} />
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Users size={16} />
                  <span>{project.team_name}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-all">{project.name}</h3>
              <p className="text-slate-400 text-sm line-clamp-2 flex-1">
                Workspace for {project.team_name}. Manage tasks, members, and analytics.
              </p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-primary font-medium text-sm">
                Open Project
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Project Name</label>
                <input
                  required
                  className="w-full input-field"
                  placeholder="e.g. Mobile App Redesign"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Team Name</label>
                <input
                  required
                  className="w-full input-field"
                  placeholder="e.g. Design Team"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary py-3"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
