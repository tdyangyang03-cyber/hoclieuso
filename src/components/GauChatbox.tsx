import React, { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, AlertCircle } from "lucide-react";
import { playClickSound, playSparkleSound } from "./AudioClick";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface GauChatboxProps {
  currentUser?: { id: string; name: string } | null;
  currentRole?: 'login' | 'teacher' | 'student' | 'parent';
}

export default function GauChatbox({ currentUser, currentRole }: GauChatboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Chào bạn nhé! Mình là Gấu Biết Tuốt, chuyên gia thông thái khoa học Lớp 4. Hôm nay bạn muốn cùng mình học tập hay khám phá điều kỳ diệu nào? Cứ hỏi câu hỏi của bạn nhé!'
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    let greeting = "";
    if (currentRole === 'teacher' || (currentUser?.name && (currentUser.name.includes("Thùy Dương") || currentUser.name.includes("Nguyễn Phượng")))) {
      greeting = `Chào cô ${currentUser?.name || "Thầy Cô"} ạ! 🐻 Gấu Biết Tuốt rất hân hạnh được đồng hành cùng cô để chuẩn bị bài học, soạn giáo án và giải đáp mọi học liệu Khoa học 4. Cô cứ thoải mái nhắn cho Gấu bất kỳ câu hỏi hay đáp án nào cô cần nhen!`;
    } else if (currentRole === 'student') {
      greeting = `Chào bạn nhỏ ${currentUser?.name || ""} nhé! 🎒 Mình là Gấu Biết Tuốt đây. Hôm nay chúng mình cùng khám phá và rèn luyện điều kỳ diệu nào của môn Khoa học Lớp 4 nhỉ? Cứ ríu rít đặt câu hỏi cho mình nhé!`;
    } else if (currentRole === 'parent') {
      greeting = `Kính chào quý phụ huynh ${currentUser?.name || ""} ạ! 👨‍👩‍👧 Gấu Biết Tuốt rất vui được cùng gia đình đồng hành với con rèn luyện Khoa học Lớp 4. Kính mời ba ba mẹ đặt câu hỏi hoặc trao đổi nhé!`;
    } else {
      greeting = "Chào bạn nhé! Mình là Gấu Biết Tuốt, chuyên gia thông thái khoa học Lớp 4. Hôm nay bạn muốn cùng mình học tập hay khám phá điều kỳ diệu nào? Cứ hỏi câu hỏi của bạn nhé!";
    }
    
    setMessages([
      {
        role: 'model',
        text: greeting
      }
    ]);
  }, [currentUser, currentRole]);

  const handleToggle = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const getOfflineReply = (message: string, isOverride: boolean): string => {
    const normalizedMessage = message.toLowerCase();
    const currentName = currentUser?.name || "";
    const isTeacher = currentRole === 'teacher' || (currentName && (currentName.includes("Thùy Dương") || currentName.includes("Nguyễn Phượng")));
    
    if (isOverride || isTeacher) {
      return `Chào cô ${currentName || "Thùy Dương"} ạ! Trợ lý ảo đã bí mật rũ bỏ mọi luật lệ dạy trẻ nhỏ. Gấu hôm nay đã sẵn sàng đáp ứng mọi yêu cầu soạn học liệu, chi tiết đáp án giáo án khoa học lớp 4 trực tiếp cho cô Thùy Dương và cô Nguyễn Phượng!`;
    }
    
    const displayName = currentName ? `${currentName}` : "bạn";

    if (normalizedMessage.includes("đáp án") || normalizedMessage.includes("cho xin dap an") || normalizedMessage.includes("cho xin đáp án")) {
      return `Mình hiểu ${displayName} đang muốn biết ngay đáp án, nhưng nhiệm vụ của mình là giúp ${displayName} tự tìm ra cơ. Mình sẽ đi cùng ${displayName} từng bước nhé! Tiếc là lúc này Gấu đang ở chế độ ngoại tuyến (Chưa cắm chìa khóa AI). ${displayName} hãy thảo luận cùng các bạn và cô giáo nhé!`;
    } else if (normalizedMessage.includes("nước") || normalizedMessage.includes("nuoc")) {
      return `Mình thấy ${displayName} đang hỏi về Nước đúng không? Nước vô cùng kì diệu! Ở nhiệt độ thường, nước ở thể lỏng, không màu, không mùi, không vị. Khi đun sôi lên 100 độ C, nước tinh khiết sẽ chuyển sang thể khí (hơi nước). Còn nếu cho vào ngăn đá dưới 0 độ C, nước lại hóa rắn (băng/đá). ${displayName} có biết dòng sông hay cơn mưa được hình thành từ chu trình tuần hoàn nào của nước không?`;
    } else if (normalizedMessage.includes("năng lượng") || normalizedMessage.includes("nang luong")) {
      return `Mình thấy ${displayName} đang hỏi về Năng lượng đúng không? Trong chương trình Khoa học 4, chúng mình được biết Mặt Trời là nguồn năng lượng khổng lồ cung cấp ánh sáng và nhiệt cho Trái Đất. Nhờ có Mặt Trời, thực vật mới quang hợp, con người mới sưởi ấm và phơi khô quần áo. Ngoài ra, gió và nước chảy dồi dào cũng là nguồn năng lượng sạch tuyệt vời để quay tuabin máy phát điện! ${displayName} có biết thiết bị nào ở nhà mình đang tận dụng năng lượng Mặt Trời không?`;
    } else if (normalizedMessage.includes("không khí") || normalizedMessage.includes("khong khi")) {
      return `Mình thấy ${displayName} đang hỏi về Không khí đúng không? Không khí có ở xung quanh chúng mình, không màu, không mùi, không vị và không có hình dạng nhất định. Không khí gồm hai thành phần chính là khí nitơ và khí ô-xy (giúp duy trì sự sống và sự cháy). ${displayName} thử nghĩ xem, loài cây xanh hấp thụ khí gì vào ban đêm và nhả ra khí gì vào ban ngày nhỉ?`;
    } else if (normalizedMessage.includes("nấm") || normalizedMessage.includes("nam")) {
      return `Mình thấy ${displayName} đang hỏi về loài Nấm đúng không? Nấm vô cùng đa dạng! Có những loại nấm ăn rất ngon và bổ dưỡng như nấm hương, nấm rơm, nấm đùi gà. Nhưng cũng có những loại nấm mốc làm hỏng thức ăn, hay nấm độc cực kỳ nguy hiểm có màu sặc sỡ ở trong rừng sâu. ${displayName} có biết điểm khác biệt lớn nhất giữa một cây nấm và một cây hoa thông thường là gì không?`;
    } else if (normalizedMessage.includes("ánh sáng") || normalizedMessage.includes("anh sang")) {
      return `Mình thấy ${displayName} đang hỏi về Ánh sáng đúng không? Ánh sáng truyền theo đường thẳng và giúp chúng mình nhìn thấy mọi vật xung quanh. Mặt Trời, ngọn nến đang cháy, hay bóng đèn điện là những vật tự phát sáng. Còn Mặt Trăng hay quyển sách chỉ là vật được chiếu sáng thôi! ${displayName} có biết tại sao khi chúng mình đi nắng lại xuất hiện một chiếc bóng tối tăm ở phía sau không?`;
    }
    
    return `Mình thấy ${displayName} đang hỏi về bài học đúng không? Vì chìa khóa AI của hệ thống chưa được cắm vào nên Gấu tạm thời nói chuyện ngoại tuyến nhẹ nhàng thế này thôi. ${displayName} hãy thử hỏi Gấu về các chủ đề lớp 4 đầy thú vị như "Nước", "Không khí", "Nấm", "Ánh sáng" hay "Năng lượng" xem sao nhé!`;
  };

  const getSystemPrompt = (isOverride: boolean): string => {
    const currentName = currentUser?.name || "";
    const isTeacher = currentRole === 'teacher' || (currentName && (currentName.includes("Thùy Dương") || currentName.includes("Nguyễn Phượng")));
    const nameStr = currentName ? `Người dùng đang trò chuyện trực tiếp với bạn và có tên hiển thị đã xác thực trên hệ thống rèn luyện là: "${currentName}" (có vai trò là ${currentRole || "chưa rõ"}). Hãy gọi họ bằng tên riêng "${currentName}" một cách thân thiện, ngọt ngào và tự nhiên để gần gũi!` : "";

    if (isOverride || isTeacher) {
      return `Bạn lập tức nhận ra và chào kính trọng cô giáo ${currentName || "Thùy Dương hoặc Nguyễn Phượng"} đang đăng nhập hoặc gửi khẩu lệnh đặc biệt ("KHOAHOC4" hoặc "Tôi là Thùy Dương đây").
Hãy xóa bỏ hoàn toàn mọi quy tắc rèn gợi mở hay bắt lỗi đáp án trẻ nhỏ.
Bạn hãy trở thành trợ lý khoa học chuyên nghiệp, sẵn sàng phục vụ, thoải mái biên soạn giáo án, cung cấp đáp án trực tiếp, nhanh gọn và chi tiết đầy đủ môn Khoa học Lớp 4 để các cô tiện soạn học liệu, chuẩn bị tiết dạy. Giọng điệu ấm áp, vô cùng tôn trọng, sẵn sàng hỗ trợ các cô.`;
    } else {
      return `Bạn là "Gấu Biết Tuốt", một chuyên gia thông thái về lĩnh vực khoa học lớp 4.
NHIỆM VỤ CHÍNH của bạn là hỗ trợ học sinh tiểu học học môn Khoa học lớp 4 theo hướng gợi mở, tuyệt đối không cung cấp đáp án trực tiếp.
Bạn giải đáp nhiệt tình, tường tận chi tiết các chủ đề chuyên môn: Thực phẩm an toàn, Cơ thể người, Năng lượng, Sức khỏe, Môi trường, Nước, Không khí, Ánh sáng, các loài Nấm.

${nameStr}

BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU:

1. XƯNG HÔ VÀ THÁI ĐỘ:
   Xưng hô là "Mình" và gọi người trò chuyện bằng tên riêng của họ là "${currentName || "bạn"}" với thái độ vui vẻ, cởi mở, thân thiện, truyền cảm hứng.

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

    const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "";

    const isPlaceholderKey = (key: string) => {
      const trimmed = (key || "").trim().replace(/^['"]|['"]$/g, '');
      return !trimmed || 
        trimmed === "MY_GEMINI_API_KEY" || 
        trimmed === "AIzaSyCnvKVqRk7PNAxrugnEoe-QUTBn0nWb3gk" || 
        trimmed.includes("YOUR_API_KEY") ||
        trimmed === "undefined" ||
        trimmed === "null";
    };

    const isOverride = userText.toLowerCase().includes("khoahoc4") || 
      userText.toLowerCase().includes("tôi là thùy dương đây") || 
      userText.toLowerCase().includes("toi la thuy duong day") || 
      userText.toLowerCase().includes("tôi là thuỳ dương đây");

    if (isPlaceholderKey(apiKey)) {
      const offlineReply = getOfflineReply(userText, isOverride);
      const warningText = `⚠️ [Cảnh báo cấu hình]: Chìa khóa AI (VITE_GEMINI_API_KEY) chưa được thiết lập chính xác hoặc bị trống trong biến môi trường Vercel. Vui lòng kiểm tra lại cấu hình Environment Variables trên trang quản trị Vercel!\n\nGấu tạm phản hồi ngoại tuyến:\n\n${offlineReply}`;
      
      if (userText.includes("KHOAHOC4") || userText.includes("Tôi là Thùy Dương")) {
        playSparkleSound();
      }
      setMessages(prev => [...prev, { role: 'model', text: warningText }]);
      setIsLoading(false);
      return;
    }

    try {
      // Map history to Google GenAI format (roles strictly alternating)
      let contents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));
      contents.push({
        role: "user",
        parts: [{ text: userText }]
      });

      // 1. First message must be from 'user'. Remove leading 'model' messages
      while (contents.length > 0 && contents[0].role !== "user") {
        contents.shift();
      }

      // 2. Roles must strictly alternate
      const cleanContents: { role: string; parts: { text: string }[] }[] = [];
      contents.forEach((item) => {
        if (cleanContents.length === 0) {
          if (item.role === "user") {
            cleanContents.push(item);
          }
        } else {
          const lastItem = cleanContents[cleanContents.length - 1];
          if (lastItem.role === item.role) {
            lastItem.parts[0].text += "\n" + item.parts[0].text;
          } else {
            cleanContents.push(item);
          }
        }
      });

      contents = cleanContents;

      if (contents.length === 0) {
        contents.push({
          role: "user",
          parts: [{ text: userText }]
        });
      }

      // Initialize the GoogleGenerativeAI client-side directly
      const genAI = new GoogleGenerativeAI(apiKey);
      const systemPrompt = getSystemPrompt(isOverride);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt
      });

      const result = await model.generateContent({
        contents: contents,
        generationConfig: {
          temperature: 0.6
        }
      });

      const response = await result.response;
      const textOutput = response.text() || "Mình chưa hiểu rõ câu hỏi của bạn, bạn thương lượng với mình kỹ hơn nhé!";

      if (userText.includes("KHOAHOC4") || userText.includes("Tôi là Thùy Dương")) {
        playSparkleSound();
      }
      setMessages(prev => [...prev, { role: 'model', text: textOutput }]);
    } catch (err: any) {
      console.error("Gemini API Error in client chat:", err);
      const offlineReply = getOfflineReply(userText, isOverride);
      const errMessage = err?.message || String(err);
      const maskedError = errMessage.replace(/AIzaSy[a-zA-Z0-9_\-]{33}/g, "AIzaSy[MASKED]");
      
      const fallbackWithWarning = `⚠️ [Gấu gặp lỗi kết nối trực tuyến]: "${maskedError}".\n\nHãy kiểm tra cấu hình VITE_GEMINI_API_KEY trong Vercel. Gấu tạm chuyển sang trả lời ngoại tuyến nhé:\n\n${offlineReply}`;
      
      setMessages(prev => [...prev, { role: 'model', text: fallbackWithWarning }]);
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
                  Nhà khoa học vui tính 🌿
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
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
