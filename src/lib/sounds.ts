// Web Audio API sound generators — no external files needed

let audioCtx: AudioContext | null = null;
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;
let ringtoneTimeout: ReturnType<typeof setTimeout> | null = null;

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, startTime: number, ctx: AudioContext, gain: GainNode) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  osc.connect(gain);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Play the ringtone arpeggio: C5-E5-G5-C6, looped every 2s */
export function playRingtone() {
  stopRingtone();
  const ctx = getCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  const noteDur = 0.15;
  const gap = 0.05;

  const playArpeggio = () => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.connect(ctx.destination);
    notes.forEach((freq, i) => {
      playTone(freq, noteDur, ctx.currentTime + i * (noteDur + gap), ctx, gain);
    });
    // Fade out
    const totalDur = notes.length * (noteDur + gap);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + totalDur);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + totalDur + 0.1);
  };

  playArpeggio();
  ringtoneInterval = setInterval(playArpeggio, 2000);
}

/** Stop the looping ringtone */
export function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  if (ringtoneTimeout) {
    clearTimeout(ringtoneTimeout);
    ringtoneTimeout = null;
  }
}

/** Play a short two-tone notification chime: E5 → G5 */
export function playNotificationSound() {
  try {
    const ctx = getCtx();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.connect(ctx.destination);

    // E5 for 0.1s
    playTone(659.25, 0.1, ctx.currentTime, ctx, gain);
    // G5 for 0.15s
    playTone(783.99, 0.15, ctx.currentTime + 0.12, ctx, gain);

    // Fade out
    gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.27);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  } catch {
    // Silently fail if AudioContext not available
  }
}
