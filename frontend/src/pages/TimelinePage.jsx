import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import api from '../api';
import { format, addDays, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns';

const TimelinePage = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/${projectId}`);
      // Filter only tasks with dates
      setTasks(res.data.filter(t => t.start_date && t.end_date));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 14 days view
  const days = eachDayOfInterval({
    start: viewDate,
    end: addDays(viewDate, 14)
  });

  const getTaskStyle = (task) => {
    const start = new Date(task.start_date);
    const end = new Date(task.end_date);
    
    // Calculate position relative to viewDate
    const leftOffset = differenceInDays(start, viewDate);
    const duration = differenceInDays(end, start) + 1;
    
    // Only show if within view
    if (leftOffset + duration < 0 || leftOffset > 14) return { display: 'none' };
    
    const constrainedLeft = Math.max(0, leftOffset);
    const visibleDuration = duration - (constrainedLeft - leftOffset);
    
    return {
      left: `${constrainedLeft * 100 / 15}%`,
      width: `${visibleDuration * 100 / 15}%`,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'In Progress': return 'bg-yellow-500';
      case 'In Review': return 'bg-purple-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Timeline</h1>
          <p className="text-slate-400 mt-1">Visualize your sprint schedule and dependencies.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          <button 
            onClick={() => setViewDate(addDays(viewDate, -7))}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 font-medium text-sm">
            {format(viewDate, 'MMM d')} - {format(addDays(viewDate, 14), 'MMM d, yyyy')}
          </div>
          <button 
            onClick={() => setViewDate(addDays(viewDate, 7))}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        {/* Gantt Header */}
        <div className="flex border-b border-white/10 bg-white/5">
          <div className="w-64 border-r border-white/10 p-4 font-bold text-xs uppercase tracking-wider text-slate-500">Task Name</div>
          <div className="flex-1 flex">
            {days.map((day, i) => (
              <div key={i} className={`flex-1 text-center py-4 border-r border-white/5 last:border-0 ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''}`}>
                <p className="text-[10px] text-slate-500 font-bold uppercase">{format(day, 'EEE')}</p>
                <p className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading Timeline...</div>
          ) : tasks.length === 0 ? (
            <div className="p-20 text-center">
              <Calendar size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-400">No scheduled tasks found. Add start/end dates to tasks to see them here.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <div className="w-64 border-r border-white/10 p-4 shrink-0">
                  <h4 className="text-sm font-medium truncate" title={task.title}>{task.title}</h4>
                  <p className="text-[10px] text-slate-500">{task.status}</p>
                </div>
                <div className="flex-1 relative h-14 flex items-center px-1">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {days.map((_, i) => <div key={i} className="flex-1 border-r border-white/5 last:border-0" />)}
                  </div>
                  
                  {/* Task Bar */}
                  <div 
                    className={`absolute h-8 rounded-lg ${getStatusColor(task.status)} shadow-lg shadow-black/20 flex items-center px-3 transition-all cursor-pointer hover:brightness-110`}
                    style={getTaskStyle(task)}
                  >
                    <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">{task.title}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex gap-6 text-xs text-slate-500 italic">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Idea / To Do</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span>In Review</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default TimelinePage;
