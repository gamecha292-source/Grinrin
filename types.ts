
export enum TaskStatus {
  TODO = 'รอดำเนินการ',
  IN_PROGRESS = 'กำลังดำเนินงาน',
  COMPLETED = 'เสร็จสิ้น'
}

export enum Department {
  SALES = 'ฝ่ายขาย',
  LOGISTICS = 'ฝ่ายขนส่ง',
  MARKETING = 'ฝ่ายการตลาด',
  HR = 'ฝ่ายบุคคล',
  WAREHOUSE = 'คลังสินค้า'
}

export enum JobLevel {
  EXECUTIVE = 'ระดับผู้บริหาร',
  MANAGER = 'ผู้จัดการ',
  SUPERVISOR = 'หัวหน้างาน',
  STAFF = 'พนักงาน'
}

export enum IssueSeverity {
  NORMAL = 'ปกติ',
  MEDIUM = 'ปานกลาง',
  URGENT = 'เร่งด่วน'
}

export interface CheckItem {
  id: string;
  label: string;
  isDone: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  level: JobLevel;
  department: string;
  avatar: string;
  lastActive?: string;
  stats?: {
    messagesSent: number;
    issuesReported: number;
    commentsMade: number;
  }
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  department: string;
  creatorId: string;
  creatorName: string;
  creatorDepartment: string;
  assigneeId: string;
  assigneeName: string;
  createdAt: string;
  orderTime?: string;
  deadline: string;
  subTasks: CheckItem[];
}

export interface IssueComment {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
}

export interface Issue {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  department: string;
  text: string;
  severity: IssueSeverity;
  timestamp: string;
  comments: IssueComment[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  room: string;
}

export interface ProjectIdea {
  title: string;
  description: string;
  objective: string;
  keySteps: string[];
  impact: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'mention';
  department?: string;
  targetUserId?: string; // New field for specific alerts
  timestamp: Date;
  isRead?: boolean;
}
