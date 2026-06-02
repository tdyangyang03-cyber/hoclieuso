import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import {
  Users, BookOpen, Brain, FileSpreadsheet, HeartHandshake, BookCopy,
  UserCheck, ClipboardList, CheckCircle2, Bookmark, Settings, Eye, Trash2, 
  Plus, Edit, Star, LogOut, ArrowRight, Video, Gamepad2, FileText, Globe, 
  MapPin, Clock, Calendar, CheckSquare, Sparkles, MessageSquare, Send, BookMarked,
  X, Check
} from "lucide-react";

import { playClickSound, playSparkleSound } from "./components/AudioClick";
import MindmapEditor from "./components/MindmapEditor";
import GauChatbox from "./components/GauChatbox";
import StudySheetWorkspace from "./components/StudySheetWorkspace";
import RealtimeClock from "./components/RealtimeClock";
import LessonInputForm from "./components/LessonInputForm";

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
  if (lower.includes("image") || lower.includes("ảnh") || lower.includes("hình") || lower.includes("đồ họa") || lower.includes("canva") || lower.includes("phiếu_ảnh") || lower.includes("phiếu bài tập")) return "🖼️";
  if (lower.includes("vở") || lower.includes("ghi chép") || lower.includes("nhật ký")) return "📓";
  
  return "🌐";
}

function isUrlImage(url: string, type?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  if (type) {
    const lowerType = type.toLowerCase();
    if (lowerType === "image" || lowerType === "images" || lowerType === "🖼️" || lowerType === "photo") {
      return true;
    }
  }

  // Check base64
  if (lowerUrl.startsWith("data:image/")) return true;

  // Check extensions
  if (
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".gif") ||
    lowerUrl.endsWith(".webp") ||
    lowerUrl.endsWith(".bmp") ||
    lowerUrl.endsWith(".svg")
  ) {
    return true;
  }

  try {
    const urlPath = lowerUrl.split('?')[0].split('#')[0];
    if (
      urlPath.endsWith(".png") ||
      urlPath.endsWith(".jpg") ||
      urlPath.endsWith(".jpeg") ||
      urlPath.endsWith(".gif") ||
      urlPath.endsWith(".webp") ||
      urlPath.endsWith(".bmp") ||
      urlPath.endsWith(".svg")
    ) {
      return true;
    }
  } catch (e) {}

  if (
    lowerUrl.includes("drive.google.com/uc") ||
    lowerUrl.includes("images.unsplash.com") ||
    lowerUrl.includes("imgur.com") ||
    (lowerUrl.includes("uploads") && (
      lowerUrl.includes(".png") ||
      lowerUrl.includes(".jpg") ||
      lowerUrl.includes(".jpeg") ||
      lowerUrl.includes(".webp") ||
      lowerUrl.includes(".gif") ||
      lowerUrl.includes(".svg")
    ))
  ) {
    return true;
  }

  return false;
}

function isUrlPdf(url: string, type?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  if (type) {
    const lowerType = type.toLowerCase();
    if (lowerType === "pdf" || lowerType === "📄") return true;
  }
  return lowerUrl.endsWith(".pdf") || lowerUrl.split('?')[0].split('#')[0].endsWith(".pdf");
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

  // Canva embeds support (Convert Canva edit/view link directly to embed)
  if (trimmed.includes("canva.com/design/")) {
    const canvaMatch = trimmed.match(/canva\.com\/design\/([A-Za-z0-9_-]+)/);
    if (canvaMatch && canvaMatch[1]) {
      const displayMode = trimmed.includes("/watch") ? "watch" : "view";
      return `https://www.canva.com/design/${canvaMatch[1]}/${displayMode}?embed`;
    }
  }

  // Wordwall embeds support
  if (trimmed.includes("wordwall.net")) {
    const wordwallMatch = trimmed.match(/wordwall\.net\/(?:resource|play|embed\/(?:resource|play))\/([0-9]+)/);
    if (wordwallMatch && wordwallMatch[1]) {
      return `https://wordwall.net/embed/resource/${wordwallMatch[1]}`;
    }
  }

  // Scratch embeds support
  if (trimmed.includes("scratch.mit.edu/projects/")) {
    const scratchMatch = trimmed.match(/scratch\.mit\.edu\/projects\/([0-9]+)/);
    if (scratchMatch && scratchMatch[1]) {
      return `https://scratch.mit.edu/projects/${scratchMatch[1]}/embed`;
    }
  }

  // Google Drive links (Documents / Slides / Videos) conversion for safe embedding
  if (trimmed.includes("drive.google.com")) {
    if (trimmed.includes("/view")) {
      return trimmed.replace(/\/view([?#].*)?$/, "/preview");
    }
    if (trimmed.includes("?id=")) {
      const driveMatch = trimmed.match(/[?&]id=([^&]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
    }
    if (trimmed.includes("/file/d/")) {
      const driveMatch = trimmed.match(/\/file\/d\/([^\/]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
      }
    }
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

function getLessonFoldersMap(lesson: any) {
  const mats = lesson.materials || [];
  const lessonMaterials = [...mats];
  if (lesson.url) {
    if (!lessonMaterials.some((m: any) => m.id === "master_" + lesson.id || m.url === lesson.url)) {
      lessonMaterials.unshift({
        id: "master_" + lesson.id,
        title: lesson.title + " (Học liệu chính)",
        type: lesson.type,
        url: lesson.url,
        description: lesson.description || "",
        section: "🌈 Bài giảng & Đồ dùng dạy học chính khóa"
      });
    }
  }

  const foldersMap: Record<string, any[]> = {};
  lessonMaterials.forEach((m: any) => {
    const sec = m.section || "Chuyên mục học tập khác 🌐";
    if (!foldersMap[sec]) {
      foldersMap[sec] = [];
    }
    foldersMap[sec].push(m);
  });
  return foldersMap;
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
          authorName: "admin",
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
    name: "admin",
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
      name: "admin",
      themeColor: "emerald",
      mode: "light",
      avatar: "👩‍🏫"
    }
  });


   // UI state managers
  const [teacherActiveTab, setTeacherActiveTab] = useState<'dashboard' | 'students' | 'lessons' | 'parentInfo' | 'notes' | 'profile'>('dashboard');
  const [teacherStudentActiveSubTab, setTeacherStudentActiveSubTab] = useState<'roster' | 'submissions'>('roster');
  const [materialActiveSubTab, setMaterialActiveSubTab] = useState<'lessons' | 'worksheets' | 'mindmaps' | 'discussions'>('lessons');
  const [studentActiveTab, setStudentActiveTab] = useState<'attendance' | 'materials' | 'discussions' | 'feedback' | 'grades'>('materials');
  const [studentMaterialSubTab, setStudentMaterialSubTab] = useState<'lessons' | 'worksheets' | 'mindmapEdit'>('lessons');
  const [isScreenSynced, setIsScreenSynced] = useState(true);
  const [teacherNotesActiveSubTab, setTeacherNotesActiveSubTab] = useState<'annual' | 'lesson_plan' | 'notes'>('annual');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [expandedCategoryIndex, setExpandedCategoryIndex] = useState<number | null>(null);
  const [selectedCategoryPage, setSelectedCategoryPage] = useState<number | null>(null);

  // Modals / forms state
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineType, setInlineType] = useState("video");
  const [inlineUrl, setInlineUrl] = useState("");
  const [inlineDescription, setInlineDescription] = useState("");
  const [isInlineAdding, setIsInlineAdding] = useState(false);

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
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<any>(null);
  const [showAddMaterialForm, setShowAddMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    type: "video",
    url: "",
    description: "",
    section: "Video bài giảng 📹"
  });

  const [isFolderUploading, setIsFolderUploading] = useState(false);
  const [lessonFolders, setLessonFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [newFolderInput, setNewFolderInput] = useState("");

  const [deletedFoldersMap, setDeletedFoldersMap] = useState<Record<string, string[]>>({});
  const [customFoldersMap, setCustomFoldersMap] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem("khoahoc4_custom_folders");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("khoahoc4_custom_folders", JSON.stringify(customFoldersMap));
  }, [customFoldersMap]);

  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderValue, setEditingFolderValue] = useState("");

  useEffect(() => {
    if (selectedExploreLesson) {
      const mats = selectedExploreLesson.materials || [];
      if (mats.length > 0) {
        const stillExists = mats.find(m => m.id === activeMaterial?.id);
        if (stillExists) {
          setActiveMaterial(stillExists);
        } else {
          setActiveMaterial(mats[0]);
        }
      } else {
        setActiveMaterial(null);
      }

      const lessonId = selectedExploreLesson.id;

      // Compute lesson folders
      const foldersSet = new Set<string>();
      if (selectedExploreLesson.url) {
        foldersSet.add("🌈 Bài giảng & Đồ dùng dạy học chính khóa");
      }
      
      // Existing material sections
      mats.forEach(m => {
        if (m.section) foldersSet.add(m.section);
      });

      // Add custom created folders
      const customForThis = customFoldersMap[lessonId] || [];
      customForThis.forEach(f => foldersSet.add(f));

      const deletedForThis = deletedFoldersMap[lessonId] || [];

      const finalFolders = Array.from(foldersSet).filter(f => !deletedForThis.includes(f));
      setLessonFolders(finalFolders);
      
      // Select the first folder as active folder by default if current activeFolder is not in the list
      if (!activeFolder || !finalFolders.includes(activeFolder)) {
        setActiveFolder(finalFolders[0] || null);
      }
    } else {
      setActiveMaterial(null);
      setLessonFolders([]);
      setActiveFolder(null);
    }
  }, [selectedExploreLesson, deletedFoldersMap, customFoldersMap]);

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
      setProfileFormName(appState.teacherProfile.name || "admin");
      setProfileFormAvatar(appState.teacherProfile.avatar || "👩‍🏫");
      setProfileFormThemeColor(appState.teacherProfile.themeColor || "emerald");
      setHasInitializedProfile(true);
    }
  }, [appState.teacherProfile, hasInitializedProfile]);

  useEffect(() => {
    if (teacherActiveTab === 'profile' && appState.teacherProfile) {
      setProfileFormName(appState.teacherProfile.name || "admin");
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
        
        // Sync open lesson detail dynamically
        if (selectedExploreLesson) {
          const fresh = parsed.lessons?.find((l: any) => l.id === selectedExploreLesson.id);
          if (fresh) {
            setSelectedExploreLesson(fresh);
          }
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
  const activeLessonIdRef = React.useRef<string | null>(null);
  const activeFolderRef = React.useRef<string | null>(null);
  const activeMaterialIdRef = React.useRef<string | null>(null);
  const currentRoleRef = React.useRef<string>("login");
  const isScreenSyncedRef = React.useRef<boolean>(true);

  React.useEffect(() => {
    activeLessonIdRef.current = selectedExploreLesson?.id || null;
  }, [selectedExploreLesson]);

  React.useEffect(() => {
    activeFolderRef.current = activeFolder;
  }, [activeFolder]);

  React.useEffect(() => {
    activeMaterialIdRef.current = activeMaterial?.id || null;
  }, [activeMaterial]);

  React.useEffect(() => {
    currentRoleRef.current = currentRole;
  }, [currentRole]);

  React.useEffect(() => {
    isScreenSyncedRef.current = isScreenSynced;
  }, [isScreenSynced]);

  // Real-time Firebase Firestore onSnapshot listener with query cache-busting fallback
  useEffect(() => {
    if (isOfflineMode) return;

    console.log("[Firebase Realtime] Subscribing via onSnapshot to app/state...");
    const docRef = doc(db, "app", "state");

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log("[Firebase Realtime] Received state snapshot update:", data);
        handleStateUpdate(data);
      } else {
        console.warn("[Firebase Realtime] State document does not exist yet.");
      }
    }, (error) => {
      console.error("[Firebase Realtime] onSnapshot subscription failure:", error);
      handleFirestoreError(error, OperationType.GET, "app/state");
    });

    // Run fallback cache-busted REST client polling loop every 8 seconds as robust backup
    const fallbackInterval = setInterval(fetchState, 8000);
    fetchState();

    return () => {
      unsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [isOfflineMode]);

  const handleStateUpdate = async (data: any) => {
    if (!data) return;
    // Smart session synchronizer to survive Cloud Run server context restarts without state loss
    let merged = data;
    const local = localStorage.getItem("khoahoc4_state");
    if (local) {
      try {
        const parsedLocal = JSON.parse(local);
        if (parsedLocal) {
          // Server is in pristine/default seed status if it has exactly its initial seed events
          const isServerSeedState = 
            data.lessons && 
            data.lessons.length === 2 && 
            data.lessons.some((l: any) => l.id === "L1") && 
            data.lessons.some((l: any) => l.id === "L2") &&
            data.parentFeedback &&
            data.parentFeedback.length === 1 &&
            data.parentFeedback[0]?.id === "f1" &&
            (!data.workbookSubmissions || data.workbookSubmissions.length === 0);

          // Client contains custom modifications/additions that should be preserved on restart
          const clientHasCustomData = 
            (parsedLocal.lessons && parsedLocal.lessons.length > 2) ||
            (parsedLocal.lessons && parsedLocal.lessons.some((l: any) => l.id !== "L1" && l.id !== "L2")) ||
            (parsedLocal.parentFeedback && parsedLocal.parentFeedback.length > 1) ||
            (parsedLocal.workbookSubmissions && parsedLocal.workbookSubmissions.length > 0) ||
            (parsedLocal.mindmapSubmissions && parsedLocal.mindmapSubmissions.length > 0) ||
            (parsedLocal.students && parsedLocal.students.length > 2);

          // ONLY allow 'teacher' to restore backup state to prevent students from overwriting DB with stale local backup
          if (currentRoleRef.current === 'teacher' && isServerSeedState && clientHasCustomData) {
            // Server restarted or state cleared: push client's backup state to restore online database
            const resRestore = await fetch("/api/state/restore", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(parsedLocal)
            });
            const restoreData = await resRestore.json();
            if (restoreData.success) {
              merged = restoreData.state;
            }
          } else {
            // Server is running lively as absolute source of truth. Take latest edits, creations, or deletions directly!
            merged = data;
          }
        }
      } catch (err) {
        console.warn("Local storage state synchronizer warning:", err);
        merged = data;
      }
    }

    setAppState(merged);
    localStorage.setItem("khoahoc4_state", JSON.stringify(merged));
    setIsOfflineMode(false);
    // Pre-fill teacher notes text if empty initially
    if (merged.teacherNotes && merged.teacherNotes[0]) {
      setNoteInputValue(merged.teacherNotes[0].content);
    }
    
    // Active presentation and routing synchronizer for students/parents based on teacher adjustments
    const currentRoleVal = currentRoleRef.current;
    const isScreenSyncedVal = isScreenSyncedRef.current;
    
    if (isScreenSyncedVal && (currentRoleVal === 'student' || currentRoleVal === 'parent')) {
      if (merged.activeLessonId) {
        const freshLesson = merged.lessons?.find((l: any) => l.id === merged.activeLessonId);
        if (freshLesson) {
          const currentSelLessonId = activeLessonIdRef.current;
          if (!currentSelLessonId || currentSelLessonId !== merged.activeLessonId) {
            setSelectedExploreLesson(freshLesson);
          }
          if (merged.activeFolder && activeFolderRef.current !== merged.activeFolder) {
            setActiveFolder(merged.activeFolder);
          }
          if (merged.activeMaterialId) {
            const freshMat = freshLesson.materials?.find((m: any) => m.id === merged.activeMaterialId);
            if (freshMat && (!activeMaterialIdRef.current || activeMaterialIdRef.current !== merged.activeMaterialId)) {
              setActiveMaterial(freshMat);
            }
          }
        }
      } else {
        if (activeLessonIdRef.current) {
          setSelectedExploreLesson(null);
          setActiveMaterial(null);
        }
      }

      if (merged.activeSubTab) {
        setStudentActiveTab("materials");
        setStudentMaterialSubTab(merged.activeSubTab);
      }
    } else {
      // Sync open lesson detail dynamically if working separately or manually
      const currentSelLessonId = activeLessonIdRef.current;
      if (currentSelLessonId) {
        const fresh = merged.lessons?.find((l: any) => l.id === currentSelLessonId);
        if (fresh) {
          setSelectedExploreLesson(fresh);
        }
      }
    }
  };

  const fetchState = async () => {
    try {
      // Force non-cached, fresh, absolute live data by appending timestamp parameter and no-cache flags
      const res = await fetch(`/api/state?_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        }
      });
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
        handleStateUpdate(data);
      }
    } catch (e) {
      // Quietly fall back without firing console.error to avoid error trackers capturing transient dev server restarts
      useOfflineFallback();
    }
  };

  // Broadcast teacher adjustments (selected lesson, active folder, active material, active subtab) to server in real-time
  useEffect(() => {
    if (currentRole === 'teacher') {
      let activeSubTab: string | null = null;
      if (selectedExploreLesson) {
        activeSubTab = 'lessons';
      }
      
      fetch("/api/active-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeLessonId: selectedExploreLesson?.id || null,
          activeFolder: activeFolder || null,
          activeMaterialId: activeMaterial?.id || null,
          activeSubTab: activeSubTab
        })
      }).catch(err => console.error("Session sync broadcast error:", err));
    }
  }, [currentRole, selectedExploreLesson?.id, activeFolder, activeMaterial?.id]);

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

  const handleStudentSelectLesson = (lesson: Lesson, mat: any = null) => {
    setIsScreenSynced(false);
    setSelectedExploreLesson(lesson);
    if (mat) {
      setActiveMaterial(mat);
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
      setStudentActiveTab('grades');
    } else {
      alert(`Hệ thống chưa tìm thấy học sinh tên "${parentSearchChild}" trong lớp. Hãy báo lại ${appState.teacherProfile?.name || "admin"} thêm bé vào sổ điểm danh trước nhen!`);
      // Fallback register
      setCurrentUser({ id: "PH_TEMP", name: `${parentName.trim()} (Phụ huynh)` });
      setCurrentRole('parent');
      setStudentActiveTab('grades');
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

      // Track as deleted locally
      try {
        const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_students") || "[]");
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem("khoahoc4_deleted_students", JSON.stringify(deletedList));
        }
      } catch (e) {
        console.error(e);
      }

      // Offline updates / Instant update
      updateOfflineState(prev => ({
        ...prev,
        students: (prev.students || []).filter(s => s.id !== id),
        gradesAndComments: (prev.gradesAndComments || []).filter(g => g.studentId !== id)
      }));

      if (isOfflineMode) {
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
        setIsOfflineMode(true);
      }
    });
  };

  const handleRenameStudent = async (id: string, currentName: string) => {
    const newName = prompt("Nhập tên mới cho học sinh:", currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    const cleanName = newName.trim();
    playClickSound();

    updateOfflineState(prev => {
      const students = (prev.students || []).map((s: any) => s.id === id ? { ...s, name: cleanName } : s);
      const gradesAndComments = (prev.gradesAndComments || []).map((g: any) => g.studentId === id ? { ...g, studentName: cleanName } : g);
      const parentFeedback = (prev.parentFeedback || []).map((f: any) => f.studentId === id ? { ...f, studentName: cleanName, parentName: "Phụ huynh em " + cleanName } : f);
      const discussionThreads = (prev.discussionThreads || []).map((t: any) => {
        if (!t.comments) return t;
        const comments = t.comments.map((c: any) => c.studentId === id ? { ...c, studentName: cleanName } : c);
        return { ...t, comments };
      });
      const lessons = (prev.lessons || []).map((l: any) => {
        if (!l.comments) return l;
        const comments = l.comments.map((c: any) => c.authorId === id ? { ...c, authorName: cleanName } : c);
        return { ...l, comments };
      });
      return { ...prev, students, gradesAndComments, parentFeedback, discussionThreads, lessons };
    });

    if (isOfflineMode) {
      playSparkleSound();
      return;
    }

    try {
      const res = await fetch(`/api/students/${id}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName })
      });
      const data = await res.json();
      if (data.success) {
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
      setIsOfflineMode(true);
    }
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

  const handleSaveInlineLesson = async (e: React.FormEvent, categoryIdx: number) => {
    e.preventDefault();
    if (!inlineTitle.trim()) {
      alert("Cần điền tiêu đề bài học!");
      return;
    }
    if (!inlineUrl.trim()) {
      alert("Cần đường dẫn liên kết học liệu!");
      return;
    }
    playClickSound();
    try {
      if (isOfflineMode) {
        let newlyCreatedOffline: any = null;
        updateOfflineState(prev => {
          newlyCreatedOffline = {
            id: "L_" + Date.now(),
            title: inlineTitle,
            type: inlineType,
            url: inlineUrl,
            description: inlineDescription,
            categoryIndex: categoryIdx,
            createdAt: new Date().toISOString(),
            comments: [],
            materials: []
          };
          const updatedLessons = [...prev.lessons, newlyCreatedOffline];
          return { ...prev, lessons: updatedLessons };
        });
        
        setInlineTitle("");
        setInlineType("video");
        setInlineUrl("");
        setInlineDescription("");
        setIsInlineAdding(false);
        playSparkleSound();
        if (newlyCreatedOffline) {
          setSelectedExploreLesson(newlyCreatedOffline);
        }
        return;
      }

      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: inlineTitle,
          type: inlineType,
          url: inlineUrl,
          description: inlineDescription,
          categoryIndex: categoryIdx
        })
      });
      const data = await res.json();
      if (data.success) {
        const prevIds = new Set(appState.lessons.map(l => l.id));
        const newlyCreated = data.lessons.find((l: any) => !prevIds.has(l.id));

        setInlineTitle("");
        setInlineType("video");
        setInlineUrl("");
        setInlineDescription("");
        setIsInlineAdding(false);
        playSparkleSound();
        if (newlyCreated) {
          setSelectedExploreLesson(newlyCreated);
        }
        fetchState();
      }
    } catch (err) {
      console.error(err);
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
      if (isOfflineMode) {
        let newlyCreatedOffline: any = null;
        updateOfflineState(prev => {
          let updatedLessons;
          if (editingLesson) {
            updatedLessons = prev.lessons.map(l => l.id === editingLesson.id ? { ...l, title: lessonForm.title, type: lessonForm.type, url: lessonForm.url, description: lessonForm.description } : l);
          } else {
            newlyCreatedOffline = {
              id: "L_" + Date.now(),
              title: lessonForm.title,
              type: lessonForm.type,
              url: lessonForm.url,
              description: lessonForm.description,
              categoryIndex: activeCategoryIndex !== null ? activeCategoryIndex : lessonForm.categoryIndex,
              createdAt: new Date().toISOString(),
              comments: [],
              materials: []
            };
            updatedLessons = [...prev.lessons, newlyCreatedOffline];
          }
          return { ...prev, lessons: updatedLessons };
        });
        
        setShowAddLessonModal(false);
        setEditingLesson(null);
        setLessonForm({ title: "", type: "video", url: "", description: "", categoryIndex: 1 });
        playSparkleSound();
        if (newlyCreatedOffline) {
          setSelectedExploreLesson(newlyCreatedOffline);
        }
        return;
      }

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
        const prevIds = new Set(appState.lessons.map(l => l.id));
        const newlyCreated = data.lessons.find((l: any) => !prevIds.has(l.id));

        setShowAddLessonModal(false);
        setEditingLesson(null);
        setLessonForm({ title: "", type: "video", url: "", description: "", categoryIndex: 1 });
        playSparkleSound();
        if (newlyCreated) {
          setSelectedExploreLesson(newlyCreated);
        } else if (editingLesson) {
          const updated = data.lessons.find((l: any) => l.id === editingLesson.id);
          if (updated) setSelectedExploreLesson(updated);
        }
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderInput.trim()) return;
    if (!selectedExploreLesson) return;
    const folderName = newFolderInput.trim();
    playClickSound();

    const lessonId = selectedExploreLesson.id;
    setDeletedFoldersMap(prev => {
      const list = prev[lessonId] || [];
      if (list.includes(folderName)) {
        return {
          ...prev,
          [lessonId]: list.filter(f => f !== folderName)
        };
      }
      return prev;
    });

    setCustomFoldersMap(prev => {
      const list = prev[lessonId] || [];
      if (!list.includes(folderName)) {
        return {
          ...prev,
          [lessonId]: [...list, folderName]
        };
      }
      return prev;
    });

    setActiveFolder(folderName);
    setNewFolderInput("");
  };

  const handleDeleteFolder = (folderName: string) => {
    if (folderName === "🌈 Bài giảng & Đồ dùng dạy học chính khóa") {
      alert("Đây là thư mục chính khóa, không thể xóa nhé cô!");
      return;
    }
    if (!selectedExploreLesson) return;

    requestConfirmation(
      `Cô có chắc chắn muốn xóa thư mục "${folderName}" và toàn bộ các liên kết học liệu bên trong không?`,
      async () => {
        playClickSound();
        try {
          const lessonId = selectedExploreLesson.id;

          setCustomFoldersMap(prev => {
            const list = prev[lessonId] || [];
            return {
              ...prev,
              [lessonId]: list.filter(f => f !== folderName)
            };
          });

          const mats = selectedExploreLesson.materials || [];
          const targets = mats.filter(m => {
            const sec = m.section || "Chuyên mục học tập khác 🌐";
            return sec === folderName;
          });

          if (isOfflineMode) {
            updateOfflineState(prev => {
              const updatedLessons = prev.lessons.map(l => {
                if (l.id === lessonId && l.materials) {
                  return {
                    ...l,
                    materials: l.materials.filter((m: any) => {
                      const sec = m.section || "Chuyên mục học tập khác 🌐";
                      return sec !== folderName;
                    })
                  };
                }
                return l;
              });
              return { ...prev, lessons: updatedLessons };
            });

            setDeletedFoldersMap(prev => ({
              ...prev,
              [lessonId]: [...(prev[lessonId] || []), folderName]
            }));

            setTimeout(() => {
              setAppState(prev => {
                const fresh = prev.lessons.find(l => l.id === lessonId);
                if (fresh) setSelectedExploreLesson(fresh);
                return prev;
              });
              playSparkleSound();
            }, 100);
          } else {
            // Delete each material in the folder online
            for (const t of targets) {
              await fetch(`/api/lessons/${lessonId}/materials/${t.id}`, {
                method: "DELETE"
              });
            }

            setDeletedFoldersMap(prev => ({
              ...prev,
              [lessonId]: [...(prev[lessonId] || []), folderName]
            }));

            playSparkleSound();
            fetchState();
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleRenameFolder = async (oldName: string, newName: string) => {
    if (oldName === "🌈 Bài giảng & Đồ dùng dạy học chính khóa") {
      alert("Đây là thư mục chính khóa, không thể sửa nhé cô!");
      return;
    }
    const cleanNewName = newName.trim();
    if (!cleanNewName) {
      alert("Vui lòng nhập tên thư mục hợp lệ!");
      return;
    }
    if (cleanNewName === oldName) {
      setEditingFolder(null);
      return;
    }
    if (!selectedExploreLesson) return;

    playClickSound();
    try {
      const lessonId = selectedExploreLesson.id;

      setCustomFoldersMap(prev => {
        const list = prev[lessonId] || [];
        const isCustom = list.includes(oldName);
        if (isCustom) {
          return {
            ...prev,
            [lessonId]: list.map(f => f === oldName ? cleanNewName : f)
          };
        } else {
          return {
            ...prev,
            [lessonId]: [...list, cleanNewName]
          };
        }
      });

      const mats = selectedExploreLesson.materials || [];
      const targets = mats.filter(m => {
        const sec = m.section || "Chuyên mục học tập khác 🌐";
        return sec === oldName;
      });

      if (isOfflineMode) {
        updateOfflineState(prev => {
          const updatedLessons = prev.lessons.map(l => {
            if (l.id === lessonId && l.materials) {
              const updatedMaterials = l.materials.map((m: any) => {
                const sec = m.section || "Chuyên mục học tập khác 🌐";
                return sec === oldName ? { ...m, section: cleanNewName } : m;
              });
              return { ...l, materials: updatedMaterials };
            }
            return l;
          });
          return { ...prev, lessons: updatedLessons };
        });

        setDeletedFoldersMap(prev => ({
          ...prev,
          [lessonId]: [...(prev[lessonId] || []), oldName]
        }));

        setTimeout(() => {
          setAppState(prev => {
            const fresh = prev.lessons.find(l => l.id === lessonId);
            if (fresh) {
              setSelectedExploreLesson(fresh);
              setActiveFolder(cleanNewName);
            }
            return prev;
          });
          playSparkleSound();
        }, 100);
      } else {
        // Edit each material's section in the database
        for (const t of targets) {
          await fetch(`/api/lessons/${lessonId}/materials`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: t.id,
              title: t.title,
              type: t.type,
              url: t.url,
              description: t.description || "",
              section: cleanNewName
            })
          });
        }

        setDeletedFoldersMap(prev => ({
          ...prev,
          [lessonId]: [...(prev[lessonId] || []), oldName]
        }));

        playSparkleSound();
        setActiveFolder(cleanNewName);
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
    setEditingFolder(null);
  };

  const handleSaveMaterial = async (e: React.FormEvent, lessonId: string) => {
    e.preventDefault();
    if (!materialForm.title.trim()) {
      alert("Nhập tiêu đề cho học liệu mới nhé!");
      return;
    }
    playClickSound();
    try {
      if (isOfflineMode) {
        updateOfflineState(prev => {
          const updatedLessons = prev.lessons.map(l => {
            if (l.id === lessonId) {
              const materials = l.materials || [];
              let updatedMaterials;
              if (editingMaterial) {
                updatedMaterials = materials.map((m: any) => 
                  m.id === editingMaterial.id 
                    ? { ...m, title: materialForm.title, type: materialForm.type, url: materialForm.url, description: materialForm.description, section: materialForm.section }
                    : m
                );
              } else {
                const newM = {
                  id: "M_" + Date.now(),
                  title: materialForm.title,
                  type: materialForm.type,
                  url: materialForm.url,
                  description: materialForm.description,
                  section: materialForm.section || "Học tập tổng hợp 📝",
                  createdAt: new Date().toISOString()
                };
                updatedMaterials = [...materials, newM];
              }
              return { ...l, materials: updatedMaterials };
            }
            return l;
          });
          return { ...prev, lessons: updatedLessons };
        });
        
        setShowAddMaterialForm(false);
        setEditingMaterial(null);
        setMaterialForm({ title: "", type: "video", url: "", description: "", section: "Video bài giảng 📹" });
        playSparkleSound();
        setTimeout(() => {
          setAppState(prev => {
            const fresh = prev.lessons.find(l => l.id === lessonId);
            if (fresh) setSelectedExploreLesson(fresh);
            return prev;
          });
        }, 100);
        return;
      }

      const res = await fetch(`/api/lessons/${lessonId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMaterial?.id,
          title: materialForm.title,
          type: materialForm.type,
          url: materialForm.url,
          description: materialForm.description,
          section: materialForm.section
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddMaterialForm(false);
        setEditingMaterial(null);
        setMaterialForm({ title: "", type: "video", url: "", description: "", section: "Video bài giảng 📹" });
        playSparkleSound();
        fetchState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterial = async (lessonId: string, materialId: string) => {
    requestConfirmation("Cô chắc chắn muốn xóa học liệu này chứ?", async () => {
      playClickSound();
      try {
        if (isOfflineMode) {
          updateOfflineState(prev => {
            const updatedLessons = prev.lessons.map(l => {
              if (l.id === lessonId && l.materials) {
                return { ...l, materials: l.materials.filter((m: any) => m.id !== materialId) };
              }
              return l;
            });
            return { ...prev, lessons: updatedLessons };
          });
          setTimeout(() => {
            setAppState(prev => {
              const fresh = prev.lessons.find(l => l.id === lessonId);
              if (fresh) setSelectedExploreLesson(fresh);
              return prev;
            });
          }, 100);
          return;
        }

        const res = await fetch(`/api/lessons/${lessonId}/materials/${materialId}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          fetchState();
        }
      } catch (err) {
        console.error(err);
      }
    });
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

      // Instantly track as deleted locally
      try {
        const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_lessons") || "[]");
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem("khoahoc4_deleted_lessons", JSON.stringify(deletedList));
        }
      } catch (e) {
        console.error(e);
      }

      // Update state instantly so the UI reacts with zero latency
      setAppState(prev => {
        const filtered = (prev.lessons || []).filter(l => l.id !== id);
        const updated = { ...prev, lessons: filtered };
        localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
        return updated;
      });

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
        if (data.teacherProfile) {
          setAppState(prev => {
            const updated = { ...prev, teacherProfile: data.teacherProfile };
            localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
            return updated;
          });
        }
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

      // Track as deleted locally
      try {
        const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_plans") || "[]");
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem("khoahoc4_deleted_plans", JSON.stringify(deletedList));
        }
      } catch (e) {
        console.error(e);
      }

      // Update state instantly
      setAppState(prev => {
        const filtered = (prev.lessonPlans || []).filter(p => p.id !== id);
        const updated = { ...prev, lessonPlans: filtered };
        localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
        return updated;
      });

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

      // Track as deleted locally
      try {
        const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_events") || "[]");
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem("khoahoc4_deleted_events", JSON.stringify(deletedList));
        }
      } catch (e) {
        console.error(e);
      }

      // Update state instantly
      setAppState(prev => {
        const filtered = (prev.scheduleEvents || []).filter(e => e.id !== id);
        const updated = { ...prev, scheduleEvents: filtered };
        localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
        return updated;
      });

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

      // Track as deleted locally
      try {
        const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_sheets") || "[]");
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem("khoahoc4_deleted_sheets", JSON.stringify(deletedList));
        }
      } catch (e) {
        console.error(e);
      }

      // Update state instantly
      setAppState(prev => {
        const filtered = (prev.studySheets || []).filter(s => s.id !== id);
        const updated = { ...prev, studySheets: filtered };
        localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
        return updated;
      });

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

      // Track as deleted locally
      try {
        const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_discussions") || "[]");
        if (!deletedList.includes(id)) {
          deletedList.push(id);
          localStorage.setItem("khoahoc4_deleted_discussions", JSON.stringify(deletedList));
        }
      } catch (e) {
        console.error(e);
      }

      // Update state instantly
      setAppState(prev => {
        const filtered = (prev.discussionThreads || []).filter(t => t.id !== id);
        const updated = { ...prev, discussionThreads: filtered };
        localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
        return updated;
      });

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

    let sId = currentUser.id;
    let sName = currentUser.name;
    let pName = currentUser.name;

    if (currentUser.name.includes(" (PH em ")) {
      const parts = currentUser.name.split(" (PH em ");
      pName = "Phụ huynh " + parts[0];
      sName = parts[1].replace(")", "");
    } else if (currentUser.name.includes(" (Phụ huynh)")) {
      const parts = currentUser.name.split(" (Phụ huynh)");
      pName = "Phụ huynh " + parts[0];
      sName = "Học sinh";
    } else {
      pName = "Phụ huynh của em " + currentUser.name;
    }

    const tempId = "f_" + Date.now();
    const newFb = {
      id: tempId,
      studentId: sId,
      studentName: sName,
      parentName: pName,
      message: parentFeedbackInput,
      timestamp: new Date().toISOString()
    };

    // Update locally immediately for an instant zero-latency feedback loop
    setAppState(prev => {
      const updatedList = [newFb, ...(prev.parentFeedback || [])];
      const updated = { ...prev, parentFeedback: updatedList };
      localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
      return updated;
    });

    const bodyContent = {
      studentId: sId,
      studentName: sName,
      parentName: pName,
      message: parentFeedbackInput
    };

    setParentFeedbackInput("");
    playSparkleSound();
    alert("✉️ Đã gửi tin nhắn phản hồi trực tiếp cho Giáo viên lớp học!");

    try {
      const res = await fetch("/api/parent-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyContent)
      });
      const data = await res.json();
      if (data.success) {
        if (data.parentFeedback) {
          setAppState(prev => {
            const filteredLocal = (prev.parentFeedback || []).filter(fb => fb.id !== tempId);
            const map = new Map();
            data.parentFeedback.forEach((item: any) => map.set(item.id, item));
            filteredLocal.forEach((item: any) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            const mergedList = Array.from(map.values());
            const updated = { ...prev, parentFeedback: mergedList };
            localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
            return updated;
          });
        }
        fetchState();
      }
    } catch (err) {
      console.error("Failed to send parent feedback online, relying on local instant state:", err);
      setIsOfflineMode(true);
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
        if (data.parentFeedback) {
          setAppState(prev => {
            const updated = { ...prev, parentFeedback: data.parentFeedback };
            localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
            return updated;
          });
        }
        fetchState();
        alert("✉️ Đã gửi phản hồi đến phụ huynh thành công!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete parent feedback
  const handleDeleteFeedback = async (feedbackId: string) => {
    playClickSound();
    
    // Add to deleted feedbacks set locally so it never gets merged back by state synchronization
    try {
      const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_feedbacks") || "[]");
      if (!deletedList.includes(feedbackId)) {
        deletedList.push(feedbackId);
        localStorage.setItem("khoahoc4_deleted_feedbacks", JSON.stringify(deletedList));
      }
    } catch (e) {
      console.error(e);
    }

    // Instantly filter parent feedback in present local state so the UI updates with zero delay
    setAppState(prev => {
      const filtered = (prev.parentFeedback || []).filter(fb => fb.id !== feedbackId);
      const updated = { ...prev, parentFeedback: filtered };
      localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch("/api/parent-feedback/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId })
      });
      const data = await res.json();
      if (data.success) {
        playSparkleSound();
        if (data.parentFeedback) {
          const deletedList = JSON.parse(localStorage.getItem("khoahoc4_deleted_feedbacks") || "[]");
          const filtered = data.parentFeedback.filter((fb: any) => fb && !deletedList.includes(fb.id));
          setAppState(prev => {
            const updated = { ...prev, parentFeedback: filtered };
            localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
            return updated;
          });
        }
        fetchState();
      }
    } catch (err) {
      console.error("Online delete request failed, falling back to instant local state suppression:", err);
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
        if (data.teacherProfile) {
          setAppState(prev => {
            const updated = { ...prev, teacherProfile: data.teacherProfile };
            localStorage.setItem("khoahoc4_state", JSON.stringify(updated));
            return updated;
          });
        }
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
        localStorage.removeItem("khoahoc4_deleted_lessons");
        localStorage.removeItem("khoahoc4_deleted_students");
        localStorage.removeItem("khoahoc4_deleted_plans");
        localStorage.removeItem("khoahoc4_deleted_events");
        localStorage.removeItem("khoahoc4_deleted_sheets");
        localStorage.removeItem("khoahoc4_deleted_discussions");
        localStorage.removeItem("khoahoc4_deleted_feedbacks");
        localStorage.removeItem("khoahoc4_state");

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
                    <h3 className="text-lg sm:text-xl font-black text-yellow-950 tracking-tight mt-3">{(appState.teacherProfile?.name || "admin").toUpperCase()}</h3>
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
                  {appState.teacherProfile.name || "admin"}
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
            <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6">
              <RealtimeClock />
              
              {/* ================================== TAB B1: TEACHER DASHBOARD ================================== */}
              {teacherActiveTab === 'dashboard' && (
                <div className="flex flex-col gap-6">

                  {/* Header Strip with total updates */}
                  <div className="bg-white p-6 rounded-[32px] border-4 border-[#FDE047] shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-amber-950">BẢNG QUẢN LÝ LỚP KHOA HỌC 4A</h2>
                      <p className="text-xs text-zinc-600 font-bold mt-1">Chào mừng {appState.teacherProfile?.name || "admin"}, hệ thống đang đồng bộ liên tục với học sinh.</p>
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
                                    alert(`Ngày này đã tồn tại rồi ${appState.teacherProfile?.name || "admin"} ơi!`);
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
                                      onClick={() => handleRenameStudent(student.id, student.name)}
                                      className="p-1.5 hover:bg-amber-50 text-amber-600 rounded-lg cursor-pointer shrink-0 transition-all"
                                      title="Đổi tên học sinh"
                                    >
                                      <Edit className="w-4 h-4" />
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
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('lessons'); setSelectedCategoryPage(null); }}
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
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('worksheets'); setSelectedCategoryPage(null); }}
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
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('mindmaps'); setSelectedCategoryPage(null); }}
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
                      onClick={() => { playClickSound(); setMaterialActiveSubTab('discussions'); setSelectedCategoryPage(null); }}
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

                      {selectedCategoryPage !== null ? (
                        /* Dedicated Topic Lessons Page View */
                        <div className="flex flex-col gap-4">
                          <button
                            type="button"
                            onClick={() => { playClickSound(); setSelectedCategoryPage(null); }}
                            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer border border-zinc-350 shadow-sm transition-colors self-start px-4 py-2"
                          >
                            ⬅️ QUAY LẠI DANH SÁCH CHỦ ĐỀ
                          </button>

                          <div className={`rounded-[32px] p-6 border-4 border-zinc-200 shadow-md ${SUBJECT_COLORS[selectedCategoryPage - 1]} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                            <div className="flex items-center gap-4">
                              <span className="text-5xl">{SUBJECT_EMOJIS[selectedCategoryPage - 1]}</span>
                              <div>
                                <h4 className="text-lg font-black uppercase tracking-tight text-zinc-900 leading-tight">
                                  {SUBJECT_CATEGORIES[selectedCategoryPage - 1]}
                                </h4>
                                <p className="text-xs font-bold text-zinc-650 mt-1">
                                  Danh sách toàn bộ bài học, các học liệu hướng dẫn và video bài giảng mượt mà
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setActiveCategoryIndex(selectedCategoryPage);
                                setEditingLesson(null);
                                setLessonForm({ title: "", type: "video", url: "", description: "", categoryIndex: selectedCategoryPage });
                                setShowAddLessonModal(true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-650 text-white font-black text-xs uppercase flex items-center gap-1 shadow-md cursor-pointer shrink-0 transition-transform hover:scale-103"
                              title="Thêm Bài Học Mới"
                            >
                              ➕ THÊM BÀI HỌC MỚI
                            </button>
                          </div>

                          {/* Gorgeous Collapsible Inline Lesson Creator form within category page */}
                          <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 p-5 rounded-[24px] border-4 border-dashed border-amber-300 shadow-md">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => { playClickSound(); setIsInlineAdding(!isInlineAdding); }}>
                              <div className="flex items-start md:items-center gap-2">
                                <span className="text-xl animate-bounce">🌱</span>
                                <div>
                                  <h4 className="font-extrabold text-[#022C22] text-xs uppercase leading-snug">
                                    THÊM BÀI HỌC NHANH TRỰC TIẾP TRONG CHỦ ĐỀ NÀY
                                  </h4>
                                  <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">Thêm bài học mới cực nhanh chỉ bằng cách nhập tên bài học</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-955 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border border-amber-500 shrink-0 select-none cursor-pointer"
                              >
                                {isInlineAdding ? "🛑 Đóng" : "➕ Thêm Bài Học Trực Tiếp"}
                              </button>
                            </div>

                            {isInlineAdding && (
                              <form 
                                onSubmit={(e) => handleSaveInlineLesson(e, selectedCategoryPage)} 
                                className="flex flex-col sm:flex-row gap-3 mt-4 text-xs font-bold text-zinc-700 border-t border-amber-200/50 pt-4 animate-fade-in items-end"
                              >
                                <div className="flex flex-col gap-1 flex-grow w-full">
                                  <label className="text-zinc-650 block mb-0.5">TÊN BÀI HỌC MỚI:</label>
                                  <input
                                    type="text"
                                    placeholder="Ví dụ: Bài 2: Sự chuyển thể của nước, Bài 3: Giải phẫu bông hoa..."
                                    value={inlineTitle}
                                    onChange={(e) => setInlineTitle(e.target.value)}
                                    className="p-3 border-2 border-zinc-200 bg-white rounded-xl outline-none focus:border-amber-400 font-semibold text-sm w-full"
                                    required
                                  />
                                </div>

                                <button
                                  type="submit"
                                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer hover:scale-[1.01] active:scale-95 transition-all text-center whitespace-nowrap h-[46px] flex items-center justify-center"
                                >
                                  Tạo Bài Học Mới 🚀
                                </button>
                              </form>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                            {filteredLessonsOfCategory(selectedCategoryPage).length === 0 ? (
                              <div className="col-span-full py-16 text-center text-zinc-550 italic bg-zinc-50 border-4 border-dashed rounded-[32px] px-6">
                                <p className="text-sm font-black text-zinc-650 mb-2">Chưa có bài giảng hay học liệu số nào trong chủ đề này.</p>
                                <p className="text-xs text-zinc-500 font-bold">Hãy nhấp nút "+ THÊM BÀI HỌC MỚI" ở trên để tạo nha cô giáo!</p>
                              </div>
                            ) : (
                              filteredLessonsOfCategory(selectedCategoryPage).map(lesson => (
                                <div
                                  key={lesson.id}
                                  onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('span[role="button"]')) {
                                      return;
                                    }
                                    playClickSound();
                                    setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id);
                                  }}
                                  className={`bg-white rounded-[32px] p-5 border-4 transition-all flex flex-col justify-between relative min-h-[180px] cursor-pointer hover:scale-[1.01] duration-200 ${
                                    expandedLessonId === lesson.id ? "border-amber-400 shadow-lg ring-4 ring-amber-100" : "border-zinc-200/80 hover:border-amber-400 hover:shadow-xl"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start gap-2.5">
                                      <span className="text-3xl shrink-0 mt-0.5">
                                        {getLessonTypeIcon(lesson.type)}
                                      </span>
                                      <div className="overflow-hidden">
                                        <h5 className="font-extrabold text-[#022C22] text-sm break-words line-clamp-2 font-sans" title={lesson.title}>
                                          {lesson.title}
                                        </h5>
                                        <span className="text-[9px] uppercase font-black tracking-wider text-amber-850 bg-amber-50 rounded-full px-2.5 py-0.5 border border-amber-200 inline-block mt-1">
                                          Bài học / Học liệu
                                        </span>
                                      </div>
                                    </div>

                                    {lesson.description && (
                                      <p className="text-xs text-zinc-550 font-bold italic bg-zinc-50 p-2.5 rounded-2xl border border-zinc-100 mt-3 line-clamp-3">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>

                                  {expandedLessonId === lesson.id && (
                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-zinc-100 text-left animate-fade-in w-full text-zinc-800" onClick={(e) => e.stopPropagation()}>
                                      <h6 className="text-[11px] font-black uppercase text-amber-955 tracking-wider mb-2.5 flex items-center gap-1 select-none">
                                        📂 THƯ MỤC HỌC LIỆU CỦA BÀI:
                                      </h6>
                                      {(() => {
                                        const foldersMap = getLessonFoldersMap(lesson);
                                        const folderNames = Object.keys(foldersMap);
                                        
                                        if (folderNames.length === 0) {
                                          return (
                                            <div className="p-3 bg-zinc-50 rounded-2xl border text-center text-[10px] text-zinc-500 font-bold select-none leading-relaxed">
                                              🌿 Bài học này hiện chưa có thư mục học liệu nào do cô giáo thiết kế.<br />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  playClickSound();
                                                  setSelectedExploreLesson(lesson);
                                                }}
                                                className="text-amber-805 hover:text-amber-900 underline font-black mt-1.5 inline-block cursor-pointer"
                                              >
                                                ⚙️ Nhấp để vào cấu hình / Soạn bài ➡️
                                              </button>
                                            </div>
                                          );
                                        }
                                        
                                        return (
                                          <div className="space-y-2">
                                            {folderNames.map((folderName) => {
                                              const folderMats = foldersMap[folderName];
                                              return (
                                                <div key={folderName} className="bg-amber-50/20 rounded-2xl p-2.5 border border-amber-200/50 shadow-2xs">
                                                  <div className="text-[11px] font-black text-amber-955 uppercase flex items-center gap-1.5 select-none border-b border-amber-200/30 pb-1 mb-1.5">
                                                    <span>📂</span>
                                                    <span className="truncate max-w-[240px]" title={folderName}>{folderName}</span>
                                                    <span className="ml-auto text-[9px] bg-amber-100/90 text-amber-900 font-black px-1.5 py-0.5 rounded-full shrink-0">
                                                      {folderMats.length} link
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="space-y-1">
                                                    {folderMats.map((m) => (
                                                      <div 
                                                        key={m.id}
                                                        onClick={() => {
                                                          playClickSound();
                                                          setSelectedExploreLesson(lesson);
                                                          setActiveMaterial(m);
                                                        }}
                                                        className="p-1.5 bg-white hover:bg-emerald-50 rounded-xl border border-zinc-150 flex items-center justify-between text-[11px] font-bold text-zinc-700 hover:text-[#022C22] transition-all cursor-pointer shadow-2xs gap-2"
                                                        title="Nhấp để hiển thị học trực quan"
                                                      >
                                                        <span className="truncate flex items-center gap-1.5">
                                                          <span className="text-sm shrink-0">{getLessonTypeIcon(m.type)}</span>
                                                          <span className="truncate" title={m.title}>{m.title}</span>
                                                        </span>
                                                        <span className="text-[9px] font-black bg-zinc-50 hover:bg-emerald-100 text-zinc-500 hover:text-emerald-800 border border-zinc-200 px-1.5 py-0.5 rounded-md uppercase shrink-0 transition-all">
                                                          Mở ➡️
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  )}

                                  <div className="flex flex-col gap-2.5 border-t border-zinc-100 pt-3 mt-4" onClick={(e) => e.stopPropagation()}>
                                    {lesson.url && (
                                      <a
                                        href={lesson.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] text-blue-650 font-bold hover:underline truncate"
                                        title={lesson.url}
                                      >
                                        🔗 Link: {lesson.url}
                                      </a>
                                    )}
                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          playClickSound();
                                          setSelectedExploreLesson(lesson);
                                        }}
                                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-955 text-xs font-black rounded-xl border border-amber-500 cursor-pointer flex items-center gap-0.5 transition-all text-center shadow-xs"
                                        title="Vào học / Xem học liệu"
                                      >
                                        🚪 Vào học ➡️
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditLessonTrigger(lesson, selectedCategoryPage);
                                        }}
                                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black rounded-xl border border-amber-200 cursor-pointer flex items-center gap-x-0.5 transition-all text-center"
                                        title="Chỉnh sửa bài"
                                      >
                                        ⚙️ Sửa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteLesson(lesson.id);
                                        }}
                                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black rounded-xl border border-rose-200 cursor-pointer flex items-center gap-x-0.5 transition-all text-center"
                                        title="Xóa bài"
                                      >
                                        × Xóa
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        /* List of 6 subject category cards as original grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {SUBJECT_CATEGORIES.map((subjectTitle, i) => {
                            const categoryIdx = i + 1;
                            const subjectLessons = filteredLessonsOfCategory(categoryIdx);
                            const boxColorStyle = SUBJECT_COLORS[i] || SUBJECT_COLORS[0];
                            const iconCharacter = SUBJECT_EMOJIS[i] || "🧪";

                            return (
                              <div
                                key={categoryIdx}
                                onClick={() => {
                                  playClickSound();
                                  setSelectedCategoryPage(categoryIdx);
                                }}
                                className={`rounded-[32px] p-5 border-4 border-zinc-200 shadow-lg flex flex-col justify-between relative cursor-pointer hover:border-amber-400 hover:shadow-xl transition-all min-h-[170px] ${boxColorStyle}`}
                              >
                                {/* Circular decorative indicator */}
                                <div
                                  className="absolute -top-3 -left-3 w-11 h-11 bg-white rounded-full border-4 border-amber-400 shadow-md flex items-center justify-center text-xl z-10 transition-transform"
                                  title="Nhấp để mở trang bài học"
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

                                {/* Link action hint */}
                                <div className="flex justify-between items-center mt-4 pt-2 border-t border-dashed border-zinc-300/40">
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
                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition-transform hover:scale-103 cursor-pointer shrink-0 border border-green-600"
                                    title="Thêm Bài Học Mới"
                                  >
                                    ➕ Thêm bài học
                                  </button>
                                  <div className="text-[10px] uppercase font-black text-amber-950 text-right flex items-center justify-end gap-1 underline decoration-dotted">
                                    Vào học ➡️
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                                  setIsSheetUploading(true);
                                  const reader = new FileReader();
                                  reader.onload = async (event) => {
                                    if (event.target?.result && typeof event.target.result === "string") {
                                      try {
                                        const response = await fetch("/api/upload", {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ name: file.name, base64: event.target.result })
                                        });
                                        const upData = await response.json();
                                        if (upData.success && upData.url) {
                                          setSheetFormUrl(upData.url);
                                          if (!sheetFormTitle.trim()) {
                                            const nameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                            setSheetFormTitle(nameNoExt);
                                          }
                                          playSparkleSound();
                                        } else {
                                          alert(upData.error || "Gặp lỗi tải tệp lên máy chủ");
                                        }
                                      } catch (err: any) {
                                        alert("Lỗi kết nối máy chủ: " + err.message);
                                      } finally {
                                        setIsSheetUploading(false);
                                      }
                                    }
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
                                    reader.onload = async (event) => {
                                      if (event.target?.result && typeof event.target.result === "string") {
                                        try {
                                          const response = await fetch("/api/upload", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ name: file.name, base64: event.target.result })
                                          });
                                          const upData = await response.json();
                                          if (upData.success && upData.url) {
                                            setSheetFormUrl(upData.url);
                                            if (!sheetFormTitle.trim()) {
                                              const nameNoExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                                              setSheetFormTitle(nameNoExt);
                                            }
                                            playSparkleSound();
                                          } else {
                                            alert(upData.error || "Gặp sự cố tải tệp");
                                          }
                                        } catch (err: any) {
                                          alert("Lỗi kết nối máy chủ: " + err.message);
                                        } finally {
                                          setIsSheetUploading(false);
                                        }
                                      }
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
                            {sheetFormUrl && (sheetFormUrl.startsWith("data:") || sheetFormUrl.startsWith("/uploads/")) && (
                              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col gap-2 text-left">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                                    🌟 TẢI LÊN THÀNH CÔNG HỌC LIỆU ĐỒNG BỘ!
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
                                  {sheetFormUrl.startsWith("data:image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(sheetFormUrl) ? (
                                    <img src={sheetFormUrl} alt="Preview" className="max-h-32 rounded object-contain" />
                                  ) : sheetFormUrl.startsWith("data:audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(sheetFormUrl) ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-[10px] font-black text-amber-900 block">🔊 Bản ghi âm nghe mượt</span>
                                      <audio src={sheetFormUrl} controls className="max-h-12 w-full max-w-xs" />
                                    </div>
                                  ) : sheetFormUrl.startsWith("data:video/") || /\.(mp4|webm|mov)$/i.test(sheetFormUrl) ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-[10px] font-black text-amber-900 block">🎬 Clip bài giảng khoa học</span>
                                      <video src={sheetFormUrl} controls className="max-h-32 rounded bg-black" />
                                    </div>
                                  ) : (
                                    <div className="py-2">
                                      <span className="text-xs font-bold text-zinc-650 block">📄 Học liệu PDF / Slides / Giáo trình điện tử</span>
                                      <span className="text-[9px] text-zinc-400 block mt-0.5">{sheetFormUrl}</span>
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
                    <LessonInputForm
                      onClose={() => setShowAddLessonModal(false)}
                      onSubmit={handleSaveLesson}
                      lessonForm={lessonForm}
                      setLessonForm={setLessonForm}
                      editingLesson={!!editingLesson}
                      subjectCategory={SUBJECT_CATEGORIES[(activeCategoryIndex || 1) - 1]}
                      getLessonTypeIcon={getLessonTypeIcon}
                      customLessonTypes={customLessonTypes}
                      setCustomLessonTypes={setCustomLessonTypes}
                      playClickSound={playClickSound}
                      playSparkleSound={playSparkleSound}
                      teacherName={appState.teacherProfile?.name}
                    />
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
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-zinc-500 font-bold">{new Date(fb.timestamp).toLocaleDateString()}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeedback(fb.id)}
                                  className="w-5 h-5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 flex items-center justify-center font-black text-xs cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all"
                                  title="Xóa tin nhắn"
                                >
                                  ×
                                </button>
                              </div>
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
                            <span className="text-[10px] text-zinc-500 font-medium">Tên hiển thị mặc định khi đăng nhập là "admin".</span>
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

        {/* ======================= CASE C: STUDENT & PARENT WORKSPACE ======================= */}
        {(currentRole === 'student' || currentRole === 'parent') && currentUser && (
          <div className="flex-1 flex flex-row h-full">
            
            {/* 1. Left Vertical Menu Sidebar (as squares with stickers) */}
            <aside className="w-20 sm:w-24 md:w-28 lg:w-32 bg-white border-r-4 border-emerald-400 flex flex-col p-2.5 sm:p-4 gap-3 shrink-0">
              <div className="flex flex-col items-center gap-1 mb-4 bg-emerald-50 p-1.5 sm:p-2 rounded-2xl border border-emerald-200">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-emerald-350 flex items-center justify-center text-lg sm:text-xl shadow-sm select-none shrink-0" title={currentUser.name}>
                  {currentRole === 'parent' ? "👨‍👩‍👧" : "🧒"}
                </div>
                <span className="hidden sm:inline text-[8px] font-black text-emerald-850 uppercase tracking-tighter text-center">
                  {currentRole === 'parent' ? "Phụ huynh" : "Học sinh"}
                </span>
              </div>

              {/* Navigation column list of squares */}
              <nav className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => { playClickSound(); setStudentActiveTab('grades'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    studentActiveTab === 'grades'
                      ? 'bg-emerald-100 hover:bg-emerald-100 text-teal-900 border-emerald-400 shadow-md animate-pulse-slow'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  title={currentRole === 'parent' ? "Thành tích, kết quả học tập & Nhận xét từ cô giáo" : "Thành tích học tập & nhận xét của em"}
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">🏆</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    Thành tích
                  </span>
                </button>
                <button
                  onClick={() => { playClickSound(); setStudentActiveTab('attendance'); }}
                  className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                    studentActiveTab === 'attendance'
                      ? 'bg-emerald-100 hover:bg-emerald-100 text-teal-900 border-emerald-400 shadow-md'
                      : 'bg-white text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  title={currentRole === 'parent' ? "Sổ chuyên cần và điểm chuyên cần của con" : "Điểm danh"}
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">📝</span>
                  <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                    {currentRole === 'parent' ? "Nề nếp" : "Điểm danh"}
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
                {currentRole === 'parent' && (
                  <button
                    onClick={() => { playClickSound(); setStudentActiveTab('feedback'); }}
                    className={`aspect-square w-full rounded-2xl flex flex-col items-center justify-center text-center p-1 sm:p-2 gap-0.5 sm:gap-1 cursor-pointer transition-all border-4 relative overflow-hidden select-none hover:scale-[1.03] active:scale-95 ${
                      studentActiveTab === 'feedback'
                        ? 'bg-emerald-100 hover:bg-emerald-100 text-teal-900 border-emerald-400 shadow-md'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                    title={`Gửi phản hồi, góp ý cho ${appState.teacherProfile?.name || "Cô giáo"}`}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow">✉️</span>
                    <span className="text-[8px] sm:text-[9px] font-black leading-tight break-words text-center uppercase tracking-tighter mt-1">
                      Ý kiến PH
                    </span>
                  </button>
                )}
              </nav>

              {/* Sidebar bottom decoration/quick switch */}
              <div className="mt-auto hidden sm:flex flex-col gap-1 p-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-center col-span-1">
                <p className="text-[8px] sm:text-[9px] font-black text-emerald-850 uppercase tracking-tighter">
                  🌟 ĐIỂM SAO
                </p>
              </div>
            </aside>

            {/* 2. Right Workspace Panel */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col gap-6">
              <RealtimeClock />

              {/* Real-time Screen Synchronization Indicator */}
              {appState.activeLessonId && (
                <div className="bg-white border-2 border-emerald-405 p-4 rounded-[24px] shadow-sm flex flex-col md:flex-row justify-between items-center gap-3 animate-fade-in">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="relative flex h-3.5 w-3.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold text-zinc-700 leading-normal">
                      📡 <span className="text-emerald-605 font-extrabold tracking-wider uppercase">MÀN HÌNH ĐỒNG BỘ: Cô Dương đang giảng bài</span>{" "}
                      <span className="text-[#042F1A] font-black underline decoration-2 decoration-emerald-400">
                        {appState.lessons?.find(l => l.id === appState.activeLessonId)?.title || "Bài Học Trực Tuyến"}
                      </span>
                      {appState.activeFolder && (
                        <>
                          {" "}» Thư mục đang chỉ:{" "}
                          <span className="text-amber-700 font-extrabold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 ml-1 inline-block">{appState.activeFolder}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        const nextVal = !isScreenSynced;
                        setIsScreenSynced(nextVal);
                        if (nextVal) {
                          // Force update to catch up immediately
                          fetchState();
                        }
                      }}
                      className={`px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer select-none border-2 transition-all flex items-center gap-1.5 ${
                        isScreenSynced
                          ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm hover:bg-emerald-100"
                          : "bg-zinc-105 hover:bg-zinc-200 border-zinc-300 text-zinc-650"
                      }`}
                    >
                      {isScreenSynced ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Đang nhận bài giảng cô giáo (BẬT)</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                          <span>Tự xem bài độc lập (TẮT)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Playful student or parent title header card in natural tone */}
              <div className="bg-[#DCFCE7] p-5 rounded-[32px] border-4 border-emerald-400 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-5xl animate-wiggle">{currentRole === 'parent' ? "👨‍👩‍👧" : "🎒"}</span>
                  <div>
                    <h2 className="text-xl font-black text-emerald-955 max-w-2xl leading-normal">
                      {currentRole === 'parent' ? (
                        <>KÍNH CHÀO PHỤ HUYNH: <span className="bg-white px-2.5 py-0.5 rounded-xl border-2 border-emerald-300 inline-block rotate-1 my-1">{currentUser.name}</span></>
                      ) : (
                        <>CHÀO BẠN NHỎ: <span className="bg-white px-2.5 py-0.5 rounded-xl border-2 border-emerald-300 inline-block rotate-1 my-1">{currentUser.name}</span> CHÀO MỪNG BẠN ĐẾN KHÁM PHÁ!</>
                      )}
                    </h2>
                    <p className="text-xs font-bold text-emerald-805 mt-1">
                      {currentRole === 'parent' 
                        ? "Đồng hành và theo sát hành trình tự học, rèn luyện tư duy sáng tạo của con thân yêu! 💕"
                        : "👋 Cách học: Chọn 1 trong 6 Chủ đề dưới đây ➡️ Nhấp vào Bài học con muốn học ➡️ Nhấn nút xanh lá \"🚀 NHẤP VÀO ĐÂY ĐỂ HỌC\" để bắt đầu ngay nhé! 🌟"
                      }
                    </p>
                  </div>
                </div>

                {/* Status and attendance badge */}
                <div>
                  {currentRole === 'parent' ? (
                    <div className="bg-white border-2 border-emerald-405 text-emerald-850 font-black text-xs px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm">
                      ✨ KÊNH LIÊN LẠC GIA ĐÌNH & GIÁO VIÊN: {(appState.teacherProfile?.name || "Cô giáo").toUpperCase()}
                    </div>
                  ) : appState.students.find(s=>s.id === currentUser.id)?.isPresent ? (
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

            {/* ================================== TAB S0: GRADES & REMARKS BLOCK ================================== */}
            {studentActiveTab === 'grades' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* 1. Main Scoreboard Banner with Cute Animal Badges */}
                <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 rounded-[32px] border-4 border-amber-400 shadow-lg text-white relative overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute right-0 bottom-0 opacity-10 text-[180px] pointer-events-none select-none translate-x-12 translate-y-12">
                     🏆
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-4xl shadow-inner border border-white/30 animate-pulse">
                        🏆
                      </div>
                      <div>
                        <h3 className="text-lg font-black tracking-wide uppercase">SỔ ĐIỂM & CHỨNG NHẬN VINH DANH</h3>
                        <p className="text-xs text-amber-50 font-bold mt-1">
                          {currentRole === 'parent' 
                            ? "Xem kết quả rèn luyện tích lũy từng ngày và nhận xét từ giáo viên chủ nhiệm!" 
                            : "Cố gắng đạt thật nhiều sao vàng rực rỡ để rinh danh hiệu bé ngoan nhé em yêu!"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Quick overview widget */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-5 shrink-0 shadow-sm text-center">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-100 block">SỐ SAO TÍCH LŨY</span>
                        <div className="text-2xl font-black text-yellow-300 flex items-center justify-center gap-1 mt-0.5">
                          ⭐ {(() => {
                            const wbStars = appState.workbookSubmissions.filter(s => s.studentId === currentUser?.id).reduce((acc, curr) => acc + (curr.stars || 0), 0);
                            const mmStars = appState.mindmapSubmissions.filter(s => s.studentId === currentUser?.id).reduce((acc, curr) => acc + (curr.stars || 0), 0);
                            return wbStars + mmStars;
                          })()}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-white/20"></div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-100 block">DANH HIỆU ĐẠT</span>
                        <div className="text-sm font-black text-white bg-amber-600/50 px-2.5 py-1 rounded-lg border border-white/10 mt-1">
                          {(() => {
                            const badgesEarned = appState.students.find(s => s.id === currentUser?.id)?.badges?.length || 0;
                            if (badgesEarned >= 5) return "🏆 Khoa học Gia Vàng";
                            if (badgesEarned >= 3) return "🥈 Chuyên gia Tư duy";
                            return "🥉 Bé ngoan Chăm chỉ";
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid layout for detailed grades and teacher weekly comments */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Grade Card & Academic stats */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-300 shadow-sm flex flex-col gap-4">
                      <h4 className="font-sans font-black text-sm text-[#065F46] uppercase border-b pb-2 flex items-center justify-between">
                        <span>🌟 KẾT QUẢ ĐÁNH GIÁ THI ĐUA LỚP KHÁM PHÁ</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-850 px-2.5 py-0.5 rounded-full font-black border border-emerald-200">
                          Sổ điểm số hóa
                        </span>
                      </h4>

                      {(() => {
                        const scoreRecord = appState.gradesAndComments.find(g => g.studentId === currentUser?.id) || {
                          attendanceScore: "Xuất sắc",
                          midTermScore: 10,
                          finalScore: 10,
                          weeklyComment: "Con học bài chăm chỉ, vẽ mindmap sáng tạo.",
                          lastUpdated: new Date().toISOString()
                        };

                        return (
                          <div className="flex flex-col gap-4">
                            {/* Score items */}
                            <div className="grid grid-cols-3 gap-3">
                              {/* 1. Attendance assessment */}
                              <div className="bg-[#ECFDF5] p-3.5 rounded-2xl border-2 border-emerald-200 text-center flex flex-col justify-between">
                                <span className="text-[10px] font-black text-emerald-800 uppercase block leading-tight">Chuyên cần</span>
                                <div className="text-sm sm:text-md font-black text-emerald-950 my-1">
                                  {scoreRecord.attendanceScore || "Chưa đánh giá"}
                                </div>
                                <span className="text-[9px] text-zinc-550 font-bold block">Xếp loại tuần</span>
                              </div>

                              {/* 2. Mid term */}
                              <div className="bg-[#FFFBEB] p-3.5 rounded-2xl border-2 border-amber-200 text-center flex flex-col justify-between">
                                <span className="text-[10px] font-black text-amber-805 uppercase block leading-tight">Thử Thách Tuần</span>
                                <div className="text-md sm:text-lg font-black text-[#B45309] my-1">
                                  {scoreRecord.midTermScore !== undefined ? `${scoreRecord.midTermScore}/10` : "---"}
                                </div>
                                <span className="text-[9px] text-zinc-550 font-bold block">Phiếu tổng kết</span>
                              </div>

                              {/* 3. Final score */}
                              <div className="bg-[#EEF2FF] p-3.5 rounded-2xl border-2 border-indigo-200 text-center flex flex-col justify-between">
                                <span className="text-[10px] font-black text-indigo-800 uppercase block leading-tight">Sáng tạo Sơ đồ</span>
                                <div className="text-md sm:text-lg font-black text-indigo-950 my-1">
                                  {scoreRecord.finalScore !== undefined ? `${scoreRecord.finalScore}/10` : "---"}
                                </div>
                                <span className="text-[9px] text-zinc-550 font-bold block">Bài thi vẽ</span>
                              </div>
                            </div>

                            {/* Additional info */}
                            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-2xl flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                              <span>📅 Cập nhật: {scoreRecord.lastUpdated ? new Date(scoreRecord.lastUpdated).toLocaleDateString() : "Mới nhất"}</span>
                              <span className="text-emerald-700 font-extrabold text-[10px]">Đồng bộ dữ liệu thời gian thực ❇️</span>
                            </div>

                            {/* Academic Progress bar */}
                            <div className="p-4 bg-[#FFFDF2] border border-amber-200 rounded-2xl flex flex-col gap-2">
                              <div className="flex justify-between items-center text-[11px] font-black text-amber-955 uppercase">
                                <span>Tiến trình hoàn thành học liệu:</span>
                                <div>
                                  {(() => {
                                    const totalSubmissions = appState.workbookSubmissions.filter(s => s.studentId === currentUser?.id).length + appState.mindmapSubmissions.filter(s => s.studentId === currentUser?.id).length;
                                    const progressPct = Math.min(100, Math.round((totalSubmissions / 5) * 100));
                                    return `${progressPct}%`;
                                  })()}
                                </div>
                              </div>
                              <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
                                  style={{
                                    width: `${(() => {
                                      const totalSubmissions = appState.workbookSubmissions.filter(s => s.studentId === currentUser?.id).length + appState.mindmapSubmissions.filter(s => s.studentId === currentUser?.id).length;
                                      return Math.min(100, Math.round((totalSubmissions / 5) * 100));
                                    })()}%`
                                  }}
                                />
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-1 leading-normal font-bold">
                                * Tiến trình tự động ghi nhận khi con nộp Bài tập Phiếu học tập tuần & Sơ đồ tư duy Sáng tạo của buổi học trực tuyến.
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Teacher speech bubble weekly remark */}
                    <div className="bg-[#FFFDF2] p-6 rounded-[32px] border-4 border-amber-300 shadow-md relative overflow-hidden flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-amber-200 pb-2.5">
                        <h4 className="font-extrabold text-[#B45309] text-xs uppercase flex items-center gap-1.5">
                          <span>👩‍🏫</span> Nhận xét Tổng thể của Giáo viên {appState.teacherProfile?.name || "chủ nhiệm"}
                        </h4>
                        <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full">
                          Nhận xét tuần này
                        </span>
                      </div>

                      {(() => {
                        const scoreRecord = appState.gradesAndComments.find(g => g.studentId === currentUser?.id);
                        if (!scoreRecord || !scoreRecord.weeklyComment) {
                          return (
                            <div className="flex items-center gap-3 py-4 text-xs font-bold text-zinc-400 italic">
                              <span className="text-2xl animate-spin">🌱</span>
                              <span>Con đang rèn luyện chăm chỉ từng ngày... Cô đang cập nhật kết quả và viết lời khích lệ yêu thương tại đây!</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex gap-3 items-start py-0.5">
                            <span className="text-3xl shrink-0 animate-bounce">💬</span>
                            <div className="flex-1">
                              <p className="text-xs font-black text-rose-955 bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl italic leading-relaxed shadow-3xs">
                                &ldquo;{scoreRecord.weeklyComment}&rdquo;
                              </p>
                              <div className="flex justify-end gap-2 text-[10px] font-black text-amber-900 mt-2">
                                <span>Giáo viên chủ nhiệm: {appState.teacherProfile?.name || "Chưa cập nhật"} 🌿</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {currentRole === 'parent' && (
                        <div className="mt-2 pt-3.5 border-t border-dashed border-amber-200 flex justify-end">
                          <button
                            onClick={() => { playClickSound(); setStudentActiveTab('feedback'); }}
                            className="bg-amber-100 hover:bg-amber-200 text-[#B45309] text-[10px] font-black px-3.5 py-2.5 rounded-xl border border-amber-300 shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <span>✉️</span> PHẢN HỒI Ý KIẾN TRỰC TIẾP GỬI {(appState.teacherProfile?.name || "Cô giáo").toUpperCase()} ↩️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Homework nộp & Sao chấm */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* List of study workbook submissions */}
                    <div className="bg-white p-5 rounded-[32px] border-4 border-emerald-250 shadow-sm flex flex-col gap-4">
                      <h4 className="font-sans font-black text-xs text-[#065F46] uppercase border-b pb-1.5 flex items-center gap-2">
                        <span>📝</span> PHIẾU BÀI ĐÃ LÀM & SỐ SAO ĐẠT ĐƯỢC
                      </h4>

                      {(() => {
                        const myWorkbooks = appState.workbookSubmissions.filter(s => s.studentId === currentUser?.id);
                        if (myWorkbooks.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs text-zinc-400 font-bold italic bg-zinc-50 border border-dashed rounded-2xl">
                              Con chưa nộp phiếu học tập tuần nào. Hãy dặn dò bé chăm chỉ nộp bài nhen bố mẹ!
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-3.5 max-h-[250px] overflow-y-auto pr-1">
                            {myWorkbooks.map((sub, idx) => (
                              <div key={idx} className="p-3 bg-[#ECFDF5]/50 border border-emerald-100 rounded-xl flex flex-col gap-1.5 text-xs font-bold font-sans">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-emerald-850">
                                  <span>{sub.sheetTitle}</span>
                                  <span className="text-zinc-400 font-bold">{sub.timestamp ? new Date(sub.timestamp).toLocaleDateString() : ""}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-amber-805">Số sao cô chấm:</span>
                                  <span className="text-amber-500 font-black">
                                    {Array.from({ length: sub.stars || 0 }).map((_, i) => "⭐").join("") || "⏳ Đang đợi cô chấm điểm..."}
                                  </span>
                                </div>
                                {sub.comment && (
                                  <p className="bg-white border-l-4 border-emerald-400 p-2 text-[10px] italic font-bold text-[#047857] shadow-3xs rounded-r-lg mt-1">
                                    {appState.teacherProfile?.name !== "admin" ? appState.teacherProfile?.name : "Cô giáo"} phê: &ldquo;{sub.comment}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* List of Mindmaps submitted by student */}
                    <div className="bg-white p-5 rounded-[32px] border-4 border-indigo-250 shadow-sm flex flex-col gap-4">
                      <h4 className="font-sans font-black text-xs text-indigo-900 uppercase border-b pb-1.5 flex items-center gap-2">
                        <span>🧠</span> VỞ VẼ SƠ ĐỒ TỰ DUY SÁNG TẠO HỌC TẬP
                      </h4>

                      {(() => {
                        const myMindmaps = appState.mindmapSubmissions.filter(sub => sub.studentId === currentUser?.id);
                        if (myMindmaps.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs text-zinc-400 font-bold italic bg-zinc-50 border border-dashed rounded-2xl">
                              Con chưa vẽ sơ đồ tư duy nào. Hãy cùng bé thực hành thiết kế Mindmap vẽ nước kỳ diệu!
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-3.5 max-h-[250px] overflow-y-auto pr-1">
                            {myMindmaps.map((sub, idx) => (
                              <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col gap-1.5 text-xs font-bold font-sans">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-900">
                                  <span>Sơ đồ nước của bé</span>
                                  <span className="text-zinc-400 font-bold">{sub.timestamp ? new Date(sub.timestamp).toLocaleDateString() : ""}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-indigo-800">Cô chấm sáng tạo:</span>
                                  <span className="text-amber-500 font-black">
                                    {Array.from({ length: sub.stars || 0 }).map((_, i) => "⭐").join("") || "⏳ Đang đợi cô chấm điểm..."}
                                  </span>
                                </div>
                                {sub.comment && (
                                  <p className="bg-white border-l-4 border-indigo-400 p-2 text-[10px] italic font-bold text-indigo-950 shadow-3xs rounded-r-lg mt-1">
                                    {appState.teacherProfile?.name !== "admin" ? appState.teacherProfile?.name : "Cô giáo"} ghi: &ldquo;{sub.comment}&rdquo;
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================================== TAB S1: ATTENDANCE BLOCK ================================== */}
            {studentActiveTab === 'attendance' && (
              <div className="flex flex-col gap-6">
                {/* Multi-day Attendance Grid */}
                <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-300 shadow-sm flex flex-col gap-4 text-sm font-semibold">
                  <h3 className="font-black text-md text-emerald-955 uppercase border-b pb-2 flex items-center justify-between font-sans">
                    <span>👋 SỔ ĐIỂM DANH CHUYÊN CẦN LỚP 4</span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                      Tích lũy buổi học: {appState.students.find(s => s.id === currentUser?.id)?.attendedDays?.length || 0} ngày
                    </span>
                  </h3>

                  <p className="leading-relaxed text-zinc-650 text-xs font-bold font-sans">
                    🔔 Em hãy chọn đúng Buổi/Ngày học thực tế hôm nay để tiến hành điểm danh lên sổ chuyên cần nhé. Cô giáo hoặc {appState.teacherProfile?.name || "admin"} sẽ cộng sao chăm chỉ cho những bạn chuyên cần tinh anh đấy!
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
                    <span className="text-xs font-black text-emerald-950 uppercase block mb-2 font-sans">DANH SÁCH BẠN BÈ LÊN LỚP HÔM NAY:</span>
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
                    <h3 className="font-black text-md text-emerald-955 uppercase flex items-center gap-2 font-sans">
                      <span>🏅</span> KHO HUY CHƯƠNG & DANH HIỆU SÁNG TẠO
                    </h3>
                    <span className="text-xs bg-emerald-150 text-emerald-950 px-3 py-1 rounded-full font-black border border-emerald-250 shrink-0">
                      Đã đạt: {appState.students.find(s => s.id === currentUser?.id)?.badges?.length || 0} / 6
                    </span>
                  </div>
                  
                  <p className="text-xs font-bold text-zinc-550 leading-relaxed font-sans">
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
                        unlock: "Nộp đáp án chi tiết và nhận phần thưởng điểm sao."
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
                              <span className="font-black text-xs block text-zinc-900 leading-tight uppercase font-sans">
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
                            <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider animate-pulse shrink-0">
                              🎉 ĐÃ HOÀN THÀNH
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-zinc-200 text-zinc-655 border border-zinc-300 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider shrink-0">
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
                    onClick={() => { playClickSound(); setStudentMaterialSubTab('lessons'); setSelectedCategoryPage(null); }}
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
                    onClick={() => { playClickSound(); setStudentMaterialSubTab('worksheets'); setSelectedCategoryPage(null); }}
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
                    onClick={() => { playClickSound(); setStudentMaterialSubTab('mindmapEdit'); setSelectedCategoryPage(null); }}
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
                        <p className="text-[11px] text-zinc-500 font-bold mt-0.5 font-sans">Cô giáo và học sinh luôn đồng bộ bài học thời gian thực, click khám phá bên dưới nhé!</p>
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

                    {selectedCategoryPage !== null ? (
                      /* Dedicated Topic Lessons Page View for Students */
                      <div className="flex flex-col gap-4">
                        <button
                          type="button"
                          onClick={() => { playClickSound(); setSelectedCategoryPage(null); }}
                          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-805 rounded-2xl text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer border border-zinc-350 shadow-sm transition-colors self-start px-4 py-2"
                        >
                          ⬅️ QUAY LẠI DANH SÁCH CHỦ ĐỀ
                        </button>

                        <div className={`rounded-[32px] p-6 border-4 border-zinc-200 shadow-md ${SUBJECT_COLORS[selectedCategoryPage - 1]} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                          <div className="flex items-center gap-4">
                            <span className="text-5xl animate-bounce">{SUBJECT_EMOJIS[selectedCategoryPage - 1]}</span>
                            <div>
                              <h4 className="text-lg font-black uppercase tracking-tight text-zinc-900 leading-tight font-sans">
                                {SUBJECT_CATEGORIES[selectedCategoryPage - 1]}
                              </h4>
                              <p className="text-xs font-bold text-zinc-650 mt-1 font-sans">
                                Chào mừng con! Hãy chọn bài học bên dưới để bắt đầu khám phá thế giới khoa học kỳ thú nhé!
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2 animate-fade-in">
                          {filteredLessonsOfCategory(selectedCategoryPage).length === 0 ? (
                            <div className="col-span-full py-16 text-center text-zinc-550 italic bg-zinc-50 border-4 border-dashed rounded-[32px] px-6">
                              <p className="text-sm font-black text-zinc-655 font-sans">Chưa có bài học hay học liệu số nào trong chủ đề này do cô giáo thiết kế.</p>
                              <p className="text-xs text-zinc-500 font-bold mt-1 font-sans">Cần thêm thời gian soạn bài, con hãy quay lại sau nhen!</p>
                            </div>
                          ) : (
                            filteredLessonsOfCategory(selectedCategoryPage).map(lesson => (
                              <div
                                key={lesson.id}
                                onClick={() => {
                                  playClickSound();
                                  setExpandedLessonId(expandedLessonId === lesson.id ? null : lesson.id);
                                }}
                                className={`bg-white rounded-[32px] p-5 border-4 transition-all flex flex-col justify-between relative cursor-pointer min-h-[170px] hover:scale-[1.01] duration-200 ${
                                  expandedLessonId === lesson.id ? "border-emerald-400 shadow-lg ring-4 ring-emerald-50" : "border-zinc-200/85 hover:border-emerald-400 hover:shadow-xl"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start gap-2.5">
                                    <span className="text-3xl shrink-0 mt-0.5">
                                      {getLessonTypeIcon(lesson.type)}
                                    </span>
                                    <div className="overflow-hidden font-sans">
                                      <h5 className="font-extrabold text-[#022C22] text-sm break-words line-clamp-2" title={lesson.title}>
                                        {lesson.title}
                                      </h5>
                                      <span className="text-[9px] uppercase font-black tracking-wider text-emerald-850 bg-emerald-50 rounded-full px-2.5 py-0.5 border border-emerald-200 inline-block mt-1 col-span-full">
                                        Bài học / Học liệu
                                      </span>
                                    </div>
                                  </div>

                                  {lesson.description && (
                                    <p className="text-xs text-zinc-650 font-semibold italic bg-zinc-50 p-2.5 rounded-2xl border border-zinc-100 mt-3 line-clamp-3">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>

                                {expandedLessonId === lesson.id && (
                                  <div className="mt-4 pt-4 border-t-2 border-dashed border-zinc-100 text-left animate-fade-in w-full text-zinc-800" onClick={(e) => e.stopPropagation()}>
                                    <h6 className="text-[11px] font-black uppercase text-emerald-955 tracking-wider mb-2.5 flex items-center gap-1 select-none">
                                      📂 THƯ MỤC HỌC LIỆU CỦA BÀI:
                                    </h6>
                                    {(() => {
                                      const foldersMap = getLessonFoldersMap(lesson);
                                      const folderNames = Object.keys(foldersMap);
                                      
                                      if (folderNames.length === 0) {
                                        return (
                                          <div className="p-3 bg-zinc-50 rounded-2xl border text-center text-[10px] text-zinc-500 font-bold select-none leading-relaxed">
                                            🌿 Cô giáo đang soạn học liệu, con quay lại sau nhen!<br />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                playClickSound();
                                                handleStudentSelectLesson(lesson);
                                              }}
                                              className="text-emerald-805 hover:text-emerald-900 underline font-black mt-1.5 inline-block cursor-pointer"
                                            >
                                              💬 Tham gia góc thảo luận ➡️
                                            </button>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div className="space-y-2">
                                          {folderNames.map((folderName) => {
                                            const folderMats = foldersMap[folderName];
                                            return (
                                              <div key={folderName} className="bg-emerald-50/15 rounded-2xl p-2.5 border border-emerald-200/40 shadow-2xs">
                                                <div className="text-[11px] font-black text-emerald-955 uppercase flex items-center gap-1.5 select-none border-b border-emerald-200/20 pb-1 mb-1.5">
                                                  <span>📂</span>
                                                  <span className="truncate max-w-[240px]" title={folderName}>{folderName}</span>
                                                  <span className="ml-auto text-[9px] bg-emerald-100/70 text-emerald-900 font-black px-1.5 py-0.5 rounded-full shrink-0">
                                                    {folderMats.length} link
                                                  </span>
                                                </div>
                                                
                                                <div className="space-y-1">
                                                  {folderMats.map((m) => (
                                                    <div 
                                                      key={m.id}
                                                      onClick={() => {
                                                        playClickSound();
                                                        handleStudentSelectLesson(lesson, m);
                                                      }}
                                                      className="p-1.5 bg-white hover:bg-emerald-50 rounded-xl border border-zinc-150 flex items-center justify-between text-[11px] font-bold text-zinc-700 hover:text-[#022C22] transition-all cursor-pointer shadow-2xs gap-2"
                                                      title="Nhấp để hiển thị học trực quan"
                                                    >
                                                      <span className="truncate flex items-center gap-1.5">
                                                        <span className="text-sm shrink-0">{getLessonTypeIcon(m.type)}</span>
                                                        <span className="truncate" title={m.title}>{m.title}</span>
                                                      </span>
                                                      <span className="text-[9px] font-black bg-zinc-50 hover:bg-emerald-100 text-zinc-500 hover:text-emerald-850 border border-zinc-200 px-1.5 py-0.5 rounded-md uppercase shrink-0 transition-all">
                                                        Vào Học ➡️
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}

                                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-4 gap-2" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] text-zinc-500 font-bold">
                                    ✨ Thảo luận & Xem bài
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playClickSound();
                                      handleStudentSelectLesson(lesson);
                                    }}
                                    className="text-[10px] bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 font-extrabold text-center shrink-0 uppercase transition-all"
                                  >
                                    VÀO HỌC ➡️
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      /* List of 6 subject category cards as original grid */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
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
                                setSelectedCategoryPage(catIdx);
                              }}
                              className={`rounded-[32px] p-5 border-4 border-zinc-200 flex flex-col justify-between transition-all duration-250 relative cursor-pointer hover:border-amber-400 hover:shadow-xl min-h-[160px] ${boxColorStyle}`}
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

                                <div className="flex justify-end items-center mt-4 pt-2 border-t border-dashed border-zinc-300/40">
                                  <span className="text-[10px] uppercase font-black text-amber-955 text-right flex items-center justify-end gap-1 underline decoration-dotted">
                                    Vào học ➡️
                                  </span>
                                </div>

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
                                              handleStudentSelectLesson(lesson);
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
                                              handleStudentSelectLesson(lesson);
                                            }}
                                            className="text-[10px] bg-emerald-55 text-emerald-800 hover:bg-emerald-100 px-1.5 py-0.5 rounded border text-center shrink-0 font-extrabold cursor-pointer uppercase transition-all"
                                          >
                                            Vào học ➡️
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
                    )}
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
                  <p className="text-xs text-zinc-650 italic text-center py-6">Hiện tại giáo viên chưa mở cuộc thảo luận trực tuyến nào cho lớp học.</p>
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
                          <p className="text-[11px] text-zinc-555 italic text-center py-4 bg-zinc-100/50 rounded-xl">Chưa có ai phát biểu câu trả lời nào cả, em hãy xung phong đầu tiên đi nhen!</p>
                        ) : (
                          thread.comments.map(comment => (
                            <div key={comment.id} className="p-2.5 bg-white border rounded-xl flex justify-between items-center text-xs animate-fade-in">
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-850">🧒 {comment.studentName}:</span>
                                <span className="font-semibold text-zinc-650 italic mt-0.5">&ldquo;{comment.content}&rdquo;</span>
                              </div>
                              <div className="flex items-center gap-1 text-amber-500" id={`star-container-${comment.id}`}>
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

                <div className="border-t pt-3 mt-4 text-[10px] text-zinc-400 font-bold">
                  * Ý kiến đóng góp cần mang tính giáo dục, tích cực xây dựng bài phát biểu học tốt.
                </div>
              </div>
            )}

            {studentActiveTab === 'feedback' && currentRole === 'parent' && (
              <div className="bg-white p-6 rounded-[32px] border-4 border-emerald-300 shadow-sm text-zinc-800 flex flex-col gap-6 animate-fade-in">
                <div>
                  <h3 className="font-black text-md text-[#B45309] uppercase border-b-2 pb-2 flex items-center gap-2">
                    <span>✉️</span> SỔ LIÊN LẠC TOÀN DIỆN & GÓP Ý VỚI GIÁO VIÊN CHỦ NHIỆM
                  </h3>
                  <p className="text-xs text-zinc-655 font-bold font-sans mt-2 leading-relaxed">
                    Kính thưa quý phụ huynh, đây là hòm thư kết nối bí mật và trực tiếp tới giáo viên chủ nhiệm. Quý phụ huynh có thể trao đổi tình hình học tập, đóng góp ý kiến xây dựng bài học hoặc nhờ giáo viên hỗ trợ thêm cho bé nhen!
                  </p>
                </div>

                {/* Send New Feedback Form */}
                <form onSubmit={handlePostParentFeedback} className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 flex flex-col gap-3">
                  <label className="text-xs font-black text-amber-955 uppercase flex items-center gap-1.5">
                    <span>✍️</span> Nhập ý kiến phản hồi mới gửi giáo viên {appState.teacherProfile?.name !== "admin" ? appState.teacherProfile?.name : "chủ nhiệm"}:
                  </label>
                  <textarea
                    rows={4}
                    value={parentFeedbackInput}
                    onChange={(e) => setParentFeedbackInput(e.target.value)}
                    placeholder="Quý phụ huynh hãy viết lời nhắn, thắc mắc hoặc góp ý tại đây nhé..."
                    className="w-full text-xs p-3.5 bg-white border border-zinc-200 rounded-xl outline-none font-bold text-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 transition-all"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="py-2 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <span>🚀</span> Gửi Lời Nhắn Tới Giáo Viên
                    </button>
                  </div>
                </form>

                {/* Current feedbacks history */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-black text-xs uppercase text-zinc-500 border-b pb-1.5 flex items-center gap-1">
                    <span>📋</span> Lịch sử liên lạc lớp học của gia đình nhà mình:
                  </h4>

                  {(() => {
                    const myFeedbacks = appState.parentFeedback.filter(fb => fb.studentId === currentUser.id);
                    if (myFeedbacks.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-zinc-400 italic bg-zinc-50 rounded-2xl border border-dashed">
                          Chưa có tin nhắn liên lạc nào được trao đổi trước đó.
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-3.5 max-h-[400px] overflow-y-auto pr-2">
                        {myFeedbacks.map(fb => (
                          <div key={fb.id} className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xs flex flex-col gap-3">
                            <div className="flex justify-between items-start text-[11px] font-black border-b border-zinc-150 pb-1.5">
                              <span className="text-amber-900 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">{fb.parentName} ({fb.studentName})</span>
                              <span className="text-zinc-400 font-bold">{new Date(fb.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-xs font-bold text-zinc-805 leading-relaxed">{fb.message}</p>

                            {/* Reply if teacher responded */}
                            {(fb.teacherReply || fb.reply) ? (
                              <div className="p-3 bg-rose-50/50 border border-rose-200/50 rounded-xl flex flex-col gap-1.5 mt-1.5">
                                <span className="text-[10px] font-black text-rose-800 uppercase flex items-center gap-1.5">
                                  👩‍🏫 PHẢN HỒI TỪ GIÁO VIÊN {appState.teacherProfile?.name !== "admin" ? (appState.teacherProfile?.name || "").toUpperCase() : "CHỦ NHIỆM"}:
                                </span>
                                <p className="text-xs font-black text-rose-955 italic leading-relaxed pl-1">
                                  &ldquo;{fb.teacherReply || fb.reply}&rdquo;
                                </p>
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-400 italic flex items-center gap-1 mt-1 pl-1 font-bold">
                                <span>⏳</span> Tin nhắn đã gửi thành công - đang chờ giáo viên đọc và phản hồi...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}



            </main>
          </div>
        )
      }

      {/* ================================== MODAL: DETAILED LESSON EXPLORER ================================== */}
      {selectedExploreLesson && (
        <div className="fixed inset-0 bg-rose-955/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-amber-50 rounded-[40px] border-8 border-amber-300 w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-200 via-yellow-105 to-amber-200 px-6 py-4 border-b-4 border-amber-300 flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">📚</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-900 tracking-wider">Chủ đề {selectedExploreLesson.categoryIndex}</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-500">Môn học: {SUBJECT_CATEGORIES[selectedExploreLesson.categoryIndex - 1]}</span>
                  </div>
                  <h3 className="font-black text-zinc-900 text-sm sm:text-base leading-snug mt-1 uppercase tracking-wide">
                    {selectedExploreLesson.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => { playClickSound(); setSelectedExploreLesson(null); setActiveMaterial(null); }}
                className="w-10 h-10 bg-white hover:bg-zinc-100 border-2 border-zinc-300 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer font-black text-lg shadow-sm"
                title="Đóng cửa sổ bài học"
              >
                ×
              </button>
            </div>

            {/* Inner scroll container layout - Bố cục Rạp Chiếu YouTube tuyệt diệu */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 min-h-0 bg-[#FFFDF5]">
              
              {/* LEFT MAIN AREA: Video Player / Image View / Interactive Workspace & Comments (2/3 width on large screens) */}
              <div className="flex-1 flex flex-col gap-5 min-w-0">
                {(() => {
                  const rawMats = selectedExploreLesson.materials || [];
                  const lessonMaterials = [...rawMats];
                  if (selectedExploreLesson.url && !lessonMaterials.some(m => m.url === selectedExploreLesson.url)) {
                    lessonMaterials.unshift({
                      id: "master_" + selectedExploreLesson.id,
                      title: selectedExploreLesson.title + " (Học liệu chính)",
                      type: selectedExploreLesson.type,
                      url: selectedExploreLesson.url,
                      description: selectedExploreLesson.description,
                      section: "🌈 Bài giảng & Đồ dùng dạy học chính khóa"
                    });
                  }

                  const activeMat = activeMaterial || (lessonMaterials.length > 0 ? lessonMaterials[0] : null);

                  if (!activeMat) {
                    return (
                      <div className="bg-zinc-100 rounded-3xl p-8 border border-dashed text-center text-xs text-zinc-500 font-bold py-14">
                        Cô chưa gán học liệu chính thống hoặc liên kết nào cho bài học nầy.
                      </div>
                    );
                  }

                  // Helper check media types
                  const isImg = (url: string, type: string) => {
                    return isUrlImage(url, type);
                  };

                  const isVid = (url: string, type: string) => {
                    if (!url) return false;
                    const lowerUrl = url.toLowerCase();
                    const lowerType = type ? type.toLowerCase() : "";
                    return (
                      lowerUrl.endsWith(".mp4") ||
                      lowerUrl.endsWith(".webm") ||
                      lowerUrl.endsWith(".mov") ||
                      lowerUrl.endsWith(".ogg") ||
                      lowerType === "video_direct"
                    );
                  };

                  return (
                    <>
                      {/* Integrated YouTube style Video / Image / Document Workspace */}
                      {activeMat.url ? (
                        <div className="w-full bg-zinc-950 rounded-[28px] overflow-hidden border-4 border-zinc-900 shadow-2xl flex flex-col transition-all relative">
                          <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex justify-between items-center text-[10px] sm:text-xs font-black text-zinc-300">
                            <span className="flex items-center gap-2 uppercase select-none font-sans tracking-wider">
                              <span className="animate-pulse text-red-500 text-lg">●</span>
                              <span>ĐANG TRÌNH CHIẾU: {activeMat.type === 'video' ? '📹 VIDEO' : isImg(activeMat.url, activeMat.type) ? '🖼️ PHIẾU/ẢNH' : '🌐 HỌC LIỆU'}</span>
                            </span>
                            <div className="flex items-center gap-3">
                              <a 
                                href={activeMat.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-[#059669] hover:bg-[#047857] text-white py-1 px-3 rounded-full font-black uppercase text-[10px] transition-all flex items-center gap-1 shadow-sm"
                              >
                                Mở tap mới 🚀
                              </a>
                            </div>
                          </div>

                          {/* Media Player Container */}
                          <div className="relative w-full overflow-hidden bg-zinc-950 flex items-center justify-center animate-fade-in" style={{ minHeight: "360px", height: "480px" }}>
                            {isImg(activeMat.url, activeMat.type) ? (
                              <div className="w-full h-full flex flex-col justify-center items-center p-4 bg-zinc-900 overflow-auto">
                                <img 
                                  src={activeMat.url} 
                                  alt={activeMat.title} 
                                  className="max-h-full max-w-full object-contain rounded-xl shadow-lg border-2 border-white/15 cursor-zoom-in"
                                  onClick={() => window.open(activeMat.url, '_blank')}
                                  referrerPolicy="no-referrer"
                                  title="Click để xem kích thước lớn đầy đủ"
                                />
                                <p className="absolute bottom-2 text-[9px] font-bold text-zinc-400 bg-black/60 px-3 py-1 rounded-full select-none">
                                  💡 Nhấp vào hình ảnh để phóng to xem đầy đủ phiếu bài dạy
                                </p>
                              </div>
                            ) : isVid(activeMat.url, activeMat.type) ? (
                              <video 
                                src={activeMat.url} 
                                controls 
                                className="w-full h-full object-contain bg-black"
                                poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
                              />
                            ) : (
                              <iframe
                                src={getEmbedUrl(activeMat.url)}
                                title={activeMat.title}
                                className="absolute top-0 left-0 w-full h-full border-0 bg-white"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-100 rounded-[28px] p-8 border-4 border-dashed border-zinc-300 text-center text-xs text-zinc-500 font-bold py-12 select-none">
                          Học liệu này chưa được gắn liên kết mượt. Cô hãy chỉnh sửa và cập nhật url chính thống nhé.
                        </div>
                      )}

                      {/* Active material metadata & details */}
                      <div className="bg-white p-5 rounded-[28px] border-2 border-zinc-200/80 flex flex-col gap-2.5 shadow-xs animate-fade-in text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] bg-emerald-100 text-[#047857] hover:bg-emerald-150 uppercase px-2.5 py-1 rounded-full border border-emerald-300 font-black">
                            {activeMat.type === 'video' ? '📹 Video bài học' : activeMat.type === 'game' ? '🎮 Trò chơi tương tác' : activeMat.type === 'pdf' ? '📄 Sách/Tài liệu PDF' : activeMat.type === 'experiment' ? '🧪 Thí nghiệm trực quan' : activeMat.type === 'mindmap' ? '🧠 Sơ đồ bài học' : isImg(activeMat.url, activeMat.type) ? '🖼️ Hình ảnh & Phiếu bài tập' : '🌐 Học liệu số'}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-black uppercase font-sans">
                            📁 Thư mục: {activeMat.section}
                          </span>
                        </div>
                        <h4 className="font-black text-zinc-900 text-base leading-snug uppercase tracking-wide">
                          {activeMat.title}
                        </h4>
                        {activeMat.description && (
                          <p className="text-xs text-zinc-650 font-bold leading-relaxed italic border-t border-dashed border-zinc-200 mt-2 pt-2.5 select-none bg-zinc-50 p-3 rounded-2xl">
                            💡 Gợi ý học tập từ cô: &ldquo;{activeMat.description}&rdquo;
                          </p>
                        )}
                        
                        {activeMat.url && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => {
                                playClickSound();
                                window.open(activeMat.url, '_blank');
                              }}
                              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
                            >
                              🚀 NHẤP VÀO ĐÂY ĐỂ HỌC
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Star rating calculations scorecard for entire lesson thread */}
                <div className="bg-white p-5 rounded-[28px] border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-4 shadow-2xs">
                  <div className="text-left">
                    <span className="text-[10px] font-black text-zinc-450 block uppercase mb-1">Tổng quan tương tác học bài:</span>
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-lg font-black text-zinc-800">
                        💬 {selectedExploreLesson.comments?.length || 0} lượt đóng góp / thắc mắc học tập
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-4 font-bold text-xs flex flex-col justify-center">
                    <span className="text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl inline-block text-[10px] uppercase font-black border border-emerald-200">
                      Chuyên cần học tập tích lũy ✨
                    </span>
                  </div>
                </div>

                {/* Commenting form */}
                {currentUser && (
                  <div className="bg-white p-5 rounded-[28px] border border-zinc-200 flex flex-col gap-3 shadow-2xs text-left">
                    <span className="text-xs font-black text-emerald-955 uppercase flex items-center gap-1.5 select-none">
                      <span>✍️</span> BÁO CÁO KẾT QUẢ TỰ HỌC - GỬI CÂU HỎI CHO CÔ GIÁO:
                    </span>

                    <div className="flex gap-2">
                       <textarea
                        value={newLessonCommentContent}
                        onChange={(e) => setNewLessonCommentContent(e.target.value)}
                        placeholder="Em hãy gửi thắc mắc, bài làm hoặc nhắn gửi nội dung tại đây nhen..."
                        rows={2}
                        className="flex-grow p-3 text-xs bg-zinc-50 border border-zinc-200 focus:border-emerald-450 focus:bg-white text-zinc-808 font-bold rounded-xl outline-none transition-all"
                      />
                      <button
                        onClick={() => handlePostLessonComment(selectedExploreLesson.id)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wide rounded-xl shadow-md cursor-pointer active:scale-95 transition-all self-end"
                      >
                        Gửi Cô 👩‍🏫
                      </button>
                    </div>
                  </div>
                )}

                {/* Feed of comments list logs */}
                <div className="flex flex-col gap-3.5 mt-1 text-left">
                  <span className="text-xs font-black text-zinc-650 uppercase border-b pb-2 flex items-center gap-1.5">
                    <span>🗣️</span> BẢNG ĐÓNG GÓP Ý KIẾN & THẢO LUẬN CHO BÀI
                  </span>
                  {(!selectedExploreLesson.comments || selectedExploreLesson.comments.length === 0) ? (
                    <p className="text-xs text-zinc-500 italic text-center py-8 select-none bg-zinc-50/50 rounded-2xl border border-dashed">Chưa có ai bày tỏ thắc mắc. Hãy viết nội dung hay đầu tiên nhé học sinh yêu quý!</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedExploreLesson.comments.map(c => {
                        const isTeacherComment = c.authorRole === 'teacher';
                        const isParentComment = c.authorRole === 'parent';
                        return (
                          <div
                            key={c.id}
                            className={`p-4 rounded-2xl border text-xs leading-relaxed flex flex-col gap-2 ${
                              isTeacherComment
                                ? "bg-amber-50/70 border-amber-250 text-amber-970 font-semibold"
                                : isParentComment
                                ? "bg-blue-50/70 border-blue-200 text-blue-970 font-semibold"
                                : "bg-zinc-50/80 border-zinc-200 text-zinc-700 font-semibold"
                            }`}
                          >
                            <div className="flex justify-between items-center font-bold text-[10px] uppercase">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">
                                  {isTeacherComment ? "👩‍🏫" : isParentComment ? "🙋‍♂️" : "🧒"}
                                </span>
                                <span className="font-extrabold">{c.authorName}</span>
                                <span className={`px-2 py-0.5 rounded-full font-black text-[8px] tracking-wide ${
                                  isTeacherComment 
                                    ? "bg-amber-100 text-amber-900 border border-amber-300" 
                                    : isParentComment 
                                    ? "bg-blue-105 text-blue-900 border border-blue-200" 
                                    : "bg-zinc-200 text-zinc-805"
                                  }`}>
                                  {isTeacherComment ? "CÔ GIÁO" : isParentComment ? "PHỤ HUYNH" : "HỌC SINH"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-zinc-800 font-bold leading-relaxed">{c.content}</p>
                            <span className="text-[9px] text-zinc-450 text-right opacity-80 self-end">
                              📅 {new Date(c.timestamp).toLocaleDateString()} {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT SIDEBAR: Playlist Style Educational Folders (1/3 width, custom vertical columns) */}
              <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4 bg-white border border-zinc-250 p-4 rounded-[32px] shadow-sm max-h-[850px] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-2 select-none">
                  <span className="text-xs font-black text-amber-955 uppercase tracking-wide flex items-center gap-2">
                    <span>🎬</span> DANH SÁCH HỌC LIỆU BÀI (PLAYLIST)
                  </span>
                  {currentRole === 'teacher' && (
                    <span className="text-[9px] bg-amber-100 text-amber-805 font-black px-1.5 py-0.5 rounded border border-amber-300">CÔ GIÁO TẠO</span>
                  )}
                </div>

                {/* Option for teacher to spawn a new folder on the fly */}
                {currentRole === 'teacher' && (
                  <div className="flex flex-col gap-1.5 bg-zinc-50 p-3 rounded-2xl border-2 border-dashed border-zinc-200 shadow-inner">
                    <span className="text-[9px] text-zinc-500 font-extrabold uppercase select-none text-left">📁 TẠO THƯ MỤC HỌC LIỆU MỚI:</span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Nhập tên thư mục mới..."
                        value={newFolderInput}
                        onChange={(e) => setNewFolderInput(e.target.value)}
                        className="flex-grow p-1.5 bg-white border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-amber-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateFolder();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateFolder}
                        className="px-3 py-1.5 bg-amber-300 hover:bg-amber-350 text-amber-955 font-black text-[10px] rounded-xl tracking-wide shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs border text-center uppercase"
                      >
                        TẠO ➕
                      </button>
                    </div>
                  </div>
                )}

                {/* Vertical playlist folders of teaching materials */}
                <div className="space-y-3">
                  {(() => {
                    const rawMats = selectedExploreLesson.materials || [];
                    const lessonMaterials = [...rawMats];
                    if (selectedExploreLesson.url && !lessonMaterials.some(m => m.url === selectedExploreLesson.url)) {
                      lessonMaterials.unshift({
                        id: "master_" + selectedExploreLesson.id,
                        title: selectedExploreLesson.title + " (Học liệu chính)",
                        type: selectedExploreLesson.type,
                        url: selectedExploreLesson.url,
                        description: selectedExploreLesson.description,
                        section: "🌈 Bài giảng & Đồ dùng dạy học chính khóa"
                      });
                    }

                    if (lessonFolders.length === 0) {
                      return <p className="text-xs text-zinc-500 italic font-semibold text-center py-6 select-none animate-pulse">Chưa có thư mục nào.</p>;
                    }

                    return lessonFolders.map((folder) => {
                      const isFolderOpen = activeFolder === folder;
                      const folderMaterials = lessonMaterials.filter(m => {
                        const sec = m.section || "Chuyên mục học tập khác 🌐";
                        return sec === folder || (folder === "🌈 Bài giảng & Đồ dùng dạy học chính khóa" && m.id?.startsWith("master_"));
                      });

                      return (
                        <div key={folder} className="p-1 rounded-2xl border border-zinc-200 bg-zinc-50/30 flex flex-col shadow-2xs">
                          {/* Folder Header Row */}
                          <div
                            onClick={() => {
                              if (editingFolder === folder) return;
                              playClickSound();
                              setActiveFolder(isFolderOpen ? null : folder);
                              setMaterialForm({
                                title: "",
                                type: "video",
                                url: "",
                                description: "",
                                section: folder
                              });
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none text-left ${
                              isFolderOpen
                                ? "bg-amber-100/90 border-amber-350 text-amber-955 shadow-xs font-black ring-2 ring-amber-100"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold"
                            }`}
                          >
                            {editingFolder === folder ? (
                              <div className="flex items-center gap-1.5 w-full mr-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingFolderValue}
                                  onChange={(e) => setEditingFolderValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRenameFolder(folder, editingFolderValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingFolder(null);
                                    }
                                  }}
                                  className="flex-grow p-1 border border-amber-350 rounded-lg bg-white text-[11px] font-bold text-zinc-800 outline-none focus:ring-1 focus:ring-amber-400"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenameFolder(folder, editingFolderValue);
                                  }}
                                  className="p-1 px-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded hover:bg-emerald-200 transition-all cursor-pointer text-[10px] font-black"
                                  title="Lưu"
                                >
                                  ✔️
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolder(null);
                                  }}
                                  className="p-1 px-1.5 bg-zinc-100 text-zinc-650 border border-zinc-300 rounded hover:bg-zinc-200 transition-all cursor-pointer text-[10px] font-black"
                                  title="Hủy"
                                >
                                  ❌
                                </button>
                              </div>
                            ) : (
                              <span className="flex items-center gap-2 text-[11px] truncate max-w-[190px] uppercase font-bold">
                                <span className="text-sm shrink-0">{isFolderOpen ? "📂" : "📁"}</span>
                                <span className="truncate">{folder}</span>
                              </span>
                            )}

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                isFolderOpen ? "bg-amber-250 text-amber-955 font-extrabold" : "bg-zinc-200 text-zinc-650"
                              }`}>
                                {folderMaterials.length} bài
                              </span>

                              {currentRole === 'teacher' && folder !== "🌈 Bài giảng & Đồ dùng dạy học chính khóa" && editingFolder !== folder && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playClickSound();
                                      setEditingFolder(folder);
                                      setEditingFolderValue(folder);
                                    }}
                                    className="p-1 hover:text-amber-600 text-zinc-400 hover:bg-zinc-100 rounded transition-all cursor-pointer"
                                    title="Sửa tên thư mục"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(folder);
                                    }}
                                    className="p-1 hover:text-rose-600 text-zinc-400 hover:bg-zinc-100 rounded transition-all cursor-pointer"
                                    title="Xóa thư mục"
                                  >
                                    <X className="w-3 h-3 font-bold" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded list of materials inside folder */}
                          {isFolderOpen && (
                            <div className="mt-2 pl-2 pr-1.5 py-2 bg-white rounded-xl border border-dashed border-zinc-200 text-left flex flex-col gap-2">
                              {folderMaterials.length === 0 ? (
                                <p className="text-[10px] text-zinc-400 italic py-2 pl-1.5 select-none font-bold">
                                  Thư mục chưa có bài gắn liên kết.
                                </p>
                              ) : (
                                <div className="space-y-1.5">
                                  {folderMaterials.map((m, mIdx) => {
                                    const currentActive = activeMaterial || (lessonMaterials.length > 0 ? lessonMaterials[0] : null);
                                    const isSelected = currentActive?.id === m.id;
                                    return (
                                      <div
                                        key={m.id}
                                        onClick={() => {
                                          playClickSound();
                                          setActiveMaterial(m);
                                        }}
                                        className={`group p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-[11px] font-bold text-left relative ${
                                          isSelected
                                            ? "bg-emerald-50 border-emerald-350 text-[#022C22] shadow-sm font-extrabold ring-2 ring-emerald-50"
                                            : "bg-zinc-50 border-zinc-150 text-zinc-650 hover:bg-zinc-100"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 overflow-hidden w-full pr-12">
                                          <span className="shrink-0 text-[10px] bg-zinc-200/60 w-5 h-5 flex items-center justify-center rounded-full text-zinc-500 font-bold font-mono">
                                            {mIdx + 1}
                                          </span>
                                          <span className="shrink-0 text-xs">{getLessonTypeIcon(m.type)}</span>
                                          <span className="truncate" title={m.title}>
                                            {m.title}
                                          </span>
                                        </div>
                                        
                                        {/* Teacher controls */}
                                        <div className="absolute right-1 top-1.5 flex items-center gap-1 shrink-0">
                                          {currentRole === 'teacher' && !m.id.startsWith("master_") && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  playClickSound();
                                                  setEditingMaterial(m);
                                                  setMaterialForm({
                                                    title: m.title,
                                                    type: m.type,
                                                    url: m.url,
                                                    description: m.description || "",
                                                    section: m.section || folder
                                                  });
                                                  setShowAddMaterialForm(true);
                                                }}
                                                className="text-amber-500 hover:text-amber-700 hover:scale-110 transition-all p-1 text-[9px] font-black cursor-pointer bg-white rounded shadow-2xs border inline-block"
                                                title="Sửa"
                                              >
                                                ✏️
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteMaterial(selectedExploreLesson.id, m.id);
                                                }}
                                                className="text-rose-500 hover:text-rose-700 hover:scale-110 transition-all p-1 text-[9px] font-black cursor-pointer bg-white rounded shadow-2xs border inline-block"
                                                title="Xóa"
                                              >
                                                ×
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Teacher UI to add link/material to this specific folder */}
                              {currentRole === 'teacher' && (
                                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200 flex flex-col gap-2 mt-2.5 shadow-inner border-dashed animate-fade-in">
                                  <div className="text-[9px] font-black text-amber-955 uppercase border-b border-amber-200 pb-1 select-none">
                                    <span>🔗 CHÈN LINK BÀI MỚI VÀO ĐÂY:</span>
                                  </div>
                                  
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[8px] text-zinc-500 font-extrabold uppercase">TÊN LINK:</label>
                                    <input
                                      type="text"
                                      placeholder="vd: Phiếu vẽ tranh trạng thái nước..."
                                      value={materialForm.section === folder ? materialForm.title : ""}
                                      onChange={(e) => {
                                        setMaterialForm({
                                          title: e.target.value,
                                          type: materialForm.section === folder ? materialForm.type : "video",
                                          url: materialForm.section === folder ? materialForm.url : "",
                                          description: materialForm.section === folder ? materialForm.description : "",
                                          section: folder
                                        });
                                      }}
                                      className="p-1.5 border border-zinc-250 rounded-lg bg-white text-xs font-semibold outline-none focus:border-amber-400"
                                      required
                                    />
                                  </div>

                                  <div className="flex flex-col gap-1">
                                    <label className="text-[8px] text-zinc-500 font-extrabold uppercase">ĐƯỜNG DẪN LINK URL:</label>
                                    <input
                                      type="text"
                                      placeholder="https://... hoặc tải từ máy"
                                      value={materialForm.section === folder ? materialForm.url : ""}
                                      onChange={(e) => {
                                        setMaterialForm({
                                          title: materialForm.section === folder ? materialForm.title : "",
                                          type: materialForm.section === folder ? materialForm.type : "video",
                                          url: e.target.value,
                                          description: materialForm.section === folder ? materialForm.description : "",
                                          section: folder
                                        });
                                      }}
                                      className="p-1.5 border border-zinc-250 rounded-lg bg-white text-xs font-semibold outline-none focus:border-amber-400"
                                      required
                                    />
                                  </div>

                                  {/* Drag & Drop Local File Attachment for Folder */}
                                  <div className="flex flex-col gap-0.5">
                                    <label className="text-[8px] text-zinc-500 font-extrabold uppercase">HOẶC CHỌN TỆP TỪ THIẾT BỊ 💻:</label>
                                    <div className="relative border border-dashed border-amber-300 hover:border-amber-400 bg-white/60 hover:bg-white rounded-lg p-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[40px] group">
                                      <input
                                        type="file"
                                        accept="image/*,video/*,audio/*,application/pdf"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          setIsFolderUploading(true);
                                          playClickSound();
                                          try {
                                            const r = new FileReader();
                                            r.onload = async (event) => {
                                              const b64 = event.target?.result;
                                              if (typeof b64 === "string") {
                                                try {
                                                  const response = await fetch("/api/upload", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ name: file.name, base64: b64 })
                                                  });
                                                  const upData = await response.json();
                                                  if (upData.success && upData.url) {
                                                    const ext = file.name.split('.').pop()?.toLowerCase() || '';
                                                    let docType = "video";
                                                    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) docType = "image";
                                                    else if (['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(ext)) docType = "pdf";

                                                    setMaterialForm({
                                                      title: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
                                                      type: docType,
                                                      url: upData.url,
                                                      description: "Cô giáo chia sẻ thêm lúc " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                                                      section: folder
                                                    });
                                                    playSparkleSound();
                                                  } else {
                                                    alert(upData.error || "Gặp sự cố tải file");
                                                  }
                                                } catch (err: any) {
                                                  alert("Lỗi kết nối máy chủ: " + err.message);
                                                } finally {
                                                  setIsFolderUploading(false);
                                                }
                                              }
                                            };
                                            r.readAsDataURL(file);
                                          } catch (err: any) {
                                            alert("Không đọc được tệp: " + err.message);
                                            setIsFolderUploading(false);
                                          }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        disabled={isFolderUploading}
                                      />
                                      {isFolderUploading ? (
                                        <div className="flex items-center gap-1">
                                          <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                                          <span className="text-[9px] text-[#78350F] font-black">Mạng đang đồng bộ tệp tải lên...</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs group-hover:scale-110 transition-transform">💻</span>
                                          <span className="text-[9px] font-black text-amber-955">Chọn tệp Đồ Học, Video bài giảng, PDF hoặc ảnh...</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                                    <div className="flex flex-col gap-0.5">
                                      <label className="text-[8px] text-zinc-500 font-extrabold uppercase">LOẠI TÀI LIỆU:</label>
                                      <select
                                        value={materialForm.section === folder ? materialForm.type : "video"}
                                        onChange={(e) => {
                                          setMaterialForm({
                                            title: materialForm.section === folder ? materialForm.title : "",
                                            type: e.target.value,
                                            url: materialForm.section === folder ? materialForm.url : "",
                                            description: materialForm.section === folder ? materialForm.description : "",
                                            section: folder
                                          });
                                        }}
                                        className="p-1 border border-zinc-250 rounded-lg bg-white text-[10px] font-black cursor-pointer outline-none focus:border-amber-450"
                                      >
                                        <option value="video">📹 Video Youtube</option>
                                        <option value="image">🖼️ Ảnh / Phiếu bài tập</option>
                                        <option value="game">🎮 Trò chơi</option>
                                        <option value="pdf">📄 PDF/Slide</option>
                                        <option value="experiment">🧪 Thí nghiệm ảo</option>
                                        <option value="mindmap">🧠 Sơ đồ</option>
                                        <option value="link">🌐 Liên kết khác</option>
                                      </select>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        if (materialForm.section !== folder || !materialForm.title.trim()) {
                                          alert("Hãy đặt tên cho liên kết mới nhé!");
                                          return;
                                        }
                                        if (!materialForm.url.trim()) {
                                          alert("Hãy dán đường dẫn link vào nhé!");
                                          return;
                                        }
                                        playClickSound();
                                        await handleSaveMaterial(e, selectedExploreLesson.id);
                                        setMaterialForm({
                                          title: "",
                                          type: "video",
                                          url: "",
                                          description: "",
                                          section: folder
                                        });
                                      }}
                                      className="py-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black uppercase text-[9px] tracking-wide rounded-xl cursor-pointer transition-all active:scale-95 text-center flex items-center justify-center border shadow-xs"
                                    >
                                      🔗 CHÈN LINK ⚡
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div id="custom-confirm-modal" className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-[32px] border-4 border-amber-300 p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4">
            <span className="text-4xl filter drop-shadow">⚠️</span>
            <h3 className="font-black text-amber-955 text-md uppercase">Xác nhận thao tác</h3>
            <p className="text-xs text-zinc-700 font-bold leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3 justify-center w-full mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-808 font-bold text-xs rounded-xl border-2 border-zinc-300 cursor-pointer transition-all active:scale-95"
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

      {/* Floating Chatbot Gấu Biết Tuốt */}
      <GauChatbox currentUser={currentUser} currentRole={currentRole} />
    </div>
  </div>
  );
}
