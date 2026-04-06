import { Platform, Vibration } from "react-native";

type AnyAudioContext = {
  currentTime: number;
  destination: AudioNode;
  createOscillator: () => OscillatorNode;
  createGain: () => GainNode;
  resume: () => Promise<void>;
  state: string;
};

let webCtx: AnyAudioContext | null = null;
let webBeepInterval: ReturnType<typeof setInterval> | null = null;
let nativeSound: { stopAsync: () => Promise<unknown>; unloadAsync: () => Promise<unknown> } | null = null;

function getAudioCtx(): AnyAudioContext | null {
  const g = globalThis as unknown as {
    AudioContext?: new () => AnyAudioContext;
    webkitAudioContext?: new () => AnyAudioContext;
  };
  const Cls = g.AudioContext ?? g.webkitAudioContext;
  if (!Cls) return null;
  if (!webCtx) webCtx = new Cls();
  return webCtx;
}

export function unlockAudio() {
  if (Platform.OS !== "web") return;
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function playBeepPattern() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") { ctx.resume().catch(() => {}); }

  const beep = (freq: number, delay: number, dur: number) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.05);
    } catch {}
  };

  beep(1000, 0.00, 0.10);
  beep(1000, 0.15, 0.10);
  beep(1000, 0.30, 0.10);
  beep(800,  0.55, 0.20);
}

const VIBRATION_PATTERN = [0, 400, 200, 400, 200, 400, 800];

async function startNativeSound() {
  try {
    const { Audio } = await import("expo-av");
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" },
      { isLooping: true, volume: 1.0 }
    );
    await sound.playAsync();
    nativeSound = sound;
  } catch {
    try {
      const { Audio } = await import("expo-av");
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://cdn.freesound.org/previews/220/220602_4160425-lq.mp3" },
        { isLooping: true, volume: 1.0 }
      );
      await sound.playAsync();
      nativeSound = sound;
    } catch {}
  }
}

export async function startAlarmSound() {
  await stopAlarmSound();
  if (Platform.OS === "web") {
    playBeepPattern();
    webBeepInterval = setInterval(playBeepPattern, 1600);
  } else {
    Vibration.vibrate(VIBRATION_PATTERN, true);
    await startNativeSound();
  }
}

export async function stopAlarmSound() {
  if (Platform.OS === "web") {
    if (webBeepInterval !== null) {
      clearInterval(webBeepInterval);
      webBeepInterval = null;
    }
  } else {
    Vibration.cancel();
    if (nativeSound) {
      try {
        await nativeSound.stopAsync();
        await nativeSound.unloadAsync();
      } catch {}
      nativeSound = null;
    }
  }
}
