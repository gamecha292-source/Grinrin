
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LayoutDashboard, ListTodo, AlertTriangle, MessageSquare, Menu, X, User, LogOut, Bell, CheckCircle2, Info, AlertCircle, ChevronRight, Inbox, Clock, AtSign, Briefcase, Users, Search, Cloud, RefreshCw, Download, Upload, Circle, ExternalLink, Sparkles, BellRing, Trash, Eye } from 'lucide-react';
import DashboardView from './views/DashboardView';
import TaskBoardView from './views/TaskBoardView';
import IssueFeedView from './views/IssueFeedView';
import ChatView from './views/ChatView';
import ProfileView from './views/ProfileView';
import LoginView from './views/LoginView';
import { Task, TaskStatus, Department, Employee, AppNotification, ChatMessage, Issue, JobLevel } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [];
const INITIAL_TASKS: Task[] = [];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'ideas' | 'chat' | 'profile'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<AppNotification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const lastProcessedNotifRef = useRef<string | null>(null);

  // Real-time Sync across Tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ho_connect_employees') setEmployees(JSON.parse(e.newValue || '[]'));
      if (e.key === 'ho_connect_tasks') setTasks(JSON.parse(e.newValue || '[]'));
      if (e.key === 'ho_connect_issues') setIssues(JSON.parse(e.newValue || '[]'));
      
      if (e.key === 'ho_connect_notifications') {
        const newNotifs: AppNotification[] = JSON.parse(e.newValue || '[]');
        setNotificationHistory(newNotifs);
        
        // Find NEW notifications targeting ME
        const unreadMentions = newNotifs.filter(n => 
          n.id !== lastProcessedNotifRef.current && 
          n.type === 'mention' && 
          n.targetUserId === currentUser?.id
        );

        if (unreadMentions.length > 0) {
          const latest = unreadMentions[0];
          lastProcessedNotifRef.current = latest.id;
          setToasts(prev => [latest, ...prev].slice(0, 5));
          setTimeout(() => setToasts(prev => prev.filter(n => n.id !== latest.id)), 10000);
        }
      }
      
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 1000);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  const presenceStats = useMemo(() => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    const onlineList = employees.filter(emp => {
      if (!emp.lastActive) return false;
      return (now - new Date(emp.lastActive).getTime()) < fiveMinutes;
    });
    return {
      onlineCount: onlineList.length,
      onlineUsers: onlineList,
      offlineCount: Math.max(0, employees.length - onlineList.length)
    };
  }, [employees]);

  const availableDepartments = useMemo(() => {
    const base = Object.values(Department);
    const fromEmployees = employees.map(e => e.department);
    const fromTasks = tasks.map(t => t.department);
    const fromIssues = issues.map(i => i.department);
    return Array.from(new Set([...base, ...fromEmployees, ...fromTasks, ...fromIssues])).filter(Boolean);
  }, [employees, tasks, issues]);

  useEffect(() => {
    const hasPurged = localStorage.getItem('ho_connect_purged_v1');
    if (!hasPurged) {
      localStorage.clear();
      localStorage.setItem('ho_connect_purged_v1', 'true');
      return;
    }

    const savedEmployees = localStorage.getItem('ho_connect_employees');
    const savedTasks = localStorage.getItem('ho_connect_tasks');
    const savedIssues = localStorage.getItem('ho_connect_issues');
    const savedNotifs = localStorage.getItem('ho_connect_notifications');
    
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedIssues) setIssues(JSON.parse(savedIssues));
    if (savedNotifs) setNotificationHistory(JSON.parse(savedNotifs));

    const savedUser = localStorage.getItem('ho_connect_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('ho_connect_employees', JSON.stringify(employees));
      localStorage.setItem('ho_connect_tasks', JSON.stringify(tasks));
      localStorage.setItem('ho_connect_issues', JSON.stringify(issues));
      localStorage.setItem('ho_connect_notifications', JSON.stringify(notificationHistory));
    }
  }, [employees, tasks, issues, notificationHistory, isLoggedIn]);

  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'mention', dept?: string, targetUserId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: AppNotification = { 
      id, title, message, type, department: dept, targetUserId, timestamp: new Date(), isRead: false
    };
    
    setNotificationHistory(prev => {
      const next = [newNotif, ...prev].slice(0, 100);
      localStorage.setItem('ho_connect_notifications', JSON.stringify(next));
      return next;
    });

    if (!targetUserId || targetUserId === currentUser?.id) {
      setToasts(prev => [newNotif, ...prev].slice(0, 5));
      setTimeout(() => setToasts(prev => prev.filter(n => n.id !== id)), type === 'mention' ? 12000 : 6000);
    }
  }, [currentUser]);

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, status } : task));
    const task = tasks.find(t => t.id === id);
    if (status === TaskStatus.COMPLETED) {
      addNotification('ทำภารกิจสำเร็จ!', `งาน "${task?.title}" ถูกทำเครื่องหมายว่าเสร็จสิ้นแล้ว`, 'success');
    }
  };

  const addTask = (newTaskData: any) => {
    const id = `t-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      ...newTaskData,
      id,
      createdAt: new Date().toISOString(),
      subTasks: newTaskData.suggestedSubTasks?.map((label: string) => ({
        id: Math.random().toString(36).substr(2, 9), label, isDone: false
      })) || [],
      creatorId: currentUser?.id || '',
      creatorName: currentUser?.name || '',
      creatorDepartment: currentUser?.department || ''
    };
    setTasks(prev => [newTask, ...prev]);
    addNotification('มอบหมายงานใหม่', `ส่งงาน "${newTask.title}" ให้คุณ ${newTask.assigneeName} แล้ว`, 'info', newTask.department, newTask.assigneeId);
  };

  const updateSubTask = (taskId: string, subTaskId: string, isDone: boolean) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subTasks: task.subTasks.map(st => st.id === subTaskId ? { ...st, isDone } : st)
        };
      }
      return task;
    }));
  };

  const handleLogin = (user: Employee) => {
    const now = new Date().toISOString();
    const updatedUser = { ...user, lastActive: now };
    setCurrentUser(updatedUser);
    setEmployees(prev => prev.map(e => e.id === user.id ? updatedUser : e));
    setIsLoggedIn(true);
    localStorage.setItem('ho_connect_user', JSON.stringify(updatedUser));
  };

  const handleSignUp = (newUser: Omit<Employee, 'id'>) => {
    const id = `u-${Math.random().toString(36).substr(2, 9)}`;
    const fullUser = { ...newUser, id, lastActive: new Date().toISOString(), stats: { messagesSent: 0, issuesReported: 0, commentsMade: 0 } };
    setEmployees(prev => [...prev, fullUser]);
    handleLogin(fullUser);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    if (currentUser?.id === id) handleLogout();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('ho_connect_user');
  };

  const trackActivity = useCallback((type: 'message' | 'issue' | 'comment', userId: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === userId) {
        const currentStats = emp.stats || { messagesSent: 0, issuesReported: 0, commentsMade: 0 };
        return {
          ...emp,
          stats: {
            ...currentStats,
            messagesSent: type === 'message' ? currentStats.messagesSent + 1 : currentStats.messagesSent,
            issuesReported: type === 'issue' ? currentStats.issuesReported + 1 : currentStats.issuesReported,
            commentsMade: type === 'comment' ? currentStats.commentsMade + 1 : currentStats.commentsMade,
          }
        };
      }
      return emp;
    }));
  }, []);

  const markAllRead = () => {
    setNotificationHistory(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotificationHistory([]);
  };

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} onSignUp={handleSignUp} employees={employees} onDeleteEmployee={handleDeleteEmployee} departments={availableDepartments} />;
  }

  const unreadCount = notificationHistory.filter(n => !n.isRead && (!n.targetUserId || n.targetUserId === currentUser?.id)).length;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-[#0a0a23] text-white transition-all duration-500 ease-in-out flex flex-col z-40 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen ? (
            <h1 className="text-2xl font-black italic tracking-tighter">HO <span className="text-indigo-400">CONNECT</span></h1>
          ) : (
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0a0a23] font-black text-xs">HO</div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'ภาพรวมบริหาร' },
            { id: 'tasks', icon: ListTodo, label: 'ติดตามสถานะงาน' },
            { id: 'chat', icon: MessageSquare, label: 'ห้องแชทประสานงาน' },
            { id: 'ideas', icon: AlertTriangle, label: 'แจ้งปัญหา' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center p-4 rounded-2xl transition-all ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={22} className={isSidebarOpen ? 'mr-4' : 'mx-auto'} />
              {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={() => setActiveTab('profile')} className="w-full flex items-center p-3 rounded-2xl hover:bg-white/5 transition-all mb-4">
            <img src={currentUser?.avatar} className="w-10 h-10 rounded-xl object-cover mr-4 ring-2 ring-indigo-500/20" alt="" />
            {isSidebarOpen && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-black truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{currentUser?.role}</p>
              </div>
            )}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center p-4 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all">
            <LogOut size={20} className={isSidebarOpen ? 'mr-4' : 'mx-auto'} />
            {isSidebarOpen && <span className="font-bold text-sm">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <span>RETAIL HQ</span>
            <ChevronRight size={14} />
            <span className="text-slate-800">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsOnlineModalOpen(true)}
              className="flex items-center space-x-3 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
            >
              <div className="flex -space-x-2">
                {presenceStats.onlineUsers.slice(0, 3).map(u => (
                  <img key={u.id} src={u.avatar} className="w-6 h-6 rounded-lg ring-2 ring-white object-cover" />
                ))}
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                  Online: <span className="text-indigo-600">{presenceStats.onlineCount}</span>
                </span>
              </div>
            </button>

            <div className="flex items-center bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hidden md:flex">
              <RefreshCw size={14} className={`text-indigo-600 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">NETWORK SYNC</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotifPanelOpen(!isNotifPanelOpen)} 
                className={`p-2.5 rounded-xl transition-all relative ${unreadCount > 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}
              >
                {unreadCount > 0 ? <BellRing size={20} className="animate-pulse" /> : <Bell size={20} />}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {isNotifPanelOpen && (
                <div className="fixed md:absolute right-4 md:right-0 top-24 md:top-full mt-4 w-full md:w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-[2rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.2)] border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                  <div className="p-6 bg-[#0a0a23] text-white flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Inbox size={20} className="text-indigo-400" />
                      <h3 className="font-black text-sm uppercase tracking-widest">ศูนย์แจ้งเตือน</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={markAllRead} className="p-2 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center">
                        <Eye size={14} className="mr-2" /> อ่านทั้งหมด
                      </button>
                      <button onClick={clearNotifications} className="p-2 hover:bg-red-500/20 rounded-xl text-red-400 transition-colors">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto p-4 space-y-2 custom-scroll bg-slate-50/30">
                    {notificationHistory.filter(n => !n.targetUserId || n.targetUserId === currentUser?.id).length > 0 ? (
                      notificationHistory.filter(n => !n.targetUserId || n.targetUserId === currentUser?.id).map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-5 rounded-3xl border transition-all relative group ${notif.isRead ? 'bg-white border-slate-100' : 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50'}`}
                          onClick={() => {
                             setNotificationHistory(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                             if (notif.type === 'mention') setActiveTab('chat');
                          }}
                        >
                          {!notif.isRead && <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div>}
                          <div className="flex items-start space-x-4">
                            <div className={`p-2.5 rounded-2xl shrink-0 ${
                              notif.type === 'mention' ? 'bg-indigo-600 text-white' : 
                              notif.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                              notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {notif.type === 'mention' ? <AtSign size={18} /> : 
                               notif.type === 'warning' ? <AlertTriangle size={18} /> : 
                               notif.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs font-black mb-1 truncate ${notif.type === 'mention' ? 'text-indigo-600' : 'text-slate-800'}`}>
                                {notif.type === 'mention' && '✨ '} {notif.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">{notif.message}</p>
                              <div className="flex items-center text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                <Clock size={10} className="mr-1.5" /> {new Date(notif.timestamp).toLocaleTimeString()} 
                                {notif.department && <span className="ml-3 px-2 py-0.5 bg-slate-100 rounded text-slate-400"># {notif.department}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center opacity-20">
                        <Bell size={48} className="mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">ไม่มีการแจ้งเตือนใหม่</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white border-t border-slate-50 text-center">
                     <button onClick={() => setIsNotifPanelOpen(false)} className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:underline">ปิดศูนย์แจ้งเตือน</button>
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-100 hover:border-indigo-400 transition-all shadow-sm">
              <img src={currentUser?.avatar} className="w-full h-full object-cover" alt="" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scroll">
          {activeTab === 'dashboard' && <DashboardView tasks={tasks} currentUser={currentUser} employees={employees} departments={availableDepartments} />}
          {activeTab === 'tasks' && <TaskBoardView tasks={tasks} updateTaskStatus={updateTaskStatus} addTask={addTask} updateSubTask={updateSubTask} employees={employees} currentUser={currentUser} departments={availableDepartments} />}
          {activeTab === 'ideas' && <IssueFeedView currentUser={currentUser} issues={issues} setIssues={setIssues} trackActivity={trackActivity} addTask={addTask} employees={employees} addNotification={addNotification} departments={availableDepartments} />}
          {activeTab === 'chat' && <ChatView currentUser={currentUser} addNotification={addNotification} employees={employees} departments={availableDepartments} trackActivity={trackActivity} />}
          {activeTab === 'profile' && <ProfileView user={currentUser!} tasks={tasks} onDeleteProfile={handleDeleteEmployee} />}
        </div>

        {/* Global Online Users Modal */}
        {isOnlineModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">พนักงานที่ออนไลน์ขณะนี้</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live Profile Presence</p>
                  </div>
                  <button onClick={() => setIsOnlineModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"><X size={20} /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3 custom-scroll">
                  {presenceStats.onlineUsers.map(u => (
                    <div key={u.id} className="flex items-center p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all">
                      <div className="relative shrink-0">
                        <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="text-sm font-black text-slate-800">{u.name} {u.id === currentUser?.id && '(คุณ)'}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.department} | {u.role}</p>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Active</div>
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-indigo-50 border-t border-indigo-100 text-center">
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em]">ข้อมูลอัปเดตแบบเรียลไทม์ผ่าน Cloud Network</p>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* High-Impact Notification Toasts */}
      <div className="fixed bottom-10 right-10 z-[100] space-y-4">
        {toasts.map((toast) => {
          const isMention = toast.type === 'mention';
          return (
            <div key={toast.id} className={`bg-white p-6 rounded-[2.5rem] shadow-[0_35px_80px_-15px_rgba(0,0,0,0.25)] border-2 flex items-center space-x-5 animate-in slide-in-from-right-8 duration-700 w-[420px] max-w-[90vw] relative overflow-hidden group ${isMention ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-100'}`}>
              <div className={`absolute left-0 top-0 bottom-0 w-2.5 ${
                toast.type === 'warning' ? 'bg-orange-500' : 
                toast.type === 'mention' ? 'bg-gradient-to-b from-indigo-600 to-purple-600 animate-pulse' : 'bg-emerald-500'
              }`}></div>
              
              {isMention && (
                <div className="absolute top-0 right-0 p-4 opacity-10 text-indigo-600 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                   <Sparkles size={60} />
                </div>
              )}
              
              <div className={`p-4 rounded-3xl shrink-0 ${
                toast.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                toast.type === 'mention' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {toast.type === 'warning' ? <AlertTriangle size={28} /> : 
                 toast.type === 'mention' ? <AtSign size={28} className="animate-bounce" /> : <CheckCircle2 size={28} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-1">
                  {isMention && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full mr-2">Mentioned You</span>}
                  <p className={`text-sm font-black leading-tight truncate ${isMention ? 'text-indigo-800' : 'text-slate-800'}`}>{toast.title}</p>
                </div>
                <p className="text-[11px] text-slate-500 font-bold mt-1 line-clamp-2 leading-relaxed">{toast.message}</p>
              </div>
              
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
