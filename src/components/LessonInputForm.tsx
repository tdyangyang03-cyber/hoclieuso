import React, { useState } from "react";
import { X, Plus, AlertCircle } from "lucide-react";

interface LessonFormState {
  title: string;
  type: string;
  url: string;
  description: string;
  categoryIndex: number;
}

interface LessonInputFormProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  lessonForm: LessonFormState;
  setLessonForm: (form: LessonFormState) => void;
  editingLesson: boolean;
  subjectCategory: string;
  getLessonTypeIcon: (type: string) => string;
  customLessonTypes: string[];
  setCustomLessonTypes: (types: string[]) => void;
  playClickSound: () => void;
  playSparkleSound: () => void;
  teacherName?: string;
}

export default function LessonInputForm({
  onClose,
  onSubmit,
  lessonForm,
  setLessonForm,
  editingLesson,
  subjectCategory,
  getLessonTypeIcon,
  customLessonTypes,
  setCustomLessonTypes,
  playClickSound,
  playSparkleSound,
  teacherName,
}: LessonInputFormProps) {
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleAddCustomType = () => {
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
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError("");
    playClickSound();

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result;
        if (typeof base64 === "string") {
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: file.name, base64 })
            });
            const data = await res.json();
            if (data.success && data.url) {
              setLessonForm({ ...lessonForm, url: data.url });
              playSparkleSound();
            } else {
              setUploadError(data.error || "Lỗi tải tệp lên máy chủ");
            }
          } catch (err: any) {
            setUploadError("Mất kết nối máy chủ: " + err.message);
          } finally {
            setIsUploading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError("Không thể đọc tệp: " + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-[32px] border-4 border-amber-300 w-full max-w-lg shadow-2xl relative">
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 text-xl font-bold bg-zinc-100 hover:bg-zinc-200 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
        >
          ×
        </button>

        <h3 className="font-black text-md text-amber-950 uppercase mb-4">
          {editingLesson ? "⚙️ CHỈNH SỬA BÀI HỌC" : "➕ TẠO BÀI HỌC MỚI CỦA CHỦ ĐỀ"} {subjectCategory}
        </h3>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 text-xs font-bold text-zinc-700">
          <div className="flex flex-col gap-1">
            <label className="text-zinc-650 block mb-0.5">TÊN FILE BÀI GIẢNG / TIÊU ĐỀ BÀI HỌC:</label>
            <input
              type="text"
              placeholder="vd: Bài tập co nguyên sinh, Giải phẫu bông hoa..."
              value={lessonForm.title}
              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
              className="p-3 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400 font-semibold"
              required
            />
          </div>

          {editingLesson && (
            <>
              <div className="flex flex-col gap-1">
                <label className="flex items-center justify-between">
                  <span>LOẠI HÌNH HỌC LIỆU SỐ:</span>
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setIsAddingCustomType(!isAddingCustomType);
                    }}
                    className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all flex items-center gap-0.5"
                    title="Thêm loại học liệu mới"
                  >
                    <Plus className="w-2.5 h-2.5" /> THÊM LOẠI MỚI
                  </button>
                </label>

                <select
                  value={lessonForm.type}
                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                  className="p-3 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none font-bold"
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
                      onClick={handleAddCustomType}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black cursor-pointer shadow-xs"
                    >
                      Lưu
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label>ĐƯỜNG LIÊN KẾT NHÚNG HỌC LIỆU (URL):</label>
                <input
                  type="text"
                  placeholder="Địa chỉ youtube, canva, slides, pdf, thínghiệm... hoặc được tạo tự động phía dưới"
                  value={lessonForm.url}
                  onChange={(e) => setLessonForm({ ...lessonForm, url: e.target.value })}
                  className="p-3 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400 font-semibold text-xs"
                  required
                />
              </div>

              {/* Advanced Drag & Drop Local File Uploader */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-550 font-black">HOẶC TẢI TỆP ĐỒNG BỘ TỪ MÁY TÍNH CÔ GIÁO (ẢNH, VIDEO, PDF, SLIDES...):</span>
                <div className="flex flex-col gap-1.5 mt-1 border-2 border-dashed border-amber-200 bg-amber-50/10 hover:bg-amber-50/20 hover:border-amber-400 rounded-2xl p-3 text-center transition-all cursor-pointer relative group min-h-[90px] justify-center items-center">
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[11px] text-amber-900 font-extrabold animate-pulse">Hệ thống đang tải lên và nhúng đồng bộ bài giảng...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl group-hover:scale-115 transition-transform duration-200">📂</span>
                      <div>
                        <span className="text-[11px] font-extrabold text-[#78350F] block">NHẤP ĐỂ CHỌN HOẶC THẢ TỆP VÀO ĐÂY</span>
                        <span className="text-[9px] text-[#92400E] font-medium block">Hỗ trợ File Ảnh, Video bài giảng MP4/MOV, Sách PDF, Giáo án điện tử</span>
                      </div>
                    </div>
                  )}
                  {uploadError && (
                    <span className="text-[9px] text-rose-600 font-bold block mt-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-250">⚠️ {uploadError}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label>GỢI Ý TỪ {(teacherName || "admin").toUpperCase()} / MÔ TẢ NHIỆM VỤ:</label>
                <textarea
                  rows={3}
                  placeholder="vd: Con nhớ quan sát đường truyền ánh sáng khi đi qua ly thủy tinh nhé..."
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="p-3 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-[10px] leading-snug font-medium text-amber-900 flex items-start gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>Nguồn liên kết được tự động chuyển hóa thành định dạng nhúng an toàn trên thiết bị học sinh.</span>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md cursor-pointer hover:scale-[1.01] active:scale-95 transition-all text-center"
          >
            {editingLesson ? "Cập Nhật Học Liệu 💾" : "Tạo và Đồng Bộ Bài Học Mới 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
