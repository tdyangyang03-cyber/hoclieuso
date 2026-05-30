// Synthesizer for bright cartoon tick-tock / pop sound when clicking buttons
export function playClickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    // Quick pop sound
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = "sine";
    // Start at high frequency and descent fast (pop / tick)
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // Audio context not initialized or blocked
  }
}

// Sparkle sound for correct responses or mindmap node creates
export function playSparkleSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    const playTone = (freq: number, start: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gainNode.gain.setValueAtTime(0.1, start);
      gainNode.gain.exponentialRampToValueAtTime(0.01, start + 0.15);
      osc.start(start);
      osc.stop(start + 0.16);
    };
    
    const now = ctx.currentTime;
    playTone(523.25, now); // C5
    playTone(659.25, now + 0.08); // E5
    playTone(783.99, now + 0.16); // G5
    playTone(1046.50, now + 0.24); // C6
  } catch (e) {
    // Audio context might be blocked
  }
}
