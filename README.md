# Vuka Smart Dual‑Verification Alarm System

**Vuka** is a React Native CLI mobile application that ensures users are truly awake by requiring **two photo verifications** — first of a chosen object, then of a morning activity.  
Powered by **TensorFlow.js** and **Google Teachable Machine**, it uses real‑time AI recognition to prevent dismissing the alarm without genuine wakefulness.

---

## 🚀 Features
- Built with **React Native CLI** (no Expo).
- Runs **offline** — native Android support via Android Studio.
- **AI photo verification** using TensorFlow.js + Teachable Machine.
- **SQLite storage** for alarms and history.
- **Custom alarm sounds** with `react-native-sound`.
- **Haptic feedback** and gradient UI enhancements.
- **Navigation** via React Navigation (stack + bottom tabs).
- **TypeScript (.tsx / .ts)** for type safety and scalability.

---

## 📂 Project Structure
artifacts/vuka-cli/
├── index.js                  # CLI entry point
├── App.tsx                   # Root component
├── android/AndroidManifest.xml  # Camera + alarm permissions
├── src/screens/              # 6 screens (TSX)
├── src/components/           # AlarmCard, ActiveAlarmModal, VerificationCamera
├── src/navigation/           # React Navigation (stack + tabs)
├── src/context/              # AlarmContext (state management)
├── src/lib/                  # AI verifier, SQLite DB, alarm sound
└── README.md                 # Setup instructions



---

## 🛠️ Tech Stack

### Mobile
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Core framework |
| TypeScript (TSX) | latest | Strong typing |
| React Navigation | ^6 | Navigation (stack + tabs) |
| react-native-vision-camera | latest | Camera access |
| react-native-sound | latest | Alarm audio |
| react-native-haptic-feedback | latest | Haptics |
| react-native-linear-gradient | latest | UI gradients |

### Backend / Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 24 | Runtime |
| Express | ^5 | API framework |
| Drizzle ORM | latest | Database queries |
| PostgreSQL | — | Relational database |
| SQLite (react-native-sqlite-storage) | latest | Local storage |
| Pino | ^9 | Logging |
| Zod | v4 | Schema validation |

---

## 📄 Setup & Run

### Prerequisites
- Node.js 18+  
- React Native CLI installed (`npm install -g react-native-cli`)  
- Android Studio (with SDK + emulator)  

### Installation
Clone the repo and install dependencies:
```bash
git clone https://github.com/yourusername/vuka-cli.git
cd vuka-cli
npm install

Run on Android
Make sure Android Studio is running with an emulator or a connected device:
npx react-native run-android

📑 Notes
Works offline — no Expo Go required.

All files are written in TypeScript (.tsx / .ts).

Permissions for camera and alarms are configured in AndroidManifest.xml.

Designed for real‑world deployment with AI verification and local storage.

🌐 Deployment
Push to GitHub and share with recruiters.

Can be integrated with CI/CD pipelines for automated builds.

Documentation and screenshots can be hosted via GitHub Pages.

© 2026 Thato Xauka | Vuka Smart Alarm System
