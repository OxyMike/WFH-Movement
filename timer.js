// timer.js
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '00')}`;
}

export function startTimer(durationSeconds, onTick, onComplete) {
  const endTime = Date.now() + durationSeconds * 1000;
  let done = false;
  onTick(durationSeconds, 0);

  const id = setInterval(() => {
    if (done) return;
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    const progress = (durationSeconds - remaining) / durationSeconds;
    onTick(remaining, progress);

    if (remaining <= 0) {
      done = true;
      clearInterval(id);
      onComplete();
    }
  }, 250);

  return { stop: () => { done = true; clearInterval(id); } };
}

export function playTone(frequency = 440, durationMs = 200, gainLevel = 0.3, instrument = 'standard') {
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
  const ctx = new (AudioContext || webkitAudioContext)();
  const durationSec = durationMs / 1000;
  const now = ctx.currentTime;

  if (instrument === 'woodblock') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.75, now + 0.04);
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (instrument === 'crystal') {
    const overtones = [1.0, 2.0, 3.01, 4.04];
    const weights = [1, 0.5, 0.25, 0.13];
    overtones.forEach((h, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency * 1.6 * h, now);
      gain.gain.setValueAtTime(gainLevel * weights[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * (1.2 - idx * 0.2));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec * 1.5);
    });
  } else {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(gainLevel, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
    osc.start(now);
    osc.stop(now + durationSec);
  }
}
