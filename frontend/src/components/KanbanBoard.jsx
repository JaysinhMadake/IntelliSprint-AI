import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreVertical, User, Clock, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import api from '../api';

const columns = [
  { id: 'Idea', title: 'Idea', color: 'bg-slate-500' },
  { id: 'To Do', title: 'To Do', color: 'bg-blue-500' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'In Review', title: 'In Review', color: 'bg-purple-500' },
  { id: 'Completed', title: 'Completed', color: 'bg-emerald-500' }
];

const KanbanBoard = ({ tasks, setTasks, projectId, onRefresh, onEdit, onDelete }) => {
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic Update
    const updatedTasks = Array.from(tasks);
    const taskIndex = updatedTasks.findIndex(t => t.id.toString() === draggableId);
    const [movedTask] = updatedTasks.splice(taskIndex, 1);
    movedTask.status = destination.droppableId;
    updatedTasks.splice(destination.index, 0, movedTask);
    setTasks(updatedTasks);

    // API Update
    try {
      await api.post('/update-status', {
        task_id: draggableId,
        status: destination.droppableId
      });
    } catch (err) {
      console.error(err);
      onRefresh(); // Rollback if error
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 h-full scrollbar-hide">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs">{column.title}</h3>
                <span className="bg-white/5 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {tasks.filter(t => t.status === column.id).length}
                </span>
              </div>
              <button className="text-slate-500 hover:text-white transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 overflow-y-auto rounded-2xl p-2 transition-colors border border-dashed ${
                    snapshot.isDraggingOver ? 'bg-white/5 border-white/10' : 'border-transparent'
                  }`}
                >
                  <div className="space-y-4">
                    {tasks
                      .filter((task) => task.status === column.id)
                      .map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`kanban-card group ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary/50' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                    className="text-slate-500 hover:text-blue-400 transition-colors p-1"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              <h4 className="font-bold text-slate-100 mb-2 group-hover:text-primary transition-colors">{task.title}</h4>
                              <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                    <Clock size={12} />
                                    <span>{task.estimated_time}h</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User size={10} className="text-primary" />
                                  </div>
                                  <span className="text-[10px] font-medium text-slate-300">
                                    {task.assigned_to || 'Unassigned'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
