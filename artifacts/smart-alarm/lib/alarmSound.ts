import { Platform } from "react-native";

type WebAudioContext = {
  currentTime: number;
  destination: AudioNode;
  createOscillator: () => OscillatorNode;
  createGain: () => GainNode;
  resume: () => Promise<void>;
  state: string;
};

let webAudioCtx: WebAudioContext | null = null;
let webBeepInterval: ReturnType<typeof setInterval> | null = null;
let nativeSound: { stopAsync: () => Promise<unknown>; unloadAsync: () => Promise<unknown> } | null = null;

function playWebBeepPattern() {
  const GlobalAny = globalThis as unknown as {
    AudioContext?: new () => WebAudioContext;
    webkitAudioContext?: new () => WebAudioContext;
  };
  const AudioCtxClass = GlobalAny.AudioContext ?? GlobalAny.webkitAudioContext;
  if (!AudioCtxClass) return;

  if (!webAudioCtx) {
    webAudioCtx = new AudioCtxClass();
  }
  const ctx = webAudioCtx;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const beep = (freq: number, startDelay: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + startDelay + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + startDelay + dur);
    osc.start(ctx.currentTime + startDelay);
    osc.stop(ctx.currentTime + startDelay + dur + 0.05);
  };

  beep(880, 0.00, 0.12);
  beep(880, 0.18, 0.12);
  beep(880, 0.36, 0.12);
  beep(660, 0.60, 0.25);
}

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
        { uri: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3" },
        { isLooping: true, volume: 1.0 }
      );
      await sound.playAsync();
      nativeSound = sound;
    } catch {
    }
  }
}

export async function startAlarmSound() {
  await stopAlarmSound();
  if (Platform.OS === "web") {
    playWebBeepPattern();
    webBeepInterval = setInterval(playWebBeepPattern, 1500);
  } else {
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
    if (nativeSound) {
      try {
        await nativeSound.stopAsync();
        await nativeSound.unloadAsync();
      } catch {
      }
      nativeSound = null;
    }
  }
}
