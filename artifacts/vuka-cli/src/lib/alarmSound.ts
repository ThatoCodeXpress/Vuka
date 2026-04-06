import { Vibration } from 'react-native';
import Sound from 'react-native-sound';

Sound.setCategory('Alarm', true);

let currentSound: Sound | null = null;

const VIBRATION_PATTERN = [0, 500, 300, 500, 300, 500, 1000];

export function startAlarmSound() {
  stopAlarmSound();
  Vibration.vibrate(VIBRATION_PATTERN, true);
  try {
    const sound = new Sound(
      'alarm.mp3',
      Sound.MAIN_BUNDLE,
      (error: Error | null) => {
        if (error) {
          console.warn('Sound load error:', error);
          return;
        }
        sound.setNumberOfLoops(-1);
        sound.setVolume(1.0);
        sound.play();
        currentSound = sound;
      }
    );
  } catch (e) {
    console.warn('Sound init error:', e);
  }
}

export function stopAlarmSound() {
  Vibration.cancel();
  if (currentSound) {
    currentSound.stop();
    currentSound.release();
    currentSound = null;
  }
}
