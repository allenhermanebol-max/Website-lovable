export class AudioManager {
  constructor(volume = 0.65) {
    this.volume = volume;
    this.context = null;
    this.master = null;
  }

  setVolume(value) {
    this.volume = Number(value);
    if (this.master) {
      this.master.gain.value = this.volume;
    }
  }

  ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  play(type) {
    this.ensureContext();
    const presets = {
      swing: [220, 0.05, "sawtooth", 0.18],
      hit: [128, 0.09, "square", 0.28],
      block: [340, 0.06, "triangle", 0.22],
      dash: [180, 0.08, "sine", 0.18],
      win: [523, 0.18, "triangle", 0.22],
      lose: [92, 0.35, "sawtooth", 0.2],
      click: [420, 0.04, "sine", 0.12]
    };
    const [frequency, duration, wave, gainValue] = presets[type] ?? presets.click;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.55), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }
}
