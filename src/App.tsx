import React, { useState, useEffect } from "react";
import {
  Users, BookOpen, Brain, FileSpreadsheet, HeartHandshake, BookCopy,
  UserCheck, ClipboardList, CheckCircle2, Bookmark, Settings, Eye, Trash2, 
  Plus, Edit, Star, LogOut, ArrowRight, Video, Gamepad2, FileText, Globe, 
  MapPin, Clock, Calendar, CheckSquare, Sparkles, MessageSquare, Send, BookMarked
} from "lucide-react";

import { playClickSound, playSparkleSound } from "./components/AudioClick";
import MindmapEditor from "./components/MindmapEditor";
import GauChatbox from "./components/GauChatbox";
import StudySheetWorkspace from "./components/StudySheetWorkspace";

// Match state with Node background
import {
  Lesson, Student, TeacherNote, LessonPlan, ScheduleEvent, StudySheet,
  WorkbookSubmission, MindmapSubmission, GradeAndComment, ParentFeedback,
  DiscussionThread, TeacherProfile, AppState
} from "./types";

const SUBJECT_CATEGORIES = [
  "CHỦ ĐỀ 1: CHẤT",
  "CHỦ ĐỀ 2: NĂNG LƯỢNG",
  "CHỦ ĐỀ 3: THỰC VẬT VÀ ĐỘNG VẬT",
  "CHỦ ĐỀ 4: NẤM",
  "CHỦ ĐỀ 5: CON NGƯỜI VÀ SỨC KHỎE",
  "CHỦ ĐỀ 6: SINH VẬT VÀ MÔI TRƯỜNG"
];

const SUBJECT_EMOJIS = ["💧", "⚡", "🐘", "🍄", "❤️", "🌍"];
const SUBJECT_COLORS = [
  "bg-sky-100 border-sky-400 text-sky-800 hover:bg-sky-150",
  "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-150",
  "bg-emerald-100 border-emerald-400 text-emerald-800 hover:bg-emerald-150",
  "bg-orange-100 border-orange-400 text-orange-850 hover:bg-orange-150",
  "bg-rose-100 border-rose-400 text-rose-800 hover:bg-rose-150",
  "bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-150"
];

function getLessonTypeIcon(type: string): string {
  if (!type) return "🌐";
  // If it starts with an emoji, extract and return it!
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
  const match = type.match(emojiRegex);
  if (match) {
    return match[0];
  }
  
  // Standard defaults
  const lower = type.toLowerCase();
  if (lower.includes("video") || lower.includes("clip") || lower.includes("phim")) return "📹";
  if (lower.includes("game") || lower.includes("chơi") || lower.includes("quizz") || lower.includes("quiz") || lower.includes("wordwall") || lower.includes("scratch")) return "🎮";
  if (lower.includes("pdf") || lower.includes("bài đọc") || lower.includes("tài liệu") || lower.includes("slide") || lower.includes("sách") || lower.includes("trình chiếu")) return "📄";
  if (lower.includes("thí nghiệm") || lower.includes("mô phỏng") || lower.includes("lab") || lower.includes("ảo")) return "🧪";
  if (lower.includes("sơ đồ") || lower.includes("mindmap") || lower.includes("tư duy")) return "🧠";
  if (lower.includes("ảnh") || lower.includes("hình") || lower.includes("đồ họa") || lower.includes("canva")) return "🖼️";
  if (lower.includes("vở") || lower.includes("ghi chép") || lower.includes("nhật ký")) return "📓";
  
  return "🌐";
}

function getEmbedUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // YouTube links conversion
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=0`;
  }

  // Google Documents links (Slides, Docs, Sheets) conversion for safe embedding
  if (trimmed.includes("docs.google.com/presentation") || trimmed.includes("docs.google.com/document") || trimmed.includes("docs.google.com/spreadsheets")) {
    if (trimmed.includes("/pub?")) {
      return trimmed;
    }
    if (trimmed.includes("/edit")) {
      return trimmed.replace(/\/edit.*$/, "/embed");
    }
  }

  return trimmed;
}

const DEFAULT_COSMIC_STATE: AppState = {
  lessons: [
    {
      id: "L_sample1",
      categoryIndex: 0, // CHỦ ĐỀ 1: CHẤT
      title: "Sự chuyển thể của nước kì diệu 💧",
      type: "video",
      url: "https://www.youtube.com/watch?v=3gscG70jK10",
      description: "Học về các thể của nước: Thể lỏng, thể khí (hơi) và thể rắn qua các thí nghiệm thực tế sinh động.",
      createdAt: new Date().toISOString(),
      comments: [
        {
          id: "lc_sample1",
          authorName: "Cô Thùy Dương",
          authorRole: "teacher",
          authorId: "GV01",
          content: "Các con hãy xem kỹ video thí nghiệm chuyển thể này và thử tự vẽ lại sơ đồ tư duy nhé!",
          rating: 5,
          timestamp: new Date().toISOString()
        }
      ]
    },
    {
      id: "L_sample2",
      categoryIndex: 1, // CHỦ ĐỀ 2: NĂNG LƯỢNG
      title: "Ánh sáng và vai trò của ánh sáng trong đời sống ⚡",
      type: "pdf",
      url: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=1200&auto=format&fit=crop&q=80",
      description: "Khám phá nguồn sáng, vật chiếu sáng và đường truyền ánh sáng.",
      createdAt: new Date().toISOString(),
      comments: []
    }
  ],
  students: [
    {
      id: "HS01",
      name: "Nguyễn Gia Bảo",
      isPresent: true,
      checkinTime: new Date().toISOString(),
      badges: ["Chuyên Cần Tinh Anh 📅"],
      attendedDays: ["Ngày 1", "Ngày 2"]
    },
    {
      id: "HS02",
      name: "Trần Minh Thư",
      isPresent: false,
      checkinTime: null,
      badges: [],
      attendedDays: []
    }
  ],
  teacherNotes: [
    { id: "n1", content: "Lớp 4 rèn luyện rất chăm chỉ. Hôm nay Gia Bảo phát biểu bài rất to và rõ ràng.", createdAt: new Date().toISOString() }
  ],
  lessonPlans: [
    { id: "p1", title: "KHBD: Bài 1 - Tính chất và vai trò của nước", content: "Mục tiêu: Học sinh nhận biết được nước không màu, không mùi, không vị, hòa tan một số chất và chảy từ cao xuống thấp.", type: "kh-bai-day", link: "" }
  ],
  scheduleEvents: [
    { id: "e1", title: "Thực hành vẽ Sơ đồ tư duy Nước trên bảng phụ", date: "2026-06-01", time: "09:00" }
  ],
  studySheets: [
    { id: "ws1", title: "Mẫu Phiếu Học Tập Khám Phá Tính Chất Của Nước", imageUrl: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=60", createdAt: new Date().toISOString() }
  ],
  workbookSubmissions: [],
  mindmapSubmissions: [],
  gradesAndComments: [
    {
      id: "g_HS01",
      studentId: "HS01",
      studentName: "Nguyễn Gia Bảo",
      attendanceScore: "Xuất sắc",
      midTermScore: 10,
      finalScore: 10,
      weeklyComment: "Con rất ngoan, hoàn thành xuất sắc thử thách vẽ sơ đồ nước.",
      lastUpdated: new Date().toISOString()
    },
    {
      id: "g_HS02",
      studentId: "HS02",
      studentName: "Trần Minh Thư",
      attendanceScore: "Vắng mặt",
      midTermScore: 9,
      finalScore: 10,
      weeklyComment: "Con cần ôn tập thêm phiếu học tập tuần.",
      lastUpdated: new Date().toISOString()
    }
  ],
  parentFeedback: [
    { id: "f1", studentId: "HS01", studentName: "Nguyễn Gia Bảo", parentName: "Phụ huynh Gia Bảo", message: "Chào cô Dương, cảm ơn cô đã tận tình hỗ trợ Gia Bảo tiến bộ vượt bậc!", timestamp: new Date().toISOString() }
  ],
  discussionThreads: [
    { id: "t1", title: "Thảo luận: Tại sao nước chảy từ trên cao xuống? 🤔", content: "Hãy cùng suy nghĩ xem trong cuộc sống, hiện tượng này giúp ích gì cho đời sống chúng mình nhé!", isOpen: true, comments: [] }
  ],
  teacherProfile: {
    name: "Cô Thùy Dương",
    themeColor: "emerald",
    mode: "light",
    avatar: "👩‍🏫"
  },
  attendanceDays: [
    "Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5",
    "Ngày 6", "Ngày 7", "Ngày 8", "Ngày 9", "Ngày 10"
  ]
};

export default function App() {
  // Application Roles and login structures
  const [currentRole, setCurrentRole] = useState<'login' | 'teacher' | 'student' | 'parent'>('login');
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [studentPassword, setStudentPassword] = useState("");
  const [parentSearchChild, setParentSearchChild] = useState("");

  // Additional login inputs as requested
  const [studentLoginName, setStudentLoginName] = useState("");
  const [teacherLoginCode, setTeacherLoginCode] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [parentName, setParentName] = useState("");
  const [classCode, setClassCode] = useState("KHOAHOC4");
  const [loginSubTab, setLoginSubTab] = useState<'student' | 'teacher' | 'parent'>('student');

  const [customLessonTypes, setCustomLessonTypes] = useState<string[]>([]);
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");

  // Server state
  const [appState, setAppState] = useState<AppState>({
    lessons: [],
    students: [],
    teacherNotes: [],
    lessonPlans: [],
    scheduleEvents: [],
    studySheets: [],
    workbookSubmissions: [],
    mindmapSubmissions: [],
    gradesAndComments: [],
    parentFeedback: [],
    discussionThreads: [],
    teacherProfile: {
      name: "Admin",
      themeColor: "emerald",
      mode: "light",
      avatar: "👩‍🏫"
    }
  });


   // UI state managers
  const [teacherActiveTab, setTeacherActiveTab] = useState<'dashboard' | 'students' | 'lessons' | 'parentInfo' | 'notes' | 'profile'>('dashboard');
  const [teacherStudentActiveSubTab, setTeacherStudentActiveSubTab] = useState<'roster' | 'submissions'>('roster');
  const [materialActiveSubTab, setMaterialActiveSubTab] = useState<'lessons' | 'worksheets' | 'mindmaps' | 'discussions'>('lessons');
  const [studentActiveTab, setStudentActiveTab] = useState<'attendance' | 'materials' | 'discussions'>('attendance');
  const [studentMaterialSubTab, setStudentMaterialSubTab] = useState<'lessons' | 'worksheets' | 'mindmapEdit'>('lessons');
  const [teacherNotesActiveSubTab, setTeacherNotesActiveSubTab] = useState<'annual' | 'lesson_plan' | 'notes'>('annual');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [expandedCategoryIndex, setExpandedCategoryIndex] = useState<number | null>(null);

  // Modals / forms state
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    type: "video" as Lesson['type'],
    url: "",
    description: "",
    categoryIndex: 1
  });

  const [studentFormName, setStudentFormName] = useState("");
  const [noteInputValue, setNoteInputValue] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<WorkbookSubmission | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStars, setReviewStars] = useState(5);

  const [sheetFormTitle, setSheetFormTitle] = useState("");
  const [sheetFormUrl, setSheetFormUrl] = useState("");
  const [sheetUploadMode, setSheetUploadMode] = useState<'upload' | 'url'>('upload');
  const [isSheetUploading, setIsSheetUploading] = useState(false);

  const [planFormTitle, setPlanFormTitle] = useState("");
  const [planFormContent, setPlanFormContent] = useState("");
  const [planFormLink, setPlanFormLink] = useState("");
  const [planFormType, setPlanFormType] = useState<'kh-bai-day' | 'kh-day-hoc'>('kh-bai-day');

  const [eventFormDate, setEventFormDate] = useState("");
  const [eventFormTime, setEventFormTime] = useState("");
  const [eventFormTitle, setEventFormTitle] = useState("");

  const [gradeInputMap, setGradeInputMap] = useState<Record<string, { mid: number; final: number; comment: string; att: string }>>({});
  const [discussionFormContent, setDiscussionFormContent] = useState("");
  const [selectedStarRating, setSelectedStarRating] = useState(5);

  const [parentFeedbackInput, setParentFeedbackInput] = useState("");
  const [teacherReplyMap, setTeacherReplyMap] = useState<Record<string, string>>({});
  const [newDiscussionTitle, setNewDiscussionTitle] = useState("");
  const [newDiscussionContent, setNewDiscussionContent] = useState("");

  // Search filter for lessons
  const [lessonSearchQuery, setLessonSearchQuery] = useState("");

  // Badges and interactive lesson details state
  const [selectedExploreLesson, setSelectedExploreLesson] = useState<Lesson | null>(null);
  const [newLessonCommentContent, setNewLessonCommentContent] = useState("");
  const [newLessonCommentRating, setNewLessonCommentRating] = useState(5);
  const [editingStudentBadgesId, setEditingStudentBadgesId] = useState<string | null>(null);

  // Profile form state
  const [profileFormName, setProfileFormName] = useState("");
  const [profileFormAvatar, setProfileFormAvatar] = useState("");
  const [profileFormThemeColor, setProfileFormThemeColor] = useState<'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'violet'>("emerald");

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  const [hasInitializedProfile, setHasInitializedProfile] = useState(false);

  useEffect(() => {
    if (appState.teacherProfile && !hasInitializedProfile) {
      setProfileFormName(appState.teacherProfile.name || "Admin");
      setProfileFormAvatar(appState.teacherProfile.avatar || "👩‍🏫");
      setProfileFormThemeColor(appState.teacherProfile.themeColor || "emerald");
      setHasInitializedProfile(true);
    }
  }, [appState.teacherProfile, hasInitializedProfile]);

  useEffect(() => {
    if (teacherActiveTab === 'profile' && appState.teacherProfile) {
      setProfileFormName(appState.teacherProfile.name || "Admin");
      setProfileFormAvatar(appState.teacherProfile.avatar || "👩‍🏫");
      setProfileFormThemeColor(appState.teacherProfile.themeColor || "emerald");
    }
  }, [teacherActiveTab]);

  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const updateOfflineState = (updaterFn: (prevState: AppState) => AppState) => {
    setAppState(prev => {
      const updated = updaterFn(prev);
      localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
      return updated;
    });
  };

  const useOfflineFallback = () => {
    setIsOfflineMode(true);
    const local = localStorage.getItem("khoahoc4_state");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setAppState(parsed);
        if (parsed.teacherNotes && parsed.teacherNotes[0]) {
          setNoteInputValue(parsed.teacherNotes[0].content);
        }
      } catch (err) {
        setAppState(DEFAULT_COSMIC_STATE);
        localStorage.setItem("khoahoc4_state", JSON.stringify(DEFAULT_COSMIC_STATE));
      }
    } else {
      setAppState(DEFAULT_COSMIC_STATE);
      localStorage.setItem("khoahoc4_state", JSON.stringify(DEFAULT_COSMIC_STATE));
    }
  };

  // Real-time server sync polling
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [isOfflineMode]);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) {
        useOfflineFallback();
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // Safe check for SPA html fallback response during transient states
        useOfflineFallback();
        return;
      }
      const data = await res.json();
      if (data) {
        setAppState(data);
        localStorage.setItem("khoahoc4_state", JSON.stringify(data));
        setIsOfflineMode(false);
        // Pre-fill teacher notes text if empty initially
        if (data.teacherNotes && data.teacherNotes[0]) {
          setNoteInputValue(data.teacherNotes[0].content);
        }
      }
    } catch (e) {
      console.error("Polling error: ", e);
      useOfflineFallback();
    }
  };

  const handleRoleSelection = (role: typeof currentRole) => {
    playClickSound();
    setCurrentRole(role);
    if (role === 'login') {
      setCurrentUser(null);
      setStudentPassword("");
      setParentSearchChild("");
      setTeacherLoginCode("");
      setTeacherPassword("");
      setParentName("");
      setClassCode("");
    }
  };

  const handleTeacherLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherLoginCode !== "admin") {
      alert("Mã đăng nhập giáo viên chưa đúng rồi! Hãy nhập mã đăng nhập là: admin");
      return;
    }
    if (teacherPassword !== "123456") {
      alert("Mật khẩu giáo viên chưa đúng rồi! Hãy nhập: 123456");
      return;
    }
    playClickSound();
    playSparkleSound();
    setCurrentUser({ id: "GV01", name: appState.teacherProfile.name });
    setCurrentRole('teacher');
  };

  const handleStudentLoginWithCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentLoginName.trim();
    if (!cleanName) {
      alert("Vui lòng điền họ tên học sinh nhé!");
      return;
    }
    playClickSound();
    playSparkleSound();
    
    // Find or auto-add student record case-insensitively
    let student = appState.students.find(s => s.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (student) {
      setCurrentUser({ id: student.id, name: student.name });
      setCurrentRole('student');
    } else {
      if (isOfflineMode) {
        const newId = "HS" + String(appState.students.length + 1).padStart(2, "0");
        const newStudent = {
          id: newId,
          name: cleanName,
          isPresent: false,
          checkinTime: null,
          badges: [],
          attendedDays: []
        };
        const newGrade = {
          id: "g_" + newId,
          studentId: newId,
          studentName: cleanName,
          attendanceScore: "Vắng mặt",
          midTermScore: 10,
          finalScore: 10,
          weeklyComment: "Chưa có nhận xét.",
          lastUpdated: new Date().toISOString()
        };
        updateOfflineState(prev => ({
          ...prev,
          students: [...prev.students, newStudent],
          gradesAndComments: [...prev.gradesAndComments, newGrade]
        }));
        setCurrentUser({ id: newId, name: cleanName });
        setCurrentRole('student');
        return;
      }
      // If student is not registered yet, auto-add them so it's fully fluid!
      try {
        const res = await fetch("/api/students/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cleanName })
        });
        const data = await res.json();
        if (data.success) {
          const updatedRes = await fetch("/api/state");
          const updatedData = await updatedRes.json();
          setAppState(updatedData);
          localStorage.setItem("khoahoc4_state", JSON.stringify(updatedData));
          
          const newStudent = updatedData.students.find((s: any) => s.name.trim().toLowerCase() === cleanName.toLowerCase());
          if (newStudent) {
            setCurrentUser({ id: newStudent.id, name: newStudent.name });
            setCurrentRole('student');
          } else {
            setCurrentUser({ id: "ST_TEMP", name: cleanName });
            setCurrentRole('student');
          }
        } else {
          setCurrentUser({ id: "ST_TEMP", name: cleanName });
          setCurrentRole('student');
        }
      } catch (err) {
        // Local fallback in case server fails unexpectedly
        const newId = "HS" + String(appState.students.length + 1).padStart(2, "0");
        const newStudent = {
          id: newId,
          name: cleanName,
          isPresent: false,
          checkinTime: null,
          badges: [],
          attendedDays: []
        };
        const newGrade = {
          id: "g_" + newId,
          studentId: newId,
          studentName: cleanName,
          attendanceScore: "Vắng mặt",
          midTermScore: 10,
          finalScore: 10,
          weeklyComment: "Chưa có nhận xét.",
          lastUpdated: new Date().toISOString()
        };
        updateOfflineState(prev => ({
          ...prev,
          students: [...prev.students, newStudent],
          gradesAndComments: [...prev.gradesAndComments, newGrade]
        }));
        setCurrentUser({ id: newId, name: cleanName });
        setCurrentRole('student');
        setIsOfflineMode(true);
      }
    }
  };

  const handleParentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim()) {
      alert("Họ tên phụ huynh không được bỏ trống nha!");
      return;
    }
    if (!parentSearchChild.trim()) {
      alert("Vui lòng điền họ tên con em học sinh nhé!");
      return;
    }
    if (!classCode || classCode.trim().toUpperCase() !== "KHOAHOC4") {
      alert("Mã lớp chưa đúng rồi bạn phụ huynh ơi! Hãy gõ mã lớp là: KHOAHOC4");
      return;
    }
    playClickSound();
    playSparkleSound();
    
    // Try to link with a student
    const matched = appState.students.find(s => s.name.toLowerCase().includes(parentSearchChild.trim().toLowerCase()));
    if (matched) {
      setCurrentUser({ id: matched.id, name: `${parentName.trim()} (PH em ${matched.name})` });
      setCurrentRole('parent');
    } else {
      alert(`Hệ thống chưa tìm thấy học sinh tên "${parentSearchChild}" trong lớp. Hãy báo lại cô Thùy Dương thêm bé vào sổ điểm danh trước nhen!`);
      // Fallback register
      setCurrentUser({ id: "PH_TEMP", name: `${parentName.trim()} (Phụ huynh)` });
      setCurrentRole('parent');
    }
  };

  const handleRollCall = async (dayName?: string) => {
    if (!currentUser) return;
    playClickSound();
    playSparkleSound();
    const targetDay = dayName || "Ngày 1";
    if (isOfflineMode) {
      updateOfflineState(prev => {
        const students = prev.students.map(s => {
          if (s.id === currentUser.id) {
            const badges = s.badges || [];
            if (!badges.includes("Chuyên Cần Tinh Anh 📅")) {
              badges.push("Chuyên Cần Tinh Anh 📅");
            }
            const attended = s.attendedDays || [];
            const updatedAttended = attended.includes(targetDay) ? attended : [...attended, targetDay];
            return {
              ...s,
              isPresent: true,
              checkinTime: new Date().toISOString(),
              attendedDays: updatedAttended,
              badges
            };
          }
          return s;
        });
        return { ...prev, students };
      });
      return;
    }
    try {
      const res = await fetch("/api/students/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentUser.id, isPresent: true, dayName: targetDay })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error(err);
      // fallback in case of errors
      updateOfflineState(prev => {
        const students = prev.students.map(s => {
          if (s.id === currentUser.id) {
            const badges = s.badges || [];
            if (!badges.includes("Chuyên Cần Tinh Anh 📅")) {
              badges.push("Chuyên Cần Tinh Anh 📅");
            }
            const attended = s.attendedDays || [];
            const updatedAttended = attended.includes(targetDay) ? attended : [...attended, targetDay];
            return {
              ...s,
              isPresent: true,
              checkinTime: new Date().toISOString(),
              attendedDays: updatedAttended,
              badges
            };
          }
          return s;
        });
        return { ...prev, students };
      });
      setIsOfflineMode(true);
    }
  };

  const handleToggleAttendance = async (studentId: string, currentPresent: boolean, dayName?: string) => {
    playClickSound();
    playSparkleSound();
    const targetDay = dayName || "Ngày 1";
    if (isOfflineMode) {
      updateOfflineState(prev => {
        const students = prev.students.map(s => {
          if (s.id === studentId) {
            const badges = s.badges || [];
            if (!currentPresent && !badges.includes("Chuyên Cần Tinh Anh 📅")) {
              badges.push("Chuyên Cần Tinh Anh 📅");
            }
            const attended = s.attendedDays || [];
            const updatedAttended = !currentPresent 
              ? (attended.includes(targetDay) ? attended : [...attended, targetDay])
              : attended.filter(d => d !== targetDay);
            return {
              ...s,
              isPresent: updatedAttended.length > 0,
              checkinTime: updatedAttended.length > 0 ? (s.checkinTime || new Date().toISOString()) : null,
              attendedDays: updatedAttended,
              badges
            };
          }
          return s;
        });
        return { ...prev, students };
      });
      return;
    }

    try {
      const res = await fetch("/api/students/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, isPresent: !currentPresent, dayName: targetDay })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error(err);
      // Fallback offline
      updateOfflineState(prev => {
        const students = prev.students.map(s => {
          if (s.id === studentId) {
            const badges = s.badges || [];
            if (!currentPresent && !badges.includes("Chuyên Cần Tinh Anh 📅")) {
              badges.push("Chuyên Cần Tinh Anh 📅");
            }
            const attended = s.attendedDays || [];
            const updatedAttended = !currentPresent 
              ? (attended.includes(targetDay) ? attended : [...attended, targetDay])
              : attended.filter(d => d !== targetDay);
            return {
              ...s,
              isPresent: updatedAttended.length > 0,
              checkinTime: updatedAttended.length > 0 ? (s.checkinTime || new Date().toISOString()) : null,
              attendedDays: updatedAttended,
              badges
            };
          }
          return s;
        });
        return { ...prev, students };
      });
      setIsOfflineMode(true);
    }
  };

  // Add Student account
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentFormName.trim();
    if (!cleanName) {
      alert("Vui lòng điền họ tên học sinh!");
      return;
    }
    playClickSound();
    if (isOfflineMode) {
      const newId = "HS" + String(appState.students.length + 1).padStart(2, "0");
      updateOfflineState(prev => {
        const newStudent = {
          id: newId,
          name: cleanName,
          isPresent: false,
          checkinTime: null,
          badges: [],
          attendedDays: []
        };
        const newGrade = {
          id: "g_" + newId,
          studentId: newId,
          studentName: cleanName,
          attendanceScore: "Vắng mặt",
          midTermScore: 10,
          finalScore: 10,
          weeklyComment: "Chưa có nhận xét.",
          lastUpdated: new Date().toISOString()
        };
        return {
          ...prev,
          students: [...prev.students, newStudent],
          gradesAndComments: [...prev.gradesAndComments, newGrade]
        };
      });
      setStudentFormName("");
      playSparkleSound();
      alert(`✔️ Đã thêm học sinh "${cleanName}" thành công!`);
      return;
    }
    try {
      const res = await fetch("/api/students/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName })
      });
      const data = await res.json();
      if (data.success) {
        setStudentFormName("");
        playSparkleSound();
        fetchState();
        alert(`✔️ Đã thêm học sinh "${cleanName}" thành công!`);
      }
    } catch (err) {
      console.error(err);
      const newId = "HS" + String(appState.students.length + 1).padStart(2, "0");
      updateOfflineState(prev => {
        const newStudent = {
          id: newId,
          name: cleanName,
          isPresent: false,
          checkinTime: null,
          badges: [],
          attendedDays: []
        };
        const newGrade = {
          id: "g_" + newId,
          studentId: newId,
          studentName: cleanName,
          attendanceScore: "Vắng mặt",
          midTermScore: 10,
          finalScore: 10,
          weeklyComment: "Chưa có nhận xét.",
          lastUpdated: new Date().toISOString()
        };
        return {
          ...prev,
          students: [...prev.students, newStudent],
          gradesAndComments: [...prev.gradesAndComments, newGrade]
        };
      });
      setStudentFormName("");
      playSparkleSound();
      alert(`✔️ Đã thêm học sinh "${cleanName}" thành công (chế độ ngoại tuyến)!`);
      setIsOfflineMode(true);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    requestConfirmation("Bé học sinh này sẽ bị xóa khỏi sổ lớp. Bạn có chắc chắn?", async () => {
      playClickSound();
      if (isOfflineMode) {
        updateOfflineState(prev => ({
          ...prev,
          students: prev.students.filter(s => s.id !== id),
          gradesAndComments: prev.gradesAndComments.filter(g => g.studentId !== id)
        }));
        return;
      }
      try {
        const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
        updateOfflineState(prev => ({
          ...prev,
          students: prev.students.filter(s => s.id !== id),
          gradesAndComments: prev.gradesAndComments.filter(g => g.studentId !== id)
        }));
        setIsOfflineMode(true);
      }
    });
  };

  const handlePostLessonComment = async (lessonId: string) => {
    if (!currentUser || !newLessonCommentContent.trim()) return;
    playClickSound();
    if (isOfflineMode) {
      const role: 'teacher' | 'student' | 'parent' = currentRole === 'teacher' ? 'teacher' : currentRole === 'parent' ? 'parent' : 'student';
      const newComment = {
        id: "lc_" + Date.now(),
        authorName: currentUser.name,
        authorRole: role,
        authorId: currentUser.id,
        content: newLessonCommentContent,
        rating: newLessonCommentRating,
        timestamp: new Date().toISOString()
      };
      updateOfflineState(prev => {
        const lessons = prev.lessons.map(l => {
          if (l.id === lessonId) {
            const comments = l.comments || [];
            return { ...l, comments: [...comments, newComment] };
          }
          return l;
        });
        return { ...prev, lessons };
      });
      setNewLessonCommentContent("");
      setNewLessonCommentRating(5);
      playSparkleSound();
      // Update locally selected lesson explorer
      const updatedLesson = appState.lessons.find(l => l.id === lessonId);
      if (updatedLesson) {
        setSelectedExploreLesson({
          ...updatedLesson,
          comments: [...(updatedLesson.comments || []), newComment]
        });
      }
      return;
    }
    try {
      const role: 'teacher' | 'student' | 'parent' = currentRole === 'teacher' ? 'teacher' : currentRole === 'parent' ? 'parent' : 'student';
      const res = await fetch(`/api/lessons/${lessonId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: currentUser.name,
          authorRole: role,
          authorId: currentUser.id,
          content: newLessonCommentContent,
          rating: newLessonCommentRating
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewLessonCommentContent("");
        setNewLessonCommentRating(5);
        playSparkleSound();
        fetchState();
        const updatedLesson = data.lessons.find((l: any) => l.id === lessonId);
        if (updatedLesson) {
          setSelectedExploreLesson(updatedLesson);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback offline
      const role: 'teacher' | 'student' | 'parent' = currentRole === 'teacher' ? 'teacher' : currentRole === 'parent' ? 'parent' : 'student';
      const newComment = {
        id: "lc_" + Date.now(),
        authorName: currentUser.name,
        authorRole: role,
        authorId: currentUser.id,
        content: newLessonCommentContent,
        rating: newLessonCommentRating,
        timestamp: new Date().toISOString()
      };
      updateOfflineState(prev => {
        const lessons = prev.lessons.map(l => {
          if (l.id === lessonId) {
            const comments = l.comments || [];
            return { ...l, comments: [...comments, newComment] };
          }
          return l;
        });
        return { ...prev, lessons };
      });
      setNewLessonCommentContent("");
      setNewLessonCommentRating(5);
      playSparkleSound();
      const updatedLesson = appState.lessons.find(l => l.id === lessonId);
      if (updatedLesson) {
        setSelectedExploreLesson({
          ...updatedLesson,
          comments: [...(updatedLesson.comments || []), newComment]
        });
      }
      setIsOfflineMode(true);
    }
  };

  const handleToggleBadge = async (studentId: string, badgeName: string, hasBadge: boolean) => {
    playClickSound();
    if (isOfflineMode) {
      updateOfflineState(prev => {
        const students = prev.students.map(s => {
          if (s.id === studentId) {
            let badges = s.badges || [];
            if (hasBadge) {
              badges = badges.filter(b => b !== badgeName);
            } else {
              if (!badges.includes(badgeName)) {
                badges = [...badges, badgeName];
              }
            }
            return { ...s, badges };
          }
          return s;
        });
        return { ...prev, students };
      });
      return;
    }
    try {
      const url = hasBadge ? `/api/students/${studentId}/remove-badge` : `/api/students/${studentId}/award-badge`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge: badgeName })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error(err);
      updateOfflineState(prev => {
        const students = prev.students.map(s => {
          if (s.id === studentId) {
            let badges = s.badges || [];
            if (hasBadge) {
              badges = badges.filter(b => b !== badgeName);
            } else {
              if (!badges.includes(badgeName)) {
                badges = [...badges, badgeName];
              }
            }
            return { ...s, badges };
          }
          return s;
        });
        return { ...prev, students };
      });
      setIsOfflineMode(true);
    }
  };

  // Add Lesson
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      alert("Cần điền tiêu đề học liệu!");
      return;
    }
    playClickSound();
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLesson?.id,
          title: lessonForm.title,
          type: lessonForm.type,
          url: lessonForm.url,
          description: lessonForm.description,
          categoryIndex: activeCategoryIndex !== null ? activeCategoryIndex : lessonForm.categoryIndex
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddLessonModal(false);
        setEditingLesson(null);
        setLessonForm({ title: "", type: "video", url: "", description: "", categoryIndex: 1 });
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditLessonTrigger = (lesson: Lesson, categoryIdx: number) => {
    playClickSound();
    setEditingLesson(lesson);
    setActiveCategoryIndex(categoryIdx);
    
    const standardTypes = ["video", "game", "pdf", "experiment", "mindmap", "link"];
    if (!standardTypes.includes(lesson.type) && !customLessonTypes.includes(lesson.type)) {
      setCustomLessonTypes(prev => [...prev, lesson.type]);
    }

    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      url: lesson.url,
      description: lesson.description || "",
      categoryIndex: categoryIdx
    });
    setShowAddLessonModal(true);
  };

  const handleDeleteLesson = async (id: string) => {
    requestConfirmation("Có chắc chắn muốn xóa học liệu này không?", async () => {
      playClickSound();
      try {
        const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Student Worksheets answers
  const handleWorksheetSubmit = async (answers: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: currentUser.name,
          studentId: currentUser.id,
          sheetId: appState.studySheets[0]?.id || "ws1",
          sheetTitle: appState.studySheets[0]?.title || "Phiếu Học Tập Mặc Định",
          answers
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mindmap Save
  const handleMindmapSave = async (title: string, nodes: any[]) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/mindmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: currentUser.name,
          studentId: currentUser.id,
          title,
          nodes: JSON.stringify(nodes),
          edges: "[]"
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Review Sheet Work Submission
  const handleReviewSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    playClickSound();
    try {
      const res = await fetch("/api/submissions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          comment: reviewComment,
          stars: reviewStars
        })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSubmission(null);
        setReviewComment("");
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save general notebook
  const handleSaveNotebook = async () => {
    playClickSound();
    try {
      const res = await fetch("/api/teacher/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteInputValue })
      });
      const data = await res.json();
      if (data.success) {
        playSparkleSound();
        fetchState();
        alert("📝 Đã lưu vào sổ tay ghi chú của giáo viên.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save teacher profile update
  const handleSaveTeacherProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormName.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileFormName,
          avatar: profileFormAvatar,
          themeColor: profileFormThemeColor
        })
      });
      const data = await res.json();
      if (data.success) {
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create lesson plan or curriculum document
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormTitle.trim() || !planFormContent.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/teacher/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: planFormTitle, content: planFormContent, type: planFormType, link: planFormLink })
      });
      const data = await res.json();
      if (data.success) {
        setPlanFormTitle("");
        setPlanFormContent("");
        setPlanFormLink("");
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create event schedules
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormTitle.trim() || !eventFormDate) return;
    playClickSound();
    try {
      const res = await fetch("/api/teacher/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventFormTitle, date: eventFormDate, time: eventFormTime })
      });
      const data = await res.json();
      if (data.success) {
        setEventFormTitle("");
        setEventFormDate("");
        setEventFormTime("");
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update sheet template 
  const handleCreateStudySheetTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetFormTitle.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/study-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sheetFormTitle, imageUrl: sheetFormUrl })
      });
      const data = await res.json();
      if (data.success) {
        setSheetFormTitle("");
        setSheetFormUrl("");
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    requestConfirmation("Bạn có chắc muốn xóa kế hoạch/giáo án này?", async () => {
      playClickSound();
      try {
        const res = await fetch(`/api/teacher/plans/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteEvent = async (id: string) => {
    requestConfirmation("Bạn có chắc muốn xóa sự kiện lịch trình này?", async () => {
      playClickSound();
      try {
        const res = await fetch(`/api/teacher/events/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteStudySheetTemplate = async (id: string) => {
    requestConfirmation("Bạn có chắc muốn xóa phiếu học tập mẫu này?", async () => {
      playClickSound();
      try {
        const res = await fetch(`/api/teacher/sheets/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteDiscussionThread = async (id: string) => {
    requestConfirmation("Bạn có chắc muốn xóa chủ đề thảo luận này và toàn bộ bình luận của học sinh?", async () => {
      playClickSound();
      try {
        const res = await fetch(`/api/discussions/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Update student scores & parent reports
  const handleUpdateGrades = async (studentId: string) => {
    const changes = gradeInputMap[studentId];
    if (!changes) return;
    playClickSound();
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          midTermScore: changes.mid,
          finalScore: changes.final,
          weeklyComment: changes.comment,
          attendanceScore: changes.att
        })
      });
      const data = await res.json();
      if (data.success) {
        playSparkleSound();
        fetchState();
        alert("⭐ Đã cập nhật kết quả học tập & nhận xét gửi cho phụ huynh bé!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeInputChange = (studentId: string, field: 'mid' | 'final' | 'comment' | 'att', value: any) => {
    const existing = gradeInputMap[studentId] || {
      mid: appState.gradesAndComments.find(g => g.studentId === studentId)?.midTermScore || 10,
      final: appState.gradesAndComments.find(g => g.studentId === studentId)?.finalScore || 10,
      comment: appState.gradesAndComments.find(g => g.studentId === studentId)?.weeklyComment || "",
      att: appState.gradesAndComments.find(g => g.studentId === studentId)?.attendanceScore || "Tốt"
    };

    setGradeInputMap({
      ...gradeInputMap,
      [studentId]: {
        ...existing,
        [field]: value
      }
    });
  };

  // Create discussion boards
  const handleCreateDiscussionThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/discussions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDiscussionTitle, content: newDiscussionContent })
      });
      const data = await res.json();
      if (data.success) {
        setNewDiscussionContent("");
        setNewDiscussionTitle("");
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostDiscussionComment = async (threadId: string) => {
    if (!currentUser || !discussionFormContent.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/discussions/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          studentName: currentUser.name,
          studentId: currentUser.id,
          content: discussionFormContent,
          stars: selectedStarRating
        })
      });
      const data = await res.json();
      if (data.success) {
        setDiscussionFormContent("");
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Parent feedback
  const handlePostParentFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !parentFeedbackInput.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/parent-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: currentUser.id.replace(" (Phụ huynh)", ""),
          studentName: currentUser.name.replace(" (Phụ huynh)", ""),
          parentName: "Phụ huynh " + currentUser.name.replace(" (Phụ huynh)", ""),
          message: parentFeedbackInput
        })
      });
      const data = await res.json();
      if (data.success) {
        setParentFeedbackInput("");
        playSparkleSound();
        fetchState();
        alert("✉️ Đã gửi tin nhắn phản hồi trực tiếp cho Giáo viên lớp học!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit teacher reply to parent feedback
  const handleTeacherReplyFeedback = async (feedbackId: string) => {
    const replyText = teacherReplyMap[feedbackId];
    if (!replyText || !replyText.trim()) return;
    playClickSound();
    try {
      const res = await fetch("/api/parent-feedback/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId,
          reply: replyText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setTeacherReplyMap({
          ...teacherReplyMap,
          [feedbackId]: ""
        });
        playSparkleSound();
        fetchState();
        alert("✉️ Đã gửi phản hồi đến phụ huynh thành công!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Teacher settings UI adjustments
  const handleUpdateTeacherProfile = async (field: keyof TeacherProfile, value: string) => {
    playClickSound();
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (data.success) {
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic reset state to keep test runs easy
  const handleResetBackendState = async () => {
    requestConfirmation("Hệ thống sẽ làm trống mọi học liệu, phiếu nộp, các điểm danh để bạn cài lại từ đầu. Chắc chắn chứ?", async () => {
      playClickSound();
      try {
        const res = await fetch("/api/state/reset", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          playSparkleSound();
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  // Helper filter for searching lessons in Student & Teacher tabs
  const filteredLessonsOfCategory = (catIdx: number) => {
    return appState.lessons.filter(l => 
      l.categoryIndex === catIdx &&
      (lessonSearchQuery === "" || l.title.toLowerCase().includes(lessonSearchQuery.toLowerCase()))
    );
  };

  // Dynamic color palette mapping based on teacher profile themeColor
  const themeAccentColor = appState.teacherProfile.themeColor;
  const rawThemeColors: Record<string, string> = {
    emerald: "from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 focus:ring-emerald-400 bg-emerald-500 text-white selection:bg-emerald-200 text-emerald-800 border-emerald-400 bg-emerald-50",
    amber: "from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 focus:ring-amber-500 bg-amber-500 text-white selection:bg-amber-200 text-amber-800 border-amber-400 bg-amber-50",
    cyan: "from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 focus:ring-cyan-400 bg-cyan-500 text-white selection:bg-cyan-200 text-cyan-800 border-cyan-400 bg-cyan-50",
    rose: "from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 focus:ring-rose-400 bg-rose-500 text-white selection:bg-rose-200 text-rose-800 border-rose-400 bg-rose-50",
    indigo: "from-indigo-400 to-violet-500 hover:from-indigo-500 hover:to-violet-600 focus:ring-indigo-400 bg-indigo-500 text-white selection:bg-indigo-200 text-indigo-800 border-indigo-400 bg-indigo-50",
    violet: "from-violet-400 to-fuchsia-500 hover:from-violet-500 hover:to-fuchsia-650 focus:ring-violet-400 bg-violet-500 text-white selection:bg-violet-200 text-violet-800 border-violet-400 bg-violet-50"
  };

  const activeThemeClass = rawThemeColors[themeAccentColor] || rawThemeColors.emerald;

  const getThemeGradient = () => {
    switch (themeAccentColor) {
      case 'amber': return 'from-amber-400 to-orange-400';
      case 'cyan': return 'from-cyan-400 to-blue-500';
      case 'rose': return 'from-rose-400 to-red-500';
      case 'indigo': return 'from-indigo-400 to-violet-500';
      case 'violet': return 'from-violet-400 to-fuchsia-500';
      default: return 'from-emerald-400 to-teal-500';
    }
  };

  const getThemeBgLight = () => {
    switch (themeAccentColor) {
      case 'amber': return 'bg-amber-50';
      case 'cyan': return 'bg-cyan-50';
      case 'rose': return 'bg-rose-50';
      case 'indigo': return 'bg-indigo-50';
      case 'violet': return 'bg-violet-50';
      default: return 'bg-emerald-50';
    }
  };

  const getThemeBorderLight = () => {
    switch (themeAccentColor) {
      case 'amber': return 'border-amber-200';
      case 'cyan': return 'border-cyan-200';
      case 'rose': return 'border-rose-200';
      case 'indigo': return 'border-[#DDD6FE]';
      case 'violet': return 'border-fuchsia-200';
      default: return 'border-emerald-250';
    }
  };

  const getThemeTextDark = () => {
    switch (themeAccentColor) {
      case 'amber': return 'text-amber-955 font-black';
      case 'cyan': return 'text-cyan-950 font-black';
      case 'rose': return 'text-rose-950 font-black';
      case 'indigo': return 'text-indigo-950 font-black';
      case 'violet': return 'text-violet-950 font-black';
      default: return 'text-emerald-850 font-black';
    }
  };

  const getThemeActiveBorder = () => {
    switch (themeAccentColor) {
      case 'amber': return 'border-amber-400';
      case 'cyan': return 'border-cyan-400';
      case 'rose': return 'border-rose-400';
      case 'indigo': return 'border-[#818CF8]';
      case 'violet': return 'border-fuchsia-400';
      default: return 'border-emerald-400';
    }
  };

  return (
    <div className={`min-h-screen bg-[#FFFBEB] text-[#374151] font-sans relative flex flex-col ${
      appState.teacherProfile.mode === 'dark' ? "brightness-95 contrast-105" : ""
    }`}>

      {/* Floating Sparkle visual background ornaments */}
      <div className="absolute top-10 left-[20%] text-4xl opacity-15 pointer-events-none select-none animate-bounce delay-150">☁️</div>
      <div className="absolute bottom-24 left-[15%] text-4xl opacity-10 pointer-events-none select-none">🌿</div>
      <div className="absolute top-48 right-[10%] text-4xl opacity-15 pointer-events-none select-none animate-pulse">✨</div>
      <div className="absolute bottom-1/2 right-[25%] text-3xl opacity-10 pointer-events-none select-none">☁️</div>

      {/* Top Universal Classroom Banner Header */}
      <header className="sticky top-0 bg-white border-b-4 border-[#FDE047] z-40 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-md animate-spin-slow">
            <span className="text-2xl">🍄</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-orange-600 block">KHOA HỌC LỚP 4 • VUI THỰC TẾ</span>
            <span className="text-xl font-black text-amber-950 italic tracking-tight">HỌC VUI!</span>
          </div>
        </div>

        {/* Global state and fast navigation */}
        <div className="flex items-center gap-2">
          {currentRole !== 'login' && (
            <div className="bg-amber-100/70 border-2 border-amber-300 rounded-2xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-amber-900 shadow-sm">
              <span>👤 Vai trò:</span>
              <span className="bg-white px-2 py-0.5 rounded-lg text-amber-700 capitalize border shadow-sm">
                {currentRole === 'teacher' ? "👩‍🏫 Giáo viên" : currentRole === 'student' ? "🧒 Học sinh" : "👨‍👩‍👧 Phụ huynh"}
              </span>
              <span className="hidden md:inline h-4 w-px bg-amber-300"></span>
              <span className="hidden md:inline text-amber-800">
                Chào, <strong>{currentUser?.name || "Bạn nhỏ"}</strong>!
              </span>
            </div>
          )}

          {currentRole !== 'login' ? (
            <button
              onClick={() => handleRoleSelection('login')}
              className="py-1.5 px-3 bg-red-100 hover:bg-red-200 border-2 border-red-400 text-red-700 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" /> Đổi vai trò
            </button>
          ) : (
            <span className="text-[11px] text-zinc-550 font-bold bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-yellow-300">
              ⚡ Hệ thống Đồng bộ Học liệu Số
            </span>
          )}
        </div>
      </header>

      {/* RENDER BODY BASED ON SELECTED ROLES */}
      <div className="flex-1 flex flex-col">
        
        {/* ======================= CASE A: LOGIN SECTION ======================= */}
        {currentRole === 'login' && (
          <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 flex flex-col justify-center">
            
            {/* Center greeting card with VUI HỌC KHOA HỌC as title */}
            <div className="text-center mb-10">
              <span className="text-6xl animate-bounce inline-block mb-3">🎒</span>
              <h1 className="text-4xl sm:text-5xl font-black text-amber-950 tracking-tight leading-tight uppercase">
                VUI HỌC KHOA HỌC
              </h1>
            </div>

            {/* Top Sub-tab selectors to compress login categories */}
            <div className="flex justify-center mb-8">
              <div className="bg-amber-100 p-1.5 rounded-2xl border-2 border-amber-300 flex gap-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setLoginSubTab('student'); }}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    loginSubTab === 'student'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  <span>🧒</span> Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => { playClickSound(); setLoginSubTab('teacher'); }}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    loginSubTab === 'teacher'
                      ? 'bg-yellow-500 text-yellow-950 shadow-md'
                      : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  <span>👩‍🏫</span> Giáo viên
                </button>
                <button
                  type="button"
                  onClick={() => { playClickSound(); setLoginSubTab('parent'); }}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                    loginSubTab === 'parent'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  <span>👨‍👩‍👧</span> Phụ huynh
                </button>
              </div>
            </div>

            {/* Collapsed Active Login Card */}
            <div className="w-full">
              
              {/* Option 1: 🧒 STUDENT ACCESS */}
              {loginSubTab === 'student' && (
                <div className="bg-[#DCFCE7] p-6 sm:p-8 rounded-[32px] border-4 border-emerald-400 shadow-xl max-w-md mx-auto w-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-white border-2 border-emerald-300 flex items-center justify-center text-3xl shadow-sm">🧒</div>
                    <h3 className="text-lg sm:text-xl font-black text-emerald-950 tracking-tight mt-3">HỌC SINH LỚP 4</h3>
                  </div>

                   <form onSubmit={handleStudentLoginWithCreds} className="bg-white rounded-2xl p-5 border-2 border-emerald-250 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-black text-emerald-850 text-left">Họ tên của em:</label>
                      <input
                        type="text"
                        placeholder="Hãy nhập họ tên của em có trong danh sách..."
                        value={studentLoginName}
                        onChange={(e) => setStudentLoginName(e.target.value)}
                        className="w-full text-xs p-3 border-2 border-emerald-200 bg-[#F0FDF4] rounded-xl outline-none text-emerald-950 font-bold"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full mt-2 py-3 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Vào Lớp Khám Phá</span> <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-emerald-600 italic text-center">💡 Nhập đúng họ tên mà cô giáo đã thêm trong danh sách sỹ số nhé!</p>
                  </form>
                </div>
              )}

              {/* Option 2: 👩‍🏫 TEACHER PORTAL ACCESS */}
              {loginSubTab === 'teacher' && (
                <div className="bg-[#FEF9C3] p-6 sm:p-8 rounded-[32px] border-4 border-yellow-400 shadow-xl max-w-md mx-auto w-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-white border-2 border-yellow-300 flex items-center justify-center text-3xl shadow-sm">👩‍🏫</div>
                    <h3 className="text-lg sm:text-xl font-black text-yellow-950 tracking-tight mt-3">CÔ GIÁO THÙY DƯƠNG</h3>
                    <p className="text-xs font-bold text-yellow-800 mt-1">Soạn bài giảng, bổ sung học sinh, chấm bài nộp và quản lý học liệu</p>
                  </div>

                  <form onSubmit={handleTeacherLoginSubmit} className="bg-white rounded-2xl p-5 border-2 border-yellow-250 flex flex-col gap-3">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black text-yellow-900 uppercase">Mã đăng nhập cô giáo:</label>
                      <input
                        type="text"
                        placeholder="Nhập mã đăng nhập cô giáo..."
                        className="w-full text-xs p-3 border-2 border-yellow-200 bg-yellow-50 rounded-xl outline-none text-yellow-950 font-bold"
                        value={teacherLoginCode}
                        onChange={(e) => setTeacherLoginCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black text-yellow-900 uppercase">Mật khẩu giáo viên:</label>
                      <input
                        type="password"
                        placeholder="Nhập mật khẩu..."
                        className="w-full text-xs p-3 border-2 border-yellow-200 bg-yellow-50 rounded-xl outline-none text-yellow-950 font-bold"
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-2 py-3 bg-[#EAB308] hover:bg-[#CA8A04] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Vào Bảng Dạy Học</span> <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Option 3: 👨‍👩‍👧 PARENT ACCOUNT LINK */}
              {loginSubTab === 'parent' && (
                <div className="bg-[#FFE4E6] p-6 sm:p-8 rounded-[32px] border-4 border-rose-300 shadow-xl max-w-md mx-auto w-full transition-all duration-300">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-3xl bg-white border-2 border-rose-300 flex items-center justify-center text-3xl shadow-sm">👨‍👩‍👧</div>
                    <h3 className="text-lg sm:text-xl font-black text-rose-950 tracking-tight mt-3">GÓC PHỤ HUYNH</h3>
                    <p className="text-xs font-bold text-rose-700 mt-1">Theo dõi điểm sao và bảng kết quả học tập phiếu online của bé</p>
                  </div>

                  <form onSubmit={handleParentLoginSubmit} className="bg-white rounded-2xl p-5 border-2 border-rose-250 flex flex-col gap-3">
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black text-rose-850 uppercase">Họ tên phụ huynh:</label>
                      <input
                        type="text"
                        placeholder="Nhập họ tên của ba hoặc mẹ"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        className="w-full text-xs p-3 border-2 border-rose-200 bg-rose-50 rounded-xl outline-none text-rose-950 font-bold"
                        required
                      />
                    </div>
                     <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black text-rose-850 uppercase">Họ tên con (học sinh):</label>
                      <input
                        type="text"
                        placeholder="Gõ đúng tên bé, vd: Minh Khang"
                        value={parentSearchChild}
                        onChange={(e) => setParentSearchChild(e.target.value)}
                        className="w-full text-xs p-3 border-2 border-rose-200 bg-rose-50 rounded-xl outline-none text-rose-950 font-bold"
                        required
                      />
                    </div>
                    
                    {appState.students && appState.students.length > 0 && (
                      <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-zinc-600 font-bold text-center leading-relaxed">
                        <span>📋 DANH SÁCH BÉ TRONG SỔ LỚP (Bấm để chọn tự điền):</span>
                        <div className="flex flex-wrap gap-1.5 justify-center mt-1.5">
                          {appState.students.map(st => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => { playClickSound(); setParentSearchChild(st.name); }}
                              className="px-2 py-0.5 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-lg font-black transition-all text-[9px] cursor-pointer"
                            >
                              {st.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[10px] font-black text-rose-850 uppercase">Mã lớp con học (Mặc định: KHOAHOC4):</label>
                      <input
                        type="text"
                        placeholder="Nhập mã lớp..."
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value)}
                        className="w-full text-xs p-3 border-2 border-rose-200 bg-rose-50 rounded-xl outline-none text-rose-950 font-bold"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full mt-1 py-3 bg-[#F43F5E] hover:bg-[#E11D48] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <span>Đồng Bộ Phụ Huynh</span> <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10.5px] text-rose-600 italic text-center font-bold">💡 Gợi ý mã lớp: KHOAHOC4 (hệ thống tự điền sẵn cho ba mẹ)</p>
                  </form>
                </div>
              )}

            </div>

            {/* Customized accompanied tag button replace old clean database button */}
            <div className="mt-14 text-center">
              <button
                onClick={handleResetBackendState}
                className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-955 text-xs font-black uppercase rounded-2xl shadow-sm border border-amber-300 cursor-pointer active:scale-95 transition-all"
                title="Đồng hành học tập"
              >
                🤝 ĐỒNG HÀNH CÙNG BÉ
              </button>
            </div>

          </div>
        )}

        {/* ======================= CASE B: TEACHER WORKSPACE ======================= */}
        {currentRole === 'teacher' && (
          <div className="flex-1 flex flex-row h-full">
            
            {/* 1. Left Vertical Menu Sidebar */}
            <aside className="w-20 sm:w-24 md:w-28 lg:w-32 bg-white border-r-4 border-[#FDE047] flex flex-col p-2.5 sm:p-4 gap-3 shrink-0">
              <div className={`flex flex-col items-center gap-1 mb-4 p-1.5 sm:p-2 rounded-2xl border ${getThemeBgLight()} ${getThemeBorderLight()}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 flex items-center justify-center text-lg sm:text-xl shadow-sm select-none shrink-0 ${getThemeActiveBorder()}`} title={appState.teacherProfile.name || "Giáo viên"}>
                  {appState.teacherProfile.avatar || "👩‍🏫"}
                </div>
                <span className={`hidden sm:inline text-[8px] font-black uppercase tracking-tighter text-center max-w-full truncate ${getThemeTextDark()}`}>
                  {appState.teacherProfile.name || "Cô Dương"}
                </span>
              </div>

              {/* Navigation column list (as squares with stickers) */}
              <nav className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => { playClickSound(); setTeacherActiveTab('dashboard'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    teacherActiveTab === 'dashboard'
                      ? 'bg-amber-100 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                  title="Bảng điều khiển"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">📊</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Thống kê
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setTeacherActiveTab('students'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    teacherActiveTab === 'students'
                      ? 'bg-amber-100 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                  title="Học sinh & Điểm danh"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">🧒</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Học sinh
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setTeacherActiveTab('lessons'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    teacherActiveTab === 'lessons'
                      ? 'bg-amber-100 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                  title="Học liệu lớp học"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">📚</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Học liệu
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setTeacherActiveTab('parentInfo'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    teacherActiveTab === 'parentInfo'
                      ? 'bg-amber-100 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                  title="Phụ huynh"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">👨‍👩‍👧</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Phụ huynh
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setTeacherActiveTab('notes'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    teacherActiveTab === 'notes'
                      ? 'bg-amber-100 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                  title="Sổ tay kế hoạch & Giáo án"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">📓</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Kế hoạch & GA
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setTeacherActiveTab('profile'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    teacherActiveTab === 'profile'
                      ? 'bg-amber-100 hover:bg-amber-100 text-amber-950 border-amber-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-amber-50 hover:border-amber-200'
                  }`}
                  title="Trang cá nhân & Profile của tôi"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">👤</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Cá nhân
                  </span>
                </button>
              </nav>

              {/* Sidebar bottom decoration/quick switch */}
              <div className="mt-auto hidden sm:flex flex-col gap-1 p-2 bg-teal-50 rounded-2xl border border-teal-200 text-center">
                <p className="text-[8px] sm:text-[9px] font-black text-teal-850 uppercase tracking-tighter">
                  ⚡ ĐỒNG BỘ
                </p>
              </div>
            </aside>

            {/* 2. Right Workspace Panel */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
              
              {/* ================================== TAB B1: TEACHER DASHBOARD ================================== */}
              {teacherActiveTab === 'dashboard' && (
                <div className="flex flex-col gap-6">

                  {/* Header Strip with total updates */}
                  <div className="bg-white p-6 rounded-[32px] border-4 border-[#FDE047] shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-amber-950">BẢNG QUẢN LÝ LỚP KHOA HỌC 4A</h2>
                      <p className="text-xs text-zinc-600 font-bold mt-1">Chào mừng cô Thùy Dương, hệ thống đang đồng bộ liên tục với học sinh.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetBackendState}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-750 font-black text-xs border-2 border-rose-300 rounded-xl transition-all"
                      >
                        🧹 Xóa Sạch Bài / reset số liệu
                      </button>
                    </div>
                  </div>

                  {/* Metrics & Statistical Bar Charts column (Sơ đồ hình cột) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Visual Bar chart representations of classroom data. Default 0 unless populated */}
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-200 shadow-md md:col-span-2 flex flex-col">
                      <h3 className="font-black text-sm uppercase text-amber-900 mb-4 flex items-center justify-between">
                        <span>📊 BIỂU ĐỒ SỐ LIỆU TƯƠNG TÁC LỚP HỌC</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">Thời gian thực</span>
                      </h3>

                      {/* We make a beautiful responsive pure-CSS bar chart showing exact metrics */}
                      <div className="flex-1 flex flex-col justify-center gap-5 py-4">
                        
                        {/* Bar 1: lessons */}
                        <div className="flex items-center gap-3">
                          <span className="w-28 text-[11px] font-black text-zinc-650 uppercase">1. Số bài giảng</span>
                          <div className="flex-1 bg-zinc-100 h-6 rounded-full overflow-hidden flex items-center relative">
                            <div
                              className="bg-sky-400 h-full transition-all duration-500 rounded-full"
                              style={{ width: `${Math.min(100, (appState.lessons.length * 10) || 5)}%` }}
                            />
                            <span className="absolute left-3 text-[10px] font-black text-zinc-900">{appState.lessons.length} bài giảng được đăng tải</span>
                          </div>
                        </div>

                        {/* Bar 2: students */}
                        <div className="flex items-center gap-3">
                          <span className="w-28 text-[11px] font-black text-zinc-650 uppercase">2. Số học sinh</span>
                          <div className="flex-1 bg-zinc-100 h-6 rounded-full overflow-hidden flex items-center relative">
                            <div
                              className="bg-emerald-400 h-full transition-all duration-500 rounded-full"
                              style={{ width: `${Math.min(100, (appState.students.length * 8) || 5)}%` }}
                            />
                            <span className="absolute left-3 text-[10px] font-black text-zinc-900">
                              {appState.students.length} học sinh trong danh sách lớp
                            </span>
                          </div>
                        </div>

                        {/* Bar 3: parents */}
                        <div className="flex items-center gap-3">
                          <span className="w-28 text-[11px] font-black text-zinc-650 uppercase">3. Số phụ huynh</span>
                          <div className="flex-1 bg-zinc-100 h-6 rounded-full overflow-hidden flex items-center relative">
                            <div
                              className="bg-purple-400 h-full transition-all duration-500 rounded-full"
                              style={{ width: `${Math.min(100, (appState.parentFeedback.length * 10) || 5)}%` }}
                            />
                            <span className="absolute left-3 text-[10px] font-black text-zinc-900">{appState.parentFeedback.length} phụ huynh gửi phản hồi/tương tác</span>
                          </div>
                        </div>

                      </div>
                      
                      <div className="mt-3 border-t pt-3 text-[10px] font-bold text-zinc-600 flex justify-between">
                        <span>💡 Đạt mốc tối đa 100% khi có đầy đủ bài giảng và bài tập.</span>
                        <span className="text-teal-700">Đồng bộ tự động</span>
                      </div>
                    </div>

                    {/* Quick Notifications Ledger */}
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-200 shadow-md flex flex-col justify-between">
                      <div>
                        <h3 className="font-black text-xs uppercase text-zinc-650 mb-3 block">🔔 THÔNG BÁO HOẠT ĐỘNG MỚI</h3>
                        
                        <div className="space-y-2.5 max-h-56 overflow-y-auto">
                          {appState.workbookSubmissions.length === 0 && appState.mindmapSubmissions.length === 0 ? (
                            <p className="text-xs text-zinc-650 italic">Hiện tại quy về số 0 vì chưa tạo bài học hay chưa có học sinh nộp bài tập nào.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {appState.workbookSubmissions.slice(-3).map((sub, i) => (
                                <div key={i} className="p-2 bg-purple-50 rounded-xl border border-purple-200 text-xs">
                                  <strong>🧒 {sub.studentName}</strong> đã nộp Phiếu bài tập online <strong>{sub.sheetTitle}</strong>!
                                </div>
                              ))}
                              {appState.mindmapSubmissions.slice(-3).map((sub, i) => (
                                <div key={i} className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                                  <strong>🧠 {sub.studentName}</strong> vừa lưu sơ đồ tư duy mới lên lớp.
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-3 mt-4 text-center">
                        <button
                          onClick={() => { playClickSound(); setTeacherActiveTab('students'); }}
                          className="text-xs font-black text-amber-805 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          Xem chi tiết các bài tập nộp ngay <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}
                               {/* ================================== TAB B2: STUDENTS MANAGEMENT ================================== */}
              {teacherActiveTab === 'students' && (
                <div className="flex flex-col gap-6">
                  
                  {/* Top sub-tabs switch */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-emerald-50 rounded-2xl border border-emerald-200 self-start">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setTeacherStudentActiveSubTab('roster'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        teacherStudentActiveSubTab === 'roster'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-zinc-650 hover:bg-emerald-100/30'
                      }`}
                    >
                      🧒 Sỹ số lớp học & Thêm học sinh
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setTeacherStudentActiveSubTab('submissions'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        teacherStudentActiveSubTab === 'submissions'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'text-zinc-650 hover:bg-emerald-100/30'
                      }`}
                    >
                      📝 Bài nộp của học sinh ({appState.workbookSubmissions.length})
                    </button>
                  </div>

                  {/* SUB-TAB 1: Sỹ SỐ LỚP HỌC & THÊM HỌC SINH */}
                  {teacherStudentActiveSubTab === 'roster' && (
                    <div className="flex flex-col gap-6 animate-fade-in">
                      {/* Student account creator form */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-300 shadow-md">
                        <h3 className="font-black text-sm uppercase text-emerald-950 mb-3">🧑‍🎓 SỸ SỐ LỚP HỌC (TỔNG SỐ HỌC SINH: {appState.students.length} EM)</h3>
                        
                        <form onSubmit={handleAddStudent} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhập họ và tên học sinh mới... (vd: Nguyễn Thùy Trang)"
                            value={studentFormName}
                            onChange={(e) => setStudentFormName(e.target.value)}
                            className="flex-grow p-2.5 bg-zinc-50 border-2 border-emerald-200 rounded-xl outline-none focus:border-emerald-400 font-bold text-xs"
                          />
                          <button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wide rounded-xl shadow-md cursor-pointer active:scale-95 transition-all text-xs flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> THÊM HỌC SINH
                          </button>
                        </form>

                        <p className="text-[10px] text-zinc-650 mt-2 italic">⚠️ Khi được thêm vào, học sinh chỉ cần tự điền chính xác họ tên của mình ngoài trang đăng nhập để vào rèn trực tuyến cùng cả lớp.</p>
                      </div>

                      {/* Student roster & attendance check-ins */}
                      {/* Student roster & attendance check-ins */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-200 shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-150">
                          <div>
                            <h4 className="font-black text-sm uppercase text-amber-950 flex items-center gap-1.5">
                              <span>📋</span> QUẢN LÝ ĐIỂM DANH ĐA NGÀY / SỔ TIẾT HỌC
                            </h4>
                            <p className="text-[10px] text-zinc-550 font-bold mt-1">
                              Cô giáo có thể tích hợp thêm các "Ngày 1, Ngày 2..." hoặc "Buổi 1, Buổi 2..." và trực tiếp đánh dấu chuyên cần cho từng học sinh.
                            </p>
                          </div>
                          <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full font-bold border border-amber-100 shrink-0 self-start sm:self-center">
                            Tổng sỹ số: {appState.students.length} em
                          </span>
                        </div>

                        {/* Add Attendance Day Bar */}
                        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 mb-4 flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-900 block shrink-0">➕ THÊM PHIÊN / NGÀY ĐIỂM DANH MỚI:</span>
                          </div>
                          
                          <div className="flex gap-2 flex-grow sm:flex-none max-w-sm w-full">
                            <input
                              type="text"
                              id="newAttendanceDayInput"
                              placeholder="Nhập tên ngày... (vd: Ngày 11 hoặc Buổi 3)"
                              className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl outline-none focus:border-amber-400 font-bold text-xs flex-grow"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                playClickSound();
                                const inputEl = document.getElementById("newAttendanceDayInput") as HTMLInputElement;
                                const customDay = inputEl?.value?.trim();
                                if (isOfflineMode) {
                                  const nextNum = (appState.attendanceDays || []).length + 1;
                                  const newDay = customDay || `Ngày ${nextNum}`;
                                  if ((appState.attendanceDays || []).includes(newDay)) {
                                    alert("Ngày này đã tồn tại rồi cô Thùy Dương ơi!");
                                    return;
                                  }
                                  updateOfflineState(prev => {
                                    const expandedDays = [...(prev.attendanceDays || []), newDay];
                                    return { ...prev, attendanceDays: expandedDays };
                                  });
                                  if (inputEl) inputEl.value = "";
                                  playSparkleSound();
                                  alert("➕ Thêm ngày điểm danh thành công!");
                                  return;
                                }
                                try {
                                  const res = await fetch("/api/students/attendance/add-day", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ dayName: customDay })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    if (inputEl) inputEl.value = "";
                                    playSparkleSound();
                                    fetchState();
                                    alert("➕ Thêm ngày điểm danh thành công!");
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-xl shadow-sm transition-all cursor-pointer"
                            >
                              Thêm Ngày
                            </button>
                          </div>
                        </div>

                        {/* List of students with inline multi-day toggles */}
                        <div className="divide-y max-h-128 overflow-y-auto pr-1">
                          {appState.students.map(student => {
                            const studentBadges = student.badges || [];
                            const isEditingBadges = editingStudentBadgesId === student.id;
                            const studentAttended = student.attendedDays || [];

                            return (
                              <div key={student.id} className="py-4 border-b last:border-b-0 flex flex-col gap-3">
                                {/* Student core row */}
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className={`w-3 h-3 rounded-full shrink-0 ${student.isPresent ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                                    <span className="font-black text-zinc-900 text-sm select-none">{student.name}</span>
                                    <span className="text-[9px] text-zinc-550 bg-zinc-100 px-1.5 rounded-full font-black">
                                      Mã: {student.id}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                    {/* Badge toggle action */}
                                    <button
                                      onClick={() => {
                                        playClickSound();
                                        setEditingStudentBadgesId(isEditingBadges ? null : student.id);
                                      }}
                                      className={`p-1.5 rounded-lg border font-black text-[10px] cursor-pointer flex items-center gap-0.5 transition-all ${
                                        isEditingBadges 
                                          ? 'bg-amber-150 text-amber-950 border-amber-300' 
                                          : 'bg-zinc-50 text-zinc-650 hover:bg-amber-50 border-zinc-250'
                                      }`}
                                      title="Quản lý danh hiệu/huy chương khoa học"
                                    >
                                      🏅 <span className="hidden sm:inline">Danh hiệu ({studentBadges.length})</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteStudent(student.id)}
                                      className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer shrink-0 transition-all"
                                      title="Xóa học sinh"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Multi-day interactive toggles for this student */}
                                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                                  <span className="text-[9px] font-black text-zinc-500 block mb-2 uppercase tracking-wide">
                                    TÍCH LŨY ĐIỂM DANH:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(appState.attendanceDays || [
                                      "Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5",
                                      "Ngày 6", "Ngày 7", "Ngày 8", "Ngày 9", "Ngày 10"
                                    ]).map(day => {
                                      const isDayAttended = studentAttended.includes(day);
                                      return (
                                        <button
                                          key={day}
                                          type="button"
                                          onClick={() => handleToggleAttendance(student.id, isDayAttended, day)}
                                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 cursor-pointer select-none ${
                                            isDayAttended
                                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold shadow-sm'
                                              : 'bg-white text-zinc-400 border-zinc-200 hover:border-emerald-200'
                                          }`}
                                          title={`Bấm để thay đổi điểm danh ${day} cho em ${student.name}`}
                                        >
                                          <span>{isDayAttended ? "🟢" : "⚫"}</span>
                                          <span>{day}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Row 2: Shelf of earned badges inline for teachers */}
                                <div className="flex flex-wrap gap-1 items-center px-1">
                                  <span className="text-[9px] font-black uppercase text-zinc-400 select-none mr-2">DANH HIỆU BẬC:</span>
                                  {studentBadges.map((b: string) => (
                                    <span 
                                      key={b} 
                                      className="text-[9px] bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded-full font-black flex items-center gap-0.5"
                                      title={b}
                                    >
                                      <span>{b.split(" ").slice(-1)[0]}</span>
                                      <span>{b.replace(/\s\S+$/, "")}</span>
                                    </span>
                                  ))}
                                  {studentBadges.length === 0 && (
                                    <span className="text-[9px] text-zinc-400 font-bold italic">Chưa đạt danh hiệu nào</span>
                                  )}
                                </div>

                                {/* Row 3: Live interactive badge management */}
                                {isEditingBadges && (
                                  <div className="mt-1.5 p-3 bg-amber-50/70 border-2 border-dashed border-amber-200 rounded-2xl flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-amber-950 uppercase flex items-center gap-1">
                                      <span>⚙️</span> TRAO BẬC & RÚT HUY CHƯƠNG: <span className="text-emerald-950 underline">{student.name}</span>
                                    </span>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                      {[
                                        "Chuyên Cần Tinh Anh 📅",
                                        "Bậc Thầy Sơ Đồ Tư Duy 🧠",
                                        "Nhà Bình Luận Tri Thức 💬",
                                        "Nhà Luận Chiến Khoa Học 🗣️",
                                        "Siêu Nhân Vở Bài Tập 📝",
                                        "Học Sinh Ưu Tú 🌟"
                                      ].map(badgeName => {
                                        const hasBadge = studentBadges.includes(badgeName);
                                        const cleanBadgeTitle = badgeName.replace(/\s\S+$/, "");
                                        const badgeIcon = badgeName.split(" ").slice(-1)[0];

                                        return (
                                          <button
                                            key={badgeName}
                                            onClick={() => handleToggleBadge(student.id, badgeName, hasBadge)}
                                            className={`py-1 px-2 rounded-xl text-[10px] font-black flex items-center justify-between border cursor-pointer select-none transition-all ${
                                              hasBadge
                                                ? 'bg-amber-100/90 text-amber-950 border-amber-300 shadow-sm'
                                                : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                                            }`}
                                          >
                                            <span className="truncate flex items-center gap-1">
                                              <span>{badgeIcon}</span>
                                              <span className="truncate">{cleanBadgeTitle}</span>
                                            </span>
                                            <span className="text-[8px] font-black ml-1">
                                              {hasBadge ? "🟢 Có" : "🔒 Khóa"}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: BÀI NỘP CỦA HỌC SINH */}
                  {teacherStudentActiveSubTab === 'submissions' && (
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-200 shadow-md animate-fade-in">
                      <h4 className="font-black text-xs uppercase text-purple-900 mb-3 block">📝 NHẬN XÉT PHIẾU BÀI TẬP TRỰC TUYẾN</h4>
                      
                      {appState.workbookSubmissions.length === 0 ? (
                        <p className="text-xs text-zinc-650 italic mt-6 text-center">Chưa có bài tập nộp sòng trực tuyến nào từ các em học sinh.</p>
                      ) : (
                        <div className="space-y-3">
                          {appState.workbookSubmissions.map(sub => (
                            <div key={sub.id} className="p-3 bg-zinc-50 rounded-2xl border-2 border-zinc-200 flex flex-col gap-2">
                              <div className="flex justify-between items-center text-xs">
                                <div>
                                  <strong className="text-zinc-900 text-sm block">🧑 Học sinh: {sub.studentName}</strong>
                                  <span className="text-[10px] text-zinc-500 block font-medium mt-0.5">Tác phẩm: {sub.sheetTitle} • Nộp lúc: {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { playClickSound(); setSelectedSubmission(sub); setReviewComment(sub.comment || ""); setReviewStars(sub.stars || 5); }}
                                  className="py-1 px-3 bg-[#E0F2FE] hover:bg-sky-200 border border-sky-300 text-sky-850 font-black rounded-lg text-[10px] uppercase cursor-pointer"
                                >
                                  {sub.comment ? "Cập Nhật Nhận Xét" : "🖊️ Đọc và Chấm"}
                                </button>
                              </div>

                              <div className="p-2.5 bg-white rounded-xl border text-xs text-zinc-750 font-semibold leading-relaxed">
                                <span className="font-bold text-[#B45309] block text-[10px] mb-1">DÒNG ĐÁP ÁN EM VIẾT:</span>
                                &ldquo;{sub.answers}&rdquo;
                              </div>

                              {sub.comment && (
                                <div className="text-[11px] bg-emerald-50 p-2 rounded-lg border border-emerald-250 flex items-center justify-between text-emerald-950 font-bold">
                                  <span>💬 Nhận xét của cô: &ldquo;{sub.comment}&rdquo;</span>
                                  <span className="flex text-amber-400 gap-0.5 font-bold shrink-0">
                                    {sub.stars} ⭐
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

                  {/* Submission detail reviewer pop modal */}
                  {selectedSubmission && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                      <div className="bg-white p-6 rounded-[32px] border-4 border-[#FDE047] w-full max-w-lg shadow-2xl relative">
                        <h3 className="font-black text-md text-amber-950 uppercase mb-4">🖊️ VIẾT LỜI NHẬN XÉT: {selectedSubmission.studentName}</h3>
                        
                        <form onSubmit={handleReviewSubmission} className="flex flex-col gap-4">
                          <div className="p-3 bg-zinc-50 rounded-xl max-h-36 overflow-y-auto border text-xs font-semibold leading-relaxed text-zinc-500">
                            <strong>ĐÁP ÁN HỌC SINH NỘP:</strong>
                            <p className="mt-1 text-zinc-800">&ldquo;{selectedSubmission.answers}&rdquo;</p>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-zinc-650 uppercase">ĐÁNH GIÁ ĐẠT ĐƯỢC (TẶNG SAO):</label>
                            <div className="flex gap-2">
                              {Array.from({ length: 5 }).map((_, i) => {
                                const starVal = i + 1;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => { playClickSound(); setReviewStars(starVal); }}
                                    className="p-1 hover:scale-110 active:scale-95 transition-all text-amber-400 cursor-pointer"
                                  >
                                    <Star className={`w-8 h-8 ${starVal <= reviewStars ? 'fill-amber-400' : 'text-zinc-200'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-zinc-650 uppercase">Ý KIẾN NHẬN XÉT KHÍCH LỆ CỦA CÔ GIÁO:</label>
                            <textarea
                              rows={3}
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Khen ngợi bé hoặc gợi mở hướng làm tốt hơn..."
                              className="w-full text-xs p-3 font-semibold border-2 border-zinc-200 rounded-xl outline-none focus:border-yellow-400"
                              required
                            />
                          </div>

                          <div className="flex gap-2 justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => { playClickSound(); setSelectedSubmission(null); }}
                              className="py-2 px-4 bg-zinc-100 hover:bg-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Đóng
                            </button>
                            <button
                              type="submit"
                              className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer"
                            >
                              Lưu và Gửi Bình Luận
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

              {/* ================================== TAB B3: HỌC LIỆU LỚP HỌC ================================== */}
              {teacherActiveTab === 'lessons' && (
                <div className="flex flex-col gap-6 text-zinc-800 w-full">
                  
                  {/* Top sub-tabs switch */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-amber-50 rounded-2xl border border-amber-200 self-start">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('lessons'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        materialActiveSubTab === 'lessons'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      📚 Bài học - 6 chủ đề
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('worksheets'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        materialActiveSubTab === 'worksheets'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      📄 Phiếu học tập
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('mindmaps'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        materialActiveSubTab === 'mindmaps'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      🧠 Sơ đồ tư duy
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('discussions'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        materialActiveSubTab === 'discussions'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      💬 Thảo luận lớp
                    </button>
                  </div>

                  {/* 1. Sub-tab: BÀI HỌC - 6 CHỦ ĐỀ */}
                  {materialActiveSubTab === 'lessons' && (
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-[#FDE047] shadow-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b pb-4">
                        <div>
                          <h3 className="font-black text-lg text-amber-950 uppercase tracking-tight">📚 HỆ THỐNG KHO HỌC LIỆU SỐ TỰ TẠO</h3>
                          <p className="text-xs text-zinc-650 font-bold mt-1">Các ý học liệu tuyệt đối không được tự tiện thêm vào. Chỉ khi cô giáo nhấp dấu cộng tạo bài thì trang học sinh mới đồng bộ hiển thị tức thì!</p>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                          <input
                            type="text"
                            placeholder="Tìm nhanh học liệu..."
                            value={lessonSearchQuery}
                            onChange={(e) => setLessonSearchQuery(e.target.value)}
                            className="p-2 bg-zinc-50 border border-zinc-300 rounded-xl font-bold text-xs outline-none"
                          />
                        </div>
                      </div>

                      {/* The 6 Subject Cards precisely in order 1-6 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SUBJECT_CATEGORIES.map((subjectTitle, i) => {
                          const categoryIdx = i + 1;
                          const subjectLessons = filteredLessonsOfCategory(categoryIdx);
                          const boxColorStyle = SUBJECT_COLORS[i] || SUBJECT_COLORS[0];
                          const iconCharacter = SUBJECT_EMOJIS[i] || "🧪";
                          const isExpanded = expandedCategoryIndex === categoryIdx;

                          return (
                            <div
                              key={categoryIdx}
                              onClick={() => {
                                playClickSound();
                                setExpandedCategoryIndex(isExpanded ? null : categoryIdx);
                              }}
                              className={`rounded-[32px] p-5 border-4 border-zinc-200 shadow-lg flex flex-col justify-between relative cursor-pointer hover:border-amber-400 hover:shadow-xl transition-all ${
                                isExpanded ? 'min-h-[300px] ring-4 ring-amber-250' : 'min-h-[160px]'
                              } ${boxColorStyle}`}
                            >
                              {/* Gấu biết tuốt circular badge in a corner of the card */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playClickSound();
                                  setExpandedCategoryIndex(isExpanded ? null : categoryIdx);
                                }}
                                className="absolute -top-3 -left-3 w-11 h-11 bg-white rounded-full border-4 border-amber-400 shadow-md flex items-center justify-center text-xl z-10 hover:scale-115 active:scale-95 transition-transform"
                                title="Gấu Biết Tuốt gợi ý học tập"
                              >
                                🐻
                              </div>

                              {/* Inner Header */}
                              <div>
                                <span className="text-5xl block mb-3">{iconCharacter}</span>
                                <h4 className="text-md font-black tracking-tight leading-tight uppercase mb-1">
                                  {subjectTitle}
                                </h4>
                                <span className="text-[10px] bg-white/70 px-2.5 py-0.5 rounded-full font-black border text-zinc-655 inline-block font-sans">
                                  {subjectLessons.length} bài đăng thực tế
                                </span>
                              </div>

                              {/* Lesson sublist details inside card */}
                              <div className="w-full">
                                {isExpanded ? (
                                  <div className="mt-4 space-y-2 max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-between items-center bg-white/80 p-1.5 px-2.5 rounded-2xl border border-zinc-200/50 mb-2 shadow-xs">
                                      <span className="text-[9px] font-black uppercase text-zinc-500">QUẢN LÝ BÀI GIẢNG:</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          playClickSound();
                                          setActiveCategoryIndex(categoryIdx);
                                          setEditingLesson(null);
                                          setLessonForm({ title: "", type: "video", url: "", description: "", categoryIndex: categoryIdx });
                                          setShowAddLessonModal(true);
                                        }}
                                        className="px-2 py-1 rounded-xl bg-green-500 hover:bg-green-650 text-white font-black text-[9px] cursor-pointer flex items-center gap-0.5"
                                        title="Thêm Bài Học Mới"
                                      >
                                        ➕ THÊM BÀI
                                      </button>
                                    </div>
                                    {subjectLessons.length === 0 ? (
                                      <p className="text-[11px] text-zinc-550 italic font-semibold">Trống trơn. Bấm nút "+ THÊM BÀI" ở trên để tạo nha cô!</p>
                                    ) : (
                                      subjectLessons.map(lesson => (
                                        <div
                                          key={lesson.id}
                                          className="p-2 bg-white rounded-xl border border-zinc-150 flex items-center justify-between text-xs"
                                        >
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-xs">
                                              {getLessonTypeIcon(lesson.type)}
                                            </span>
                                            <span className="font-bold truncate text-zinc-900" title={lesson.title}>
                                              {lesson.title}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0 ml-1">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                playClickSound();
                                                setSelectedExploreLesson(lesson);
                                              }}
                                              className="text-sky-500 hover:text-sky-700 font-black p-1 text-md cursor-pointer"
                                              title="Xem bình luận & đánh giá sao"
                                            >
                                              💬
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditLessonTrigger(lesson, categoryIdx);
                                              }}
                                              className="text-amber-500 font-black text-md hover:text-amber-700 p-1 cursor-pointer"
                                              title="Sửa học liệu"
                                            >
                                              ⚙️
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteLesson(lesson.id);
                                              }}
                                              className="text-rose-500 hover:text-rose-700 font-black p-1 text-md cursor-pointer"
                                              title="Xóa"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Sub-tab: PHIẾU HỌC TẬP */}
                  {materialActiveSubTab === 'worksheets' && (
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-200 shadow-md">
                      <h3 className="font-black text-sm uppercase text-amber-900 mb-3 flex items-center gap-2">
                        <span>📄</span> ĐƯA PHIẾU HỌC TẬP LÊN TRANG HỌC SINH
                      </h3>

                      {/* Mode choice buttons */}
                      <div className="flex gap-2 mb-4 bg-amber-50 p-1 rounded-2xl border border-amber-100 max-w-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setSheetUploadMode('upload');
                            playClickSound();
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                            sheetUploadMode === 'upload'
                              ? 'bg-amber-400 text-white shadow-sm'
                              : 'text-amber-800 hover:bg-amber-100/50'
                          }`}
                        >
                          📍 Tải tệp từ máy tính lên
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSheetUploadMode('url');
                            playClickSound();
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                            sheetUploadMode === 'url'
                              ? 'bg-amber-400 text-white shadow-sm'
                              : 'text-amber-800 hover:bg-amber-100/50'
                          }`}
                        >
                          🔗 Nhập đường dẫn liên kết
                        </button>
                      </div>

                      <form onSubmit={handleCreateStudySheetTemplate} className="flex flex-col gap-4">
                        {/* Title input */}
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest pl-1">
                            Tiêu đề bài tập hoặc tên phiếu học tập:
                          </label>
                          <input
                            type="text"
                            placeholder="Tiêu đề phiếu bài tập... (vd: Tìm hiểu hệ tiêu hóa lớp 4)"
                            value={sheetFormTitle}
                            onChange={(e) => setSheetFormTitle(e.target.value)}
                            className="p-3 w-full border-2 border-amber-200 rounded-xl outline-none font-bold text-xs bg-amber-50/20 focus:border-amber-400 focus:bg-white transition-all"
                            required
                          />
                        </div>

                        {/* File Upload Mode */}
                        {sheetUploadMode === 'upload' ? (
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest pl-1 text-left">
                              Chọn phiếu học tập mẫu từ máy tính của cô:
                            </label>
                            
                            {/* Drag and Drop Zone */}
                            <div
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  setIsSheetUploading(true);
                                  reader.onload = (event) => {
                                    if (event.target?.result && typeof event.target.result === "string") {
                                      setSheetFormUrl(event.target.result);
                                      if (!sheetFormTitle.trim()) {
                                        const nameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                        setSheetFormTitle(nameNoExt);
                                      }
                                      playSparkleSound();
                                    }
                                    setIsSheetUploading(false);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              onClick={() => {
                                const fileInput = document.getElementById("local-sheet-file-picker");
                                if (fileInput) fileInput.click();
                              }}
                              className="border-4 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/50 p-6 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group relative min-h-[120px]"
                            >
                              <input
                                id="local-sheet-file-picker"
                                type="file"
                                accept="image/*,application/pdf,audio/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    setIsSheetUploading(true);
                                    reader.onload = (event) => {
                                      if (event.target?.result && typeof event.target.result === "string") {
                                        setSheetFormUrl(event.target.result);
                                        if (!sheetFormTitle.trim()) {
                                          const nameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                          setSheetFormTitle(nameNoExt);
                                        }
                                        playSparkleSound();
                                      }
                                      setIsSheetUploading(false);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              
                              {isSheetUploading ? (
                                <div className="flex flex-col items-center gap-1.5">
                                  <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[10px] font-bold text-amber-900">Đang chuyển đổi tệp của cô...</span>
                                </div>
                              ) : (
                                <>
                                  <span className="text-3xl group-hover:scale-110 transition-transform">💻</span>
                                  <div>
                                    <span className="text-xs font-extrabold text-amber-950 block">Nhấp để chọn phiếu từ máy tính hoặc kéo thả tệp vào đây</span>
                                    <span className="text-[9px] text-zinc-500 block mt-0.5">Dạng ảnh (.png, .jpg, .gif), tài liệu (.pdf), hoặc tệp âm thanh nghe/video mẫu</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Local file state indicator */}
                            {sheetFormUrl && sheetFormUrl.startsWith("data:") && (
                              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col gap-2 text-left">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                                    🌟 CHUYỂN ĐỔI THÀNH CÔNG SANG PHIẾU ONLINE!
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSheetFormUrl("");
                                      playClickSound();
                                    }}
                                    className="text-rose-600 hover:underline font-bold"
                                  >
                                    Đổi tệp khác ❌
                                  </button>
                                </div>
                                <div className="border border-emerald-100 rounded-lg p-2 bg-white flex items-center justify-center text-center">
                                  {sheetFormUrl.startsWith("data:image/") ? (
                                    <img src={sheetFormUrl} alt="Preview" className="max-h-32 rounded object-contain" />
                                  ) : sheetFormUrl.startsWith("data:audio/") ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-lg">🔊 Bản ghi âm học tập</span>
                                      <audio src={sheetFormUrl} controls className="max-h-12 w-full max-w-xs" />
                                    </div>
                                  ) : sheetFormUrl.startsWith("data:video/") ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-lg">🎬 Clip bài tập khoa học</span>
                                      <video src={sheetFormUrl} controls className="max-h-32 rounded" />
                                    </div>
                                  ) : (
                                    <div className="py-2">
                                      <span className="text-xs font-bold text-zinc-650 block">📄 Học liệu PDF / Tài liệu Văn bản</span>
                                      <span className="text-[9px] text-zinc-400 block mt-0.5">Đã được chuyển sang dạng phiếu bài tập trực tuyến</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 text-left">
                            <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest pl-1">
                              Đường dẫn liên kết (URL ảnh hoặc tài liệu nhúng):
                            </label>
                            <input
                              type="text"
                              placeholder="Đường dẫn ảnh phiếu... (vd: https://images.unsplash.com/... hoặc link slide/youtube)"
                              value={sheetFormUrl}
                              onChange={(e) => setSheetFormUrl(e.target.value)}
                              className="p-3 w-full border-2 border-amber-200 rounded-xl outline-none font-bold text-xs bg-amber-50/20 focus:border-amber-400 focus:bg-white transition-all"
                            />
                            {sheetFormUrl && !sheetFormUrl.startsWith("data:") && (
                              <div className="p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-left">
                                <span className="text-[9px] font-bold text-zinc-500 block">Xem trước link liên kết:</span>
                                <span className="text-[10px] text-zinc-700 font-extrabold truncate block">{sheetFormUrl}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="py-3 px-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95 hover:shadow-lg transition-all"
                        >
                          🚀 Giao Phiếu Cho Cả Lớp
                        </button>
                      </form>
                      <p className="text-[10px] text-zinc-550 mt-3 font-medium">Khi cô giao phiếu, hệ thống sẽ chuyển đổi tệp/link này thành định dạng số. Toàn bộ học sinh sẽ mở ra, gõ bài làm online và nộp cô chấm lấy điểm sao trực tiếp!</p>

                      {/* Active worksheet templates listing with delete ('x') button */}
                      <div className="mt-4 bg-amber-50/40 p-4 rounded-2xl border-2 border-amber-200 text-xs text-left">
                        <strong className="text-amber-950 block mb-2 uppercase tracking-tight flex items-center gap-1">📋 Các phong phiếu bài tập đang giao cho lớp:</strong>
                        {appState.studySheets.length === 0 ? (
                          <span className="text-zinc-500 italic block">Chưa giao phiếu trực tuyến nào hết. Hãy tạo phiếu mẫu ở trên để giao bài!</span>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {appState.studySheets.map(sheet => (
                              <div key={sheet.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm">
                                <span className="font-extrabold text-zinc-850 truncate mr-2 flex items-center gap-1 select-none">
                                  <span>📄</span> <span>{sheet.title}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudySheetTemplate(sheet.id)}
                                  className="text-rose-500 hover:text-rose-700 font-bold p-1 hover:bg-rose-50 rounded-lg text-xs cursor-pointer w-6 h-6 flex items-center justify-center shrink-0 transition-all active:scale-90"
                                  title="Xóa phiếu bài giảng mẫu"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-8 pt-6 border-t-2 border-dashed border-zinc-200">
                        <h4 className="font-black text-xs uppercase text-zinc-800 mb-3 flex items-center gap-2">
                          <span>🔔</span> DANH SÁCH BÀI LÀM PHIẾU ONLINE ĐÃ GỬI LẠI CÔ GIAO ({appState.workbookSubmissions.length})
                        </h4>

                        {appState.workbookSubmissions.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {appState.workbookSubmissions.map(sub => (
                              <div key={sub.id} className="p-4 bg-zinc-50 rounded-2xl border-2 border-zinc-200 flex flex-col justify-between gap-3">
                                <div className="flex justify-between items-start text-xs">
                                  <div>
                                    <strong className="text-zinc-900 text-sm block">🧑 Học sinh: {sub.studentName}</strong>
                                    <span className="text-[10px] text-zinc-550 block font-bold mt-0.5">Bài làm phiếu: {sub.sheetTitle} • Gửi: {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <button
                                    onClick={() => { playClickSound(); setSelectedSubmission(sub); setReviewComment(sub.comment || ""); setReviewStars(sub.stars || 5); }}
                                    className="py-1 px-3 bg-[#E0F2FE] hover:bg-sky-200 border border-sky-300 text-sky-850 font-black rounded-lg text-[10px] uppercase cursor-pointer transition-all"
                                  >
                                    {sub.comment ? "Cập Nhật Nhận Xét" : "🖊️ Đọc và Chấm"}
                                  </button>
                                </div>

                                <div className="p-2.5 bg-white rounded-xl border text-xs text-zinc-700 font-semibold leading-relaxed">
                                  <span className="font-bold text-[#B45309] block text-[10px] mb-1">DÒNG ĐÁP ÁN EM GÕ TRỰC TUYẾN:</span>
                                  &ldquo;{sub.answers}&rdquo;
                                </div>

                                {sub.comment && (
                                  <div className="text-[11px] bg-emerald-50 p-2.5 rounded-xl border border-emerald-250 flex items-center justify-between text-emerald-950 font-black">
                                    <span>💬 Lời phê: &ldquo;{sub.comment}&rdquo;</span>
                                    <span className="flex text-amber-400 gap-0.5 shrink-0">
                                      {sub.stars} ⭐
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Sub-tab: SƠ ĐỒ TỰ DUY */}
                  {materialActiveSubTab === 'mindmaps' && (
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-300 shadow-md text-zinc-800">
                      <h3 className="font-black text-md text-amber-950 uppercase mb-4">🧠 SƠ ĐỒ TƯ DUY HỌC SINH TẠO TRONG LỚP KHÁM PHÁ</h3>
                      
                      {appState.mindmapSubmissions.length === 0 ? (
                        <div className="text-center py-12">
                          <span className="text-4xl block mb-2">💭</span>
                          <p className="text-xs text-zinc-550 italic font-bold">Chưa có em học sinh nào nộp hoặc lưu sơ đồ tư duy nào lên hệ thống lớp.</p>
                          <p className="text-[11px] text-zinc-500 mt-2">Cô có thể mở Tab học sinh, tổ chức rẽ nhánh sơ đồ bài &ldquo;NẤM&rdquo; rồi bấm Lưu Sơ Đồ để dữ liệu xuất hiện tại đây!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {appState.mindmapSubmissions.map(submission => {
                            let parsedNodes = [];
                            try {
                              parsedNodes = JSON.parse(submission.nodes);
                            } catch(e){}

                            return (
                              <div key={submission.id} className="p-4 rounded-2xl bg-[#FFFDF2] border-2 border-amber-200 flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <strong className="text-amber-950 font-black block">🧑 Em: {submission.studentName}</strong>
                                      <span className="text-[10px] text-zinc-500 font-bold block mb-2">Đề bài: {submission.title} • Gửi: {new Date(submission.submittedAt).toLocaleTimeString()}</span>
                                    </div>
                                    <span className="bg-amber-100 border text-amber-800 font-black text-[10px] px-2 py-0.5 rounded-full shrink-0">
                                      {parsedNodes.length} Nhánh con
                                    </span>
                                  </div>

                                  {/* Simple visual display of the loaded mindmap nodes */}
                                  <div className="p-2.5 bg-white rounded-xl border flex flex-wrap gap-1.5 my-2">
                                    {parsedNodes.map((n: any) => (
                                      <span key={n.id} className={`text-[10px] px-2 py-1 rounded-full border font-bold flex items-center gap-1 bg-yellow-50 text-amber-800 border-yellow-250`}>
                                        <span>{n.emoji}</span> <span>{n.text}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Review Box for Mindmap */}
                                <div className="mt-3 pt-3 border-t-2 border-dashed border-amber-200">
                                  {submission.comment ? (
                                    <p className="text-[11px] text-emerald-800 font-bold leading-relaxed italic bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                                      Cô đã nhận xét: &ldquo;{submission.comment}&rdquo;
                                    </p>
                                  ) : (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        id={`comment-mm-${submission.id}`}
                                        placeholder="Lời khuyên, khen ngợi sơ đồ bé viết..."
                                        className="flex-1 bg-white border rounded-xl p-2 text-xs font-semibold outline-none"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            const inputVal = (e.currentTarget as HTMLInputElement).value;
                                            if (inputVal) {
                                              playClickSound();
                                              fetch("/api/mindmaps/review", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ submissionId: submission.id, comment: inputVal })
                                              }).then(() => fetchState());
                                            }
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const inputEl = document.getElementById(`comment-mm-${submission.id}`) as HTMLInputElement;
                                          if (inputEl && inputEl.value) {
                                            playClickSound();
                                            fetch("/api/mindmaps/review", {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ submissionId: submission.id, comment: inputEl.value })
                                            }).then(() => {
                                              inputEl.value = "";
                                              fetchState();
                                            });
                                          }
                                        }}
                                        className="px-3 bg-teal-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                                      >
                                        Nộp cô xem
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {materialActiveSubTab === 'discussions' && (
                    <div className="flex flex-col gap-6 animate-fade-in w-full">
                      
                      {/* Top: Class Discussion board creation */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-300 shadow-md">
                        <h4 className="font-black text-xs uppercase text-teal-900 mb-3 block">💬 ĐĂNG CÂU HỎI THẢO LUẬN LỚP CHO HỌC SINH CÙNG LÀM BÀI</h4>
                        
                        <form onSubmit={handleCreateDiscussionThread} className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-500 uppercase">TÊN CHỦ ĐỀ THẢO LUẬN:</label>
                              <input
                                type="text"
                                placeholder="vd: Thảo luận về sinh vật sống học tuần này..."
                                value={newDiscussionTitle}
                                onChange={(e) => setNewDiscussionTitle(e.target.value)}
                                className="p-2 border bg-zinc-50 outline-none rounded-xl text-xs font-bold"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-500 uppercase">NỘI DUNG / CÂU HỎI THẢO LUẬN:</label>
                              <textarea
                                rows={1}
                                placeholder="vd: Em hãy phát biểu xem nấm có phải thực vật không? Tại sao?"
                                value={newDiscussionContent}
                                onChange={(e) => setNewDiscussionContent(e.target.value)}
                                className="p-2 border bg-zinc-50 outline-none rounded-xl text-xs font-bold"
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" /> Đăng câu hỏi thảo luận cho cả lớp
                          </button>
                        </form>
                      </div>

                      {/* Bottom Threads List */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md">
                        <h4 className="font-black text-xs uppercase text-teal-900 mb-4 block">📋 CÁC CHỦ ĐỀ THẢO LUẬN KHẢO SÁT ONLINE</h4>

                        {appState.discussionThreads.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic text-center py-6">Hiện cô chưa đăng câu hỏi thảo luận nào.</p>
                        ) : (
                          <div className="space-y-4">
                            {appState.discussionThreads.map(thread => (
                              <div key={thread.id} className="p-4 bg-zinc-50 hover:bg-zinc-100/50 border-2 rounded-2xl flex flex-col gap-3 transition-all">
                                <div className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-black text-zinc-800 text-sm block">💬 {thread.title}</span>
                                    <span className="text-[11px] text-zinc-550 italic block mt-0.5">&ldquo;{thread.content}&rdquo;</span>
                                  </div>
                                  <div className="flex gap-1.5 items-center">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${thread.isOpen ? 'bg-emerald-150 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                      {thread.isOpen ? "Mở" : "Khóa"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        playClickSound();
                                        fetch("/api/discussions/toggle", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ threadId: thread.id, isOpen: !thread.isOpen })
                                        }).then(() => fetchState());
                                      }}
                                      className="py-1 px-2.5 bg-white border hover:bg-zinc-100 text-zinc-700 font-bold rounded-lg cursor-pointer text-[10px]"
                                    >
                                      {thread.isOpen ? "Khóa lại" : "Mở lại"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteDiscussionThread(thread.id)}
                                      className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg cursor-pointer text-[10px]"
                                      title="Xóa hoàn toàn cuộc thảo luận này"
                                    >
                                      Xóa ×
                                    </button>
                                  </div>
                                </div>

                                {/* Comments stream from classmates for teacher */}
                                <div className="border-t pt-3 space-y-2">
                                  <span className="text-[9px] font-black text-zinc-450 block uppercase">BÀI LÀM / PHẢI BIỂU CỦA CÁC BẠN HỌC SINH:</span>
                                  {thread.comments.length === 0 ? (
                                    <p className="text-[11px] text-zinc-500 italic">Chưa có ai phát biểu câu trả lời nào cả.</p>
                                  ) : (
                                    thread.comments.map(comment => (
                                      <div key={comment.id} className="p-2.5 bg-white border rounded-xl flex justify-between items-center text-xs">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-zinc-850">🧒 {comment.studentName}:</span>
                                          <span className="font-semibold text-zinc-600 italic mt-0.5">&ldquo;{comment.content}&rdquo;</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2 bg-amber-50 px-2 py-1 rounded-lg border border-amber-205">
                                          {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className="text-[10px]">
                                              {i < comment.stars ? "⭐" : "☆"}
                                            </span>
                                          ))}
                                          <span className="text-[9px] font-black text-amber-900">({comment.stars} sao)</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Add/Edit lesson dialog popup modal */}
                  {showAddLessonModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-300 w-full max-w-lg shadow-2xl relative">
                        <button
                          type="button"
                          onClick={() => { playClickSound(); setShowAddLessonModal(false); }}
                          className="absolute top-4 right-4 text-xl font-bold bg-zinc-100 hover:bg-zinc-200 rounded-full w-8 h-8 flex items-center justify-center"
                        >
                          ×
                        </button>

                        <h3 className="font-black text-md text-amber-950 uppercase mb-4">
                          {editingLesson ? "⚙️ CHỈNH SỬA BÀI HỌC" : "🌿 SOẠN MỤC HỌC LIỆU MỚI"} CỦA {SUBJECT_CATEGORIES[(activeCategoryIndex || 1) - 1]}
                        </h3>

                        <form onSubmit={handleSaveLesson} className="flex flex-col gap-3 text-xs font-bold text-zinc-700">
                          <div className="flex flex-col gap-1">
                            <label>TÊN BÀI GIẢNG / TÊN FILE:</label>
                            <input
                              type="text"
                              placeholder="Trực quan: Ăn thịt nấm rơm, Thí nghiệm co nguyên sinh..."
                              value={lessonForm.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              className="p-2 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="flex items-center justify-between">
                              <span>LOẠI HÌNH HỌC LIỆU SỐ:</span>
                              <button
                                type="button"
                                onClick={() => { playClickSound(); setIsAddingCustomType(!isAddingCustomType); }}
                                className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all flex items-center gap-0.5"
                                title="Thêm loại học liệu mới"
                              >
                                ➕ THÊM LOẠI MỚI
                              </button>
                            </label>

                            <select
                              value={lessonForm.type}
                              onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                              className="p-2 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none font-bold"
                            >
                              <option value="video">📹 Video Bài giảng (YouTube mượt hoặc Mp4)</option>
                              <option value="game">🎮 Trò chơi giáo dục (Wordwall / Scratch / Quizizz)</option>
                              <option value="pdf">📄 Bài Đọc Slide / Tài Liệu PDF (Canva / Google Slides)</option>
                              <option value="experiment">🧪 Thí nghiệm ảo / Hình vẽ giải phẫu</option>
                              <option value="mindmap">🧠 Sơ đồ tư duy trực quan</option>
                              <option value="link">🌐 Liên kết học liệu khác</option>
                              {customLessonTypes.map((ct) => (
                                <option key={ct} value={ct}>
                                  {getLessonTypeIcon(ct)} {ct}
                                </option>
                              ))}
                            </select>

                            {isAddingCustomType && (
                              <div className="flex gap-2 p-2 mt-1 border-2 border-dashed border-emerald-300 bg-emerald-50/10 rounded-xl animate-fade-in items-center">
                                <input
                                  type="text"
                                  placeholder="Nhập loại mới (ví dụ: 🔬 Thí nghiệm 3D)"
                                  value={customTypeInput}
                                  onChange={(e) => setCustomTypeInput(e.target.value)}
                                  className="flex-1 p-1.5 border-2 border-zinc-200 rounded-lg text-xs font-bold bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClickSound();
                                    const val = customTypeInput.trim();
                                    if (val) {
                                      if (!customLessonTypes.includes(val)) {
                                        setCustomLessonTypes([...customLessonTypes, val]);
                                      }
                                      setLessonForm({ ...lessonForm, type: val });
                                      setCustomTypeInput("");
                                      setIsAddingCustomType(false);
                                      playSparkleSound();
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs"
                                >
                                  OK
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <label>ĐƯỜNG DẪN URL HOẶC LINK NHÚNG (IFRAME):</label>
                            <input
                              type="text"
                              placeholder="Nhập link YouTube, Canva, Scratch, Quizizz..."
                              value={lessonForm.url}
                              onChange={(e) => setLessonForm({ ...lessonForm, url: e.target.value })}
                              className="p-2 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400 text-xs"
                            />
                            <span className="text-[10px] text-zinc-500 font-medium">💡 Nếu là link YouTube, hãy đổi thành định dạng nhúng (vd: /embed/xxxx) hoặc dán link gốc, hệ thống sẽ tự tối ưu để hiện trực tiếp trên website!</span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label>MÔ TẢ NGẮN (KHI BÉ BẤM XEM):</label>
                            <textarea
                              rows={2}
                              placeholder="Cô viết dặn dò học sinh nạp bài hay tóm tắt bài giảng nhé..."
                              value={lessonForm.description}
                              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                              className="p-2 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400 text-xs text-zinc-805"
                            />
                          </div>

                          <div className="flex gap-2 justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => { playClickSound(); setShowAddLessonModal(false); }}
                              className="py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl cursor-pointer"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              type="submit"
                              className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl shadow-md cursor-pointer"
                            >
                              Đồng Bộ Đăng Học Liệu 🚀
                            </button>
                          </div>

                        </form>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ================================== TAB B5: PHỤ HUYNH & THÔNG BÁO ================================== */}
              {teacherActiveTab === 'parentInfo' && (
                <div className="flex flex-col gap-6 text-zinc-850">
                  
                  {/* Part 1: Input weekly reports, attendance & comments to sync with Parents page */}
                  <div className="bg-white p-6 rounded-[32px] border-4 border-[#FDE047] shadow-xl">
                    <h3 className="font-black text-md text-amber-950 uppercase mb-4">📈 KHO SỔ ĐIỂM & NHẬN XÉT HÀNG TUẦN GỬI CHO PHỤ HUYNH</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-amber-100 text-amber-950 font-black border-b-2">
                            <th className="p-3 rounded-l-xl">Tên Học Sinh Lớp 4</th>
                            <th className="p-3">Điểm số ở lớp (Cuối kỳ)</th>
                            <th className="p-3">Học lực / Chuyên Cần</th>
                            <th className="p-3">Nhận xét tuần này của Giáo Viên</th>
                            <th className="p-3 text-center rounded-r-xl">Hành động</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold divide-y">
                          {appState.students.map(student => {
                            const record = appState.gradesAndComments.find(g => g.studentId === student.id) || {
                              midTermScore: 10,
                              finalScore: 10,
                              weeklyComment: "Chưa có nhận xét.",
                              attendanceScore: "Tốt"
                            };

                            const curInput = gradeInputMap[student.id] || {
                              mid: record.midTermScore,
                              final: record.finalScore,
                              comment: record.weeklyComment,
                              att: record.attendanceScore
                            };

                            return (
                              <tr key={student.id} className="hover:bg-zinc-50">
                                <td className="p-3 font-black text-zinc-900">{student.name}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5 w-24">
                                    <input
                                      type="number"
                                      min={0}
                                      max={10}
                                      value={curInput.final}
                                      onChange={(e) => handleGradeInputChange(student.id, 'final', Number(e.target.value))}
                                      className="w-12 p-1 border rounded text-center text-xs font-bold"
                                    />
                                    <span>/ 10</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <select
                                    value={curInput.att}
                                    onChange={(e) => handleGradeInputChange(student.id, 'att', e.target.value)}
                                    className="p-1 border bg-white rounded text-xs font-bold"
                                  >
                                    <option value="Yếu">Yếu</option>
                                    <option value="Trung bình">Trung bình</option>
                                    <option value="Khá">Khá</option>
                                    <option value="Tốt">Tốt</option>
                                    <option value="Xuất sắc">Xuất sắc</option>
                                  </select>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={curInput.comment}
                                    onChange={(e) => handleGradeInputChange(student.id, 'comment', e.target.value)}
                                    placeholder="Ví dụ: Em rất tích cực rẽ Sơ đồ..."
                                    className="w-full p-2 border bg-zinc-55 rounded text-xs font-semibold"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => handleUpdateGrades(student.id)}
                                    className="py-1 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] uppercase rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all text-xs"
                                  >
                                    Gửi nhận xét
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Part 2: Feedback and announcements received from parents */}
                  <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md">
                    <h4 className="font-black text-xs uppercase text-zinc-650 mb-3 block">📩 Hộp thư phản hồi của Phụ Huynh gửi Cô giáo</h4>
                    
                    {appState.parentFeedback.length === 0 ? (
                      <p className="text-xs text-zinc-650 italic text-center mt-6">Không có tin nhắn hay phản hồi kín nào từ phía gia đình học sinh.</p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {appState.parentFeedback.map(fb => (
                          <div key={fb.id} className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                              <strong className="text-rose-955 font-black">{fb.parentName} ({fb.studentName})</strong>
                              <span className="text-[9px] text-zinc-500 font-bold">{new Date(fb.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-zinc-800 italic">&ldquo;{fb.message}&rdquo;</p>
                            
                            {fb.teacherReply && (
                              <div className="mt-1 p-2.5 bg-emerald-50 border-l-4 border-emerald-400 rounded-lg">
                                <div className="flex justify-between items-center mb-1 text-[10px]">
                                  <span className="font-extrabold text-emerald-950">Phản hồi của bạn:</span>
                                  {fb.replyTimestamp && (
                                    <span className="text-[8px] text-zinc-400 font-bold">{new Date(fb.replyTimestamp).toLocaleDateString()}</span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-zinc-700 leading-normal">{fb.teacherReply}</p>
                              </div>
                            )}

                            <div className="mt-1 bg-white p-2 rounded-xl border border-rose-100 flex gap-2">
                              <input
                                type="text"
                                placeholder={fb.teacherReply ? "Thay đổi câu trả lời..." : "Phản hồi lại phụ huynh..."}
                                value={teacherReplyMap[fb.id] || ""}
                                onChange={(e) => setTeacherReplyMap({
                                  ...teacherReplyMap,
                                  [fb.id]: e.target.value
                                })}
                                className="flex-1 text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-250 rounded-lg outline-none font-bold text-zinc-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleTeacherReplyFeedback(fb.id)}
                                className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-[10px] uppercase rounded-lg shadow-sm cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shrink-0"
                              >
                                {fb.teacherReply ? "Cập nhật" : "Gửi"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ================================== TAB B6S: SỔ TAY KẾ HOẠCH & GIÁO ÁN ================================== */}
              {teacherActiveTab === 'notes' && (
                <div className="flex flex-col gap-6 animate-fade-in text-zinc-800 w-full">
                  
                  {/* Sub-tabs menu */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-amber-50 rounded-2xl border border-amber-200 self-start">
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setTeacherNotesActiveSubTab('annual'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        teacherNotesActiveSubTab === 'annual'
                          ? 'bg-amber-400 text-amber-955 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      📅 Kế hoạch dạy học năm học
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setTeacherNotesActiveSubTab('lesson_plan'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        teacherNotesActiveSubTab === 'lesson_plan'
                          ? 'bg-amber-400 text-amber-955 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      📝 Giáo án bài dạy
                    </button>
                    <button
                      type="button"
                      onClick={() => { playClickSound(); setTeacherNotesActiveSubTab('notes'); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        teacherNotesActiveSubTab === 'notes'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-zinc-650 hover:bg-amber-100/30'
                      }`}
                    >
                      📔 Sổ tay ghi chú cá nhân
                    </button>
                  </div>

                  {/* SUBTAB 1: KẾ HOẠCH DẠY HỌC NĂM HỌC */}
                  {teacherNotesActiveSubTab === 'annual' && (
                    <div className="flex flex-col lg:flex-row gap-6">
                      
                      {/* Form column */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md w-full lg:w-1/3 shrink-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-sm uppercase text-amber-900 mb-3 block">➕ THÊM KẾ HOẠCH NĂM HỌC</h3>
                          
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            setPlanFormType('kh-day-hoc');
                            playClickSound();
                            try {
                              const res = await fetch("/api/teacher/plans", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ title: planFormTitle, content: planFormContent, type: 'kh-day-hoc', link: planFormLink })
                              });
                              const data = await res.json();
                              if (data.success) {
                                setPlanFormTitle("");
                                setPlanFormContent("");
                                setPlanFormLink("");
                                playSparkleSound();
                                fetchState();
                                alert("📅 Đăng Kế hoạch dạy học năm học thành công!");
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-550 uppercase">TIÊU ĐỀ KẾ HOẠCH CHUNG:</label>
                              <input
                                type="text"
                                placeholder="vd: Chương 1: Sinh vật và Môi trường..."
                                value={planFormTitle}
                                onChange={(e) => setPlanFormTitle(e.target.value)}
                                className="p-2 border border-amber-200 bg-amber-50/20 outline-none rounded-xl text-xs font-bold w-full"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-550 uppercase">NỘI DUNG KẾ HOẠCH / CHI TIẾT TỪNG PHÂN MÔN:</label>
                              <textarea
                                rows={6}
                                placeholder="vd: Phân phối chương trình khoa học lớp 4, tuần 1 đến tuần 10..."
                                value={planFormContent}
                                onChange={(e) => setPlanFormContent(e.target.value)}
                                className="p-2 border border-amber-200 bg-amber-50/20 outline-none rounded-xl text-xs font-bold w-full leading-relaxed"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-550 uppercase">ĐƯỜNG DẪN LIÊN KẾT ĐÍNH KÈM (Mở rộng - Slide/Drive/Website):</label>
                              <input
                                type="url"
                                placeholder="https://drive.google.com/... hoặc link slide"
                                value={planFormLink}
                                onChange={(e) => setPlanFormLink(e.target.value)}
                                className="p-2 border border-amber-200 bg-amber-50/20 outline-none rounded-xl text-xs font-bold w-full"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              📁 Đăng kế hoạch năm
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* List column */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md flex-1">
                        <h3 className="font-black text-sm uppercase text-amber-900 mb-4 block">📋 DANH SÁCH KẾ HOẠCH DẠY HỌC ({appState.lessonPlans.filter(p => p.type === 'kh-day-hoc').length})</h3>
                        
                        {appState.lessonPlans.filter(p => p.type === 'kh-day-hoc').length === 0 ? (
                          <div className="text-center py-12">
                            <span className="text-4xl">📅</span>
                            <p className="text-xs text-zinc-500 mt-2 font-bold italic">Chưa có kế hoạch giảng dạy năm học nào được đăng tải.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-128 overflow-y-auto pr-1">
                            {appState.lessonPlans.filter(p => p.type === 'kh-day-hoc').map(plan => (
                              <div key={plan.id} className="p-4 rounded-3xl bg-amber-50/50 border-2 border-amber-200 text-left relative flex flex-col justify-between">
                                  <div>
                                    <div className="flex justify-between items-start">
                                      <span className="text-[10px]/none bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Học trình</span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePlan(plan.id)}
                                        className="text-rose-500 hover:text-rose-700 font-black px-1.5 py-0.5 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                                        title="Xóa kế hoạch giảng dạy này"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <h4 className="text-sm font-black text-zinc-900 mt-2">✨ {plan.title}</h4>
                                    <p className="text-xs text-zinc-650 font-medium leading-relaxed mt-2 whitespace-pre-wrap italic">&ldquo;{plan.content}&rdquo;</p>
                                    
                                    {plan.link && (
                                      <div className="mt-3">
                                        <a
                                          href={plan.link}
                                          target="_blank"
                                          referrerPolicy="no-referrer"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-lg tracking-wide transition-all shadow-xs cursor-pointer"
                                        >
                                          🔗 XEM TRANG BÀI GIẢNG / LINK ĐÍNH KÈM
                                        </a>
                                      </div>
                                    )}
                                  </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* SUBTAB 2: GIÁO ÁN BÀI DẠY */}
                  {teacherNotesActiveSubTab === 'lesson_plan' && (
                    <div className="flex flex-col lg:flex-row gap-6">
                      
                      {/* Form column */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md w-full lg:w-1/3 shrink-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-sm uppercase text-amber-900 mb-3 block">➕ TẠO GIÁO ÁN BÀI GIẢNG</h3>
                          
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            setPlanFormType('kh-bai-day');
                            playClickSound();
                            try {
                              const res = await fetch("/api/teacher/plans", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ title: planFormTitle, content: planFormContent, type: 'kh-bai-day', link: planFormLink })
                              });
                              const data = await res.json();
                              if (data.success) {
                                setPlanFormTitle("");
                                setPlanFormContent("");
                                setPlanFormLink("");
                                playSparkleSound();
                                fetchState();
                                alert("📝 Đăng Giáo án thành công!");
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-550 uppercase">TÊN TIẾT BÀI GIẢNG / GIÁO ÁN:</label>
                              <input
                                type="text"
                                placeholder="vd: Bài dạy: Thực vật sinh dưỡng bằng cách nào?..."
                                value={planFormTitle}
                                onChange={(e) => setPlanFormTitle(e.target.value)}
                                className="p-2 border border-amber-200 bg-amber-50/20 outline-none rounded-xl text-xs font-bold w-full"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-550 uppercase">NỘI DUNG KỊCH BẢN GIẢNG DẠY:</label>
                              <textarea
                                rows={6}
                                placeholder="vd: 1. Khởi động trò chơi 2. Hình thành kiến thức qua sơ đồ tư duy..."
                                value={planFormContent}
                                onChange={(e) => setPlanFormContent(e.target.value)}
                                className="p-2 border border-amber-200 bg-amber-50/20 outline-none rounded-xl text-xs font-bold w-full leading-relaxed"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1 text-left">
                              <label className="text-[10px] font-black text-zinc-550 uppercase">ĐƯỜNG DẪN LIÊN KẾT ĐÍNH KÈM (Mở rộng - Slide/Drive/Website):</label>
                              <input
                                type="url"
                                placeholder="https://drive.google.com/... hoặc bài giảng điện tử"
                                value={planFormLink}
                                onChange={(e) => setPlanFormLink(e.target.value)}
                                className="p-2 border border-amber-200 bg-amber-50/20 outline-none rounded-xl text-xs font-bold w-full"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase rounded-xl tracking-wider shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                            >
                              🖊️ Tạo Giáo án mới
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* List column */}
                      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md flex-1">
                        <h3 className="font-black text-sm uppercase text-amber-900 mb-4 block">📋 HỒ SƠ GIÁO ÁN ĐÃ LƯU trữ ({appState.lessonPlans.filter(p => p.type === 'kh-bai-day').length})</h3>
                        
                        {appState.lessonPlans.filter(p => p.type === 'kh-bai-day').length === 0 ? (
                          <div className="text-center py-12">
                            <span className="text-4xl">📝</span>
                            <p className="text-xs text-zinc-500 mt-2 font-bold italic">Chưa lưu trữ hồ sơ hay kịch bản giáo án nào.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-128 overflow-y-auto pr-1">
                            {appState.lessonPlans.filter(p => p.type === 'kh-bai-day').map(plan => (
                              <div key={plan.id} className="p-4 rounded-3xl bg-emerald-50/40 border-2 border-emerald-250 text-left relative flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px]/none bg-emerald-100 text-emerald-850 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Giáo án tiết dạy</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePlan(plan.id)}
                                      className="text-rose-500 hover:text-rose-700 font-black px-1.5 py-0.5 hover:bg-rose-50 rounded-lg text-xs cursor-pointer"
                                      title="Xóa giáo án này"
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <h4 className="text-sm font-black text-zinc-900 mt-2">📗 {plan.title}</h4>
                                  <p className="text-xs text-zinc-650 font-medium leading-relaxed mt-2 whitespace-pre-wrap italic">&ldquo;{plan.content}&rdquo;</p>
                                  
                                  {plan.link && (
                                    <div className="mt-3">
                                      <a
                                        href={plan.link}
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] rounded-lg tracking-wide transition-all shadow-xs cursor-pointer"
                                      >
                                        🔗 XEM TRANG BÀI GIẢNG / LINK ĐÍNH KÈM
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* SUBTAB 3: SỔ TAY GHI CHÚ */}
                  {teacherNotesActiveSubTab === 'notes' && (
                    <div className="bg-white p-6 rounded-[32px] border-4 border-amber-250 shadow-md flex flex-col gap-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                        <div>
                          <h3 className="font-black text-sm uppercase text-amber-900">📔 SỔ TAY GHI CHÚ TIẾT DẠY CỦA CÔ GIÁO</h3>
                          <span className="text-[10px] text-zinc-500 font-bold">Hãy ghi lại những lưu ý cần dặn dò các bé ngày mai.</span>
                        </div>
                        <button
                          onClick={handleSaveNotebook}
                          className="py-2 px-5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1 shrink-0"
                        >
                          💾 Lưu Sổ Tay Giáo Viên
                        </button>
                      </div>

                      <div className="relative bg-amber-50/50 p-6 rounded-2xl border-2 border-amber-200 shadow-inner flex flex-col gap-2 min-h-96">
                        <label className="text-[10.5px] font-black text-amber-900 uppercase">TIẾP NỘI DUNG SỔ GHI CHÚ:</label>
                        <textarea
                          rows={12}
                          value={noteInputValue}
                          onChange={(e) => setNoteInputValue(e.target.value)}
                          placeholder="Ví dụ: Cần nhắc các em mang mẫu lá cây ngày mai, Nguyễn Gia Bảo cần rèn luyện vẽ thêm sơ đồ tư duy phân nhánh..."
                          className="w-full text-xs p-5 bg-white border border-dashed border-amber-300 rounded-xl outline-none font-bold text-zinc-850 leading-6 font-mono resize-y shadow-sm"
                          style={{ backgroundImage: 'linear-gradient(#f3f1e7 95%, #cbd5e1 5%)', backgroundSize: '100% 24px' }}
                        />
                        <div className="text-[10px] text-zinc-400 font-semibold italic text-right mt-1">
                          🛡️ Đồng bộ tức thì khi lưu lên máy chủ.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================================== TAB B7: HỒ SƠ CÁ NHÂN GIÁO VIÊN ================================== */}
              {teacherActiveTab === 'profile' && (
                <div className="bg-white p-6 rounded-[32px] border-4 border-amber-300 shadow-md max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in text-zinc-800 w-full text-left">
                      <div className="flex items-center gap-3 border-b-2 border-dashed border-amber-200 pb-4">
                        <span className="text-4xl filter drop-shadow">👤</span>
                        <div>
                          <h3 className="font-black text-lg text-amber-950 uppercase">HỒ SƠ CÁ NHÂN GIÁO VIÊN</h3>
                          <p className="text-[11px] text-zinc-550 font-semibold uppercase">Thay đổi tên hiển thị, chọn avatar và cá nhân hóa trang quản trị của bạn</p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveTeacherProfile} className="flex flex-col gap-5 text-sm font-bold text-zinc-700">
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs uppercase text-zinc-650 font-extrabold flex items-center gap-1">
                            <span>👩‍🏫</span> Tên Giáo Viên (Tên Hiển Thị):
                          </label>
                          <input
                            type="text"
                            placeholder="Mặc định: Admin..."
                            value={profileFormName}
                            onChange={(e) => setProfileFormName(e.target.value)}
                            className="p-3 border-2 border-amber-200 bg-amber-50/20 rounded-2xl outline-none focus:border-amber-400 font-black text-sm"
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-2 text-left">
                          <label className="text-xs uppercase text-zinc-655 font-extrabold flex items-center gap-1">
                            <span>✨</span> Chọn Hình Đại Diện (Avatar):
                          </label>
                          
                          {/* Avatar Picker Grid */}
                          <div className="grid grid-cols-5 gap-3 p-3 bg-zinc-50 border-2 rounded-2xl">
                            {["👩‍🏫", "👨‍🏫", "🦁", "🐼", "🐻", "🐯", "🦊", "🐰", "🐨", "🦄"].map(av => (
                              <button
                                key={av}
                                type="button"
                                onClick={() => { playClickSound(); setProfileFormAvatar(av); }}
                                className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-3 transition-all cursor-pointer ${
                                  profileFormAvatar === av
                                    ? "bg-amber-100 border-amber-500 scale-110 shadow-md"
                                    : "bg-white border-zinc-200 hover:border-amber-300"
                                }`}
                              >
                                {av}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 text-left">
                          <label className="text-xs uppercase text-zinc-650 font-extrabold flex items-center gap-1">
                            <span>🎨</span> Chọn Màu Sắc Chủ Đạo (Giao Diện Toàn Trang):
                          </label>
                          
                          {/* Theme Color Picker Grid */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 p-3 bg-zinc-50 border-2 rounded-2xl">
                            {[
                              { id: 'emerald', label: '🟢 Xanh Lá', color: 'bg-emerald-500 border-emerald-600' },
                              { id: 'amber', label: '🟡 Vàng Cam', color: 'bg-amber-500 border-amber-600' },
                              { id: 'cyan', label: '🔵 Xanh Dương', color: 'bg-cyan-500 border-cyan-600' },
                              { id: 'rose', label: '🔴 Hồng Đỏ', color: 'bg-rose-500 border-rose-600' },
                              { id: 'indigo', label: '🟣 Xanh Chàm', color: 'bg-indigo-500 border-indigo-600' },
                              { id: 'violet', label: '🔮 Tím Fuchsia', color: 'bg-violet-500 border-violet-600' }
                            ].map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => { playClickSound(); setProfileFormThemeColor(item.id as any); }}
                                className={`p-2 rounded-xl flex flex-col items-center gap-1 border-3 transition-all cursor-pointer ${
                                  profileFormThemeColor === item.id
                                    ? "bg-amber-100 border-amber-500 scale-105 shadow-md"
                                    : "bg-white border-zinc-200 hover:border-amber-300"
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full ${item.color} shadow-xs border`} />
                                <span className="text-[10px] font-black text-zinc-700 whitespace-nowrap">{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-amber-50/50 p-4 rounded-2xl border-2 border-amber-200 mt-2">
                          <div className="text-left">
                            <span className="font-extrabold text-xs text-amber-950 block">💡 Thông tin đồng bộ trực tuyến</span>
                            <span className="text-[10px] text-zinc-500 font-medium">Tên hiển thị mặc định khi đăng nhập là "Admin".</span>
                          </div>
                          <button
                            type="submit"
                            className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase text-xs rounded-xl shadow-md cursor-pointer active:scale-95 transition-all"
                          >
                            Lưu Thay Đổi 💾
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

            </main>
          </div>
        )}

        {/* ======================= CASE C: STUDENT WORKSPACE ======================= */}
        {currentRole === 'student' && currentUser && (
          <div className="flex-1 flex flex-row h-full">
            
            {/* 1. Left Vertical Menu Sidebar (as squares with stickers) */}
            <aside className="w-20 sm:w-24 md:w-28 lg:w-32 bg-white border-r-4 border-emerald-400 flex flex-col p-2.5 sm:p-4 gap-3 shrink-0">
              <div className="flex flex-col items-center gap-1 mb-4 bg-emerald-50 p-1.5 sm:p-2 rounded-2xl border border-emerald-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-emerald-350 flex items-center justify-center text-lg sm:text-xl shadow-sm select-none shrink-0" title={currentUser.name}>
                  🧒
                </div>
                <span className="hidden sm:inline text-[8px] font-black text-emerald-850 uppercase tracking-tighter text-center">
                  Học sinh
                </span>
              </div>

              {/* Navigation column list of squares */}
              <nav className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => { playClickSound(); setStudentActiveTab('attendance'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    studentActiveTab === 'attendance'
                      ? 'bg-emerald-100 hover:bg-emerald-100 text-teal-900 border-emerald-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  title="Điểm danh"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">📝</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Điểm danh
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setStudentActiveTab('materials'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    studentActiveTab === 'materials'
                      ? 'bg-emerald-100 hover:bg-emerald-100 text-teal-900 border-emerald-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  title="Học liệu lớp học"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">📚</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Học liệu
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setStudentActiveTab('discussions'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    studentActiveTab === 'discussions'
                      ? 'bg-emerald-100 hover:bg-emerald-100 text-teal-900 border-emerald-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  title="Thảo luận học hỏi"
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">💬</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Thảo luận
                  </span>
                </button>
              </nav>

              {/* Sidebar bottom decoration/quick switch */}
              <div className="mt-auto hidden sm:flex flex-col gap-1 p-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <p className="text-[8px] sm:text-[9px] font-black text-emerald-850 uppercase tracking-tighter">
                  🌟 ĐIỂM SAO
                </p>
              </div>
            </aside>

            {/* 2. Right Workspace Panel */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6">
              
              {/* Playful student title header card in natural tone */}
              <div className="bg-[#DCFCE7] p-5 rounded-[32px] border-4 border-emerald-400 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-5xl animate-wiggle">🎒</span>
                  <div>
                    <h2 className="text-xl font-black text-emerald-950">
                      CHÀO BẠN NHỎ: <span className="bg-white px-2.5 py-0.5 rounded-xl border-2 border-emerald-300 inline-block rotate-1">{currentUser.name}</span> CHÀO MỪNG BẠN ĐẾN KHÁM PHÁ!
                    </h2>
                    <p className="text-xs font-bold text-emerald-800 mt-1">Hôm nay hãy cùng Gấu Biết Tuốt AI rinh thật nhiều nhận xét điểm sao xuất sắc nhé! 🌿</p>
                  </div>
                </div>

                {/* Status and attendance badge */}
                <div>
                  {appState.students.find(s=>s.id === currentUser.id)?.isPresent ? (
                    <div className="bg-white border-2 border-emerald-400 text-emerald-850 font-black text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm">
                      <CheckSquare className="w-4 h-4 text-emerald-500" /> EM CÓ MẶT THÀNH CÔNG!
                    </div>
                  ) : (
                    <button
                      onClick={handleRollCall}
                      className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      🔔 BẤM VÀO ĐỂ ĐIỂM DANH LÊN LỚP
                    </button>
                  )}
                </div>
              </div>

            {/* STUDENT COMPONENT SWAP */}

            {/* ================================== TAB S1: ATTENDANCE BLOCK ================================== */}
            {studentActiveTab === 'attendance' && (
              <div className="flex flex-col gap-6">
                {/* Multi-day Attendance Grid */}
                <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-300 shadow-sm flex flex-col gap-4 text-sm font-semibold">
                  <h3 className="font-black text-md text-emerald-950 uppercase border-b pb-2 flex items-center justify-between">
                    <span>👋 SỔ ĐIỂM DANH CHUYÊN CẦN LỚP 4</span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                      Tích lũy buổi học: {appState.students.find(s => s.id === currentUser?.id)?.attendedDays?.length || 0} ngày
                    </span>
                  </h3>

                  <p className="leading-relaxed text-zinc-650 text-xs font-bold">
                    🔔 Em hãy chọn đúng Buổi/Ngày học thực tế hôm nay để tiến hành điểm danh lên sổ chuyên cần nhé. Cô Thùy Dương sẽ cộng sao chăm chỉ cho những bạn chuyên cần tinh anh đấy!
                  </p>

                  <div className="p-5 rounded-2xl bg-[#ECFDF5] border-2 border-emerald-300">
                    <h4 className="font-black text-xs uppercase text-emerald-900 mb-3 flex items-center gap-1">
                      <span>🗓️</span> CHI TIẾT ĐIỂM DANH TỪNG NGÀY (EM BẤM VÀO ĐỂ ĐIỂM DANH):
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {(appState.attendanceDays || [
                        "Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5",
                        "Ngày 6", "Ngày 7", "Ngày 8", "Ngày 9", "Ngày 10"
                      ]).map((day) => {
                        const sRecord = appState.students.find(s => s.id === currentUser?.id);
                        const isAttended = sRecord?.attendedDays?.includes(day);
                        return (
                          <button
                            key={day}
                            onClick={() => {
                              if (!isAttended) {
                                handleRollCall(day);
                              } else {
                                alert(`Em đã điểm danh ${day} thành công rồi nhé! Đừng lo nè.`);
                              }
                            }}
                            className={`p-3.5 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                              isAttended
                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md transform scale-[1.02]'
                                : 'bg-white text-zinc-650 border-[#E4E4E7] hover:bg-emerald-50 hover:border-emerald-250 hover:scale-[1.01]'
                            }`}
                          >
                            <span className="text-base">{isAttended ? '🎯' : '🔔'}</span>
                            <span className="uppercase text-[10px] tracking-wider font-extrabold">{day}</span>
                            <span className="text-[9px] font-bold opacity-90">
                              {isAttended ? 'ĐÃ CÓ MẶT ✔' : 'CHƯA ĐIỂM DANH'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 mt-2">
                    <span className="text-xs font-black text-emerald-900 uppercase block mb-2">DANH SÁCH BẬN BÈ LÊN LỚP HÔM NAY:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {appState.students.map(s => (
                        <span
                          key={s.id}
                          className={`text-xs px-2.5 py-1 rounded-full border font-bold flex items-center gap-1 bg-white ${
                            s.isPresent ? 'text-emerald-800 border-emerald-300 font-extrabold shadow-sm' : 'text-zinc-400 border-zinc-200 opacity-60'
                          }`}
                        >
                          <span>{s.isPresent ? "🟢" : "⚫"}</span>
                          <span>{s.name}</span>
                          <span className="text-[9px] text-zinc-400">({s.attendedDays?.length || 0} ngày)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Badges shelves bento card */}
                <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-350 shadow-md flex flex-col gap-4 text-sm font-semibold">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <h3 className="font-black text-md text-emerald-950 uppercase flex items-center gap-2">
                      <span>🏅</span> KHO HUY CHƯƠNG & DANH HIỆU SÁNG TẠO
                    </h3>
                    <span className="text-xs bg-emerald-150 text-emerald-950 px-3 py-1 rounded-full font-black border border-emerald-250 shrink-0">
                      Đã đạt: {appState.students.find(s => s.id === currentUser?.id)?.badges?.length || 0} / 6
                    </span>
                  </div>
                  
                  <p className="text-xs font-bold text-zinc-550 leading-relaxed">
                    Cố gắng học tập, thảo luận lớp và tự thiết kế sơ đồ tư duy để mở khóa đầy đủ các huy chương tinh anh quý giá nhé em yêu khoa học!
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {[
                      {
                        name: "Chuyên Cần Tinh Anh 📅",
                        desc: "Ghi nhận việc em tích cực điểm danh đầy đủ trước mỗi buổi học khoa học trực tuyến.",
                        unlock: "Điểm danh hàng tuần tại Sổ Điểm Danh & Thông tin học tập."
                      },
                      {
                        name: "Bậc Thầy Sơ Đồ Tư Duy 🧠",
                        desc: "Dành cho những em rèn luyện tư duy xuất sắc qua tính năng tự kiến thiết Mindmap trực quan.",
                        unlock: "Tự tạo hình vẽ liên tưởng nộp sơ đồ tại mục Sơ Đồ Tư Duy Online."
                      },
                      {
                        name: "Nhà Bình Luận Tri Thức 💬",
                        desc: "Sự đóng góp vàng giúp cô tối ưu hóa bài giảng bằng cách đánh giá chất lượng học liệu.",
                        unlock: "Đăng bình luận đóng góp ý kiến kèm đánh giá sao tại Bài học kì diệu."
                      },
                      {
                        name: "Nhà Luận Chiến Khoa Học 🗣️",
                        desc: "Vinh danh những em năng nổ phát biểu ý kiến, trả lời câu hỏi mỏ gợi chuyện cô giáo giao.",
                        unlock: "Để lại ý kiến phản hồi sâu sắc trên Bảng Thảo luận lớp học kì diệu."
                      },
                      {
                        name: "Siêu Nhân Vở Bài Tập 📝",
                        desc: "Hoàn thiện và lưu trữ câu trả lời phiếu học tập điện tử đúng tiến trình cô giao.",
                        unlock: "Nộp đầy đủ đáp án văn bản trong mục Phiếu Học Tập và Điểm Sao."
                      },
                      {
                        name: "Học Sinh Ưu Tú 🌟",
                        desc: "Phần thưởng tuyệt diệu cho thành quả học tập chuẩn mực và đạt số sao bứt phá.",
                        unlock: "Được cô giáo đánh giá bài nộp phiếu học tập đạt từ 4 ⭐ hoặc 5 ⭐ trở lên."
                      }
                    ].map(badge => {
                      const studentRecord = appState.students.find(s => s.id === currentUser?.id);
                      const isEarned = studentRecord?.badges?.includes(badge.name);

                      return (
                        <div
                          key={badge.name}
                          className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                            isEarned
                              ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-300 shadow-md scale-[1.01]'
                              : 'bg-zinc-50/55 border-zinc-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-3xl block shrink-0">{badge.name.split(" ").slice(-1)[0]}</span>
                            <div className="flex-1">
                              <span className="font-black text-xs block text-zinc-900 leading-tight uppercase">
                                {badge.name.replace(/\s\S+$/, "")}
                              </span>
                              <p className="text-[10px] text-zinc-555 font-bold mt-1 leading-snug">
                                {badge.desc}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-2 border-t border-dashed border-zinc-200">
                            <span className="text-[9px] text-[#D97706] font-extrabold block">
                              🔑 YÊU CẦU: {badge.unlock}
                            </span>
                          </div>

                          {/* Earned bubble tag */}
                          {isEarned ? (
                            <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider animate-pulse shrink-0">
                              🎉 ĐÃ HOÀN THÀNH
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-zinc-200 text-zinc-650 border border-zinc-300 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider shrink-0">
                              🔒 KHÓA
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ================================== TAB S2: HỌC LIỆU LỚP HỌC ================================== */}
            {studentActiveTab === 'materials' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* Segmented controls for student material categories */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-emerald-50 rounded-2xl border border-emerald-200 self-start">
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setStudentMaterialSubTab('lessons'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      studentMaterialSubTab === 'lessons'
                        ? 'bg-emerald-400 text-[#042F1A] shadow-sm'
                        : 'text-emerald-800 hover:bg-emerald-100/30'
                    }`}
                  >
                    📚 Bài học - 6 chủ đề
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setStudentMaterialSubTab('worksheets'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      studentMaterialSubTab === 'worksheets'
                        ? 'bg-emerald-400 text-[#042F1A] shadow-sm'
                        : 'text-emerald-800 hover:bg-emerald-100/30'
                    }`}
                  >
                    📄 Phiếu học tập
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setStudentMaterialSubTab('mindmapEdit'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      studentMaterialSubTab === 'mindmapEdit'
                        ? 'bg-emerald-400 text-[#042F1A] shadow-sm'
                        : 'text-emerald-800 hover:bg-emerald-100/30'
                    }`}
                  >
                    🧠 Sơ đồ tư duy
                  </button>
                </div>

                {/* Sub-tab content 1: BÀI HỌC - 6 CHỦ ĐỀ */}
                {studentMaterialSubTab === 'lessons' && (
                  <div className="flex flex-col gap-6 text-zinc-850">
                    <div className="bg-zinc-50 p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-3">
                      <div>
                        <span className="text-xs font-black text-emerald-850">XEM BÀI HỌC CÔ GIAO TRỰC TUYẾN</span>
                        <p className="text-[11px] text-zinc-500 font-bold mt-0.5">Cô giáo và học sinh luôn đồng bộ bài học thời gian thực, click khám phá bên dưới nhé!</p>
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Tìm bài theo tên..."
                          value={lessonSearchQuery}
                          onChange={(e) => setLessonSearchQuery(e.target.value)}
                          className="p-2 border rounded-xl text-xs font-bold outline-none bg-white focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {SUBJECT_CATEGORIES.map((catTitle, i) => {
                        const catIdx = i + 1;
                        const catLessons = filteredLessonsOfCategory(catIdx);
                        const isSelectedCategory = expandedCategoryIndex === catIdx;
                        const boxColorStyle = SUBJECT_COLORS[i] || SUBJECT_COLORS[0];
                        const iconChar = SUBJECT_EMOJIS[i] || "🧪";

                        return (
                          <div
                            key={catIdx}
                            onClick={() => {
                              playClickSound();
                              setExpandedCategoryIndex(isSelectedCategory ? null : catIdx);
                            }}
                            className={`rounded-[32px] p-5 border-4 border-zinc-200 flex flex-col justify-between transition-all duration-250 relative cursor-pointer hover:border-amber-400 hover:shadow-xl ${
                              isSelectedCategory ? 'min-h-[285px] ring-4 ring-amber-250' : 'min-h-[160px]'
                            } ${boxColorStyle}`}
                          >
                            {/* Gấu biết tuốt circular badge in a corner of the card */}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                playClickSound();
                                setExpandedCategoryIndex(isSelectedCategory ? null : catIdx);
                              }}
                              className="absolute -top-3.5 -left-3.5 w-11 h-11 bg-white rounded-full border-4 border-amber-400 shadow-md flex items-center justify-center text-xl z-20 hover:scale-115 active:scale-95 transition-transform" 
                              title="Gấu Biết Tuốt gợi ý"
                            >
                              🐻
                            </div>

                            <div>
                              <span className="text-5xl block mb-3 animate-pulse">{iconChar}</span>
                              <h4 className="text-md font-black uppercase tracking-tight leading-tight mb-2 text-zinc-900">
                                {catTitle}
                              </h4>
                              <span className="text-[10px] bg-white text-zinc-700 px-3 py-0.5 rounded-full font-black border">
                                {catLessons.length} học liệu khả dụng
                              </span>

                              {isSelectedCategory && (
                                <div className="mt-4 space-y-1.5 max-h-36 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                  {catLessons.length === 0 ? (
                                    <p className="text-[10px] text-zinc-550 italic font-medium">Chưa có bài nào được cô giáo thêm vào mục này.</p>
                                  ) : (
                                    catLessons.map(lesson => (
                                      <div
                                        key={lesson.id}
                                        className="w-full p-2 bg-white border rounded-xl flex items-center justify-between text-xs font-bold text-zinc-900 transition-all outline-none gap-1.5"
                                      >
                                        <span 
                                          className="truncate flex-grow hover:text-emerald-700 cursor-pointer text-left py-0.5"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            playClickSound();
                                            setSelectedExploreLesson(lesson);
                                          }}
                                          title="Click để xem chi tiết & nhận xét sao"
                                        >
                                          {getLessonTypeIcon(lesson.type)}{" "}
                                          {lesson.title}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            playClickSound();
                                            setSelectedExploreLesson(lesson);
                                          }}
                                          className="text-[10px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-1.5 py-0.5 rounded border text-center shrink-0 font-extrabold cursor-pointer uppercase transition-all"
                                        >
                                          CHI TIẾT 💬
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-tab content 2: PHIẾU HỌC TẬP */}
                {studentMaterialSubTab === 'worksheets' && (
                  <div className="flex flex-col gap-6 animate-fade-in text-zinc-850">
                    {appState.studySheets.length === 0 ? (
                      <div className="bg-white p-6 rounded-[32px] border-4 border-[#FDE047] shadow-md text-center text-xs text-zinc-655 italic">
                        Hôm nay cô giáo chưa giao phiếu bài tập thực tế nào cho cả lớp ôn luyện rồi.
                      </div>
                    ) : (
                      appState.studySheets.map(sheet => {
                        const matchedSubmission = appState.workbookSubmissions.find(s => s.studentId === currentUser.id && s.sheetId === sheet.id);

                        return (
                          <div key={sheet.id}>
                            <StudySheetWorkspace
                              sheet={sheet}
                              studentName={currentUser.name}
                              studentId={currentUser.id}
                              onSubmit={handleWorksheetSubmit}
                              existingSubmission={matchedSubmission}
                            />
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Sub-tab content 3: SƠ ĐỒ TƯ DUY */}
                {studentMaterialSubTab === 'mindmapEdit' && (
                  <div className="animate-fade-in bg-white p-2 rounded-[32px] border-4 border-emerald-300 shadow-xl overflow-hidden min-h-[500px]">
                    <MindmapEditor
                      studentName={currentUser.name}
                      studentId={currentUser.id}
                      onSave={handleMindmapSave}
                    />
                  </div>
                )}

              </div>
            )}

            {/* ================================== TAB S5: CLASS DISCUSSION THREADS ================================== */}
            {studentActiveTab === 'discussions' && (
              <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-300 shadow-sm text-zinc-800 flex flex-col gap-4 animate-fade-in">
                <h3 className="font-black text-md text-[#B45309] uppercase border-b-2 pb-2">💬 GIAO LƯU & BÌNH LUẬN TRÊN BẢNG LỚP HỌC</h3>

                {appState.discussionThreads.length === 0 ? (
                  <p className="text-xs text-zinc-650 italic text-center py-6">Hiện tại cô chưa mở cuộc thảo luận trực tuyến nào cho lớp học.</p>
                ) : (
                  appState.discussionThreads.map(thread => (
                    <div key={thread.id} className="p-4 bg-zinc-50 border-2 rounded-2xl flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] bg-amber-100 text-[#B45309] font-black uppercase px-2.5 py-0.5 rounded border shadow-sm">Bảng Thảo Luận Mở</span>
                        <h4 className="text-md font-black text-zinc-900 mt-1">{thread.title}</h4>
                        <p className="text-xs text-zinc-600 font-bold mt-1 italic">&ldquo;{thread.content}&rdquo;</p>
                      </div>

                      {/* Comments stream from classmates */}
                      <div className="border-t pt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                        <span className="text-[10px] font-black text-zinc-500 block uppercase">Ý kiến phát biểu của các bạn:</span>
                        {thread.comments.length === 0 ? (
                          <p className="text-[11px] text-zinc-550 italic">Chưa có ai phát biểu câu trả lời nào cả, em hãy xung phong đầu tiên đi nhen!</p>
                        ) : (
                          thread.comments.map(comment => (
                            <div key={comment.id} className="p-2.5 bg-white border rounded-xl flex justify-between items-center text-xs">
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-850">🧒 {comment.studentName}:</span>
                                <span className="font-semibold text-zinc-650 italic mt-0.5">&ldquo;{comment.content}&rdquo;</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className="text-sm">
                                    {i < comment.stars ? "⭐" : "☆"}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Student writes custom response to board */}
                      <div className="border-t pt-2 flex flex-col gap-2">
                        <textarea
                          placeholder="Viết phát biểu thảo luận của em tại đây nhen..."
                          value={discussionFormContent}
                          onChange={(e) => setDiscussionFormContent(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-zinc-300 rounded-xl outline-none font-bold text-zinc-805"
                        />
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-zinc-500">Đánh giá sao cho chủ đề:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => { playClickSound(); setSelectedStarRating(star); }}
                                  className="p-1 hover:scale-105"
                                >
                                  {star <= selectedStarRating ? "★" : "☆"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => handlePostDiscussionComment(thread.id)}
                            className="py-1.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] uppercase rounded-xl tracking-wider shadow-sm cursor-pointer"
                          >
                            Đăng ý kiến thảo luận
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}

            </main>
          </div>
        )}

        {/* ======================= CASE D: PARENT WORKSPACE ======================= */}
        {currentRole === 'parent' && currentUser && (
          <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6 text-zinc-800 animate-fade-in">
            
            {/* Parent workspace header strip in warm pink tones */}
            <div className="bg-[#FFE4E6] p-6 rounded-[32px] border-4 border-rose-300 shadow-md">
              <h2 className="text-xl font-black text-rose-950 flex items-center gap-2 leading-tight">
                <span>👨‍👩‍👧</span> SỔ TRỰC TUYẾN DÀNH CHO PHỤ HUYNH HỌC SINH: {currentUser.name.replace(" (Phụ huynh)", "")}
              </h2>
              <p className="text-xs font-bold text-rose-800 mt-1">Trang theo dõi tiến trình làm bài tập khoa học Lớp 4 và kiểm tra nhận xét điểm sao kín của cô giáo chủ nhiệm.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Student evaluation status */}
              <div className="bg-white p-6 rounded-[32px] border-4 border-rose-200 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-xs uppercase text-rose-900 border-b pb-2 mb-3">⭐ ĐÁNH GIÁ KẾT QUẢ CỦA BÉ</h3>
                  
                  {/* Pull values from app state */}
                  {(() => {
                    const cleanStudentId = currentUser.id;
                    const record = appState.gradesAndComments.find(g => g.studentId === cleanStudentId) || {
                      midTermScore: 10,
                      finalScore: 10,
                      weeklyComment: "Chưa có nhận xét nào được nạp tuần này từ cô giáo.",
                      attendanceScore: "Tốt"
                    };

                    const submittedCount = appState.workbookSubmissions.filter(s => s.studentId === cleanStudentId).length;

                    return (
                      <div className="space-y-4 font-semibold text-xs text-zinc-700">
                        <div className="flex justify-between items-center bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                          <span>Điểm kiểm tra khoa học trên lớp:</span>
                          <span className="text-sm font-black text-rose-900">{record.finalScore} / 10 điểm</span>
                        </div>

                        <div className="flex justify-between items-center bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                          <span>Chuyên cần & Thái độ:</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-rose-200 text-rose-800 font-bold">{record.attendanceScore}</span>
                        </div>

                        <div className="flex justify-between items-center bg-rose-50/70 p-3 rounded-xl border border-rose-100">
                          <span>Tổng phiếu bài tập trực tuyến đã nộp:</span>
                          <span className="bg-white px-2 py-0.5 rounded border border-rose-200 text-rose-800 font-bold">{submittedCount} bài nộp</span>
                        </div>

                        <div className="mt-3 bg-zinc-50 p-4 rounded-2xl border">
                          <span className="text-[10px] font-black text-zinc-500 block uppercase mb-1">NHẬN XÉT HÀNG TUẦN CỦA CÔ:</span>
                          <p className="text-xs leading-relaxed italic text-zinc-800 font-black">&ldquo;{record.weeklyComment}&rdquo;</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="border-t pt-3 mt-4 text-[10px] text-zinc-400 font-bold">
                  * Kết quả học tập được cô giáo cập nhật trực tiếp tại lớp học.
                </div>
              </div>

              {/* Box 2: Feedbacks or reaction sent back to teacher (Does not show in student tabs) */}
              <div className="bg-white p-6 rounded-[32px] border-4 border-rose-200 shadow-md">
                <h3 className="font-black text-xs uppercase text-rose-900 border-b pb-2 mb-3">💬 PHẢN HỒI Ý KIẾN TRỰC TIẾP CHO GIÁO VIÊN</h3>
                
                <form onSubmit={handlePostParentFeedback} className="flex flex-col gap-3">
                  <p className="text-xs font-bold text-zinc-650 leading-relaxed">Phụ huynh có thể điền các phản hồi, thảo luận hoặc gửi nhắn nhủ ý kiến trực tiếp tại đây. Nội dung phản hồi được cô Thùy Dương tiếp nhận riêng và hoàn toàn ẩn ngoài trang học sinh.</p>
                  
                  <textarea
                    rows={4}
                    placeholder="vd: Cảm ơn cô giáo, cháu có về nhà kể câu chuyện về các loại nấm rơm ăn rất thích, mong cô hướng dẫn con vẽ Sơ đồ tư duy tiếp theo..."
                    value={parentFeedbackInput}
                    onChange={(e) => setParentFeedbackInput(e.target.value)}
                    className="w-full text-xs p-3 font-semibold border-2 border-rose-200 bg-rose-50/30 rounded-xl outline-none focus:border-rose-450"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer tracking-wider"
                  >
                    Gửi phản hồi cho Giáo Viên
                  </button>
                </form>

                {/* History of feedback and teacher replies */}
                <div className="mt-4 pt-4 border-t-2 border-dashed border-rose-100">
                  <h4 className="font-black text-xs uppercase text-rose-900 mb-2.5 flex items-center gap-1">
                    <span>💬</span> Lịch sử ý kiến & phản hồi từ Cô giáo
                  </h4>
                  {appState.parentFeedback.filter(fb => fb.studentId === currentUser.id.replace(" (Phụ huynh)", "")).length === 0 ? (
                    <p className="text-[11px] text-zinc-550 italic">Bạn chưa gửi phản hồi hoặc góp ý nào.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {appState.parentFeedback
                        .filter(fb => fb.studentId === currentUser.id.replace(" (Phụ huynh)", ""))
                        .map(fb => (
                          <div key={fb.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-1 font-bold">
                              <span>Ý kiến của bạn</span>
                              <span>{new Date(fb.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-semibold text-zinc-800 leading-normal italic">&ldquo;{fb.message}&rdquo;</p>
                            
                            {fb.teacherReply ? (
                              <div className="mt-2.5 p-2.5 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg text-xs">
                                <div className="flex justify-between items-center mb-1 text-[10px]">
                                  <strong className="text-emerald-955 font-black">Cô giáo phản hồi:</strong>
                                  {fb.replyTimestamp && (
                                    <span className="text-zinc-500 font-bold">{new Date(fb.replyTimestamp).toLocaleDateString()}</span>
                                  )}
                                </div>
                                <p className="font-bold text-zinc-700 leading-normal">{fb.teacherReply}</p>
                              </div>
                            ) : (
                              <div className="mt-2 text-[10px] text-amber-600 font-bold italic flex items-center gap-1">
                                <span>⏳</span> Đang đợi phản hồi từ cô giáo...
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {currentRole !== 'login' && <GauChatbox />}

      {/* Floating Detailed Study Lesson & Comments dialog modal */}
      {selectedExploreLesson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-[32px] border-4 border-amber-300 w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal header with fun design */}
            <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-orange-50 p-6 border-b-4 border-amber-200 shrink-0 relative">
              <button
                onClick={() => { playClickSound(); setSelectedExploreLesson(null); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white hover:bg-zinc-100 font-bold border-2 border-zinc-350 text-zinc-550 hover:text-zinc-800 transition-all cursor-pointer flex items-center justify-center text-xs shadow-sm"
              >
                ✕
              </button>
              <span className="text-3xl block mb-1">
                {getLessonTypeIcon(selectedExploreLesson.type)}
              </span>
              <h3 className="font-black text-zinc-900 text-base uppercase leading-tight">
                {selectedExploreLesson.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-amber-900 bg-amber-100 font-black px-2 py-0.5 rounded border border-amber-300 uppercase shrink-0">
                  {selectedExploreLesson.type === 'video' ? 'Video bải giảng' : selectedExploreLesson.type === 'game' ? 'Trò chơi giáo dục' : selectedExploreLesson.type === 'pdf' ? 'Tài liệu PDF/Slide' : selectedExploreLesson.type === 'experiment' ? 'Thí nghiệm ảo' : selectedExploreLesson.type === 'mindmap' ? 'Sơ đồ tư duy' : selectedExploreLesson.type === 'link' ? 'Liên kết học liệu' : selectedExploreLesson.type}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold">
                  Kho học liệu từ {appState.teacherProfile.name || "Thầy Cô"}
                </span>
              </div>
            </div>

            {/* Scrollable details & logs container */}
            <div className="p-5 overflow-y-auto flex-grow flex flex-col gap-5">
              {/* Material teacher description help text */}
              {selectedExploreLesson.description && (
                <div className="bg-amber-50/60 p-4 rounded-2xl border-2 border-dashed border-amber-200 text-xs">
                  <span className="font-black text-[#A16207] uppercase block mb-1">💡 Hướng dẫn học tập của cô giáo:</span>
                  <p className="font-bold text-zinc-700 leading-relaxed italic">
                    &ldquo;{selectedExploreLesson.description}&rdquo;
                  </p>
                </div>
              )}

              {/* Dynamic Web Embed (YouTube, pdf, slides, worksheets, etc.) */}
              {selectedExploreLesson.url && (
                <div className="w-full bg-zinc-50 rounded-2xl overflow-hidden border-2 border-zinc-200 shadow-inner flex flex-col">
                  <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex justify-between items-center text-[10px] font-black text-zinc-650">
                    <span className="flex items-center gap-1 uppercase">
                      <span>👁️</span> KHUNG HỌC TẬP TRỰC TIẾP TRÊN WEB
                    </span>
                    <a 
                      href={selectedExploreLesson.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      Mở tab mới ↗
                    </a>
                  </div>
                  <div className="relative w-full overflow-hidden bg-zinc-900" style={{ minHeight: "360px", height: "450px" }}>
                    <iframe
                      src={getEmbedUrl(selectedExploreLesson.url)}
                      title={selectedExploreLesson.title}
                      className="absolute top-0 left-0 w-full h-full border-0 bg-white"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Huge beautiful play launch call to action button */}
              <div className="flex justify-center text-xs">
                <button
                  onClick={() => {
                    playClickSound();
                    if (selectedExploreLesson.url) {
                      window.open(selectedExploreLesson.url, '_blank');
                    } else {
                      alert("Học liệu trực quan chưa được gán đường dẫn web liên kết chính thức.");
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-[12px] uppercase tracking-wider rounded-2xl shadow-md cursor-pointer inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                >
                  🚀 KHÁM PHÁ & TRẢI NGHIỆM BÀI HỌC NGAY
                </button>
              </div>

              {/* Star Rating calculations view scorecard */}
              <div className="bg-zinc-50 p-4 rounded-2xl border flex items-center justify-between text-xs gap-4">
                <div>
                  <span className="text-[10px] font-black text-zinc-500 block uppercase mb-1">Điểm đánh giá trung bình:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-zinc-800">
                      {(() => {
                        const comments = selectedExploreLesson.comments || [];
                        if (comments.length === 0) return "5.0";
                        const total = comments.reduce((acc, c) => acc + c.rating, 0);
                        return (total / comments.length).toFixed(1);
                      })()}
                    </span>
                    <div className="flex text-amber-400 gap-0.5 sm:gap-1">
                      {(() => {
                        const comments = selectedExploreLesson.comments || [];
                        const avg = comments.length === 0 ? 5 : comments.reduce((acc, c) => acc + c.rating, 0) / comments.length;
                        return Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`w-4 h-4 ${idx < Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'}`} />
                        ));
                      })()}
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-bold block mt-1">
                    • Lớp học hiện có {(selectedExploreLesson.comments || []).length} lượt bình chọn
                  </span>
                </div>

                <div className="text-right border-l pl-4 font-bold text-xs flex flex-col justify-center">
                  <span className="text-emerald-800 bg-emerald-55 px-2 py-1 rounded inline-block text-[10px] uppercase font-black border border-emerald-200">
                    Bình chọn trực tiếp
                  </span>
                </div>
              </div>

              {/* Star creator comments posting panel */}
              {currentUser && (
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 flex flex-col gap-3">
                  <span className="text-xs font-black text-emerald-950 uppercase flex items-center gap-1.5 select-none">
                    <span>✍️</span> ĐỂ LẠI NHẬN XÉT & BÌNH CHỌN SAO CỦA BẠN:
                  </span>

                  {/* Stars choice dynamic buttons slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-650">Bình chọn:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const starVal = idx + 1;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => { playClickSound(); setNewLessonCommentRating(starVal); }}
                            className="p-1 cursor-pointer transition-all hover:scale-125"
                          >
                            <Star className={`w-6 h-6 ${starVal <= newLessonCommentRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-250'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text comments posting */}
                  <div className="flex gap-2">
                    <textarea
                      value={newLessonCommentContent}
                      onChange={(e) => setNewLessonCommentContent(e.target.value)}
                      placeholder="Hãy viết cảm nhận, bí kíp hoặc góp ý của bạn về bài này nhé..."
                      rows={2}
                      className="flex-grow p-2.5 text-xs bg-zinc-50 border-2 border-emerald-100 focus:border-emerald-400 text-zinc-800 font-bold rounded-xl outline-none"
                    />
                    <button
                      onClick={() => handlePostLessonComment(selectedExploreLesson.id)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wide rounded-xl shadow-md cursor-pointer active:scale-95 transition-all self-end"
                    >
                      Gửi Nhận Xét
                    </button>
                  </div>
                </div>
              )}

              {/* Feed of comments list logs */}
              <div className="flex flex-col gap-3.5 mt-1">
                <span className="text-xs font-black text-zinc-650 uppercase border-b pb-1.5">🗣️ LỊCH SỬ BÌNH LUẬN & GÓP Ý TRƯỚC ĐÓ</span>
                {(!selectedExploreLesson.comments || selectedExploreLesson.comments.length === 0) ? (
                  <p className="text-xs text-zinc-600 italic text-center py-6 select-none bg-zinc-50/50 rounded-2xl border border-dashed">Chưa có ai nhận xét bài này. Hãy là người viết đóng góp lời giải tuyệt diệu đầu tiên nha!</p>
                ) : (
                  <div className="space-y-3">
                    {selectedExploreLesson.comments.map(c => {
                      const isTeacherComment = c.authorRole === 'teacher';
                      const isParentComment = c.authorRole === 'parent';
                      return (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex flex-col gap-2 ${
                            isTeacherComment
                              ? 'bg-amber-50/70 border-amber-250 text-amber-950 font-semibold'
                              : isParentComment
                              ? 'bg-blue-50/70 border-blue-200 text-blue-950 font-semibold'
                              : 'bg-zinc-50/80 border-zinc-200 text-zinc-700 font-semibold'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold text-[10px] uppercase">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">
                                {isTeacherComment ? "👩‍🏫" : isParentComment ? "🙋‍♂️" : "🧒"}
                              </span>
                              <span className="font-extrabold">{c.authorName}</span>
                              <span className={`px-1.5 py-0.5 rounded-full font-black text-[8px] ${
                                isTeacherComment 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : isParentComment 
                                  ? 'bg-blue-105 text-blue-900 border border-blue-200' 
                                  : 'bg-zinc-200 text-zinc-805'
                              }`}>
                                {isTeacherComment ? "CÔ GIÁO" : isParentComment ? "PHỤ HUYNH" : "HỌC SINH"}
                              </span>
                            </div>
                            <div className="flex items-center text-amber-500 gap-0.5 shrink-0 select-none">
                              {Array.from({ length: 5 }).map((_, sIdx) => (
                                <Star key={sIdx} className={`w-3 h-3 ${sIdx < c.rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-855 font-bold leading-relaxed">{c.content}</p>
                          <span className="text-[9px] text-zinc-500 text-right opacity-80 self-end">
                            {new Date(c.timestamp).toLocaleDateString()} {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div id="custom-confirm-modal" className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] border-4 border-amber-300 p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4">
            <span className="text-4xl filter drop-shadow">⚠️</span>
            <h3 className="font-black text-amber-950 text-md uppercase">Xác nhận thao tác</h3>
            <p className="text-xs text-zinc-700 font-bold leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center w-full mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl border-2 border-zinc-300 cursor-pointer transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-650 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
              >
                Đồng ý ×
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
