import React, { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";

export default function RealtimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-[#FEF3C7] border-2 border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fade-in">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-amber-200 border border-amber-400 flex items-center justify-center shadow-xs animate-pulse">
          <Clock className="w-5 h-5 text-amber-900" />
        </div>
        <div className="text-left">
          <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider block">
            Hệ Thống Đồng Bộ Học Liệu Số
          </span>
          <span className="text-[11px] text-zinc-650 font-black mt-0.5 block">
            {formatDate(time)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-white px-3.5 py-1.5 rounded-2xl border border-amber-300">
          <span className="text-sm font-mono font-black text-amber-950 tracking-wide">
            {formatTime(time)}
          </span>
        </div>
        <div className="bg-emerald-500 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full border border-emerald-400 shadow-xs flex items-center gap-1 uppercase tracking-wider animate-bounce">
          <RefreshCw className="w-3 h-3 animate-spin duration-3000" />
          <span>Realtime</span>
        </div>
      </div>
    </div>
  );
}
