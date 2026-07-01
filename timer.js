// timer.js
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '00')}`;
}

export function startTimer(durationSeconds, onTick, onComplete) {
  let remaining = durationSeconds;
  onTick(remaining, 0);

  const id = setInterval(() => {
    remaining -= 1;
    const progress = (durationSeconds - remaining) / durationSeconds;
    onTick(remaining, progress);

    if (remaining <= 0) {
      clearInterval(id);
      onComplete();
    }
  }, 1000);

  return { stop: () => clearInterval(id) };
}

export function playTone(frequency = 440, durationMs = 200) {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
  const ctx = new (AudioContext || webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + durationMs / 1000);
}
