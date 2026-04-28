import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Brain, Sparkles } from 'lucide-react';
import api from '../api';
import KanbanBoard from '../components/KanbanBoard';

const DashboardPage = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    required_skill: '',
    estimated_time: '',
    actual_time: '',
    start_date: '',
    end_date: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/${projectId}`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/task/${editingTask.id}`, newTask);
      } else {
        await api.post('/add-task', { ...newTask, project_id: projectId });
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setNewTask({ title: '', description: '', priority: 'Medium', required_skill: '', estimated_time: '', actual_time: '', start_date: '', end_date: '' });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      required_skill: task.required_skill || '',
      estimated_time: task.estimated_time || '',
      actual_time: task.actual_time || '',
      start_date: task.start_date || '',
      end_date: task.end_date || ''
    });
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/task/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePredictTime = async (priority) => {
    try {
      const res = await api.post('/predict-time', { priority });
      setPrediction(res.data.predictions);
      setNewTask({ ...newTask, priority, estimated_time: res.data.current_priority_prediction });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoAssign = async () => {
    try {
      await api.post('/auto-assign', { project_id: projectId });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Board</h1>
          <p className="text-slate-400 mt-1">Manage your team's workflow and tasks.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleAutoAssign}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            <Brain size={18} />
            <span>AI Auto-Assign</span>
          </button>
          <button 
            onClick={() => {
              setEditingTask(null);
              setNewTask({ title: '', description: '', priority: 'Medium', required_skill: '', estimated_time: '', actual_time: '', start_date: '', end_date: '' });
              setShowTaskModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard 
          tasks={tasks} 
          setTasks={setTasks} 
          projectId={projectId} 
          onRefresh={fetchTasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
        />
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
          <div className="glass-card max-w-lg w-full p-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6">{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Title</label>
                <input
                  required
                  className="w-full input-field"
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Description</label>
                <textarea
                  className="w-full input-field min-h-[100px]"
                  placeholder="What needs to be done?"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Priority</label>
                  <select
                    className="w-full input-field appearance-none"
                    value={newTask.priority}
                    onChange={(e) => handlePredictTime(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Required Skill</label>
                  <input
                    className="w-full input-field"
                    placeholder="e.g. React, Python"
                    value={newTask.required_skill}
                    onChange={(e) => setNewTask({ ...newTask, required_skill: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="text-sm font-medium text-slate-400">Estimated Time (Hours)</label>
                  {prediction && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={10} /> AI Predicted
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  className="w-full input-field"
                  placeholder="Hours"
                  value={newTask.estimated_time}
                  onChange={(e) => setNewTask({ ...newTask, estimated_time: e.target.value })}
                />
              </div>

              {editingTask && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Actual Time (Hours)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full input-field"
                    placeholder="Enter actual hours spent..."
                    value={newTask.actual_time}
                    onChange={(e) => setNewTask({ ...newTask, actual_time: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full input-field"
                    value={newTask.start_date}
                    onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5 ml-1">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full input-field"
                    value={newTask.end_date}
                    onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary py-3"
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
