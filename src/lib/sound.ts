export type SfxName = 'correct' | 'incorrect' | 'levelUp' | 'click';

// No audio files are bundled yet. This stays a safe no-op so components can
// call playSfx freely; drop .mp3/.ogg files into public/sfx and wire them up
// here later without touching any calling component.
export function playSfx(_name: SfxName, soundEnabled: boolean): void {
  if (!soundEnabled) return;
}
