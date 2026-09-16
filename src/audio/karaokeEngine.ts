// Web Audio engine for karaoke playback.
//
// A single AudioContext carries both the backing track and the singer's
// microphone, so the two are mixed by the browser's audio thread and stay in
// sync with each other:
//
//   <audio> ─► source ─┬─► original ────────────────────────────┐
//                      ├─► (L−R) side  ──┐                      │
//                      ├─► lowpass 150Hz ┼─► instrumental ──────┤
//                      └─► highpass 7.5k ┘                      ├─► music bus ─┐
//                                                                              ├─► out
//   mic ─► source ─► highpass 80Hz ─► compressor ─► gain ─┬─► dry ─┐           │
//                                                         └─► echo ┴─► mic bus ┘
//
// Lead vocals are almost always mixed dead-center, i.e. identical in the left
// and right channels, so the difference signal (L−R) cancels them while
// keeping side-panned instruments. Bass and kick are center-panned too, so the
// low end (and some air on top) is added back from the untouched signal through
// filters that sit outside the vocal range.
//
// `vocalLevel` crossfades the untouched mix against that instrumental:
//   1.0 → the original recording, 0.2 → the voice kept as a quiet guide,
//   0.0 → voice removed. Because both sides carry the same instruments, the
// overall loudness stays roughly constant across the whole range.

export type MicEnvironment = "speakers" | "headphones";

/** `count` identical biquads in series, i.e. a slope of count × 12 dB/octave. */
const filterCascade = (
  ctx: AudioContext,
  type: "lowpass" | "highpass",
  frequency: number,
  count: number
): BiquadFilterNode[] =>
  Array.from({ length: count }, () => {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    return filter;
  });

const supportsWebAudio = (): boolean =>
  typeof window !== "undefined" &&
  !!(window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

export class KaraokeAudioEngine {
  private ctx: AudioContext;

  // Music path
  private musicSource: MediaElementAudioSourceNode | null = null;
  private originalGain: GainNode;
  private instrumentalGain: GainNode;
  private musicAnalyser: AnalyserNode;
  private freqData: Uint8Array;

  // Mic path
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode;
  private micEchoGain: GainNode;
  private micAnalyser: AnalyserNode;
  private micData: Uint8Array;

  constructor() {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();

    const master = this.ctx.createGain();
    master.connect(this.ctx.destination);

    // --- music bus -------------------------------------------------------
    const musicBus = this.ctx.createGain();
    this.musicAnalyser = this.ctx.createAnalyser();
    this.musicAnalyser.fftSize = 128;
    this.musicAnalyser.smoothingTimeConstant = 0.75;
    this.freqData = new Uint8Array(this.musicAnalyser.frequencyBinCount);
    musicBus.connect(this.musicAnalyser);
    this.musicAnalyser.connect(master);

    this.originalGain = this.ctx.createGain();
    this.originalGain.gain.value = 1;
    this.originalGain.connect(musicBus);

    this.instrumentalGain = this.ctx.createGain();
    this.instrumentalGain.gain.value = 0;
    this.instrumentalGain.connect(musicBus);

    // --- mic bus ---------------------------------------------------------
    const micBus = this.ctx.createGain();
    this.micAnalyser = this.ctx.createAnalyser();
    this.micAnalyser.fftSize = 512;
    this.micAnalyser.smoothingTimeConstant = 0.6;
    this.micData = new Uint8Array(this.micAnalyser.fftSize);
    micBus.connect(this.micAnalyser);
    this.micAnalyser.connect(master);

    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = 0;
    this.micGain.connect(micBus);

    // Feedback delay for a light "karaoke hall" tail.
    const delay = this.ctx.createDelay(1);
    delay.delayTime.value = 0.17;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.28;
    this.micEchoGain = this.ctx.createGain();
    this.micEchoGain.gain.value = 0;
    this.micGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.micEchoGain);
    this.micEchoGain.connect(micBus);
  }

  static isSupported = supportsWebAudio;

  /**
   * Route an <audio> element through the graph. A media element can only ever
   * be given to one AudioContext, so this runs once per element and the engine
   * is kept for the lifetime of the app.
   */
  attachMusic(element: HTMLAudioElement): void {
    if (this.musicSource) return;
    const ctx = this.ctx;
    this.musicSource = ctx.createMediaElementSource(element);

    // Untouched mix.
    this.musicSource.connect(this.originalGain);

    // L − R cancels whatever sits in the center of the stereo image.
    const splitter = ctx.createChannelSplitter(2);
    this.musicSource.connect(splitter);
    const invertRight = ctx.createGain();
    invertRight.gain.value = -1;
    const side = ctx.createGain();
    side.gain.value = 0.9;
    splitter.connect(side, 0);
    splitter.connect(invertRight, 1);
    invertRight.connect(side);
    side.connect(this.instrumentalGain);

    // Put back the low end that lives in the center (kick, bass) and the air
    // above the vocal range (hats, cymbals). Both taps are cascaded into
    // 4th-order slopes: a single biquad rolls off at only 12 dB/octave, which
    // is shallow enough to leak the voice straight back into the mix — the
    // upper-mid tap in particular would carry sibilance and the top of the
    // vocal range at barely -20 dB.
    const bass = ctx.createGain();
    bass.gain.value = 0.9;
    this.chain(this.musicSource, filterCascade(ctx, "lowpass", 130, 2)).connect(bass);
    bass.connect(this.instrumentalGain);

    const air = ctx.createGain();
    air.gain.value = 0.5;
    this.chain(this.musicSource, filterCascade(ctx, "highpass", 8500, 2)).connect(air);
    air.connect(this.instrumentalGain);
  }

  /** Wire `source` through every filter in order and return the last node. */
  private chain(source: AudioNode, filters: BiquadFilterNode[]): AudioNode {
    return filters.reduce((node, filter) => {
      node.connect(filter);
      return filter;
    }, source);
  }

  get musicAttached(): boolean {
    return this.musicSource !== null;
  }

  /** 0 = voice removed, 1 = original recording. */
  setVocalLevel(level: number): void {
    const v = Math.min(1, Math.max(0, level));
    const t = this.ctx.currentTime;
    // Short ramps keep the slider from clicking.
    this.originalGain.gain.setTargetAtTime(v, t, 0.04);
    this.instrumentalGain.gain.setTargetAtTime(1 - v, t, 0.04);
  }

  // --- microphone --------------------------------------------------------

  /**
   * Start monitoring the microphone through the speakers/headphones.
   * On speakers the browser's echo canceller stays on to stop the backing
   * track from looping back into the mic; with headphones it is turned off,
   * which leaves the voice noticeably more natural.
   */
  async startMic(environment: MicEnvironment): Promise<void> {
    const headphones = environment === "headphones";
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: !headphones,
        noiseSuppression: !headphones,
        autoGainControl: false,
      },
    });

    this.stopMic();
    this.micStream = stream;
    this.micSource = this.ctx.createMediaStreamSource(stream);

    // Roll off rumble and plosives.
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 80;

    // Even out the level and keep sudden peaks (or feedback) in check.
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    this.micSource.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(this.micGain);

    this.resume();
  }

  stopMic(): void {
    this.micSource?.disconnect();
    this.micSource = null;
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
  }

  get micActive(): boolean {
    return this.micStream !== null;
  }

  /** Monitoring volume, 0..1. Capped below unity to limit feedback risk. */
  setMicVolume(volume: number): void {
    const v = Math.min(1, Math.max(0, volume)) * 0.9;
    this.micGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  /** Amount of echo on the monitored voice, 0..1. */
  setMicEcho(amount: number): void {
    const v = Math.min(1, Math.max(0, amount)) * 0.6;
    this.micEchoGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  // --- metering ----------------------------------------------------------

  /** Frequency magnitudes of the music bus, normalized 0..1. */
  readMusicSpectrum(bars: number): number[] {
    this.musicAnalyser.getByteFrequencyData(this.freqData);
    const usable = Math.floor(this.freqData.length * 0.75);
    const step = Math.max(1, Math.floor(usable / bars));
    const out: number[] = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += this.freqData[i * step + j] ?? 0;
      out.push(sum / step / 255);
    }
    return out;
  }

  /** RMS level of the microphone, normalized 0..1. */
  readMicLevel(): number {
    if (!this.micSource) return 0;
    this.micAnalyser.getByteTimeDomainData(this.micData);
    let sum = 0;
    for (let i = 0; i < this.micData.length; i++) {
      const centered = (this.micData[i] - 128) / 128;
      sum += centered * centered;
    }
    return Math.min(1, Math.sqrt(sum / this.micData.length) * 4);
  }

  /** Browsers start an AudioContext suspended until a user gesture. */
  resume(): void {
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => undefined);
    }
  }
}
