const VOL_KEY = 'helix_volume';
const MUTE_KEY = 'helix_muted';
export const DEFAULT_VOLUME = 0.25;

const registered = new Set<HTMLAudioElement>();
const listeners = new Set<() => void>();

export function readVolumeSettings() {
  if (typeof window === 'undefined') return { volume: DEFAULT_VOLUME, muted: false };
  const raw = localStorage.getItem(VOL_KEY);
  const parsed = raw != null ? parseFloat(raw) : DEFAULT_VOLUME;
  return {
    volume: Number.isNaN(parsed) ? DEFAULT_VOLUME : Math.min(1, Math.max(0, parsed)),
    muted: localStorage.getItem(MUTE_KEY) === '1',
  };
}

function apply(el: HTMLAudioElement) {
  const { volume, muted } = readVolumeSettings();
  el.muted = muted;
  el.volume = muted ? 0 : volume;
}

export function registerBgm(el: HTMLAudioElement) {
  registered.add(el);
  apply(el);
}

export function unregisterBgm(el: HTMLAudioElement) {
  registered.delete(el);
}

export function applyVolumeToAll() {
  registered.forEach(apply);
}

export function setVolume(v: number) {
  localStorage.setItem(VOL_KEY, String(Math.min(1, Math.max(0, v))));
  applyVolumeToAll();
  listeners.forEach((fn) => fn());
}

export function setMuted(m: boolean) {
  localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  applyVolumeToAll();
  listeners.forEach((fn) => fn());
}

export function subscribeVolume(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getEffectiveVolume() {
  const { volume, muted } = readVolumeSettings();
  return muted ? 0 : volume;
}
