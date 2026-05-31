const fs = require('fs');
const filepath = './src/App.tsx';
let content = fs.readFileSync(filepath, 'utf8');

console.log('File size loaded:', content.length, 'bytes');

const marker = '{fb.teacherReply ? (';
const markerIndex = content.indexOf(marker);

if (markerIndex !== -1) {
  // First occurrence of the "Cô giáo phản hồi:" block inside fb.teacherReply
  const firstFeedbackLabel = '<strong className="text-emerald-955 font-black">Cô giáo phản hồi:</strong>';
  const labelIndex1 = content.indexOf(firstFeedbackLabel, markerIndex);
  
  // Second occurrence of same "Cô giáo phản hồi:" block after first label
  const labelIndex2 = content.indexOf(firstFeedbackLabel, labelIndex1 + firstFeedbackLabel.length);
  
  if (labelIndex1 !== -1 && labelIndex2 !== -1) {
    // We want to replace everything from after labelIndex1 (including its trailing </div> etc.) 
    // up to right before labelIndex2 (and including line 4731's ")}                             ")
    // Let's identify the exact target block
    const targetStart = labelIndex1 + firstFeedbackLabel.length;
    const targetEnd = labelIndex2;
    
    const middleContent = content.substring(targetStart, targetEnd);
    console.log('Middle content size to excise:', middleContent.length, 'characters');
    
    // We replace middleContent with a newline and proper indentation, so we transition cleanly
    // from index1 label to index2 rest of the code!
    content = content.substring(0, targetStart) + '\n' + content.substring(targetEnd);
    console.log('Excised successfully!');
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('App.tsx saved successfully after excising!');
  } else {
    console.log('Could not find both Cô giáo phản hồi labels:', { labelIndex1, labelIndex2 });
  }
} else {
  console.log('Could not find fb.teacherReply marker');
}
