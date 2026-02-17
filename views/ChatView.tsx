
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Hash, Users, MessageCircle, MoreVertical, Search, Paperclip, Plus, ChevronDown, ChevronRight, AtSign, X, Circle, Info, PanelRightClose, PanelRightOpen, Sparkles, Filter, List, Check, User, UserCircle } from 'lucide-react';
import { ChatMessage, Department, Employee } from '../types';

interface ChatViewProps {
  currentUser: Employee | null;
  addNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'mention', dept?: string, targetUserId?: string) => void;
  employees: Employee[];
  trackActivity?: (type: 'message' | 'issue' | 'comment', userId: string) => void;
  departments: string[];
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, addNotification, employees, trackActivity, departments }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('GLOBAL');
  const [inputText, setInputText] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showMembers, setShowMembers] = useState(true);
  const [filterMentions, setFilterMentions] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  
  const [departmentRooms, setDepartmentRooms] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('ho_connect_chat_rooms');
    if (saved) return JSON.parse(saved);
    const initial: Record<string, string[]> = {};
    departments.forEach(dept => {
      initial[dept] = ['ทั่วไป'];
    });
    return initial;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ho_connect_chat_rooms', JSON.stringify(departmentRooms));
  }, [departmentRooms]);

  // Handle clicking outside of options menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, activeRoom, typingUsers, filterMentions]);

  const isOnline = (emp: Employee) => {
    if (!emp.lastActive) return false;
    const lastActive = new Date(emp.lastActive).getTime();
    const now = Date.now();
    return (now - lastActive) < 5 * 60 * 1000;
  };

  const filteredEmployees = useMemo(() => 
    employees.filter(emp => emp.name.toLowerCase().includes(mentionQuery.toLowerCase())), 
    [mentionQuery, employees]
  );

  const roomMembers = useMemo(() => {
    if (activeRoom === 'GLOBAL') return employees;
    if (activeRoom.startsWith('DM:')) {
      const ids = activeRoom.replace('DM:', '').split('--');
      return employees.filter(e => ids.includes(e.id));
    }
    const dept = activeRoom.split('/')[0];
    return employees.filter(e => e.department === dept);
  }, [activeRoom, employees]);

  const sortedMembers = useMemo(() => {
    return [...roomMembers].sort((a, b) => {
      const aOnline = isOnline(a);
      const bOnline = isOnline(b);
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [roomMembers]);

  // Private Messaging Helper
  const getPrivateChatPartner = () => {
    if (!activeRoom.startsWith('DM:') || !currentUser) return null;
    const ids = activeRoom.replace('DM:', '').split('--');
    const partnerId = ids.find(id => id !== currentUser.id);
    return employees.find(e => e.id === partnerId) || null;
  };

  const startPrivateChat = (targetUser: Employee) => {
    if (!currentUser) return;
    const sortedIds = [currentUser.id, targetUser.id].sort();
    const dmRoomId = `DM:${sortedIds[0]}--${sortedIds[1]}`;
    setActiveRoom(dmRoomId);
    setFilterMentions(false);
  };

  const activePrivateChats = useMemo(() => {
    const dmRooms = Array.from(new Set(messages.filter(m => m.room.startsWith('DM:')).map(m => m.room)));
    // FIX: Typed room as string explicitly to avoid property 'replace' does not exist on type 'unknown' error
    return dmRooms.map((room: string) => {
      const ids = room.replace('DM:', '').split('--');
      const partnerId = ids.find(id => id !== currentUser?.id);
      return employees.find(e => e.id === partnerId);
    }).filter(Boolean) as Employee[];
  }, [messages, currentUser, employees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    const match = textBeforeCursor.match(/@([^@\s]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (employee: Employee) => {
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const textBefore = inputText.slice(0, cursorPosition);
    const textAfter = inputText.slice(cursorPosition);
    
    const lastAtPos = textBefore.lastIndexOf('@');
    const newText = textBefore.slice(0, lastAtPos) + `@${employee.name} ` + textAfter;
    
    setInputText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      room: activeRoom
    };

    // Notification Logic
    if (activeRoom.startsWith('DM:')) {
      const partner = getPrivateChatPartner();
      if (partner && addNotification) {
        addNotification(
          `📩 ข้อความใหม่จาก ${currentUser.name}`,
          `ข้อความส่วนตัว: "${inputText.substring(0, 50)}..."`,
          'info',
          currentUser.department,
          partner.id
        );
      }
    } else {
      const mentions = inputText.match(/@([\w\u0E00-\u0E7F ]+)/g);
      if (mentions && addNotification) {
        mentions.forEach(mention => {
          const name = mention.substring(1).trim();
          const mentionedUser = employees.find(emp => emp.name === name);
          if (mentionedUser && mentionedUser.id !== currentUser.id) {
            addNotification(
              `🔔 กล่าวถึงคุณโดย ${currentUser.name}`,
              `ในห้อง ${activeRoom === 'GLOBAL' ? 'รวมทุกฝ่าย' : activeRoom.split('/').pop()}: "${inputText.substring(0, 50)}..."`,
              'mention',
              mentionedUser.department,
              mentionedUser.id
            );
          }
        });
      }
    }

    setMessages([...messages, newMessage]);
    setInputText('');
    setShowMentions(false);
    
    if (trackActivity) trackActivity('message', currentUser.id);

    // Mock response for interactivity in group rooms
    if (!activeRoom.startsWith('DM:') && employees.length > 1) {
      const responder = employees.find(e => e.id !== currentUser.id && isOnline(e)) || employees.find(e => e.id !== currentUser.id);
      if (responder) {
        setTimeout(() => setTypingUsers(prev => new Set(prev).add(responder.id)), 1200);
        setTimeout(() => {
          setTypingUsers(prev => { const n = new Set(prev); n.delete(responder.id); return n; });
          const isMentioningMe = Math.random() > 0.4;
          const txt = isMentioningMe ? `@${currentUser.name} รับทราบครับ กำลังเร่งประสานงานต่อให้ทันทีครับ` : `รับเรื่องไว้แล้วครับ ฝ่าย ${responder.department} กำลังดำเนินการครับ`;
          const autoMsg: ChatMessage = { id: Math.random().toString(36).substr(2, 9), senderId: responder.id, senderName: responder.name, text: txt, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), room: activeRoom };
          setMessages(prev => [...prev, autoMsg]);
        }, 4000);
      }
    }
  };

  const toggleDept = (dept: string) => setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  
  const currentMessages = useMemo(() => {
    const roomMsgs = messages.filter(m => m.room === activeRoom);
    if (!filterMentions) return roomMsgs;
    return roomMsgs.filter(m => m.text.includes(`@${currentUser?.name}`));
  }, [messages, activeRoom, filterMentions, currentUser]);

  const getTypingText = () => {
    const users = Array.from(typingUsers).map(id => employees.find(e => e.id === id)?.name).filter(Boolean);
    if (users.length === 0) return null;
    return users.length === 1 ? `${users[0]} กำลังพิมพ์...` : `${users.length} คนกำลังพิมพ์...`;
  };

  const handleAddRoom = (dept: string) => {
    if (!newRoomName.trim()) return;
    setDepartmentRooms(prev => ({
      ...prev,
      [dept]: [...(prev[dept] || []), newRoomName.trim()]
    }));
    setNewRoomName('');
    setIsAddingRoom(null);
  };

  const privatePartner = getPrivateChatPartner();

  return (
    <div className="flex h-full animate-in fade-in duration-500 overflow-hidden">
      {/* Rooms Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="ค้นหาการสนทนา..." value={roomSearchQuery} onChange={(e) => setRoomSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scroll">
          {/* Main Groups */}
          <div>
            <h3 className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">แชทกลุ่มหลัก</h3>
            <button onClick={() => { setActiveRoom('GLOBAL'); setFilterMentions(false); }} className={`w-full flex items-center p-3 rounded-2xl transition-all ${activeRoom === 'GLOBAL' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users size={18} className="mr-3" /><span className="text-xs font-black">รวมทุกฝ่าย</span>
            </button>
          </div>

          {/* Active Direct Messages */}
          {activePrivateChats.length > 0 && (
            <div>
              <h3 className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">ผู้ติดต่อล่าสุด</h3>
              <div className="space-y-1">
                {activePrivateChats.map(partner => {
                  const sortedIds = [currentUser?.id, partner.id].sort();
                  const dmId = `DM:${sortedIds[0]}--${sortedIds[1]}`;
                  const online = isOnline(partner);
                  return (
                    <button 
                      key={partner.id} 
                      onClick={() => { setActiveRoom(dmId); setFilterMentions(false); }} 
                      className={`w-full flex items-center p-2.5 rounded-2xl transition-all ${activeRoom === dmId ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <div className="relative shrink-0">
                        <img src={partner.avatar} className={`w-8 h-8 rounded-xl mr-3 object-cover ${!online && 'grayscale opacity-60'}`} />
                        {online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-[11px] font-black truncate">{partner.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase truncate">{partner.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Department Channels */}
          <div>
            <h3 className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">ฝ่ายงาน</h3>
            <div className="space-y-4">
              {departments.filter(d => !roomSearchQuery || d.includes(roomSearchQuery)).map(dept => (
                <div key={dept} className="space-y-1">
                  <div className={`flex items-center justify-between p-3 rounded-2xl group cursor-pointer transition-all ${activeRoom.startsWith(`${dept}/`) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`} onClick={() => toggleDept(dept)}>
                    <div className="flex items-center text-slate-700">
                      {expandedDepts[dept] ? <ChevronDown size={14} className="mr-2 text-slate-400" /> : <ChevronRight size={14} className="mr-2 text-slate-400" />}
                      <span className="text-xs font-black tracking-tight">{dept}</span>
                    </div>
                  </div>
                  {expandedDepts[dept] && (
                    <div className="ml-4 space-y-1 border-l-2 border-slate-100/50 pl-3 py-1">
                      {(departmentRooms[dept] || ['ทั่วไป']).map(room => (
                        <button key={room} onClick={() => { setActiveRoom(`${dept}/${room}`); setFilterMentions(false); }} className={`w-full flex items-center px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${activeRoom === `${dept}/${room}` ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100/50'}`}>
                          <Hash size={12} className={`mr-2 ${activeRoom === `${dept}/${room}` ? 'text-indigo-500' : 'opacity-40'}`} /> {room}
                        </button>
                      ))}
                      
                      {isAddingRoom === dept ? (
                        <div className="mt-2 px-2 animate-in slide-in-from-left-2 duration-200">
                          <div className="flex items-center bg-white border border-indigo-200 rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-indigo-500/10">
                            <input 
                              autoFocus
                              type="text" 
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddRoom(dept);
                                if (e.key === 'Escape') setIsAddingRoom(null);
                              }}
                              placeholder="ชื่อห้อง..."
                              className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold py-1.5 px-1"
                            />
                            <div className="flex items-center space-x-1">
                              <button onClick={() => setIsAddingRoom(null)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><X size={12}/></button>
                              <button onClick={() => handleAddRoom(dept)} className="p-1 text-indigo-500 hover:text-indigo-700 transition-colors"><Check size={12}/></button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsAddingRoom(dept); }}
                          className="w-full flex items-center px-4 py-2 rounded-xl text-[9px] font-black text-slate-300 hover:bg-slate-50 hover:text-indigo-500 transition-all uppercase tracking-[0.2em] group"
                        >
                          <Plus size={10} className="mr-2 opacity-50 group-hover:opacity-100" /> เพิ่มห้องแชทเองได้
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden relative">
        <div className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center">
            {privatePartner ? (
              <div className="flex items-center animate-in slide-in-from-left-2 duration-300">
                <div className="w-12 h-12 rounded-2xl mr-5 relative shadow-sm">
                  <img src={privatePartner.avatar} className="w-full h-full object-cover rounded-2xl border border-indigo-100" />
                  {isOnline(privatePartner) && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center">
                    {privatePartner.name}
                    <Sparkles size={16} className="ml-2 text-indigo-400" />
                  </h2>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    <span className="opacity-80">{privatePartner.department} | {privatePartner.role}</span>
                    <span className="mx-2">•</span>
                    <span className={isOnline(privatePartner) ? 'text-emerald-500' : 'text-slate-300'}>
                      {isOnline(privatePartner) ? 'Active Now' : 'Away'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-5 text-indigo-600 shadow-sm border border-indigo-100 relative">
                  {activeRoom === 'GLOBAL' ? <Users size={24} /> : <Hash size={24} />}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">
                    {filterMentions ? 'ข้อความที่กล่าวถึงคุณ' : (activeRoom === 'GLOBAL' ? 'ห้องแชทประสานงานรวม' : `ห้องแชท #${activeRoom.split('/').pop()}`)}
                  </h2>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    <span className="opacity-80">{activeRoom.includes('/') ? activeRoom.split('/')[0] : 'CORPORATE HQ'}</span>
                    <span className="mx-2">•</span>
                    <span className={`${filterMentions ? 'text-indigo-500' : 'text-emerald-500'}`}>
                      {filterMentions ? `${currentMessages.length} Mentions Found` : `${roomMembers.filter(isOnline).length} Active Now`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {!showMembers && (
              <button onClick={() => setShowMembers(true)} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl transition-all shadow-sm" title="แสดงรายชื่อสมาชิก">
                <Users size={20} />
              </button>
            )}
            
            <div className="relative" ref={optionsMenuRef}>
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className={`p-3 rounded-2xl transition-all ${showOptionsMenu ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                <MoreVertical size={20} />
              </button>
              
              {showOptionsMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[80] animate-in slide-in-from-top-2 duration-200">
                  <div className="p-2">
                    {!privatePartner && (
                      <button 
                        onClick={() => { setFilterMentions(!filterMentions); setShowOptionsMenu(false); }}
                        className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${filterMentions ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <AtSign size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{filterMentions ? 'แสดงข้อความทั้งหมด' : 'ดูข้อความที่แท็กฉัน'}</span>
                      </button>
                    )}
                    <button 
                      onClick={() => { setShowMembers(!showMembers); setShowOptionsMenu(false); }}
                      className="w-full flex items-center space-x-3 p-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-all mt-1"
                    >
                      <Users size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{showMembers ? 'ซ่อนรายชื่อสมาชิก' : 'แสดงรายชื่อสมาชิก'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scroll bg-gradient-to-b from-slate-50/50 to-white">
          {filterMentions && !privatePartner && (
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between mb-4 animate-in fade-in duration-300">
              <div className="flex items-center space-x-3">
                <Filter size={16} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">กำลังแสดงเฉพาะข้อความที่แท็กคุณ (@{currentUser?.name})</span>
              </div>
              <button onClick={() => setFilterMentions(false)} className="text-indigo-600 hover:text-indigo-800 p-1">
                <X size={16} />
              </button>
            </div>
          )}

          {currentMessages.length > 0 ? currentMessages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const sender = employees.find(e => e.id === msg.senderId);
            const prevMsg = idx > 0 ? currentMessages[idx-1] : null;
            const showAvatar = !isMe && prevMsg?.senderId !== msg.senderId;
            const online = sender ? isOnline(sender) : false;
            const isTaggedMe = msg.text.includes(`@${currentUser?.name}`);

            return (
              <div key={msg.id} className={`flex items-start ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {!isMe && (
                  <div className="w-10 mr-3 relative shrink-0">
                    {showAvatar && (
                      <>
                        <img src={`https://picsum.photos/seed/${msg.senderId}/50/50`} className="w-10 h-10 rounded-xl shadow-sm border-2 border-white object-cover" alt={msg.senderName} />
                        {online && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>}
                      </>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] ${isMe ? 'mr-3' : ''}`}>
                  {!isMe && showAvatar && !privatePartner && (
                    <div className="flex items-center mb-1.5 ml-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.senderName}</span>
                      {online && <span className="ml-2 text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1 rounded">Online</span>}
                    </div>
                  )}
                  <div className={`p-4 rounded-[1.5rem] text-xs leading-relaxed shadow-sm border relative overflow-hidden ${isMe ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : isTaggedMe ? 'bg-indigo-50 text-indigo-900 border-indigo-200 rounded-tl-none ring-2 ring-indigo-500/20' : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'}`}>
                    {isTaggedMe && <div className="absolute top-0 right-0 p-2 opacity-5"><AtSign size={32} /></div>}
                    {msg.text.split(/(@[\w\u0E00-\u0E7F ]+)/g).map((part, i) => 
                      part.startsWith('@') ? (
                        <span key={i} className={`font-black underline px-1.5 py-0.5 rounded-lg transition-all ${isMe ? 'text-indigo-100 bg-indigo-700/40' : part === `@${currentUser?.name}` ? 'text-white bg-indigo-600' : 'text-indigo-700 bg-indigo-100'}`}>
                          {part}
                        </span>
                      ) : part
                    )}
                  </div>
                  <div className={`text-[8px] mt-1.5 text-slate-400 font-bold uppercase tracking-widest ${isMe ? 'text-right mr-2' : 'ml-2'}`}>{msg.timestamp}</div>
                </div>
              </div>
            )
          }) : (
            <div className="h-full flex flex-col items-center justify-center opacity-10 py-20">
              <MessageCircle size={80} className="mb-6" /><p className="font-black text-2xl uppercase tracking-[0.2em] text-center">
                {filterMentions ? 'ไม่พบข้อความที่แท็กคุณ' : 'HO CONNECT CHAT'}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-8 bg-white border-t border-slate-100 relative shrink-0">
          {typingUsers.size > 0 && (
            <div className="absolute -top-12 left-10 flex items-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl border border-indigo-50 animate-in slide-in-from-bottom-4">
              <div className="flex space-x-1 mr-3">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{getTypingText()}</span>
            </div>
          )}

          {/* Improved Mention Dropdown */}
          {showMentions && filteredEmployees.length > 0 && (
            <div className="absolute bottom-full left-8 right-8 mb-4 bg-white rounded-[2rem] shadow-[0_35px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden z-[60] animate-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 border-b border-slate-50 bg-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <AtSign size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">เลือกสมาชิกที่ต้องการแท็ก</span>
                </div>
                <span className="text-[8px] font-bold opacity-70">พิมพ์ชื่อเพื่อค้นหา...</span>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scroll">
                {filteredEmployees.map(emp => {
                  const online = isOnline(emp);
                  return (
                    <button 
                      key={emp.id} 
                      onClick={() => insertMention(emp)} 
                      className="w-full flex items-center px-6 py-4 hover:bg-indigo-50 transition-all text-left border-b border-slate-50 last:border-none group"
                    >
                      <div className="relative shrink-0">
                        <img src={emp.avatar} className="w-10 h-10 rounded-xl mr-4 shadow-sm object-cover transition-transform group-hover:scale-105" alt={emp.name} />
                        {online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="text-sm font-black text-slate-800 truncate">{emp.name} {emp.id === currentUser?.id && '(คุณ)'}</div>
                          {online && <span className="ml-2 text-[8px] font-black text-emerald-500 bg-emerald-50 px-1 rounded tracking-tighter">Live</span>}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{emp.department} | {emp.role}</div>
                      </div>
                      <Plus size={16} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="bg-slate-50/80 p-2.5 rounded-[2rem] border border-slate-200 flex items-center space-x-2 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Paperclip size={20} /></button>
            <input ref={inputRef} type="text" value={inputText} onChange={handleInputChange} placeholder={privatePartner ? `ส่งข้อความถึง ${privatePartner.name}...` : "พิมพ์ข้อความ... หรือพิมพ์ @ เพื่อแท็ก"} className="flex-1 bg-transparent border-none outline-none text-xs font-bold py-3 px-2 text-slate-800 placeholder:text-slate-300" />
            <button type="submit" disabled={!inputText.trim()} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center"><Send size={20} /></button>
          </form>
        </div>
      </div>

      {/* Right Presence Sidebar (Members List) */}
      <div className={`bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out relative overflow-hidden ${showMembers ? 'w-64 opacity-100' : 'w-0 opacity-0 border-none'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between min-w-[256px]">
          <div className="flex items-center space-x-3">
            <Users size={16} className="text-indigo-600" />
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">สมาชิกในห้อง</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[9px] font-black">{roomMembers.length}</span>
            <button 
              onClick={() => setShowMembers(false)}
              className="p-1.5 hover:bg-indigo-50 text-indigo-600/50 hover:text-indigo-600 rounded-lg transition-all"
              title="ย่อหน้าจอรายชื่อ"
            >
              <PanelRightClose size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll min-w-[256px]">
          <div className="mb-6">
            <h4 className="px-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Online — {roomMembers.filter(isOnline).length}</h4>
            <div className="space-y-1">
              {sortedMembers.filter(isOnline).map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => startPrivateChat(emp)}
                  className="flex items-center p-2 rounded-xl hover:bg-indigo-50 transition-all group cursor-pointer border border-transparent hover:border-indigo-100"
                >
                  <div className="relative shrink-0">
                    <img src={emp.avatar} className="w-8 h-8 rounded-lg mr-3 shadow-sm object-cover" alt="" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-800 truncate">{emp.name} {emp.id === currentUser?.id && '(Me)'}</p>
                    <p className="text-[9px] text-slate-400 font-bold truncate uppercase">{emp.role}</p>
                  </div>
                  <MessageCircle size={14} className="opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity ml-1" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="px-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Offline — {roomMembers.filter(e => !isOnline(e)).length}</h4>
            <div className="space-y-1 opacity-60">
              {sortedMembers.filter(e => !isOnline(e)).map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => startPrivateChat(emp)}
                  className="flex items-center p-2 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <img src={emp.avatar} className="w-8 h-8 rounded-lg mr-3 shadow-sm grayscale object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-500 truncate">{emp.name}</p>
                    <p className="text-[9px] text-slate-300 font-bold truncate uppercase">{emp.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 min-w-[256px]">
           <div className="flex items-center text-[9px] text-slate-400 font-bold leading-relaxed">
             <Info size={12} className="mr-2 shrink-0" /><p>คลิกที่ชื่อพนักงานเพื่อเริ่มแชทส่วนตัว</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
