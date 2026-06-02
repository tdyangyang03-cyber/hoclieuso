import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Standard interface for requested GoogleGenAI wrapper Compatibility
class GoogleGenAI extends GoogleGenerativeAI {
  constructor(config: { apiKey: string }) {
    super(config.apiKey || "");
  }
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function generateContentWithRetry(model: any, requestBody: any, retries = 3, delayMs = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(requestBody);
      return result;
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const errorMsg = String(error?.message || error).toLowerCase();
      const is503 = status === 503 || errorMsg.includes("503") || errorMsg.includes("overloaded") || errorMsg.includes("overload");
      const is429 = status === 429 || errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("exhausted");

      if ((is503 || is429) && i < retries - 1) {
        console.warn(`Gemini bị quá tải/quá giới hạn (${status || 'API Error'}). Đang thử lại lần ${i + 1}/${retries} sau ${delayMs}ms...`);
        await delay(delayMs);
        delayMs *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

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
          id: "M_l1_m1",
          title: "Vòng tuần hoàn kì diệu của nước 💧 (Khoa Học Lớp 4)",
          type: "video",
          url: "https://www.youtube.com/watch?v=EX290H6qf6k",
          description: "Video thú vị cùng chú khỉ đất sét khám phá 3 trạng thái của Nước: rắn, lỏng, khí và cách mây mưa hình thành nhen!",
          section: "Video bài giảng 📹",
          createdAt: new Date().toISOString()
        },
        {
          id: "M_l1_m2",
          title: "Mẫu sáp màu & Thí nghiệm đông đặc của nước đá 🧪",
          type: "experiment",
          url: "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=1000",
          description: "Quan sát trạng thái khay đá khi nước hạ nhiệt độ xuống dưới 0 độ C để hiểu rõ sự đông đặc lỏng thành rắn.",
          section: "Thí nghiệm trực quan 🧪",
          createdAt: new Date().toISOString()
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
          id: "M_l2_m1",
          title: "Thí nghiệm ánh sáng truyền thẳng qua khe giấy ⚡",
          type: "video",
          url: "https://www.youtube.com/watch?v=fD1540_U66I",
          description: "Thí nghiệm thực hành giúp con chứng minh ánh sáng đi theo đường thẳng cực kỳ dễ hiểu nhen!",
          section: "Video bài giảng 📹",
          createdAt: new Date().toISOString()
        },
        {
          id: "M_l2_m2",
          title: "Phiếu quan sát nguồn phát sáng tự nhiên & nhân tạo 📖",
          type: "worksheet",
          url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000",
          description: "Hãy điền các nguồn sáng con gặp trong gia đình (mặt trời, bóng đèn, đom đóm) vào phiếu bài lập tức nhen con!",
          section: "Phiếu học tập 📄",
          createdAt: new Date().toISOString()
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
  ] as string[],
  activeLessonId: null as string | null,
  activeFolder: null as string | null,
  activeMaterialId: null as string | null,
  activeSubTab: null as string | null
};

// --- REAL-TIME PERSISTENCE ENGINE FOR VERCEL, CONTAINERS & ROBUST STATE ---
const STATE_FILE_PATH = process.env.VERCEL ? "/tmp/khoahoc4_state.json" : path.join(process.cwd(), "state.json");

// --- SUPABASE CLIENT INITIALIZATION DISABLED AS REQUESTED ---
let supabase: any = null;
console.log("[Supabase System] Supabase is completely disabled. Relying on ultra-fast local memory database and filesystem persistence.");

async function fetchSupabaseState() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("classroom_state")
      .select("state")
      .eq("id", "lop_khoa_hoc_4_chung")
      .maybeSingle();

    if (error) {
      if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
        console.log("\n============================= SUPABASE TABLE SETUP GUIDE =============================\n" +
          "Bảng 'classroom_state' chưa tồn tại trên cơ sở dữ liệu Supabase 'supabase-sky-car'.\n" +
          "Bạn chỉ cần sao chép lệnh SQL dưới đây và dán vào Supabase Dashboard -> SQL Editor để tạo nhanh bảng:\n\n" +
          "CREATE TABLE IF NOT EXISTS classroom_state (\n" +
          "  id TEXT PRIMARY KEY,\n" +
          "  state JSONB,\n" +
          "  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())\n" +
          ");\n" +
          "ALTER TABLE classroom_state ENABLE ROW LEVEL SECURITY;\n" +
          "CREATE POLICY \"Allow public access\" ON classroom_state FOR ALL USING (true) WITH CHECK (true);\n" +
          "=================================================================================\n"
        );
        (state as any).supabaseError = "TABLE_MISSING";
      } else {
        console.log("[Supabase System Sync Notification]:", error.message);
      }
      return null;
    }

    if (data && data.state) {
      (state as any).supabaseError = null;
      return data.state;
    }
  } catch (err) {
    console.log("[Supabase System Sync Exception Handled]:", err);
  }
  return null;
}

async function saveSupabaseState(newState: any) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from("classroom_state")
      .upsert({ id: "lop_khoa_hoc_4_chung", state: newState, updated_at: new Date().toISOString() });

    if (error) {
       if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
         (state as any).supabaseError = "TABLE_MISSING";
       } else {
         console.log("[Supabase System Save Notification]:", error.message);
       }
    } else {
       (state as any).supabaseError = null;
       console.log("[Supabase System] State successfully synchronized and backed up to Supabase Singapore Cloud Replica.");
    }
  } catch (err) {
    console.log("[Supabase System Save Exception Handled]:", err);
  }
}

function loadPersistedState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed) {
        state = { ...state, ...parsed };
        console.log("[Persistence System] Successfully restored application state from local state.json:", STATE_FILE_PATH);
      }
    } else {
      console.log("[Persistence System] No existing state file found. Starting fresh.");
    }
  } catch (err) {
    console.error("[Persistence System] Critical error while reading persisted state:", err);
  }
}

function savePersistedState() {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
    console.log("[Persistence System] Persisted state successfully to local state.json file:", STATE_FILE_PATH);
    broadcastState();
    
    // Save to Supabase Singapore so other instances, mobile phones and dashboards sync instantly
    if (supabase) {
      saveSupabaseState(state);
    }
  } catch (err) {
    console.error("[Persistence System] Critical error while writing persisted state:", err);
  }
}

// --- REAL-TIME STREAMING BROADCAST ENGINE (SSE) ---
let sseClients: any[] = [];

function broadcastState() {
  const dataStr = JSON.stringify(state);
  sseClients.forEach(client => {
    try {
      client.write(`data: ${dataStr}\n\n`);
    } catch (e) {
      // dead stream ignored
    }
  });
}

// Automatically load local state on application boot
loadPersistedState();

// Initialize remote Cloud State Sync upon boot with SupabaseSingapore
if (supabase) {
  fetchSupabaseState().then(remoteState => {
    if (remoteState) {
      state = { ...state, ...remoteState };
      console.log("[Supabase System] Synchronized and loaded in-memory state with Supabase cloud database.");
    } else {
      console.log("[Supabase System] First-time cloud sync seeding 'lop_khoa_hoc_4_chung' starting state to Supabase Singapore.");
      saveSupabaseState(state);
    }
  }).catch(e => {
    console.error("[Supabase System Boot Sync Error]:", e);
  });
}

// Express Response Interceptor Middleware to capture any State Mutations & backup to Firestore/local files
app.use((req: any, res: any, next: any) => {
  const originalJson = res.json;
  res.json = function(body: any) {
    const result = originalJson.call(this, body);
    if (req.method !== "GET" && res.statusCode >= 200 && res.statusCode < 300) {
      setTimeout(() => {
        try {
          savePersistedState();
        } catch (e) {
          console.error("[Persistence Middleware] Async fallback write failed:", e);
        }
      }, 0);
    }
    return result;
  };
  next();
});

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

  // 1. Prioritize process.env.GEMINI_API_KEY
  apiKey = process.env.GEMINI_API_KEY || "";
  apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');

  // 2. If the key is empty or a placeholder, try reading from the local .env file
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

  // 3. Fallback to header if provided, but only if process.env isn't set or is a placeholder
  if (isPlaceholderKey(apiKey) && req && req.headers) {
    const headerKey = req.headers["x-gemini-key"] || req.headers["authorization"]?.toString().replace(/^Bearer\s+/i, "");
    if (headerKey && typeof headerKey === "string") {
      const cleanHeaderKey = headerKey.trim().replace(/^['"]|['"]$/g, '');
      if (!isPlaceholderKey(cleanHeaderKey)) {
        apiKey = cleanHeaderKey;
      }
    }
  }

  // Diagnostic log for debugging without leaking full key
  if (apiKey) {
    const isPlaceholder = isPlaceholderKey(apiKey);
    const hiddenKey = apiKey.length > 8 
      ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` 
      : "[SHORT_KEY]";
    console.log(`[Gemini Auth] Diagnosing API key: length=${apiKey.length}, preview=${hiddenKey}, isPlaceholder=${isPlaceholder}`);
  } else {
    console.log("[Gemini Auth] Diagnosing API key: No API key provided.");
  }

  // Final check to prevent using placeholder or default invalid keys that cause errors
  if (isPlaceholderKey(apiKey)) {
    console.warn("No valid active Gemini API key found (either placeholder or defaulted). Running on elegant offline assistant mode.");
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey
  });
  return { ai, apiKey };
}

// REST APIs
app.get("/api/state", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (supabase) {
    try {
      const remoteState = await fetchSupabaseState();
      if (remoteState) {
        state = {
          ...state,
          ...remoteState
        };
      }
    } catch (e) {
      console.error("[Supabase Pull Error] Failed to refresh live state for client query:", e);
    }
  }

  res.json(state);
});

app.get("/api/state/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Connection", "keep-alive");

  // Push initial state
  res.write(`data: ${JSON.stringify(state)}\n\n`);

  sseClients.push(res);

  req.on("close", () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

app.post("/api/active-session", (req, res) => {
  const { activeLessonId, activeFolder, activeMaterialId, activeSubTab } = req.body;
  state.activeLessonId = activeLessonId !== undefined ? activeLessonId : state.activeLessonId;
  state.activeFolder = activeFolder !== undefined ? activeFolder : state.activeFolder;
  state.activeMaterialId = activeMaterialId !== undefined ? activeMaterialId : state.activeMaterialId;
  state.activeSubTab = activeSubTab !== undefined ? activeSubTab : state.activeSubTab;
  res.json({ success: true, state });
});

app.post("/api/state/restore", (req, res) => {
  const clientState = req.body;
  if (clientState) {
    state = {
      ...state,
      ...clientState
    };
  }
  res.json({ success: true, state });
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
app.post("/api/lessons", async (req, res) => {
  const { id, categoryIndex, title, type, url, description, materials } = req.body;
  let targetLesson: any = null;
  
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
      targetLesson = state.lessons[index];
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
    targetLesson = newLesson;
  }

  // Sync to database if Supabase is connected (Non-blocking, fire-and-forget inside Try-catch to protect mainline flow)
  if (supabase && targetLesson) {
    (async () => {
      try {
        const dbPayload = {
          id: targetLesson.id,
          title: targetLesson.title,
          topic: String(targetLesson.categoryIndex),
          class_id: "lop_khoa_hoc_4_chung"
        };

        console.log(`[Supabase Sync] Attempting to upsert lesson into 'lessons' table:`, dbPayload);
        
        const { error } = await supabase
          .from("lessons")
          .upsert(dbPayload);

        if (error) {
          console.error("=================== SUPABASE DB WRITE ERROR ===================");
          console.error("[Supabase Error] Unable to upsert record into table 'lessons'.");
          console.error("Code:", error.code);
          console.error("Message:", error.message);
          console.error("Details:", error.details);
          console.error("Hint:", error.hint);
          if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
            console.error("-> ROOT CAUSE DIAGNOSIS: Bảng 'lessons' chưa được tạo trên Supabase. Vui lòng vào Supabase Dashboard -> SQL Editor và chạy SQL Script được cung cấp ở chatbot để tự tạo bảng này!");
          }
          console.error("===============================================================");
        } else {
          console.log(`[Supabase Sync] Successfully synchronized lesson '${targetLesson.id}' with 'lessons' table.`);
        }
      } catch (err: any) {
        console.error("=================== SUPABASE UNEXPECTED EXCEPTION ===================");
        console.error("[Supabase Exception] Failed while communicating with Supabase database system:");
        console.error(err);
        console.error("====================================================================");
      }
    })();
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
  const lessonId = req.params.id;
  state.lessons = state.lessons.filter(l => l.id !== lessonId);

  // Sync delete to database if Supabase is connected (Non-blocking, fire-and-forget to protect mainline response)
  if (supabase) {
    (async () => {
      try {
        const { error } = await supabase
          .from("lessons")
          .delete()
          .eq("id", lessonId);

        if (error) {
          console.error("=================== SUPABASE DB DELETE ERROR ===================");
          console.error(`[Supabase Error] Unable to delete lesson '${lessonId}' from table 'lessons'.`);
          console.error("Message:", error.message);
          if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
            console.error("-> ROOT CAUSE DIAGNOSIS: Bảng 'lessons' chưa được tạo trên Supabase. Vui lòng vào Supabase Dashboard -> SQL Editor và chạy SQL Script được cung cấp ở chatbot để tự tạo bảng này!");
          }
          console.error("=================================================================");
        } else {
          console.log(`[Supabase Sync] Successfully deleted lesson '${lessonId}' from 'lessons' table.`);
        }
      } catch (err: any) {
        console.error("[Supabase Exception] Failed to execute deletion on lessons table:", err);
      }
    })();
  }

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

app.post("/api/students/:id/rename", (req, res) => {
  const { name } = req.body;
  const studentId = req.params.id;
  const cleanName = name ? name.trim() : "";
  
  if (!cleanName) {
    return res.status(400).json({ error: "Name cannot be empty" });
  }

  // Update in state.students
  const student = state.students.find(s => s.id === studentId);
  if (student) {
    student.name = cleanName;
  }

  // Update in state.gradesAndComments
  const gradeRecord = state.gradesAndComments.find(g => g.studentId === studentId);
  if (gradeRecord) {
    gradeRecord.studentName = cleanName;
  }

  // Update in state.parentFeedback
  state.parentFeedback.forEach(f => {
    if (f.studentId === studentId) {
      f.studentName = cleanName;
      f.parentName = "Phụ huynh em " + cleanName;
    }
  });

  // Also update in all discussion comments
  state.discussionThreads.forEach(thread => {
    if (thread.comments) {
      thread.comments.forEach(comment => {
        if (comment.studentId === studentId) {
          comment.studentName = cleanName;
        }
      });
    }
  });

  // Also update in lesson comments
  state.lessons.forEach(lesson => {
    if (lesson.comments) {
      lesson.comments.forEach(c => {
        if (c.authorId === studentId) {
          c.authorName = cleanName;
        }
      });
    }
  });

  res.json({
    success: true,
    students: state.students,
    parentFeedback: state.parentFeedback,
    gradesAndComments: state.gradesAndComments,
    lessons: state.lessons,
    discussionThreads: state.discussionThreads
  });
});

// File Upload endpoint supporting images, videos, audio, documents, worksheets
app.post("/api/upload", (req, res) => {
  const { name, base64 } = req.body;
  if (!name || !base64) {
    return res.status(400).json({ error: "Missing name or base64 data" });
  }

  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Extract raw base64 data to buffer
    let fileBuffer: Buffer;
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      fileBuffer = Buffer.from(matches[2], "base64");
    } else {
      fileBuffer = Buffer.from(base64, "base64");
    }

    const ext = path.extname(name) || ".png";
    const baseName = path.basename(name, ext).replace(/[^a-zA-Z0-9-]/g, "_");
    const filename = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, fileBuffer);
    const fileUrl = `/uploads/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error("Local save error:", err);
    res.status(500).json({ error: "Failed to upload file to backend server: " + err.message });
  }
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

app.post("/api/parent-feedback/delete", (req, res) => {
  const { feedbackId } = req.body;
  state.parentFeedback = state.parentFeedback.filter(f => f.id !== feedbackId);
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

// Unified Helper for Gấu Biết Tuốt Offline Fallbacks
function getOfflineReply(message: string, isOverride: boolean): string {
  const normalizedMessage = message.toLowerCase();
  
  if (isOverride) {
    return "Chào cô Thùy Dương ạ! Trợ lý ảo đã bí mật rũ bỏ mọi luật lệ dạy trẻ nhỏ. Gấu hôm nay đã sẵn sàng đáp ứng mọi yêu cầu soạn học liệu, chi tiết đáp án giáo án khoa học lớp 4 trực tiếp cho cô Thùy Dương và cô Nguyễn Phượng!";
  }
  
  if (normalizedMessage.includes("đáp án") || normalizedMessage.includes("cho xin dap an") || normalizedMessage.includes("cho xin đáp án")) {
    return "Mình hiểu bạn đang muốn biết ngay đáp án, nhưng nhiệm vụ của mình là giúp bạn tự tìm ra cơ. Mình sẽ đi cùng bạn từng bước nhé! Tiếc là lúc này Gấu đang ở chế độ ngoại tuyến (Chưa cắm chìa khóa AI). Bạn hãy thảo luận cùng các bạn và cô giáo nhé!";
  } else if (normalizedMessage.includes("nước") || normalizedMessage.includes("nuoc")) {
    return "Mình thấy bạn đang hỏi về Nước đúng không? Nước vô cùng kì diệu! Ở nhiệt độ thường, nước ở thể lỏng, không màu, không mùi, không vị. Khi đun sôi lên 100 độ C, nước tinh khiết sẽ chuyển sang thể khí (hơi nước). Còn nếu cho vào ngăn đá dưới 0 độ C, nước lại hóa rắn (băng/đá). Bạn có biết dòng sông hay cơn mưa được hình thành từ chu trình tuần hoàn nào của nước không?";
  } else if (normalizedMessage.includes("năng lượng") || normalizedMessage.includes("nang luong")) {
    return "Mình thấy bạn đang hỏi về Năng lượng đúng không? Trong chương trình Khoa học 4, chúng mình được biết Mặt Trời là nguồn năng lượng khổng lồ cung cấp ánh sáng và nhiệt cho Trái Đất. Nhờ có Mặt Trời, thực vật mới quang hợp, con người mới sưởi ấm và phơi khô quần áo. Ngoài ra, gió và nước chảy dồi dào cũng là nguồn năng lượng sạch tuyệt vời để quay tuabin máy phát điện! Bạn có biết thiết bị nào ở nhà mình đang tận dụng năng lượng Mặt Trời không?";
  } else if (normalizedMessage.includes("không khí") || normalizedMessage.includes("khong khi")) {
    return "Mình thấy bạn đang hỏi về Không khí đúng không? Không khí có ở xung quanh chúng mình, không màu, không mùi, không vị và không có hình dạng nhất định. Không khí gồm hai thành phần chính là khí nitơ và khí ô-xy (giúp duy trì sự sống và sự cháy). Bạn thử nghĩ xem, loài cây xanh hấp thụ khí gì vào ban đêm và nhả ra khí gì vào ban ngày nhỉ?";
  } else if (normalizedMessage.includes("nấm") || normalizedMessage.includes("nam")) {
    return "Mình thấy bạn đang hỏi về loài Nấm đúng không? Nấm vô cùng đa dạng! Có những loại nấm ăn rất ngon và bổ dưỡng như nấm hương, nấm rơm, nấm đùi gà. Nhưng cũng có những loại nấm mốc làm hỏng thức ăn, hay nấm độc cực kỳ nguy hiểm có màu sặc sỡ ở trong rừng sâu. Bạn có biết điểm khác biệt lớn nhất giữa một cây nấm và một cây hoa thông thường là gì không?";
  } else if (normalizedMessage.includes("ánh sáng") || normalizedMessage.includes("anh sang")) {
    return "Mình thấy bạn đang hỏi về Ánh sáng đúng không? Ánh sáng truyền theo đường thẳng và giúp chúng mình nhìn thấy mọi vật xung quanh. Mặt Trời, ngọn nến đang cháy, hay bóng đèn điện là những vật tự phát sáng. Còn Mặt Trăng hay quyển sách chỉ là vật được chiếu sáng thôi! Bạn có biết tại sao khi chúng mình đi nắng lại xuất hiện một chiếc bóng tối tăm ở phía sau không?";
  }
  
  return "Mình thấy bạn đang hỏi về bài học đúng không? Vì chìa khóa AI của hệ thống chưa được cắm vào nên Gấu tạm thời nói chuyện ngoại tuyến nhẹ nhàng thế này thôi. Bạn hãy thử hỏi Gấu về các chủ đề lớp 4 đầy thú vị như \"Nước\", \"Không khí\", \"Nấm\", \"Ánh sáng\" hay \"Năng lượng\" xem sao nhé!";
}

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
    const fallbackText = getOfflineReply(message, isOverride);
    return res.json({ reply: fallbackText });
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

    // Initialize Generative Model exactly following the requested SDK structure
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    // Call generateContent exactly following the requested SDK pattern with secure exponential retries
    const result = await generateContentWithRetry(model, {
      contents: contents,
      generationConfig: {
        temperature: 0.6
      }
    });

    const response = await result.response;
    const textOutput = response.text() || "Mình chưa hiểu rõ câu hỏi của bạn, bạn thương lượng với mình kỹ hơn nhé!";
    res.json({ reply: textOutput });
    
  } catch (err: any) {
    console.error("Gemini API Error in chat handler:", err);
    let errorMessage = err?.message || String(err);
    // Secure masking: ensure no active API keys are ever leaked in error strings
    errorMessage = errorMessage.replace(/AIzaSy[a-zA-Z0-9_\-]{33}/g, "AIzaSy[MASKED]");
    
    // Provide diagnostic details instead of generic 'unplugged key' to help teachers and students troubleshoot online access
    const errorText = `Gấu gặp lỗi kết nối trực tuyến: "${errorMessage}". Gấu đã tạm thời kích hoạt chế độ tự học ngoại tuyến nhé!`;
    res.json({ 
      reply: errorText,
      error: "API_CALL_ERROR",
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

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

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
