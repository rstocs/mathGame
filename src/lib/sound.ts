export type SfxName = 'correct' | 'incorrect' | 'levelUp' | 'click';

// Sounds are synthesized with the Web Audio API rather than shipped as audio
// files: four short UI blips would otherwise be a network request and a few
// hundred KB each, and this way there are no assets to load, cache, or bust.

interface Note {
  /** Hz. */
  freq: number;
  /** Seconds from the start of the effect. */
  at: number;
  /** Seconds. */
  duration: number;
  type?: OscillatorType;
  gain?: number;
}

// Frequencies are equal-temperament pitches: the "correct" chime is a rising
// major third (E5 -> A5), level-up is a major arpeggio, and "incorrect" is a
// low dissonant pair that reads as a buzz without being harsh.
const SFX: Record<SfxName, Note[]> = {
  correct: [
    { freq: 659.25, at: 0, duration: 0.09 },
    { freq: 880.0, at: 0.08, duration: 0.16 },
  ],
  incorrect: [
    { freq: 174.61, at: 0, duration: 0.18, type: 'sawtooth', gain: 0.12 },
    { freq: 164.81, at: 0.02, duration: 0.16, type: 'sawtooth', gain: 0.12 },
  ],
  levelUp: [
    { freq: 523.25, at: 0, duration: 0.1 },
    { freq: 659.25, at: 0.09, duration: 0.1 },
    { freq: 783.99, at: 0.18, duration: 0.1 },
    { freq: 1046.5, at: 0.27, duration: 0.28 },
  ],
  click: [{ freq: 440, at: 0, duration: 0.04, type: 'triangle', gain: 0.07 }],
};

const DEFAULT_GAIN = 0.16;

let audioContext: AudioContext | null = null;

/**
 * Browsers refuse to create or run an AudioContext until the user has
 * interacted with the page, so this is created lazily on the first playback
 * (always triggered by a tap or click) rather than at module load.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioContext = new Ctor();
    } catch {
      return null;
    }
  }

  // Safari on iOS suspends the context when the tab loses focus; resuming is
  // a no-op when it is already running.
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }

  return audioContext;
}

function playNote(ctx: AudioContext, note: Note, startTime: number): void {
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();

  oscillator.type = note.type ?? 'sine';
  oscillator.frequency.setValueAtTime(note.freq, startTime);

  // A short attack and exponential decay: a raw square-edged gain would click
  // audibly at both ends of the note.
  const peak = note.gain ?? DEFAULT_GAIN;
  const attack = 0.008;
  envelope.gain.setValueAtTime(0.0001, startTime);
  envelope.gain.exponentialRampToValueAtTime(peak, startTime + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + note.duration);

  oscillator.connect(envelope);
  envelope.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + note.duration + 0.02);
}

export function playSfx(name: SfxName, soundEnabled: boolean): void {
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  for (const note of SFX[name]) {
    playNote(ctx, note, now + note.at);
  }
}
