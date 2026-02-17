
import React from 'react';
import { Task, TaskStatus, Department, Employee, JobLevel } from '../types';
import { 
  CheckCircle2, 
  Settings, 
  AlertTriangle, 
  Clock, 
  Plus,
  Check,
  X as CloseIcon,
  Circle,
  LayoutGrid,
  Users,
  Zap
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  currentUser: Employee | null;
  employees?: Employee[];
  departments: string[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ tasks, currentUser, employees = [], departments }) => {
  const isExecutive = currentUser?.level === JobLevel.EXECUTIVE;
  const myDept = currentUser?.department;

  const otherDepts = departments.filter(d => d !== myDept);
  
  const getDeptHealth = (deptTasks: Task[]) => {
    if (deptTasks.length === 0) return { 
      label: 'ยังไม่มีงาน', color: 'bg-slate-300', icon: Clock, status: 'none' 
    };
    const completed = deptTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const progress = (completed / deptTasks.length) * 100;
    if (progress === 100) return { label: 'เสร็จสิ้น', color: 'bg-emerald-500', icon: CheckCircle2 };
    if (progress > 0) return { label: 'กำลังทำ', color: 'bg-orange-400', icon: Settings };
    return { label: 'รอดำเนินการ', color: 'bg-slate-400', icon: Clock };
  };

  const renderDeptCard = (dept: string, isCompact = false) => {
    const deptTasks = tasks.filter(t => t.department === dept);
    const health = getDeptHealth(deptTasks);
    const completedCount = deptTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const progress = deptTasks.length > 0 ? Math.round((completedCount / deptTasks.length) * 100) : 0;
    const HealthIcon = health.icon;

    if (isCompact) {
      return (
        <div key={dept} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{dept}</h4>
            <div className={`${health.color} text-white p-1 rounded-md`}><HealthIcon size={12} /></div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
             <div className={`${health.color} h-full transition-all duration-1000`} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[8px] font-bold text-slate-400">
            <span>{health.label}</span>
            <span>{progress}%</span>
          </div>
        </div>
      );
    }

    return (
      <div key={dept} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[400px]">
        <div className={`${health.color} p-4 text-white flex items-center space-x-3`}>
          <div className="bg-white/20 p-2 rounded-full"><HealthIcon size={20} strokeWidth={2.5} /></div>
          <div><h3 className="font-bold text-lg leading-tight">{dept}</h3><p className="text-[10px] opacity-90 font-medium">{health.label}</p></div>
        </div>
        <div className="px-4 py-6">
          <div className="flex justify-between items-end mb-2">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mr-3">
              <div className={`${health.color} h-full transition-all duration-1000 ease-out rounded-full`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-black text-slate-400 leading-none">{progress}%</span>
          </div>
        </div>
        <div className="flex-1 px-4 pb-6 overflow-y-auto custom-scroll space-y-2">
          {deptTasks.length > 0 ? (
            deptTasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3 group">
                <div className="flex-shrink-0">
                  {task.status === TaskStatus.COMPLETED ? (
                    <div className="bg-emerald-500 text-white p-0.5 rounded-full"><Check size={12} strokeWidth={4} /></div>
                  ) : task.status === TaskStatus.IN_PROGRESS ? (
                    <div className="border-2 border-orange-400 w-4 h-4 rounded-full"></div>
                  ) : (
                    <div className="border-2 border-slate-300 w-4 h-4 rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm font-bold text-slate-600 truncate ${task.status === TaskStatus.COMPLETED ? 'text-slate-400' : ''}`}>{task.title}</span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 opacity-20">
              <Circle size={40} className="mb-2" /><p className="text-xs font-bold text-center">ยังไม่มีงานในฝ่ายนี้</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">ภาพรวมบริหารงานรายแผนก</h1>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center">
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
          {isExecutive ? 'View: All Departments' : `MAIN VIEW: ${myDept}`}
        </div>
      </div>

      {!isExecutive && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6 px-1">
          <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center">
            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mr-2"></span>
            FOCUS: ฝ่ายงานของคุณ ({myDept})
          </h3>
          <span className="text-xs font-bold text-indigo-400/70 italic tracking-tight">
            ระบบข้อความแจ้งเตือนงานหรือแชทหรือโดน@
          </span>
        </div>
      )}

      {isExecutive ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {departments.map(dept => renderDeptCard(dept))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            {myDept && renderDeptCard(myDept)}
          </div>
          <div className="lg:col-span-2">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center"><span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></span>SUMMARY: สถานะฝ่ายอื่นๆ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {otherDepts.map(dept => renderDeptCard(dept, true))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[220px]">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600"><Users size={120} /></div>
           <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center"><div className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></div>สรุปสถานะการดำเนินงานรวม</h3>
           <div className="flex items-end justify-between space-x-4">
              <div className="flex-1 text-center"><div className="text-5xl font-black text-emerald-500">{tasks.filter(t => (isExecutive || t.department === myDept) && t.status === TaskStatus.COMPLETED).length}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">สำเร็จ</div></div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="flex-1 text-center"><div className="text-5xl font-black text-orange-400">{tasks.filter(t => (isExecutive || t.department === myDept) && t.status === TaskStatus.IN_PROGRESS).length}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">กำลังทำ</div></div>
              <div className="w-px h-12 bg-slate-100"></div>
              <div className="flex-1 text-center"><div className="text-5xl font-black text-slate-400">{tasks.filter(t => (isExecutive || t.department === myDept) && t.status === TaskStatus.TODO).length}</div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">รอดำเนินการ</div></div>
           </div>
        </div>
        <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-center relative overflow-hidden min-h-[220px]">
           <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} className="fill-white" /></div>
           <h3 className="text-lg font-bold opacity-80 mb-4 flex items-center">
             <CheckCircle2 size={18} className="mr-2" />
             ดัชนีประสิทธิภาพ {isExecutive ? 'รวม (KPI)' : 'รายฝ่าย'}
           </h3>
           <div className="flex items-center space-x-6">
              {(() => {
                const relevantTasks = isExecutive ? tasks : tasks.filter(t => t.department === myDept);
                const kpi = relevantTasks.length > 0 ? Math.round((relevantTasks.filter(t => t.status === TaskStatus.COMPLETED).length / relevantTasks.length) * 100) : 0;
                return (
                  <>
                    <div className="text-7xl font-black tracking-tighter">{kpi}%</div>
                    <div className="flex-1">
                       <div className="w-full bg-white/20 h-4 rounded-full overflow-hidden shadow-inner"><div className="bg-white h-full transition-all duration-1000" style={{ width: `${kpi}%` }} /></div>
                       <p className="text-xs mt-4 opacity-60 font-medium italic">คำนวณจากงานในส่วนที่เกี่ยวข้อง {relevantTasks.length} รายการ</p>
                    </div>
                  </>
                );
              })()}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
