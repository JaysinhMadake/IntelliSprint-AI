import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, User, Mail, Award, Clock, Trash2 } from 'lucide-react';
import api from '../api';

const MembersPage = () => {
  const { projectId } = useParams();
  const [members, setMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', skills: '', availability: 40 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/members/${projectId}`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post('/add-member', { ...newMember, project_id: projectId });
      setShowModal(false);
      setNewMember({ name: '', skills: '', availability: 40 });
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Remove this team member?')) return;
    try {
      await api.delete(`/member/${id}`);
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-slate-400 mt-1">Manage your team and their specializations.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add Member</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 glass-card animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <User size={64} className="mx-auto text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold">No members yet</h2>
          <p className="text-slate-400 mt-2">Add team members to start assigning tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <div key={member.id} className="glass-card p-6 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{member.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                    <Clock size={14} />
                    <span>{member.availability}h / week</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.split(',').map((skill, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button className="text-primary hover:text-primary-hover text-sm font-medium">View Tasks</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Full Name</label>
                <input
                  required
                  className="w-full input-field"
                  placeholder="e.g. Alice Smith"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Skills (Comma separated)</label>
                <input
                  required
                  className="w-full input-field"
                  placeholder="e.g. React, Python, UI Design"
                  value={newMember.skills}
                  onChange={(e) => setNewMember({ ...newMember, skills: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Weekly Availability (Hours)</label>
                <input
                  type="number"
                  required
                  className="w-full input-field"
                  placeholder="40"
                  value={newMember.availability}
                  onChange={(e) => setNewMember({ ...newMember, availability: e.target.value })}
                />
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
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
