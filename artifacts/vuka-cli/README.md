# Vuka — Smart Dual-Verification Alarm System

**Group 1 — Mainstream**
NDLOVU PS · NDARANE N · XAUKA T · MASHEGO TE · NETSHIFHEFHE Z · TOMPANE R

---

## Tech Stack

| Technology | Library | Purpose |
|---|---|---|
| **React Native CLI** | `react-native@0.73.6` | Cross-platform mobile framework |
| **TypeScript (TSX)** | `typescript@5.0` | Typed application code |
| **Navigation** | `@react-navigation/native` + bottom-tabs + stack | 4-tab + modal navigation |
| **Camera** | `react-native-vision-camera` | Real-time photo capture for verification |
| **AI Model** | `@teachablemachine/image` + `@tensorflow/tfjs` | Google Teachable Machine inference |
| **Database** | `react-native-sqlite-storage` | Local SQLite for alarm logs + sleep scores |
| **Audio** | `react-native-sound` | Alarm ringtone playback |
| **Haptics** | `react-native-haptic-feedback` | Vibration feedback |
| **Gradient** | `react-native-linear-gradient` | UI gradients |
| **Icons** | `react-native-vector-icons` (Feather set) | UI iconography |
| **Storage** | `@react-native-async-storage/async-storage` | Alarm + library persistence |

---

## How to Run (Android Studio)

### Prerequisites
- Node.js 18+
- JDK 17
- Android Studio (with Android SDK, API 33+)
- A physical Android device OR an Android Emulator

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/ThatoCodeXpress/Vuka-.git
cd Vuka-

# 2. Install dependencies
npm install

# 3. Link native modules
npx react-native link react-native-vector-icons
npx react-native link react-native-sound

# 4. Start Metro bundler
npx react-native start

# 5. In a NEW terminal, run on Android
npx react-native run-android
```

---

## App Features

### Stage 1 — Wake Up Verification
When the alarm fires, the user must photograph a **random object** from the library. The photo is classified by the Google Teachable Machine AI model (or MobileNet fallback) and must reach **75% confidence** to dismiss.

### Stage 2 — Morning Routine Verification
After a configurable interval (default 30 minutes), a second alarm fires. The user photographs a **morning activity** (brushing teeth, eating breakfast, etc.) to complete the wake-up protocol.

### AI Verification
- Powered by **Google Teachable Machine** (custom trained model via URL)
- Fallback: **TensorFlow.js MobileNet** (pre-trained ImageNet model)
- Confidence threshold: **75%**
- Fully **offline** — runs entirely on-device

### Sleep Score (0–100)
Calculated after completing both stages. Deductions for:
- Late wake time vs set time
- Failed verification attempts
- Skipped Stage 2

### Database (SQLite)
All alarm events and sleep scores stored locally using `react-native-sqlite-storage`.

---

## Project Structure

```
src/
├── screens/          # HomeScreen, HistoryScreen, LibraryScreen, SettingsScreen, AddAlarm, EditAlarm
├── components/       # ActiveAlarmModal, VerificationCamera, AlarmCard
├── navigation/       # Stack + Tab navigator (React Navigation)
├── context/          # AlarmContext — global state management
├── lib/              # aiVerifier.ts, database.ts, alarmSound.ts, tmModelStore.ts
├── hooks/            # useColors
└── constants/        # colors.ts
```

---

## Google Teachable Machine Setup

1. Go to [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/)
2. Choose **Image Project**
3. Add classes matching your Library objects (e.g. "Water Bottle", "Book", "Background")
4. Train the model
5. Export → **Upload (Cloud)** → copy the model URL
6. Open Vuka → **Settings** → paste URL → Save
