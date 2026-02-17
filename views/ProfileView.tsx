
import React from 'react';
import { Employee, Task, TaskStatus, JobLevel } from '../types';
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Award, 
  CheckCircle2, 
  Clock, 
  Settings,
  ShieldCheck,
  Calendar,
  Activity,
  Briefcase,
  Trophy,
  Download,
  Upload,
  Database,
  Cloud,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ProfileViewProps {
  user: Employee;
  tasks: Task[];
  onDeleteProfile?: (id: string) => void;
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, tasks, onDeleteProfile, onExport, onImport }) => {
  const userTasks = tasks.filter(t => t.assigneeId === user.id);
  const completedTasks = userTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = userTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const pendingTasks = userTasks.filter(t => t.status === TaskStatus.TODO).length;

  const chartData = [
    { name: 'สำเร็จแล้ว', value: completedTasks, color: '#10b981' },
    { name: 'กำลังทำ', value: inProgressTasks, color: '#f97316' },
    { name: 'รอดำเนินการ', value: pendingTasks, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const handleDelete = () => {
    if (confirm('ยืนยันการลบโปรไฟล์ตนเอง? ข้อมูลโปรไฟล์ของคุณจะถูกลบออกจากระบบถาวรและคุณจะถูกออกจากระบบทันที')) {
      onDeleteProfile?.(user.id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Profile Card */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><User size={300} /></div>
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-indigo-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img src={user.avatar} className="w-48 h-48 rounded-[2.5rem] border-8 border-white shadow-2xl object-cover relative z-10" alt={user.name} />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-3 rounded-2xl shadow-lg border-4 border-white z-20"><ShieldCheck size={24} /></div>
          </div>
          <div className="text-center lg:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-3">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">{user.name}</h2>
              {user.level !== JobLevel.EXECUTIVE && (
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">{user.department}</span>
              )}
            </div>
            <p className="text-2xl text-slate-400 font-bold mb-8 flex items-center justify-center lg:justify-start">
              <Briefcase size={20} className="mr-3 text-indigo-300" />{user.role} <span className="mx-2 text-slate-200">|</span> <span className="text-indigo-400">{user.level}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex items-center text-slate-600 font-bold group"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-indigo-50 transition-colors"><Mail size={18} className="text-indigo-400" /></div>{user.id}@hoconnect.io</div>
              <div className="flex items-center text-slate-600 font-bold group"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-indigo-50 transition-colors"><Phone size={18} className="text-indigo-400" /></div>089-XXX-XXXX</div>
              <div className="flex items-center text-slate-600 font-bold group"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-indigo-50 transition-colors"><MapPin size={18} className="text-indigo-400" /></div>HQ Office, Bangkok</div>
              <div className="flex items-center text-slate-600 font-bold group"><div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mr-4 group-hover:bg-indigo-50 transition-colors"><Calendar size={18} className="text-indigo-400" /></div>Active: {user.lastActive ? new Date(user.lastActive).toLocaleTimeString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center uppercase tracking-tight"><Activity size={22} className="mr-3 text-indigo-600" />Work Distribution</h3>
            <div className="h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-sm">ไม่มีข้อมูลภาระงานในขณะนี้</div>}
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center uppercase tracking-tight"><Database size={22} className="mr-3 text-indigo-600" />Data Management & Backup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center"><Download size={16} className="mr-2 text-indigo-500" /> Export System State</h4>
                <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-widest">สำรองข้อมูลทั้งหมดในองค์กรเป็นไฟล์ JSON</p>
                <button 
                  onClick={onExport}
                  className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-indigo-50"
                >ดาวน์โหลดข้อมูล</button>
              </div>
              <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <h4 className="text-sm font-black text-slate-800 mb-2 flex items-center"><Upload size={16} className="mr-2 text-indigo-500" /> Import Data</h4>
                <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-widest">กู้คืนระบบจากไฟล์สำรองข้อมูลก่อนหน้า</p>
                <label className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-indigo-50 cursor-pointer flex items-center justify-center">
                  เลือกไฟล์กู้คืน
                  <input type="file" className="hidden" accept=".json" onChange={onImport} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col h-full">
          <div className="relative group flex-1">
            <div className="absolute inset-0 bg-indigo-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] relative overflow-hidden border border-white/10 h-full">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Trophy size={80} /></div>
              <h3 className="text-lg font-black mb-4 flex items-center"><Cloud size={18} className="mr-2 text-indigo-300" /> Cloud Ready</h3>
              <p className="text-xs text-indigo-100/80 leading-relaxed font-medium mb-6">
                ระบบตั้งค่าให้รองรับการทำงานแบบ Multi-session โปรไฟล์ของคุณจะได้รับสถานะออนไลน์เมื่อมีการเข้าใช้งาน พร้อมการซิงค์ข้อมูลผ่าน Cloud Session Secure
              </p>
              <div className="mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  <ShieldCheck size={12} />
                  <span>Verified Infrastructure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone Section */}
          <div className="bg-red-50/50 rounded-[2.5rem] p-8 border border-red-100">
            <h3 className="text-lg font-black text-red-600 mb-4 flex items-center uppercase tracking-tight"><AlertTriangle size={18} className="mr-2" /> Danger Zone</h3>
            <p className="text-[10px] text-red-400 font-bold mb-6 uppercase tracking-widest leading-relaxed">การลบโปรไฟล์จะลบข้อมูลบัญชีของคุณออกจากการเข้าสู่ระบบโดยถาวร</p>
            <button 
              onClick={handleDelete}
              className="w-full flex items-center justify-center space-x-3 bg-white text-red-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-600 transition-all shadow-sm"
            >
              <Trash2 size={16} />
              <span>ลบโปรไฟล์ถาวร</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
