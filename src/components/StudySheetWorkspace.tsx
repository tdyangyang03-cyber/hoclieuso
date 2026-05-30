import React, { useState } from "react";
import { Edit3, CheckCircle, Star, Save, HelpCircle, FileText } from "lucide-react";
import { playClickSound, playSparkleSound } from "./AudioClick";

interface StudySheet {
  id: string;
  title: string;
  imageUrl: string;
}

interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  sheetId: string;
  sheetTitle: string;
  answers: string;
  submittedAt: string;
  comment?: string;
  stars?: number;
}

interface WorksheetWorkspaceProps {
  sheet: StudySheet;
  studentName: string;
  studentId: string;
  onSubmit: (answers: string) => void | Promise<void>;
  existingSubmission?: Submission;
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

  // Google documents safe embedding
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

function isEmbeddable(url: string): boolean {
  if (!url) return false;
  
  // Base64 data rules bypass isEmbeddable checks because we will handle them granularly
  if (url.startsWith("data:")) {
    return !url.startsWith("data:image/");
  }

  const lower = url.toLowerCase();
  if (lower.includes("docs.google.com") || 
      lower.includes("youtube.com") || 
      lower.includes("youtu.be") || 
      lower.includes(".pdf") || 
      lower.includes("canva.com") || 
      lower.includes("vimeo.com") ||
      lower.includes("embed")) {
    return true;
  }
  
  const hasImageExtension = /\.(jpg|jpeg|png|webp|gif|svg)/i.test(lower);
  return !hasImageExtension;
}

export default function StudySheetWorkspace({
  sheet,
  studentName,
  studentId,
  onSubmit,
  existingSubmission
}: WorksheetWorkspaceProps): React.JSX.Element {
  const [answers, setAnswers] = useState(
    existingSubmission ? existingSubmission.answers : ""
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answers.trim()) {
      alert("Vui lòng ghi câu trả lời của em trước khi nộp bài nhé!");
      return;
    }
    playClickSound();
    playSparkleSound();
    onSubmit(answers);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="bg-white p-5 rounded-3xl border-4 border-amber-300 shadow-md text-zinc-800">
      
      {/* Worksheet Title Header */}
      <div className="flex items-center gap-3 mb-4 bg-amber-50 p-3 rounded-2xl border-2 border-amber-200">
        <div className="p-2 bg-amber-400 rounded-xl text-white">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-black text-amber-700 tracking-wider">PHIẾU BÀI TẬP ONLINE</span>
          <h3 className="text-lg font-black text-amber-900">{sheet.title}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left: Interactive/Visual Document Image */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-zinc-550 block">🖼️ ĐỀ BÀI (TÀI LIỆU, VIDEO HOẶC ẢNH PHIẾU BÀI TẬP)</span>
          {sheet.imageUrl && sheet.imageUrl.startsWith("data:audio/") ? (
            <div className="p-5 bg-amber-50/55 border-4 border-dashed border-amber-250 rounded-2xl flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
              <span className="text-4xl text-amber-500">🎧</span>
              <div>
                <span className="text-xs font-black text-amber-800 uppercase tracking-widest block mb-1">ÂM THANH PHIẾU BÀI TẬP</span>
                <p className="text-[11px] text-zinc-500 font-bold mb-3">{sheet.title}</p>
              </div>
              <audio src={sheet.imageUrl} controls className="w-full max-w-sm" />
            </div>
          ) : sheet.imageUrl && sheet.imageUrl.startsWith("data:video/") ? (
            <div className="rounded-2xl overflow-hidden border-4 border-zinc-250 shadow-sm bg-black">
              <video src={sheet.imageUrl} controls className="w-full max-h-96" />
            </div>
          ) : isEmbeddable(sheet.imageUrl) ? (
            <div className="relative rounded-2xl overflow-hidden border-4 border-zinc-250 shadow-sm min-h-[360px] bg-white">
              <iframe
                src={getEmbedUrl(sheet.imageUrl)}
                title={sheet.title}
                className="absolute top-0 left-0 w-full h-full border-0 rounded-xl bg-white"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-4 border-zinc-250 shadow-sm max-h-96">
              <img
                src={sheet.imageUrl}
                alt={sheet.title}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  // Return default fallback placeholder if broken unsplash url
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                }}
              />
              <div className="absolute top-2 left-2 bg-teal-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                Xem hình vẽ này để làm bài nha 🧐
              </div>
            </div>
          )}
        </div>

        {/* Right: Answer Sheet and Feedback Box */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" /> BẢN TRẢ LỜI CỦA EM
            </label>
            
            {existingSubmission ? (
              <div className="bg-zinc-50 p-4 rounded-2xl border-2 border-zinc-200 min-h-32 text-sm font-semibold whitespace-pre-wrap">
                {existingSubmission.answers}
              </div>
            ) : (
              <textarea
                value={answers}
                onChange={(e) => setAnswers(e.target.value)}
                placeholder="Câu 1: Câu trả lời của em là...
Câu 2: Vị trí nấm sinh sống là..."
                rows={8}
                className="w-full p-4 bg-[#FFFDF2] rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none font-bold text-sm leading-relaxed text-zinc-800"
              />
            )}

            {!existingSubmission && (
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-black rounded-xl text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitted ? "Đã Gửi Thành Công!" : "Nộp Phiếu Học Tập Lên Cho Cô Chấm"}
              </button>
            )}
          </div>

          {/* Teacher review result panel */}
          {existingSubmission && (
            <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-250 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                  ⭐ NHẬN XÉT CỦA CÔ GIÁO
                </span>
                {existingSubmission.stars ? (
                  <div className="flex gap-0.5 text-amber-400 bg-white px-2 py-1 rounded-lg border-2 border-emerald-200">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (existingSubmission.stars || 0) ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-lg animate-pulse">
                    Đợi cô nhận xét nha...
                  </span>
                )}
              </div>

              {existingSubmission.comment ? (
                <p className="text-xs font-bold text-emerald-950 italic bg-white p-3 rounded-xl border border-emerald-200 shadow-sm leading-relaxed">
                  💬 &ldquo;{existingSubmission.comment}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-emerald-700 italic">
                  Bài của em đã được gửi đi rồi. Cô giáo sẽ xem bản thảo và tặng sao cho em trong thời gian sớm nhất nhé!
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
