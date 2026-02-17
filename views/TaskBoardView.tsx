
import React, { useState } from 'react';
import { Task, TaskStatus, Employee } from '../types';
import { 
  Plus, 
  Search, 
  Clock, 
  MoreVertical, 
  Filter, 
  ArrowRight,
  X,
  User,
  Tag,
  Calendar
} from 'lucide-react';

interface TaskBoardViewProps {
  tasks: Task[];
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  addTask: (task: any) => void;
  updateSubTask: (taskId: string, subTaskId: string, isDone: boolean) => void;
  employees: Employee[];
  currentUser: Employee | null;
  departments: string[];
}

const TaskBoardView: React.FC<TaskBoardViewProps> = ({ 
  tasks, 
  updateTaskStatus, 
  addTask, 
  employees, 
  departments 
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Manual Task State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: departments[0] || '',
    assigneeId: '',
    deadline: new Date().toISOString().split('T')[0],
    orderTime: getCurrentTime()
  });

  const handleManualTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.department) return;
    
    const assignee = employees.find(emp => emp.id === formData.assigneeId);
    addTask({
      ...formData,
      assigneeName: assignee?.name || 'รอมอบหมาย',
      status: TaskStatus.TODO
    });
    
    setIsAddingTask(false);
    setFormData({
      title: '',
      description: '',
      department: departments[0] || '',
      assigneeId: '',
      deadline: new Date().toISOString().split('T')[0],
      orderTime: getCurrentTime()
    });
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.assigneeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderColumn = (status: TaskStatus, label: string, color: string) => {
    const columnTasks = filteredTasks.filter(t => t.status === status);
    return (
      <div className="flex-1 min-w-[320px] bg-slate-50/50 rounded-[2.5rem] p-6 flex flex-col h-full border border-slate-100/50">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${color} shadow-sm shadow-current`}></div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">{label}</h3>
            <span className="bg-white px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-400 border border-slate-100 shadow-sm">{columnTasks.length}</span>
          </div>
          <button className="text-slate-300 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white"><MoreVertical size={16}/></button>
        </div>

        <div className="space-y-4 overflow-y-auto custom-scroll flex-1 pr-1">
          {columnTasks.map(task => (
            <div key={task.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-200 transition-all group animate-in fade-in zoom-in-95">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">{task.department}</span>
                <div className="text-[9px] font-bold text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-lg">
                   <Clock size={10} className="mr-1.5" /> {task.deadline} {task.orderTime && `| ${task.orderTime}`}
                </div>
              </div>
              <h4 className="text-sm font-black text-slate-800 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">{task.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 mb-5 font-medium leading-relaxed">{task.description}</p>
              
              <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                <div className="flex items-center">
                  <div className="relative">
                    <img src={task.assigneeId ? `https://picsum.photos/seed/${task.assigneeId}/50/50` : 'https://picsum.photos/seed/placeholder/50/50'} className="w-8 h-8 rounded-xl mr-3 border border-white shadow-sm ring-1 ring-slate-100 object-cover" alt={task.assigneeName} />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 tracking-tight">{task.assigneeName}</span>
                </div>
                <div className="flex space-x-1.5">
                  {status !== TaskStatus.TODO && (
                    <button onClick={() => updateTaskStatus(task.id, TaskStatus.TODO)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"><ArrowRight size={14} className="rotate-180" /></button>
                  )}
                  {status !== TaskStatus.COMPLETED && (
                    <button 
                      onClick={() => updateTaskStatus(task.id, status === TaskStatus.TODO ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED)} 
                      className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {columnTasks.length === 0 && (
            <div className="py-16 text-center text-slate-300">
               <div className="w-16 h-16 bg-white rounded-[2rem] mx-auto flex items-center justify-center mb-4 shadow-sm border border-slate-50 opacity-40"><Filter size={24} /></div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ไม่พบรายการงาน</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">ติดตามสถานะงาน</h1>
          <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest opacity-80">Coordination Kanban Engine</p>
        </div>
        
        <div className="flex items-center space-x-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="ค้นหางาน หรือ พนักงาน..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 outline-none w-72 shadow-sm transition-all placeholder:text-slate-300"
              />
           </div>
           <button 
            onClick={() => setIsAddingTask(!isAddingTask)} 
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center shrink-0"
           >
             <Plus size={18} className="mr-3" /> เพิ่มรายการงาน
           </button>
        </div>
      </div>

      {isAddingTask && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in slide-in-from-top-6 duration-500 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">มอบหมายงานใหม่</h3>
            <button onClick={() => setIsAddingTask(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={20}/></button>
          </div>
          
          <form onSubmit={handleManualTaskSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">หัวข้องาน</label>
                <input 
                  type="text" 
                  required
                  placeholder="เช่น ตรวจเช็คสต็อกสินค้ารายวัน..."
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">รายละเอียด</label>
                <textarea 
                  placeholder="ระบุรายละเอียดงานเพิ่มเติม..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center"><Tag size={12} className="mr-2"/> ฝ่ายที่รับผิดชอบ</label>
                <select 
                  required
                  value={formData.department}
                  onChange={e => setFormData({...formData, department: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center"><User size={12} className="mr-2"/> ผู้รับผิดชอบ</label>
                <select 
                  value={formData.assigneeId}
                  onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- รอมอบหมาย --</option>
                  {employees.filter(emp => !formData.department || emp.department === formData.department).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center"><Calendar size={12} className="mr-2"/> กำหนดส่ง</label>
                <input 
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center"><Clock size={12} className="mr-2"/> เพิ่มเวลาที่สั่งงาน</label>
                <input 
                  type="time"
                  value={formData.orderTime}
                  onChange={e => setFormData({...formData, orderTime: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                บันทึกรายการงาน
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 flex space-x-8 overflow-x-auto pb-10 px-1 custom-scroll">
        {renderColumn(TaskStatus.TODO, 'รอดำเนินการ', 'bg-slate-300')}
        {renderColumn(TaskStatus.IN_PROGRESS, 'กำลังดำเนินงาน', 'bg-orange-400')}
        {renderColumn(TaskStatus.COMPLETED, 'เสร็จสิ้น', 'bg-emerald-500')}
      </div>
    </div>
  );
};

export default TaskBoardView;
