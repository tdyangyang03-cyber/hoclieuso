import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, User, AlertCircle, Settings, Eye, EyeOff, ShieldCheck, Key } from "lucide-react";
import { playClickSound, playSparkleSound } from "./AudioClick";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function GauChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Chào bạn nhỏ nhé! Mình là Gấu Biết Tuốt, chuyên gia thông thái khoa học Lớp 4. Hôm nay bạn muốn cùng mình học tập hay khám phá điều kỳ diệu nào? Cứ hỏi câu hỏi của bạn nhé!'
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [customApiKey, setCustomApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("custom_gemini_api_key") || "";
    setCustomApiKey(saved);
    setTempApiKey(saved);
  }, []);

  const handleSaveApiKey = () => {
    playSparkleSound();
    const cleanKey = tempApiKey.trim();
    setCustomApiKey(cleanKey);
    localStorage.setItem("custom_gemini_api_key", cleanKey);
    setShowSettings(false);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, showSettings]);

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    playClickSound();
    const userText = inputValue;
    setInputValue("");
    
    // Add user message
    const updatedMessages = [...messages, { role: 'user', text: userText } as ChatMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Map to API format
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (customApiKey) {
        headers["X-Gemini-Key"] = customApiKey;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userText, history: historyPayload })
      });

      const data = await res.json();
      
      if (data.reply) {
        // Trigger sparkle sound if teacher mode or happy reply
        if (userText.includes("KHOAHOC4") || userText.includes("Tôi là Thùy Dương")) {
          playSparkleSound();
        }
        setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
      } else if (data.details) {
        setMessages(prev => [...prev, { role: 'model', text: `Ôi có lỗi từ tổng đài vũ trụ: ${data.details}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Có chút lỗi sương sương rồi, mình chưa trả lời được ngay lúc này." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Ôi ngoài kia sóng gió quá, mình không kết nối được với vệ tinh vũ trụ rồi!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end text-zinc-800 font-sans">
      
      {/* 1. Expandable Chat Box Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-[#FFFDEF] rounded-3xl border-4 border-amber-400 shadow-2xl flex flex-col overflow-hidden mb-3 animate-fade-in animate-duration-200">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 p-4 flex justify-between items-center text-white border-b-4 border-amber-500">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-wiggle">🐻</span>
              <div>
                <h3 className="font-black text-sm tracking-wide">GẤU BIẾT TUỐT AI</h3>
                <p className="text-[10px] text-amber-50 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-200 animate-pulse" /> 
                  {customApiKey ? "🔑 Có khóa Vercel riêng" : "Nhà khoa học vui tính 🌿"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowSettings(!showSettings);
                }}
                className={`w-8 h-8 rounded-full ${showSettings ? 'bg-white/40' : 'bg-white/20'} hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer`}
                title="Cấu hình Chìa khóa AI"
              >
                <Settings className={`w-4 h-4 text-white ${showSettings ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleToggle}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="bg-amber-100/70 p-2 border-b text-[11px] leading-snug text-amber-900 font-medium px-4 flex items-center gap-1.5 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Gấu sẽ gợi mở từng bước để bạn tự phát hiện ra lời giải tuyệt vời nhất! 🌟</span>
          </div>

          {/* Main Content Area */}
          {showSettings ? (
            <div className="flex-1 p-5 overflow-y-auto bg-[#FFFDF2] flex flex-col gap-4 text-zinc-800">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="font-extrabold text-[12px] uppercase tracking-wider text-amber-955">
                  Bảo mật khóa Gemini API
                </h4>
              </div>

              <div className="text-[11px] leading-relaxed text-zinc-650 font-bold bg-amber-50/50 border border-amber-200/40 p-3 rounded-2xl">
                Để đảm bảo Gấu hoạt động bảo mật khi cô xuất website ra <strong className="text-emerald-700 font-black">Vercel</strong>, cô có thể dán chìa khóa cá nhân tại đây:
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Khóa lưu cục bộ tại trình duyệt của cô (<strong className="text-amber-900 font-black">Local Storage</strong>).</li>
                  <li>Truyền đi bảo mật cực cao bằng tiêu đề <strong className="text-emerald-700">HTTPS Request Headers</strong>.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 block">
                  Nhập Khóa Gemini API của cô:
                </label>
                <div className="flex items-center gap-2 bg-white border-2 border-amber-200 rounded-2xl px-3 py-1 focus-within:border-amber-400">
                  <Key className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type={showKey ? "text" : "password"}
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-grow bg-transparent border-0 text-xs font-bold font-mono outline-none py-1.5 text-zinc-800 placeholder-zinc-350 min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => { playClickSound(); setShowKey(!showKey); }}
                    className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer shrink-0"
                    title={showKey ? "Ẩn khóa" : "Hiện khóa"}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] font-bold text-zinc-450 italic mt-1 leading-snug">
                  * Hệ thống sẽ tự động khôi phục dùng khóa mặc định của máy chủ nếu cô để trống và Lưu.
                </p>
              </div>

              <div className="flex gap-2.5 mt-auto pt-4 border-t border-amber-100">
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl border border-emerald-700 shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-center"
                >
                  LƯU CHÌA KHÓA ✔️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setShowSettings(false);
                  }}
                  className="px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-xs py-2.5 rounded-xl border border-zinc-300 transition-colors cursor-pointer"
                >
                  QUAY LẠI ↩️
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Conversation history */}
              <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FFFDF2] flex flex-col"
              >
            {messages.map((m, idx) => {
              const isGau = m.role === 'model';
              return (
                <div
                  key={idx}
                  className={`flex gap-2 max-w-[85%] ${isGau ? 'self-start' : 'self-end flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-md border-2 shrink-0 ${
                    isGau ? 'bg-amber-100 border-amber-300' : 'bg-teal-100 border-teal-300'
                  }`}>
                    {isGau ? "🐻" : "🧒"}
                  </div>
                  
                  {/* Bubble body */}
                  <div className={`p-3 rounded-2xl text-[13px] leading-relaxed font-semibold transition-all ${
                    isGau 
                      ? 'bg-amber-50 border-2 border-amber-200 rounded-tl-none text-zinc-850' 
                      : 'bg-[#DEFCE8] border-2 border-emerald-350 rounded-tr-none text-teal-900'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2 self-start items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-md">
                  🐻
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl rounded-tl-none text-xs text-amber-700 font-bold border flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce delay-75"></span>
                  <span className="w-2 h-2 bg-amber-600 rounded-full animate-bounce delay-150"></span>
                  <span>Gấu đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-amber-50 border-t-4 border-amber-200 flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Hỏi Gấu về nấm, năng lượng, thực vật..."
              className="flex-1 bg-white border-2 border-amber-200 rounded-2xl px-4 py-2 text-xs font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white shadow-md active:scale-95 transition-all text-sm shrink-0 cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  )}

      {/* 2. Floating Clickable Badge */}
      <button
        onClick={handleToggle}
        className={`group flex items-center justify-center p-1 bg-white hover:scale-105 active:scale-95 transition-all rounded-full border-4 ${
          isOpen ? 'border-amber-400 bg-amber-50 shadow-md scale-95' : 'border-orange-400 shadow-2xl scale-100'
        } shrink-0 cursor-pointer relative w-16 h-16`}
      >
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#FFFBEB]">
          <span className="text-4xl animate-wiggle">🐻</span>
        </div>
        <div className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-white">
          AI
        </div>
      </button>

    </div>
  );
}
