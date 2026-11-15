class PlanetAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.ducked = false;
    this.droneGain = null;
    this.oscA = null;
    this.oscB = null;
    this.lastChimeAt = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  enable() {
    const ctx = this.ensureContext();
    if (!ctx) return false;
    this.enabled = true;

    if (!this.oscA) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 210;

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      droneGain.gain.exponentialRampToValueAtTime(this.ducked ? 0.004 : 0.022, ctx.currentTime + 1.4);

      const oscA = ctx.createOscillator();
      oscA.type = "sine";
      oscA.frequency.value = 110; // A2

      const oscB = ctx.createOscillator();
      oscB.type = "triangle";
      oscB.frequency.value = 164.81; // E3 fifth

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(ctx.destination);

      oscA.start();
      oscB.start();

      this.oscA = oscA;
      this.oscB = oscB;
      this.droneGain = droneGain;
    } else if (this.droneGain) {
      this.droneGain.gain.cancelScheduledValues(ctx.currentTime);
      this.droneGain.gain.setTargetAtTime(this.ducked ? 0.004 : 0.022, ctx.currentTime, 0.4);
    }

    this.playBeaconChord();
    return true;
  }

  disable() {
    this.enabled = false;
    if (this.ctx && this.droneGain) {
      this.droneGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  }

  setDucked(isDucked) {
    this.ducked = isDucked;
    if (!this.enabled || !this.ctx || !this.droneGain) return;
    this.droneGain.gain.setTargetAtTime(isDucked ? 0.002 : 0.022, this.ctx.currentTime, 0.3);
  }

  playKnowledgeChime(lat = 0, lng = 0) {
    if (!this.enabled || this.ducked) return;
    const nowMs = Date.now();
    if (nowMs - this.lastChimeAt < 650) return;
    this.lastChimeAt = nowMs;

    const ctx = this.ensureContext();
    if (!ctx) return;

    // Pentatonic C-major/A-minor crystalline voicings mapped by latitude
    const scale = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
    const norm = Math.max(0, Math.min(1, (lat + 65) / 130));
    const freq = scale[Math.floor(norm * (scale.length - 1))];

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.026, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.65);

    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-0.75, Math.min(0.75, lng / 180));
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
    } else {
      osc.connect(gain);
      gain.connect(ctx.destination);
    }

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.7);
  }

  playBeaconChord() {
    if (!this.enabled || this.ducked) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const notes = [261.63, 329.63, 392.0, 493.88];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = ctx.currentTime + idx * 0.06;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.02, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 2.0);
    });
  }
}

export const planetAudio = new PlanetAudioEngine();
