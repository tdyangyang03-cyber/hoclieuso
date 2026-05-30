import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Download, Save, ZoomIn, ZoomOut, RefreshCw, Sparkles } from "lucide-react";
import { playClickSound, playSparkleSound } from "./AudioClick";

interface MindmapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  emoji: string;
  isCenter?: boolean;
  parentId?: string; // connects to parent
}

interface MindmapEditorProps {
  studentName?: string;
  studentId?: string;
  onSave?: (title: string, nodes: MindmapNode[]) => void;
  initialNodes?: MindmapNode[];
  isReadOnly?: boolean;
}

const PASTEL_COLORS = [
  { name: "Hồng đào", code: "bg-rose-100 border-rose-400 text-rose-700" },
  { name: "Nho tím", code: "bg-violet-100 border-violet-400 text-violet-700" },
  { name: "Bóng mây", code: "bg-sky-100 border-sky-400 text-sky-700" },
  { name: "Nấm rơm", code: "bg-amber-100 border-amber-400 text-amber-700" },
  { name: "Lá non", code: "bg-emerald-100 border-emerald-400 text-emerald-700" }
];

const STICKERS = ["🍄", "🌿", "🌟", "🍎", "⚠️", "🔬", "💧", "🩺", "⚡", "🦠", "🐝", "🎒", "💭"];

export default function MindmapEditor({
  studentName = "Học sinh",
  studentId = "HS01",
  onSave,
  initialNodes,
  isReadOnly = false
}: MindmapEditorProps) {
  const [nodes, setNodes] = useState<MindmapNode[]>([
    { id: "center", text: "NẤM", x: 280, y: 180, color: "bg-rose-100 border-rose-400 text-rose-700", emoji: "🍄", isCenter: true }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("center");
  const [nodeText, setNodeText] = useState("NẤM");
  const [title, setTitle] = useState("Sơ đồ tư duy loài Nấm của tớ");
  const [zoom, setZoom] = useState(1);
  const [isSaved, setIsSaved] = useState(false);

  // Position offset state for actual drag and drop
  const draggingNodeId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes]);

  // Handle selected text update
  useEffect(() => {
    const sel = nodes.find(n => n.id === selectedNodeId);
    if (sel) {
      setNodeText(sel.text);
    }
  }, [selectedNodeId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we click the background canvas, deselect
    if (e.target === e.currentTarget) {
      playClickSound();
      setSelectedNodeId(null);
    }
  };

  const addNode = () => {
    playClickSound();
    playSparkleSound();
    
    // Position around the selected node, or center
    let parentNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];
    const newId = "node_" + Date.now();
    const angle = Math.random() * Math.PI * 2;
    const distance = 120;
    
    const newNode: MindmapNode = {
      id: newId,
      text: "Nhánh mới",
      x: parentNode.x + Math.cos(angle) * distance,
      y: parentNode.y + Math.sin(angle) * distance,
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)].code,
      emoji: STICKERS[Math.floor(Math.random() * STICKERS.length)],
      parentId: parentNode.id
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newId);
  };

  const deleteNode = () => {
    if (!selectedNodeId || selectedNodeId === "center") return;
    playClickSound();
    
    // Remove the node plus any subnodes that have this node as parent
    let idsToRemove = [selectedNodeId];
    let countBefore = 0;
    while (idsToRemove.length !== countBefore) {
      countBefore = idsToRemove.length;
      nodes.forEach(n => {
        if (n.parentId && idsToRemove.includes(n.parentId) && !idsToRemove.includes(n.id)) {
          idsToRemove.push(n.id);
        }
      });
    }

    setNodes(nodes.filter(n => !idsToRemove.includes(n.id)));
    setSelectedNodeId("center");
  };

  const updateSelectedNode = (fields: Partial<MindmapNode>) => {
    if (!selectedNodeId) return;
    setNodes(nodes.map(n => n.id === selectedNodeId ? { ...n, ...fields } : n));
  };

  // Node Dragging implementation
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    draggingNodeId.current = nodeId;
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Find where we grabbed relative to node's center/top-left
      dragOffset.current = {
        x: e.clientX / zoom - node.x,
        y: e.clientY / zoom - node.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId.current || isReadOnly) return;
    
    const x = e.clientX / zoom - dragOffset.current.x;
    const y = e.clientY / zoom - dragOffset.current.y;
    
    // Bound node inside workspace boundaries
    const boundedX = Math.max(20, Math.min(x, 750));
    const boundedY = Math.max(20, Math.min(y, 455));

    setNodes(prev => prev.map(n => n.id === draggingNodeId.current ? { ...n, x: boundedX, y: boundedY } : n));
  };

  const handleMouseUp = () => {
    draggingNodeId.current = null;
  };

  const handleSave = () => {
    playClickSound();
    playSparkleSound();
    if (onSave) {
      onSave(title, nodes);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const mockDownload = (format: 'png' | 'pdf') => {
    playClickSound();
    alert(`🎉 Đã tạo file ${format.toUpperCase()} thành công cho sơ đồ "${title}". Đang tải xuống máy học sinh...`);
  };

  const handleReset = () => {
    playClickSound();
    setNodes([
      { id: "center", text: "NẤM", x: 280, y: 180, color: "bg-rose-100 border-rose-400 text-rose-700", emoji: "🍄", isCenter: true }
    ]);
    setSelectedNodeId("center");
  };

  const activeNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-full text-zinc-800">
      
      {/* 1. Left side controls and editor */}
      {!isReadOnly && (
        <div className="w-full lg:w-72 bg-amber-50 rounded-2xl border-4 border-amber-300 p-4 shadow-md flex flex-col gap-4">
          <h4 className="font-bold text-amber-700 flex items-center gap-2 text-md">
            <span>✨</span> KHUÔN VIẾT Ý TƯỞNG
          </h4>

          <div>
            <label className="text-xs font-bold text-amber-800 block mb-1">TÊN SƠ ĐỒ</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 text-sm bg-white rounded-xl border-2 border-amber-200 outline-none focus:border-amber-400 font-medium"
            />
          </div>

          <div className="border-t-2 border-dashed border-amber-200 pt-3">
            <span className="text-xs font-bold text-amber-800 block mb-2">Ý TƯỞNG ĐANG CHỌN</span>
            {selectedNodeId ? (
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={nodeText}
                  onChange={(e) => {
                    setNodeText(e.target.value);
                    updateSelectedNode({ text: e.target.value });
                  }}
                  className="w-full p-2 text-sm bg-white rounded-xl border-2 border-teal-300 outline-none font-bold"
                  placeholder="Điền tên ý tưởng mới..."
                />

                {/* Color selects */}
                <div>
                  <label className="text-xs font-bold text-amber-700 block mb-1">MÀU HỘP</label>
                  <div className="grid grid-cols-5 gap-1">
                    {PASTEL_COLORS.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => { playClickSound(); updateSelectedNode({ color: col.code }); }}
                        title={col.name}
                        className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-all ${col.code.split(' ')[0]} ${
                          activeNode?.color === col.code ? "scale-110 ring-2 ring-teal-400" : "opacity-80"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sticker/Emoji selects */}
                <div>
                  <label className="text-xs font-bold text-amber-700 block mb-1">NHÃN DÁN STICKER</label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white rounded-lg border">
                    {STICKERS.map((st, idx) => (
                      <button
                        key={idx}
                        onClick={() => { playClickSound(); updateSelectedNode({ emoji: st }); }}
                        className={`text-lg p-1 hover:bg-zinc-100 rounded cursor-pointer ${
                          activeNode?.emoji === st ? "bg-amber-100 scale-110" : ""
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action for selected */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addNode}
                    className="flex-1 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-sm cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm nhánh
                  </button>
                  {selectedNodeId !== "center" && (
                    <button
                      onClick={deleteNode}
                      className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm cursor-pointer active:scale-95 transition-all"
                      title="Xóa nhánh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600 italic">Bấm vào một ô tròn ý tưởng trên bảng dể sửa đổi nè!</p>
            )}
          </div>

          <div className="mt-auto pt-4 border-t-2 border-dashed border-amber-200 flex flex-col gap-2">
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:opacity-95 text-sm"
            >
              <Save className="w-4 h-4" />
              {isSaved ? "Đã Lưu Thành Công!" : "Lưu Sơ Đồ Lên Lớp"}
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => mockDownload('png')}
                className="py-1.5 px-1 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" /> PNG
              </button>
              <button
                onClick={() => mockDownload('pdf')}
                className="py-1.5 px-1 bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Drawing canvas board */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border-4 border-amber-300 relative shadow-md overflow-hidden min-h-[460px]">
        {/* Canvas Toolbar */}
        <div className="bg-amber-100 p-2 border-b-4 border-amber-200 flex justify-between items-center z-10">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
            🎨 BẢNG RẼ NHÁNH TƯ DUY {isReadOnly && "(Xem học liệu)"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { playClickSound(); setZoom(z => Math.max(0.6, z - 0.1)); }}
              className="p-1 px-2 bg-white hover:bg-zinc-50 border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-zinc-600">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => { playClickSound(); setZoom(z => Math.min(1.5, z + 0.1)); }}
              className="p-1 px-2 bg-white hover:bg-zinc-50 border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {!isReadOnly && (
              <button
                onClick={handleReset}
                className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Làm mới sơ đồ"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Vẽ lại
              </button>
            )}
          </div>
        </div>

        {/* The interactive box diagram canvas */}
        <div
          ref={containerRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ height: "460px" }}
        >
          {/* Main draw container reflecting zoom */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: "100%",
              height: "100%",
              transition: draggingNodeId.current ? "none" : "transform 0.1s ease-out"
            }}
          >
            {/* SVG Lines connecting parent nodes */}
            <svg className="absolute inset-0 w-[1200px] h-[1000px] pointer-events-none z-0">
              {nodes.map(n => {
                if (!n.parentId) return null;
                const parent = nodes.find(p => p.id === n.parentId);
                if (!parent) return null;
                
                // Fine coordinates for central connection lines
                return (
                  <g key={"line_" + n.id}>
                    {/* Shadow decorative line */}
                    <path
                      d={`M ${parent.x + 45} ${parent.y + 25} Q ${(parent.x + n.x)/2 + 20} ${(parent.y + n.y)/2 - 20}, ${n.x + 45} ${n.y + 25}`}
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* Cute cartoon colored curve line */}
                    <path
                      d={`M ${parent.x + 45} ${parent.y + 25} Q ${(parent.x + n.x)/2 + 20} ${(parent.y + n.y)/2 - 20}, ${n.x + 45} ${n.y + 25}`}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={n.isCenter ? "none" : "3,3"}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Nodes */}
            {nodes.map(n => {
              const isSelected = selectedNodeId === n.id;
              return (
                <div
                  key={n.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                  style={{
                    left: `${n.x}px`,
                    top: `${n.y}px`,
                    position: "absolute"
                  }}
                  className={`px-4 py-2.5 rounded-2xl cursor-pointer select-none transition-shadow duration-100 flex items-center gap-1.5 border-4 shadow-sm font-semibold text-sm ${
                    n.color
                  } ${isSelected ? "ring-4 ring-amber-400 border-yellow-500 scale-105 z-20 shadow-lg" : "z-10"}`}
                >
                  <span className="text-lg">{n.emoji}</span>
                  <span>{n.text}</span>
                  {!isReadOnly && isSelected && n.id !== "center" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode();
                      }}
                      className="ml-1 text-rose-500 hover:text-rose-700 font-bold p-0.5"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tip footer */}
        <div className="bg-amber-50 p-2 text-center text-[11px] font-bold text-amber-700 border-t-4 border-amber-200">
          💡 {isReadOnly ? "Xem sơ đồ tóm lược bài học. Bạn có thể phóng to / thu nhỏ." : "BẤM CHỌN một ô dể sửa chữ, nhãn dán, màu sắc; KÉO THẢ hình dể di chuyển nhánh của Sơ đồ!"}
        </div>
      </div>
    </div>
  );
}
