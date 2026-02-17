
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Department, JobLevel } from '../types';
import { LogIn, ShieldCheck, UserCircle, ArrowRight, Check, UserPlus, Briefcase, Tag, Sparkles, Award, Trash2, Plus, ArrowLeft, X, Rocket, Activity } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: Employee) => void;
  onSignUp: (user: Omit<Employee, 'id'>) => void;
  onDeleteEmployee?: (id: string) => void;
  employees: Employee[];
  departments: string[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSignUp, onDeleteEmployee, employees, departments }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(employees.length > 0 ? 'login' : 'signup');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingCustomDept, setIsAddingCustomDept] = useState(false);

  useEffect(() => {
    if (employees.length === 0) setMode('signup');
  }, [employees.length]);

  const [signupData, setSignupData] = useState({
    name: '', role: '', level: JobLevel.STAFF, department: departments[0] || Department.HR,
  });

  const isUserOnline = (emp: Employee) => {
    if (!emp.lastActive) return false;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - new Date(emp.lastActive).getTime()) < fiveMinutes;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = employees.find(emp => emp.id === selectedUser);
    if (user) {
      setIsSubmitting(true);
      setTimeout(() => onLogin(user), 800);
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.name && signupData.role && signupData.department) {
      setIsSubmitting(true);
      const randomSeed = Math.floor(Math.random() * 1000);
      setTimeout(() => {
        onSignUp({ ...signupData, avatar: `https://picsum.photos/seed/${randomSeed}/200/200` });
      }, 1000);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์นี้?')) {
      onDeleteEmployee?.(id);
      if (selectedUser === id) setSelectedUser('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a23] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl mb-8 transform hover:rotate-6 transition-transform">
            <h1 className="text-4xl font-black text-[#0a0a23] tracking-tighter italic">HO</h1>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tight mb-4 drop-shadow-sm">HO Connect</h2>
          <p className="text-indigo-300/80 font-bold text-lg uppercase tracking-[0.2em] italic">Multi-Session Network Ready</p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-white/10">
          {employees.length > 0 && (
            <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] mb-10">
              <button onClick={() => setMode('login')} className={`flex-1 flex items-center justify-center py-3 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                <LogIn size={14} className="mr-2" /> เข้าสู่ระบบ
              </button>
              <button onClick={() => setMode('signup')} className={`flex-1 flex items-center justify-center py-3 rounded-[1rem] text-xs font-black uppercase tracking-widest transition-all ${mode === 'signup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                <UserPlus size={14} className="mr-2" /> สมัครสมาชิก
              </button>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-8 animate-in fade-in duration-500">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center justify-center">
                  <Activity size={14} className="mr-3" /> Select Authorized Profile
                </label>
                <div className="grid grid-cols-1 gap-4 max-h-[320px] overflow-y-auto pr-2 custom-scroll">
                  {employees.map((emp) => {
                    const online = isUserOnline(emp);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => setSelectedUser(emp.id)}
                        className={`w-full flex items-center p-4 rounded-[1.5rem] border-2 transition-all relative cursor-pointer group ${
                          selectedUser === emp.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img src={emp.avatar} className="w-12 h-12 rounded-2xl mr-4 border border-slate-100 object-cover" />
                          {online && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm font-black truncate text-slate-800">{emp.name}</p>
                            {online && <span className="ml-2 text-[7px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Live</span>}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{emp.role}</p>
                        </div>
                        <button onClick={(e) => handleDelete(e, emp.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button disabled={!selectedUser || isSubmitting} type="submit" className="w-full bg-[#0a0a23] text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-950 transition-all disabled:opacity-30 flex items-center justify-center">
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <>เข้าสู่ระบบ <ArrowRight size={20} className="ml-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-6">
              <div className="space-y-4">
                <input type="text" required placeholder="ชื่อ-นามสกุล" value={signupData.name} onChange={e => setSignupData({...signupData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10" />
                <input type="text" required placeholder="ชื่อตำแหน่ง" value={signupData.role} onChange={e => setSignupData({...signupData, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10" />
                
                <select 
                  value={signupData.level} 
                  onChange={e => {
                    const newLevel = e.target.value as JobLevel;
                    setSignupData({
                      ...signupData, 
                      level: newLevel,
                      // หากเป็นผู้บริหาร ให้ตั้งฝ่ายงานเป็น "ส่วนกลาง" อัตโนมัติ
                      department: newLevel === JobLevel.EXECUTIVE ? 'ส่วนกลาง' : (signupData.department === 'ส่วนกลาง' ? departments[0] : signupData.department)
                    });
                  }} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-black uppercase outline-none cursor-pointer"
                >
                  {Object.values(JobLevel).map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                {/* แสดงช่องเลือกฝ่ายงานเฉพาะเมื่อไม่ใช่ระดับผู้บริหาร */}
                {signupData.level !== JobLevel.EXECUTIVE && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <select 
                      value={signupData.department} 
                      onChange={e => setSignupData({...signupData, department: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-xs font-black uppercase outline-none cursor-pointer"
                    >
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-[#0a0a23] text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-indigo-950 transition-all disabled:opacity-30">สมัครสมาชิก</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
