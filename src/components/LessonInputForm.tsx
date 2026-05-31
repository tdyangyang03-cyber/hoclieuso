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
                  type="url"
                  placeholder="Địa chỉ youtube, canva, slides, pdf, thínghiệm..."
                  value={lessonForm.url}
                  onChange={(e) => setLessonForm({ ...lessonForm, url: e.target.value })}
                  className="p-3 border-2 border-zinc-200 bg-zinc-50 rounded-xl outline-none focus:border-amber-400 font-semibold"
                  required
                />
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
