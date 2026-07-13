// Web Audio karaoke engine: reduces/removes the lead vocal from stereo audio
// in real time using center-channel (mid) cancellation.
//
// How it works: lead vocals are almost always mixed dead-center, i.e. equally
// present in the left and right channels. Subtracting one channel from the
// other (L - R) cancels everything center-panned — mostly the voice — while
// keeping side-panned instruments. Since bass and kick are also center-panned,
// we add back the low end (and a bit of sparkle) from the original signal
// through filters that sit outside the vocal frequency range.
//
// The element's audio is routed:  source ─┬─ direct gain ──────────────┐
//                                         ├─ (L−R) side signal ─┐      ├─ master ─ output
//                                         ├─ lowpass 150 Hz ────┤ kar. ┘
//                                         └─ highpass 7.5 kHz ──┘ gain
//
// Crossfading direct/karaoke gains lets the caller blend how much of the
// original voice remains (reduction level 0..1).

export class KaraokeEngine {
  private ctx: AudioContext;
  private source: MediaElementAudioSourceNode | null = null;
  private directGain: GainNode;
  private karaokeGain: GainNode;
  private enabled = false;
  private level = 1;

  constructor() {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.directGain = this.ctx.createGain();
    this.karaokeGain = this.ctx.createGain();
    this.karaokeGain.gain.value = 0;
  }

  /** Route an <audio> element through the processing graph. Idempotent. */
  attach(element: HTMLAudioElement): void {
    if (this.source) return;

    const ctx = this.ctx;
    this.source = ctx.createMediaElementSource(element);

    const master = ctx.createGain();
    master.connect(ctx.destination);

    // Direct (untouched) path.
    this.source.connect(this.directGain);
    this.directGain.connect(master);

    // Side signal: L + (−1 × R) cancels center-panned vocals.
    const splitter = ctx.createChannelSplitter(2);
    this.source.connect(splitter);
    const invert = ctx.createGain();
    invert.gain.value = -1;
    const sideSum = ctx.createGain();
    sideSum.gain.value = 0.9;
    splitter.connect(sideSum, 0);
    splitter.connect(invert, 1);
    invert.connect(sideSum);
    sideSum.connect(this.karaokeGain);

    // Restore the low end lost with the center channel (kick/bass).
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 150;
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.9;
    this.source.connect(lowpass);
    lowpass.connect(bassGain);
    bassGain.connect(this.karaokeGain);

    // Restore air/sparkle above the vocal range (hi-hats, cymbals).
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 7500;
    const trebleGain = ctx.createGain();
    trebleGain.gain.value = 0.6;
    this.source.connect(highpass);
    highpass.connect(trebleGain);
    trebleGain.connect(this.karaokeGain);

    this.karaokeGain.connect(master);
    this.applyGains();
  }

  get attached(): boolean {
    return this.source !== null;
  }

  /** Enable/disable vocal removal and set how much voice to remove (0..1). */
  setMode(enabled: boolean, level: number): void {
    this.enabled = enabled;
    this.level = Math.min(1, Math.max(0, level));
    this.applyGains();
  }

  private applyGains(): void {
    const t = this.ctx.currentTime;
    const direct = this.enabled ? 1 - this.level : 1;
    const karaoke = this.enabled ? this.level : 0;
    // Short ramps avoid clicks when toggling or dragging the slider.
    this.directGain.gain.setTargetAtTime(direct, t, 0.05);
    this.karaokeGain.gain.setTargetAtTime(karaoke, t, 0.05);
  }

  /** Browsers start AudioContexts suspended until a user gesture. */
  resume(): void {
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  dispose(): void {
    void this.ctx.close().catch(() => undefined);
    this.source = null;
  }
}

/** Standalone mic monitor: plays the singer's voice with a light echo. */
export class MicMonitor {
  private ctx: AudioContext;
  private stream: MediaStream;
  private micGain: GainNode;

  constructor(stream: MediaStream, volume: number) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.stream = stream;

    const source = this.ctx.createMediaStreamSource(stream);
    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = volume;
    source.connect(this.micGain);

    // Dry voice straight through.
    this.micGain.connect(this.ctx.destination);

    // Subtle feedback echo for a "karaoke hall" feel.
    const delay = this.ctx.createDelay(1);
    delay.delayTime.value = 0.18;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.3;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.35;
    this.micGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(this.ctx.destination);

    this.resume();
  }

  setVolume(volume: number): void {
    this.micGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  resume(): void {
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  dispose(): void {
    this.stream.getTracks().forEach((track) => track.stop());
    void this.ctx.close().catch(() => undefined);
  }
}
