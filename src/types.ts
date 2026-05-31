export interface LessonComment {
  id: string;
  authorName: string;
  authorRole: 'teacher' | 'student' | 'parent';
  authorId: string;
  content: string;
  rating: number; // 1-5 stars
  timestamp: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string;
  section: string; // e.g. "Video bài học", "Trò chơi tương tác"
  createdAt?: string;
}

export interface Lesson {
  id: string;
  categoryIndex: number; // 1-6
  title: string;
  type: string; // fallback / main type
  url: string; // fallback / main link
  description?: string;
  createdAt?: string;
  comments?: LessonComment[];
  materials?: LearningMaterial[]; // list of segmented learning materials (học liệu theo chuyên mục)
}

export interface Student {
  id: string;
  name: string;
  isPresent: boolean;
  checkinTime: string | null;
  badges?: string[]; // Badges earned
  attendedDays?: string[]; // e.g. ["Ngày 1", "Ngày 2", "Ngày 3"]
}

export interface TeacherNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  content: string;
  type: 'kh-bai-day' | 'kh-day-hoc'; // Lesson plan vs Curriculum/Teaching plan
  link?: string;
}

export interface ScheduleEvent {
  id: string;
  date: string;
  title: string;
  time: string;
}

export interface StudySheet {
  id: string;
  title: string;
  imageUrl: string; // Base64 image
  createdAt: string;
}

export interface WorkbookSubmission {
  id: string;
  studentName: string;
  studentId: string;
  sheetId: string;
  sheetTitle: string;
  answers: string; // Written responses or coords
  parentConfirmed?: boolean;
  comment?: string; // Teacher's comment
  stars?: number;
  submittedAt: string;
}

export interface MindmapSubmission {
  id: string;
  studentName: string;
  studentId: string;
  title: string;
  nodes: string; // JSON String of nodes
  edges: string; // JSON String of connections
  comment?: string;
  submittedAt: string;
}

export interface GradeAndComment {
  id: string;
  studentId: string;
  studentName: string;
  attendanceScore: string; // "A" / "B" etc. or score
  midTermScore: number;
  finalScore: number;
  weeklyComment: string;
  lastUpdated: string;
}

export interface ParentFeedback {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  message: string;
  timestamp: string;
  teacherReply?: string;
  replyTimestamp?: string;
}

export interface DiscussionThread {
  id: string;
  title: string;
  content: string;
  isOpen: boolean;
  comments: Array<{
    id: string;
    studentName: string;
    studentId: string;
    content: string;
    stars: number; // Star rating (1-5)
    timestamp: string;
  }>;
}

export interface TeacherProfile {
  name: string;
  themeColor: 'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'violet';
  mode: 'light' | 'dark';
  avatar: string; // emoji or design style avatar
}

export interface AppState {
  lessons: Lesson[];
  students: Student[];
  teacherNotes: TeacherNote[];
  lessonPlans: LessonPlan[];
  scheduleEvents: ScheduleEvent[];
  studySheets: StudySheet[];
  workbookSubmissions: WorkbookSubmission[];
  mindmapSubmissions: MindmapSubmission[];
  gradesAndComments: GradeAndComment[];
  parentFeedback: ParentFeedback[];
  discussionThreads: DiscussionThread[];
  teacherProfile: TeacherProfile;
  attendanceDays?: string[];
}
