const fs = require('fs');
const filepath = './src/App.tsx';
let content = fs.readFileSync(filepath, 'utf8');

console.log('File size loaded:', content.length, 'bytes');

// 2. Repair Block 2: Student Discussion thread comments stream
const searchTabMarker = "studentActiveTab === 'discussions'";
const tabIndex = content.indexOf(searchTabMarker);

if (tabIndex !== -1) {
  const searchCommentsStream = 'Comments stream from classmates';
  const commentsIndex = content.indexOf(searchCommentsStream, tabIndex);
  
  if (commentsIndex !== -1) {
    const commentsBlockStart = content.lastIndexOf('{/* Comments stream', commentsIndex);
    const commentsBlockEndMarker = '                  })()}';
    const commentsBlockEnd = content.indexOf(commentsBlockEndMarker, commentsIndex);
    
    if (commentsBlockStart !== -1 && commentsBlockEnd !== -1) {
      const fullTarget2 = content.substring(commentsBlockStart, commentsBlockEnd + commentsBlockEndMarker.length);
      
      const correctBlock2 = `{/* Comments stream from classmates */}
                      <div className="border-t pt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                        <span className="text-[10px] font-black text-zinc-500 block uppercase">Ý kiến phát biểu của các bạn:</span>
                        {thread.comments.length === 0 ? (
                          <p className="text-[11px] text-zinc-550 italic">Chưa có ai phát biểu câu trả lời nào cả, em hãy xung phong đầu tiên đi nhen!</p>
                        ) : (
                          thread.comments.map(comment => (
                            <div key={comment.id} className="p-2.5 bg-white border rounded-xl flex justify-between items-center text-xs animate-fade-in">
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-850">🧒 {comment.studentName}:</span>
                                <span className="font-semibold text-zinc-650 italic mt-0.5">&ldquo;{comment.content}&rdquo;</span>
                              </div>
                              <div className="flex items-center gap-1">
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
                )}`;
      
      content = content.replace(fullTarget2, correctBlock2);
      console.log('Block 2 successfully restored!');
    } else {
      console.log('Indices for Block 2 not found fully:', { commentsBlockStart, commentsBlockEnd });
    }
  } else {
    console.log('Comments stream stream comments index not found inside discussions tab');
  }
} else {
  console.log('Discussions tab index not found');
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('Done repairing App.tsx!');
