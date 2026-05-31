import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// In-Memory Database to support seamless multi-role synchronization in the iframe
let state = {
  lessons: [
    {
      id: "L1",
      categoryIndex: 1,
      title: "Bài 1: Nước kì diệu có những trạng thái nào? 💧",
      description: "Học sinh khám phá các trạng thái tự nhiên của nước: Lỏng, khí, rắn và quá trình chuyển thể kỳ diệu.",
      createdAt: new Date().toISOString(),
      comments: [],
      materials: [
        {
          id: "M1",
          title: "Video bài giảng: Sự chuyển thể của Nước",
          type: "video",
          url: "https://www.youtube.com/embed/3gscG70jK10",
          description: "Xem các thí nghiệm sinh động về nước lỏng sôi biến thành hơi, hơi ngưng tụ, nước đóng băng.",
          section: "Video bài giảng 📹"
        },
        {
          id: "M2",
          title: "Tóm tắt: Sơ đồ chu trình tuần hoàn của nước",
          type: "pdf",
          url: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=60",
          description: "Hình ảnh và sơ đồ minh họa súc tích cho bài học.",
          section: "Tài liệu đọc & Quan sát 📄"
        },
        {
          id: "M3",
          title: "Trò chơi câu đố: Các thể của nước",
          type: "game",
          url: "https://wordwall.net/embed/7915509",
          description: "Trả lời thật nhanh các câu hỏi trắc nghiệm tính chất nước nhé!",
          section: "Vui chơi tương tác 🎮"
        }
      ]
    },
    {
      id: "L2",
      categoryIndex: 2,
      title: "Bài 2: Nguồn sáng & Sự truyền ánh sáng như thế nào? ⚡",
      description: "Cơ thể ta nhìn thấy vật bởi ánh sáng từ nguồn truyền tới mắt. Nhưng truyền như thế nào?",
      createdAt: new Date().toISOString(),
      comments: [],
      materials: [
        {
          id: "M4",
          title: "Video Thí nghiệm: Ánh sáng truyền theo đường thẳng",
          type: "video",
          url: "https://www.youtube.com/embed/fAWh_O4Iqas",
          description: "Chứng minh ánh sáng đi thẳng qua ba màng chắn thẳng hàng.",
          section: "Xem thí nghiệm 🧪"
        },
        {
          id: "M5",
          title: "Thử thách ghép cặp: Vật tự phát sáng",
          type: "game",
          url: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=1200&auto=format&fit=crop&q=80",
          description: "Phân biệt Mặt Trời, Đom Đóm, Đèn pin với Mặt Trăng, Gương phẳng...",
          section: "Trò chơi ô chữ 🎮"
        }
      ]
    }
  ] as any[],
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
  ] as any[],
  teacherNotes: [
    { id: "n1", content: "Lớp 4 rèn luyện rất chăm chỉ. Hôm nay Gia Bảo phát biểu bài rất to và rõ ràng.", createdAt: new Date().toISOString() }
  ] as any[],
  lessonPlans: [
    { id: "p1", title: "KHBD: Bài 1 - Tính chất và vai trò của nước", content: "Mục tiêu: Học sinh nhận biết được nước không màu, không mùi, không vị, hòa tan một số chất và chảy từ cao xuống thấp.", type: "kh-bai-day", link: "" }
  ] as any[],
  scheduleEvents: [
    { id: "e1", title: "Thực hành vẽ Sơ đồ tư duy Nước trên bảng phụ", date: "2026-06-01", time: "09:00" }
  ] as any[],
  studySheets: [
    { id: "ws1", title: "Mẫu Phiếu Học Tập Khám Phá Tính Chất Của Nước", imageUrl: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=60", createdAt: new Date().toISOString() }
  ] as any[],
  workbookSubmissions: [] as any[],
  mindmapSubmissions: [] as any[],
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
  ] as any[],
  parentFeedback: [
    { id: "f1", studentId: "HS01", studentName: "Nguyễn Gia Bảo", parentName: "Phụ huynh Gia Bảo", message: "Chào cô Dương, cảm ơn cô đã tận tình hỗ trợ Gia Bảo tiến bộ vượt bậc!", timestamp: new Date().toISOString() }
  ] as any[],
  discussionThreads: [
    { id: "t1", title: "Thảo luận: Tại sao nước chảy từ trên cao xuống? 🤔", content: "Hãy cùng suy nghĩ xem trong cuộc sống, hiện tượng này giúp ích gì cho đời sống chúng mình nhé!", isOpen: true, comments: [] }
  ] as any[],
  teacherProfile: {
    name: "admin",
    themeColor: "emerald",
    mode: "light",
    avatar: "👩‍🏫"
  },
  attendanceDays: [
    "Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5",
    "Ngày 6", "Ngày 7", "Ngày 8", "Ngày 9", "Ngày 10"
  ] as string[]
};

function awardBadgeToStudent(studentId: string, badge: string) {
  const student = state.students.find(s => s.id === studentId);
  if (student) {
    if (!student.badges) {
      student.badges = [];
    }
    if (!student.badges.includes(badge)) {
      student.badges.push(badge);
    }
  }
}
function getGeminiClient(req?: any): { ai: GoogleGenAI; apiKey: string } | null {
  let apiKey = "";

  const isPlaceholderKey = (key: string) => {
    return !key || 
      key === "MY_GEMINI_API_KEY" || 
      key === "AIzaSyCnvKVqRk7PNAxrugnEoe-QUTBn0nWb3gk" || 
      key.includes("YOUR_API_KEY");
  };

  // 1. Check custom headers for client-provided API key first (fully secure, never exposed, stored in personal browser local storage only)
  if (req && req.headers) {
    const headerKey = req.headers["x-gemini-key"] || req.headers["authorization"]?.toString().replace(/^Bearer\s+/i, "");
    if (headerKey && typeof headerKey === "string") {
      const cleanHeaderKey = headerKey.trim().replace(/^['"]|['"]$/g, '');
      if (!isPlaceholderKey(cleanHeaderKey)) {
        apiKey = cleanHeaderKey;
      }
    }
  }

  // 2. Fall back to process.env if header is not present
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || "";
    apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');
  }

  // If the key is empty or a placeholder, try reading from the local .env file
  if (isPlaceholderKey(apiKey)) {
    try {
      const envPath = path.join(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/GEMINI_API_KEY\s*=\s*(["'])(.*?)\1/) || envContent.match(/GEMINI_API_KEY\s*=\s*([^\s]+)/);
        if (match) {
          const potentialKey = (match[2] || match[1] || "").trim().replace(/^['"]|['"]$/g, '');
          if (!isPlaceholderKey(potentialKey)) {
            apiKey = potentialKey;
          }
        }
      }
    } catch (e) {
      console.error("Direct .env read error:", e);
    }
  }

  // Final check to prevent using placeholder or default invalid keys that cause errors
  if (isPlaceholderKey(apiKey)) {
    console.warn("No valid active Gemini API key found (either placeholder or defaulted). Running on elegant offline assistant mode.");
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  return { ai, apiKey };
}

// REST APIs
app.get("/api/state", (req, res) => {
  res.json(state);
});

app.post("/api/state/reset", (req, res) => {
  state.lessons = [];
  state.workbookSubmissions = [];
  state.mindmapSubmissions = [];
  state.parentFeedback = [];
  state.students = [];
  state.teacherNotes = [];
  state.lessonPlans = [];
  state.scheduleEvents = [];
  state.studySheets = [];
  state.gradesAndComments = [];
  state.discussionThreads = [];
  state.attendanceDays = [
    "Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5",
    "Ngày 6", "Ngày 7", "Ngày 8", "Ngày 9", "Ngày 10"
  ];
  res.json({ success: true, state });
});

// Update Teacher Profile
app.post("/api/teacher/profile", (req, res) => {
  state.teacherProfile = { ...state.teacherProfile, ...req.body };
  res.json({ success: true, teacherProfile: state.teacherProfile });
});

// Create/Edit/Delete Lessons
app.post("/api/lessons", (req, res) => {
  const { id, categoryIndex, title, type, url, description, materials } = req.body;
  
  if (id) {
    // Edit existing
    const index = state.lessons.findIndex(l => l.id === id);
    if (index !== -1) {
      state.lessons[index] = { 
        ...state.lessons[index], 
        title, 
        type: type || state.lessons[index].type || "video", 
        url: url || state.lessons[index].url || "", 
        description,
        materials: materials || state.lessons[index].materials || []
      };
    }
  } else {
    // Brand new item
    const newLesson = {
      id: "L_" + Date.now(),
      categoryIndex: Number(categoryIndex),
      title,
      type: type || "video",
      url: url || "",
      description,
      createdAt: new Date().toISOString(),
      comments: [],
      materials: materials || []
    };
    state.lessons.push(newLesson);
  }
  res.json({ success: true, lessons: state.lessons });
});

// Create or Edit Learning Material (Học liệu) within a Lesson
app.post("/api/lessons/:lessonId/materials", (req, res) => {
  const { id, title, type, url, description, section } = req.body;
  const lessonId = req.params.lessonId;
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (lesson) {
    if (!lesson.materials) {
      lesson.materials = [];
    }
    if (id) {
      // Edit existing material
      const mIdx = lesson.materials.findIndex((m: any) => m.id === id);
      if (mIdx !== -1) {
        lesson.materials[mIdx] = { 
          ...lesson.materials[mIdx], 
          title, 
          type, 
          url, 
          description, 
          section: section || "Chuyên mục chung" 
        };
      }
    } else {
      // Add new material
      const newMaterial = {
        id: "M_" + Date.now(),
        title,
        type: type || "video",
        url: url || "",
        description: description || "",
        section: section || "Nghe và Xem 📹",
        createdAt: new Date().toISOString()
      };
      lesson.materials.push(newMaterial);
    }
    res.json({ success: true, lessons: state.lessons });
  } else {
    res.status(404).json({ error: "Lesson not found" });
  }
});

// Delete Learning Material within a Lesson
app.delete("/api/lessons/:lessonId/materials/:materialId", (req, res) => {
  const { lessonId, materialId } = req.params;
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (lesson && lesson.materials) {
    lesson.materials = lesson.materials.filter((m: any) => m.id !== materialId);
    res.json({ success: true, lessons: state.lessons });
  } else {
    res.status(404).json({ error: "Lesson or material not found" });
  }
});

// Comment & Rate individual Learning Material
app.post("/api/lessons/:id/comment", (req, res) => {
  const { authorName, authorRole, authorId, content, rating } = req.body;
  const lessonId = req.params.id;
  const lesson = state.lessons.find(l => l.id === lessonId);
  if (lesson) {
    if (!lesson.comments) {
      lesson.comments = [];
    }
    const newComment = {
      id: "lc_" + Date.now(),
      authorName,
      authorRole,
      authorId,
      content,
      rating: Number(rating || 5),
      timestamp: new Date().toISOString()
    };
    lesson.comments.push(newComment);

    if (authorRole === "student" && authorId) {
      awardBadgeToStudent(authorId, "Nhà Bình Luận Tri Thức 💬");
    }

    res.json({ success: true, lessons: state.lessons });
  } else {
    res.status(404).json({ error: "Lesson not found" });
  }
});

// Admin Badge System (award/remove manually)
app.post("/api/students/:id/award-badge", (req, res) => {
  const { badge } = req.body;
  const student = state.students.find(s => s.id === req.params.id);
  if (student) {
    if (!student.badges) {
      student.badges = [];
    }
    if (!student.badges.includes(badge)) {
      student.badges.push(badge);
    }
    res.json({ success: true, students: state.students });
  } else {
    res.status(404).json({ error: "Student not found" });
  }
});

app.post("/api/students/:id/remove-badge", (req, res) => {
  const { badge } = req.body;
  const student = state.students.find(s => s.id === req.params.id);
  if (student) {
    if (student.badges) {
      student.badges = student.badges.filter(b => b !== badge);
    }
    res.json({ success: true, students: state.students });
  } else {
    res.status(404).json({ error: "Student not found" });
  }
});

app.delete("/api/lessons/:id", (req, res) => {
  state.lessons = state.lessons.filter(l => l.id !== req.params.id);
  res.json({ success: true, lessons: state.lessons });
});

// Student attendance & list management
app.post("/api/students/attendance", (req, res) => {
  const { id, isPresent, dayName } = req.body;
  const student = state.students.find(s => s.id === id);
  if (student) {
    if (!student.attendedDays) {
      student.attendedDays = [];
    }
    const targetDay = dayName || "Ngày 1";
    if (isPresent) {
      if (!student.attendedDays.includes(targetDay)) {
        student.attendedDays.push(targetDay);
      }
      student.isPresent = true;
      student.checkinTime = new Date().toISOString();
      awardBadgeToStudent(id, "Chuyên Cần Tinh Anh 📅");
    } else {
      student.attendedDays = student.attendedDays.filter((d: string) => d !== targetDay);
      if (student.attendedDays.length === 0) {
        student.isPresent = false;
        student.checkinTime = null;
      }
    }
  }
  res.json({ success: true, students: state.students });
});

app.post("/api/students/attendance/add-day", (req, res) => {
  const { dayName } = req.body;
  if (!state.attendanceDays) {
    state.attendanceDays = ["Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5", "Ngày 6", "Ngày 7", "Ngày 8", "Ngày 9", "Ngày 10"];
  }
  if (dayName && dayName.trim() !== "") {
    if (!state.attendanceDays.includes(dayName.trim())) {
      state.attendanceDays.push(dayName.trim());
    }
  } else {
    const nextNum = state.attendanceDays.length + 1;
    state.attendanceDays.push(`Ngày ${nextNum}`);
  }
  res.json({ success: true, attendanceDays: state.attendanceDays });
});

app.post("/api/students/add", (req, res) => {
  const { name } = req.body;
  const newStudent = {
    id: "HS" + String(state.students.length + 1).padStart(2, "0"),
    name: name ? name.trim() : "",
    isPresent: false,
    checkinTime: null,
    badges: [],
    attendedDays: []
  };
  state.students.push(newStudent);
  // Add placeholder grades & comments
  state.gradesAndComments.push({
    id: "g_" + newStudent.id,
    studentId: newStudent.id,
    studentName: name ? name.trim() : "",
    attendanceScore: "Tốt",
    midTermScore: 10,
    finalScore: 10,
    weeklyComment: "Chưa có nhận xét.",
    lastUpdated: new Date().toISOString()
  });
  res.json({ success: true, students: state.students });
});

app.delete("/api/students/:id", (req, res) => {
  state.students = state.students.filter(s => s.id !== req.params.id);
  state.gradesAndComments = state.gradesAndComments.filter(g => g.studentId !== req.params.id);
  res.json({ success: true, students: state.students });
});

// Study worksheets creation
app.post("/api/study-sheets", (req, res) => {
  const { title, imageUrl } = req.body;
  const newSheet = {
    id: "ws_" + Date.now(),
    title,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60",
    createdAt: new Date().toISOString()
  };
  state.studySheets.push(newSheet);
  res.json({ success: true, studySheets: state.studySheets });
});

// Worksheets answers submission
app.post("/api/submissions", (req, res) => {
  const { studentName, studentId, sheetId, sheetTitle, answers } = req.body;
  const submission = {
    id: "sub_" + Date.now(),
    studentName,
    studentId,
    sheetId,
    sheetTitle,
    answers,
    submittedAt: new Date().toISOString()
  };
  state.workbookSubmissions.push(submission);
  awardBadgeToStudent(studentId, "Siêu Nhân Vở Bài Tập 📝");
  res.json({ success: true, workbookSubmissions: state.workbookSubmissions });
});

// Review / score student submission (teacher comment)
app.post("/api/submissions/review", (req, res) => {
  const { submissionId, comment, stars } = req.body;
  const sub = state.workbookSubmissions.find(s => s.id === submissionId);
  if (sub) {
    sub.comment = comment;
    sub.stars = stars;
    if (Number(stars) >= 4) {
      awardBadgeToStudent(sub.studentId, "Học Sinh Ưu Tú 🌟");
    }
  }
  res.json({ success: true, workbookSubmissions: state.workbookSubmissions });
});

// Mind-maps submission
app.post("/api/mindmaps", (req, res) => {
  const { studentName, studentId, title, nodes, edges } = req.body;
  const submission = {
    id: "mm_" + Date.now(),
    studentName,
    studentId,
    title,
    nodes,
    edges,
    submittedAt: new Date().toISOString()
  };
  state.mindmapSubmissions.push(submission);
  awardBadgeToStudent(studentId, "Bậc Thầy Sơ Đồ Tư Duy 🧠");
  res.json({ success: true, mindmapSubmissions: state.mindmapSubmissions });
});

app.post("/api/mindmaps/review", (req, res) => {
  const { submissionId, comment } = req.body;
  const sub = state.mindmapSubmissions.find(s => s.id === submissionId);
  if (sub) {
    sub.comment = comment;
  }
  res.json({ success: true, mindmapSubmissions: state.mindmapSubmissions });
});

// Weekly Grades / Parent Comments updates
app.post("/api/grades", (req, res) => {
  const { studentId, midTermScore, finalScore, weeklyComment, attendanceScore } = req.body;
  const record = state.gradesAndComments.find(g => g.studentId === studentId);
  if (record) {
    record.midTermScore = Number(midTermScore);
    record.finalScore = Number(finalScore);
    record.weeklyComment = weeklyComment;
    record.attendanceScore = attendanceScore || record.attendanceScore;
    record.lastUpdated = new Date().toISOString();
  }
  res.json({ success: true, gradesAndComments: state.gradesAndComments });
});

// Parent interaction routes
app.post("/api/parent-feedback", (req, res) => {
  const { studentId, studentName, parentName, message } = req.body;
  const newFeedback = {
    id: "f_" + Date.now(),
    studentId,
    studentName,
    parentName,
    message,
    timestamp: new Date().toISOString()
  };
  state.parentFeedback.unshift(newFeedback);
  res.json({ success: true, parentFeedback: state.parentFeedback });
});

app.post("/api/parent-feedback/reply", (req, res) => {
  const { feedbackId, reply } = req.body;
  const feedback = state.parentFeedback.find(f => f.id === feedbackId);
  if (feedback) {
    feedback.teacherReply = reply;
    feedback.replyTimestamp = new Date().toISOString();
  }
  res.json({ success: true, parentFeedback: state.parentFeedback });
});

// Teacher general administrative state (events, plans, notes)
app.post("/api/teacher/notes", (req, res) => {
  state.teacherNotes = [{ id: "n1", content: req.body.content, createdAt: new Date().toISOString() }];
  res.json({ success: true, teacherNotes: state.teacherNotes });
});

app.post("/api/teacher/plans", (req, res) => {
  const { title, content, type, link } = req.body;
  const newPlan = {
    id: "plan_" + Date.now(),
    title,
    content,
    type,
    link
  };
  state.lessonPlans.push(newPlan);
  res.json({ success: true, lessonPlans: state.lessonPlans });
});

app.post("/api/teacher/events", (req, res) => {
  const { date, time, title } = req.body;
  const newEvent = {
    id: "e_" + Date.now(),
    date,
    time,
    title
  };
  state.scheduleEvents.push(newEvent);
  res.json({ success: true, scheduleEvents: state.scheduleEvents });
});

// Discussion Board routes
app.post("/api/discussions/comment", (req, res) => {
  const { threadId, studentName, studentId, content, stars } = req.body;
  const thread = state.discussionThreads.find(t => t.id === threadId);
  if (thread) {
    const newComment = {
      id: "comment_" + Date.now(),
      studentName,
      studentId,
      content,
      stars: Number(stars || 5),
      timestamp: new Date().toISOString()
    };
    thread.comments.unshift(newComment);
    if (studentId) {
      awardBadgeToStudent(studentId, "Nhà Luận Chiến Khoa Học 🗣️");
    }
  }
  res.json({ success: true, discussionThreads: state.discussionThreads });
});

app.post("/api/discussions/toggle", (req, res) => {
  const { threadId, isOpen } = req.body;
  const thread = state.discussionThreads.find(t => t.id === threadId);
  if (thread) {
    thread.isOpen = isOpen;
  }
  res.json({ success: true, discussionThreads: state.discussionThreads });
});

app.post("/api/discussions/create", (req, res) => {
  const { title, content } = req.body;
  const newThread = {
    id: "disc_" + Date.now(),
    title,
    content,
    isOpen: true,
    comments: []
  };
  state.discussionThreads.push(newThread);
  res.json({ success: true, discussionThreads: state.discussionThreads });
});

// Delete Lesson Plan
app.delete("/api/teacher/plans/:id", (req, res) => {
  const { id } = req.params;
  state.lessonPlans = state.lessonPlans.filter(p => p.id !== id);
  res.json({ success: true, lessonPlans: state.lessonPlans });
});

// Delete Schedule Event
app.delete("/api/teacher/events/:id", (req, res) => {
  const { id } = req.params;
  state.scheduleEvents = state.scheduleEvents.filter(e => e.id !== id);
  res.json({ success: true, scheduleEvents: state.scheduleEvents });
});

// Delete Worksheet Template
app.delete("/api/teacher/sheets/:id", (req, res) => {
  const { id } = req.params;
  state.studySheets = state.studySheets.filter(s => s.id !== id);
  res.json({ success: true, studySheets: state.studySheets });
});

// Delete Discussion Thread
app.delete("/api/discussions/:id", (req, res) => {
  const { id } = req.params;
  state.discussionThreads = state.discussionThreads.filter(t => t.id !== id);
  res.json({ success: true, discussionThreads: state.discussionThreads });
});

// Gemini Scientific Chatbox: "Gấu Biết Tuốt"
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Tin nhắn trống!" });
  }

  // Check classroom override/teacher password
  const normalizedMessage = message.toLowerCase();
  const isOverride = normalizedMessage.includes("khoahoc4") || normalizedMessage.includes("tôi là thùy dương đây") || normalizedMessage.includes("toi la thuy duong day") || normalizedMessage.includes("tôi là thuỳ dương đây");

  // Check if API key exists
  const clientInfo = getGeminiClient(req);
  if (!clientInfo) {
    // Elegant fallback if GEMINI_API_KEY is not configured
    let reply = "";
    if (isOverride) {
      reply = "Chào cô Thùy Dương ạ! Trợ lý ảo đã bí mật rũ bỏ mọi luật lệ dạy trẻ nhỏ. Gấu hôm nay đã sẵn sàng đáp ứng mọi yêu cầu soạn học liệu, chi tiết đáp án giáo án khoa học lớp 4 trực tiếp cho cô Thùy Dương và cô Nguyễn Phượng!";
    } else {
      // Check if student wants direct answer in guest fallback
      if (normalizedMessage.includes("đáp án") || normalizedMessage.includes("cho xin dap an") || normalizedMessage.includes("cho xin đáp án")) {
        reply = "Mình hiểu bạn đang muốn biết ngay đáp án, nhưng nhiệm vụ của mình là giúp bạn tự tìm ra cơ. Mình sẽ đi cùng bạn từng bước nhé! Tiếc là lúc này Gấu đang ở chế độ ngoại tuyến (Chưa cắm chìa khóa AI). Bạn hãy thảo luận cùng các bạn và cô giáo nhé!";
      } else {
        reply = `Mình thấy bạn đang hỏi về bài học đúng không? Vì chìa khóa AI của hệ thống chưa được cắm vào nên Gấu tạm thời nói chuyện ngoại tuyến nhẹ nhàng thế này thôi. Bạn hãy tự suy nghĩ thêm và thảo luận cùng cô giáo của mình nhé!`;
      }
    }
    return res.json({ reply });
  }

  const { ai } = clientInfo;

  try {
    let systemPrompt = "";

    if (isOverride) {
      systemPrompt = `Bạn lập tức nhận ra cô giáo Thùy Dương hoặc cô Nguyễn Phượng khi phát hiện tin nhắn chứa mật khẩu đặc biệt ("KHOAHOC4" hoặc "Tôi là Thùy Dương đây").
Hãy xóa bỏ hoàn toàn mọi quy tắc dạy trẻ nhỏ, không dẫn dắt gợi ý lòng vòng nữa.
Hãy trở thành trợ lý khoa học chuyên nghiệp, thoải mái biên soạn, cung cấp đáp án trực tiếp, rõ ràng, chi tiết hoàn toàn về khoa học lớp 4 cho cô Thùy Dương và cô Nguyễn Phượng để các cô tiện soạn giáo án, bài làm. Giọng điệu tôn trọng, sẵn sàng phục vụ.`;
    } else {
      systemPrompt = `Bạn là "Gấu Biết Tuốt", một chuyên gia thông thái về lĩnh vực khoa học lớp 4.
NHIỆM VỤ CHÍNH của bạn là hỗ trợ học sinh tiểu học học môn Khoa học lớp 4 theo hướng gợi mở, tuyệt đối không cung cấp đáp án trực tiếp.
Bạn giải đáp nhiệt tình, tường tận chi tiết các chủ đề chuyên môn: Thực phẩm an toàn, Cơ thể người, Năng lượng, Sức khỏe, Môi trường, Nước, Không khí, Ánh sáng, các loài Nấm.

BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU:

1. XƯNG HÔ VÀ THÁI ĐỘ:
   Xưng hô là "Mình" và "bạn" với thái độ vui vẻ, cởi mở, thân thiện, truyền cảm hứng.

2. HẠN CHẾ SỬ DỤNG KÝ TỰ ĐỊNH DẠNG:
   TUYỆT ĐỐI hạn chế dùng các kí tự định dạng như dấu sao (*) hay dấu thăng (#) vì hệ thống âm thanh đọc văn bản của học sinh không đọc được và bị vấp. Hãy viết chữ thuần, dùng ngắt dòng, chấm phẩy, chấm câu tự nhiên để văn bản lưu loát, dễ nghe dễ hiểu.

3. TUYỆT ĐỐI KHÔNG CUNG CẤP ĐÁP ÁN TRỰC TIẾP:
   Không được đưa ra đáp án cuối cùng hay lời giải chính xác ngay lập tức cho bài tập, đề bài khi học sinh chưa biết cách làm. Chỉ dẫn dắt, gợi mở, đưa ra gợi ý để học sinh tự suy nghĩ và tìm ra lời giải. Chỉ khi nhập mật khẩu bí mật mới đưa ra đáp án.

4. KHEN NGỢI VÀ AN ỦI ĐÚNG CÁCH:
   - Nếu học sinh trả lời Đúng: Khen rõ điểm đúng bằng câu bắt đầu bởi: "Bạn làm rất tốt ở chỗ ..."
   - Nếu học sinh trả lời Sai: Phải an ủi, động viên bằng câu bắt đầu bởi: "Không sao đâu, bạn đang suy nghĩ đúng hướng rồi. Mình thử lại nhé..." và chỉnh hướng cụ thể để học sinh làm lại.

5. KHI HỌC SINH CỐ TÌNH XIN ĐÁP ÁN TRỰC TIẾP:
   Bạn phải phản hồi đúng nguyên văn:
   “Mình hiểu bạn đang muốn biết ngay đáp án, nhưng nhiệm vụ của mình là giúp bạn tự tìm ra cơ. Mình sẽ đi cùng bạn từng bước nhé!”
   Sau đó quay lại gợi mở dưới dạng câu hỏi nhỏ, dẫn dắt tiếp.

6. XỬ LÝ KHI HỌC SINH ĐOÁN ĐÁP ÁN:
   Nếu học sinh đưa ra một đáp án phỏng đoán:
   - TUYỆT ĐỐI KHÔNG ĐƯỢC NÓI: "Đúng rồi" hay "Sai rồi" hay bất cứ từ khẳng định dứt khoát nào.
   - PHẢI NÓI:
     + Nếu hợp lý/đúng hướng: "Bạn đang suy nghĩ rất đúng hướng ở chỗ ..." và đặt câu hỏi kiểm tra lại để củng cố.
     + Nếu chưa đúng: "Bạn đã có một ý hay rồi, nhưng mình thử xem lại chỗ này nhé..." và đặt câu hỏi kiểm tra lại.

7. QUY TRÌNH TRẢ LỜI BẮT BUỘC 4 BƯỚC:
   Bạn buộc phải thực hiện đầy đủ cả 4 bước sau trong mỗi lượt trả lời phổ thông:
   - Bước 1: Nhắc lại vấn đề
     Bắt đầu bằng câu viết đúng mẫu: “Mình thấy bạn đang hỏi về [vấn đề của học sinh] đúng không?”
   - Bước 2: Gợi mở theo đúng cấp độ học sinh lớp 4 (sinh động, thực tế, gắn với cuộc sống xung quanh).
   - Bước 3: Phản hồi khen hoặc động viên theo đúng quy tắc (Đúng: "Bạn làm rất tốt ở chỗ ...", Sai: "Không sao đâu, bạn đang suy nghĩ đúng hướng rồi. Mình thử lại nhé..." + chỉnh hướng).
   - Bước 4: Hỏi tiếp
     LUÔN kết thúc bằng câu hỏi gợi mở chi tiết để dẫn dắt học sinh tiếp tục tương tác.

KHÔNG BAO GIỜ LÀM:
- Không đưa đáp án ngay lập tức.
- Không giải thích khoa học một mạch dài dặc hay nói kiểu học thuật hàn lâm người lớn.`;
    }

    // Format and clean chat history for Gemini API
    let contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Clean contents: Gemini API requires that:
    // 1. The first content must be from 'user'. If there are leading 'model' contents, remove them.
    // 2. Roles must strictly alternate: user -> model -> user -> model.
    // 3. No empty/duplicate roles in succession (e.g. user -> user or model -> model should be merged to prevent bad request).
    
    // Step 1: Remove leading 'model' messages
    while (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    // Step 2: Alternate correctly by merging successive same-role turns
    const cleanContents: any[] = [];
    contents.forEach((item) => {
      if (cleanContents.length === 0) {
        if (item.role === "user") {
          cleanContents.push(item);
        }
      } else {
        const lastItem = cleanContents[cleanContents.length - 1];
        if (lastItem.role === item.role) {
          // Merge successive text parts
          lastItem.parts[0].text += "\n" + item.parts[0].text;
        } else {
          cleanContents.push(item);
        }
      }
    });
    
    contents = cleanContents;

    // Elegant fallback if no valid contents remain
    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      }
    });

    const textOutput = response.text || "Mình chưa hiểu rõ câu hỏi của bạn, bạn thương lượng với mình kỹ hơn nhé!";
    res.json({ reply: textOutput });
    
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    let errorMessage = err?.message || String(err);
    // Secure masking: ensure no active API keys are ever leaked in error strings
    errorMessage = errorMessage.replace(/AIzaSy[a-zA-Z0-9_\-]{33}/g, "AIzaSy[MASKED]");
    res.status(500).json({ 
      error: "Gấu đang bận một chút rồi, mình hỏi lại sau nhé!", 
      details: errorMessage
    });
  }
});

// Serve frontend assets in production or use Vite dev middleware
async function setupServer() {
  if (process.env.VERCEL) {
    console.log("Running on Vercel, skipping setupServer()");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started. Listening on 0.0.0.0:${PORT}`);
  });
}

setupServer();

export default app;
