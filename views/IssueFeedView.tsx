
import React, { useState, useMemo, useRef } from 'react';
import { AlertTriangle, MessageSquare, Send, MoreHorizontal, Clock, ShieldAlert, User, Filter, CheckCircle2, Briefcase, ChevronRight, ArrowRightCircle, AtSign, X, Tag, Sparkles } from 'lucide-react';
import { Issue, IssueSeverity, Department, IssueComment, Employee, Task, TaskStatus } from '../types';

interface IssueFeedViewProps {
  currentUser: Employee | null;
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  trackActivity?: (type: 'message' | 'issue' | 'comment', userId: string) => void;
  addTask?: (task: any) => void;
  employees?: Employee[];
  addNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'mention', dept?: string, targetUserId?: string) => void;
  departments: string[];
}

const IssueFeedView: React.FC<IssueFeedViewProps> = ({ currentUser, issues, setIssues, trackActivity, addTask, employees = [], addNotification, departments }) => {
  const [newIssueText, setNewIssueText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity>(IssueSeverity.NORMAL);
  const [selectedDept, setSelectedDept] = useState<string>(departments[0] || '');
  const [isAddingNewDept, setIsAddingNewDept] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'ALL'>('ALL');
  
  const [mentioningIssueId, setMentioningIssueId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');

  const filteredMentions = useMemo(() => 
    employees.filter(emp => emp.name.toLowerCase().includes(mentionQuery.toLowerCase())), 
  [mentionQuery, employees]);

  const handleCommentInputChange = (issueId: string, value: string) => {
    setCommentInputs({ ...commentInputs, [issueId]: value });
    
    // Improved mention trigger logic for comments
    const match = value.match(/@([^@\s]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentioningIssueId(issueId);
    } else {
      setMentioningIssueId(null);
    }
  };

  const insertMention = (issueId: string, employee: Employee) => {
    const currentText = commentInputs[issueId] || '';
    const lastAtPos = currentText.lastIndexOf('@');
    const newText = currentText.slice(0, lastAtPos) + `@${employee.name} `;
    setCommentInputs({ ...commentInputs, [issueId]: newText });
    setMentioningIssueId(null);
  };

  const handlePostIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueText.trim() || !currentUser || !selectedDept) return;
    const newIssue: Issue = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      department: selectedDept,
      text: newIssueText,
      severity: selectedSeverity,
      timestamp: 'เมื่อครู่นี้',
      comments: []
    };
    setIssues([newIssue, ...issues]);
    setNewIssueText('');
    setSelectedSeverity(IssueSeverity.NORMAL);
    setIsAddingNewDept(false);
    if (trackActivity) trackActivity('issue', currentUser.id);
  };

  const handleAddComment = (issueId: string) => {
    const commentText = commentInputs[issueId];
    if (!commentText?.trim() || !currentUser) return;
    
    const newComment: IssueComment = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: commentText,
      timestamp: 'เมื่อครู่นี้'
    };

    const mentions = commentText.match(/@([\w\u0E00-\u0E7F ]+)/g);
    if (mentions && addNotification) {
      mentions.forEach(match => {
        const name = match.substring(1).trim();
        const mentionedEmp = employees.find(e => e.name === name);
        if (mentionedEmp && mentionedEmp.id !== currentUser.id) {
          addNotification(
            `🔔 กล่าวถึงคุณโดย ${currentUser.name}`,
            `${currentUser.name} ได้แสดงความคิดเห็นในปัญหาของคุณ: "${issues.find(i => i.id === issueId)?.text.substring(0, 40)}..."`,
            'mention',
            mentionedEmp.department,
            mentionedEmp.id
          );
        }
      });
    }

    setIssues(issues.map(iss => iss.id === issueId ? { ...iss, comments: [...iss.comments, newComment] } : iss));
    setCommentInputs({ ...commentInputs, [issueId]: '' });
    if (trackActivity) trackActivity('comment', currentUser.id);
    setMentioningIssueId(null);
  };

  const convertToTask = (issue: Issue) => {
    if (!addTask) return;
    const defaultAssignee = employees.filter(e => e.department === issue.department)[0];
    addTask({
      title: `[แก้ไข] ${issue.text.substring(0, 30)}...`,
      description: `สร้างจากปัญหา: ${issue.text}`,
      status: TaskStatus.TODO,
      department: issue.department,
      assigneeId: defaultAssignee?.id || '',
      assigneeName: defaultAssignee?.name || 'รอมอบหมาย',
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    alert(`สร้างงานให้ฝ่าย ${issue.department} เรียบร้อยแล้ว`);
  };

  const getSeverityStyle = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.URGENT: return 'bg-red-500 text-white';
      case IssueSeverity.MEDIUM: return 'bg-orange-400 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const filteredIssues = filterSeverity === 'ALL' ? issues : issues.filter(iss => iss.severity === filterSeverity);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex space-x-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm"><User size={24} /></div>
            <div className="flex-1">
              <textarea value={newIssueText} onChange={(e) => setNewIssueText(e.target.value)} placeholder="แจ้งปัญหา หรือพิมพ์ระบุงานที่ต้องการสนับสนุน..." className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none h-32 font-medium" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-slate-50">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">ความสำคัญ</label>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                {Object.values(IssueSeverity).map(sev => <button key={sev} onClick={() => setSelectedSeverity(sev)} className={`flex-1 px-3 py-2 text-[10px] font-black rounded-lg transition-all ${selectedSeverity === sev ? getSeverityStyle(sev) : 'text-slate-400 hover:text-slate-600'}`}>{sev}</button>)}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">ส่งถึงฝ่าย</label>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer">
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button onClick={handlePostIssue} disabled={!newIssueText.trim()} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center">
              <Send size={16} className="mr-3" /> ยืนยันการส่งเรื่อง
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <Filter size={18} className="text-slate-400 mx-3 shrink-0" />
        <div className="flex items-center space-x-2 w-full overflow-x-auto">
          <button onClick={() => setFilterSeverity('ALL')} className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterSeverity === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>ทั้งหมด</button>
          {Object.values(IssueSeverity).map(sev => <button key={sev} onClick={() => setFilterSeverity(sev)} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterSeverity === sev ? getSeverityStyle(sev) : 'text-slate-400 hover:bg-slate-50'}`}>{sev}</button>)}
        </div>
      </div>

      <div className="space-y-6">
        {filteredIssues.map((issue) => (
          <div key={issue.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-2 h-full ${getSeverityStyle(issue.severity)}`}></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <img src={issue.senderAvatar} className="w-12 h-12 rounded-2xl border-2 border-slate-50 shadow-sm mr-4 object-cover" alt={issue.senderName} />
                  <div>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">{issue.senderName}</h4>
                    <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                      <span className="text-indigo-600 font-black">แจ้งปัญหา</span> ถึง {issue.department}
                      <span className="mx-2 opacity-30">|</span> <Clock size={10} className="mr-1" />{issue.timestamp}
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center shadow-sm ${getSeverityStyle(issue.severity)}`}><ShieldAlert size={12} className="mr-2" />{issue.severity}</div>
              </div>
              <div className="text-slate-700 text-sm leading-relaxed mb-8 font-medium bg-slate-50/80 p-6 rounded-2xl border border-slate-100/50 italic">"{issue.text}"</div>
              <div className="flex justify-end mb-8 border-b border-slate-50 pb-6">
                <button onClick={() => convertToTask(issue)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all group">
                  <Briefcase size={14} className="group-hover:scale-110" />
                  <span className="text-[10px] font-black uppercase tracking-widest">สร้าง Task งานมอบหมาย</span>
                  <ArrowRightCircle size={14} />
                </button>
              </div>
              <div className="space-y-4">
                {issue.comments.map((comment) => {
                  const isTaggedMe = comment.text.includes(`@${currentUser?.name}`);
                  return (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <img src={comment.senderAvatar} className="w-8 h-8 rounded-full shadow-sm border border-white" alt={comment.senderName} />
                      <div className={`flex-1 p-4 rounded-2xl border transition-all ${isTaggedMe ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/10' : 'bg-slate-50/50 border-slate-100/50'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[11px] font-black text-slate-800 tracking-tight">{comment.senderName} {isTaggedMe && <span className="ml-2 text-[8px] text-indigo-600 animate-pulse font-black uppercase tracking-widest">กล่าวถึงคุณ</span>}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {comment.text.split(/(@[\w\u0E00-\u0E7F ]+)/g).map((part, i) => part.startsWith('@') ? <span key={i} className={`font-black ${part === `@${currentUser?.name}` ? 'bg-indigo-600 text-white px-1.5 py-0.5 rounded' : 'text-indigo-600'}`}>{part}</span> : part)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center space-x-3 mt-6 relative">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200"><User size={14} /></div>
                  <div className="flex-1 relative">
                    {mentioningIssueId === issue.id && filteredMentions.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-4 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden z-[70] animate-in slide-in-from-bottom-2">
                        <div className="p-3 border-b border-slate-50 bg-indigo-600 text-white flex items-center justify-between"><AtSign size={12}/><span className="text-[10px] font-black uppercase tracking-widest">เลือกพนักงานที่ต้องการแท็ก</span><X size={12} className="cursor-pointer" onClick={() => setMentioningIssueId(null)}/></div>
                        <div className="max-h-48 overflow-y-auto custom-scroll">
                          {filteredMentions.map(emp => (
                            <button key={emp.id} onClick={() => insertMention(issue.id, emp)} className="w-full flex items-center px-4 py-3 hover:bg-indigo-50 transition-colors text-left border-b border-slate-50 last:border-none group">
                              <img src={emp.avatar} className="w-8 h-8 rounded-xl mr-3 shadow-sm object-cover" alt={emp.name} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-black text-slate-800 truncate">{emp.name}</div>
                                <div className="text-[8px] text-slate-400 uppercase tracking-tighter">{emp.role}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <input type="text" value={commentInputs[issue.id] || ''} onChange={(e) => handleCommentInputChange(issue.id, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment(issue.id)} placeholder="ตอบกลับ หรือพิมพ์ @ เพื่อแท็ก..." className="w-full bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white transition-all pr-12 font-medium shadow-inner" />
                    <button onClick={() => handleAddComment(issue.id)} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 p-1.5 transition-colors"><Send size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IssueFeedView;
