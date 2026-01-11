# Audio Recorder App 🎙️

A modern, feature-rich audio recording application built with React Native and Expo. Record, manage, and play back voice notes with a beautiful glassmorphism UI design.

## Features ✨

- **🎤 Audio Recording**: Record high-quality voice notes with a simple tap
- **📝 Title Management**: Add titles to your recordings with automatic Title Case formatting
- **🔍 Search Functionality**: Quickly find your voice notes using the search bar
- **▶️ Playback Controls**: Play, pause, and manage your audio recordings
- **📊 Visual Feedback**: 
  - Animated waveform bars during recording
  - Animated waveform bars during playback
- **🗑️ Delete Notes**: Remove unwanted recordings with ease
- **💾 Persistent Storage**: All recordings are saved locally using AsyncStorage
- **🎨 Modern UI**: 
  - Glassmorphism design with blur effects
  - Clean color scheme (Black, White, Blue, Gray)
  - Smooth animations and transitions
  - Responsive layout

## Screenshots

The app features a clean, modern interface with:
- Glass-effect cards for voice notes
- Animated recording indicator
- Playback visualization
- Intuitive controls

## Tech Stack 🛠️

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and toolchain
- **TypeScript** - Type-safe JavaScript
- **Expo AV** - Audio recording and playback
- **Expo Blur** - Glassmorphism effects
- **AsyncStorage** - Local data persistence
- **React Navigation** - Navigation system
- **Expo Vector Icons** - Icon library

## Installation 📦

1. Clone the repository:
```bash
git clone https://github.com/Musiki8213/React-Native-Task-3---Audio-Recorder.git
cd React-Native-Task-3---Audio-Recorder
```

2. Install dependencies:
```bash
npm install
```

## Running the App 🚀

### Start the development server:
```bash
npm start
# or
npx expo start
```

### Run on specific platforms:

**iOS Simulator:**
```bash
npm run ios
# or
npx expo start --ios
```

**Android Emulator:**
```bash
npm run android
# or
npx expo start --android
```

**Web Browser:**
```bash
npm run web
# or
npx expo start --web
```

## Usage 📱

1. **Record a Voice Note:**
   - Tap the "Record" button at the bottom
   - Enter a title for your recording in the popup modal
   - The title will automatically be converted to Title Case
   - Tap "Start Recording" to begin
   - Watch the animated waveform bars while recording
   - Tap "Stop" when finished

2. **Play a Recording:**
   - Find your voice note in the list
   - Tap the play button to start playback
   - Animated waveform bars will appear during playback
   - Tap pause to stop playback

3. **Search Notes:**
   - Use the search bar at the top to filter your recordings
   - Search is case-insensitive and matches note titles

4. **Delete a Note:**
   - Tap the delete button (trash icon) on any voice note
   - The note will be permanently removed

## Project Structure 📁

```
app/
├── (tabs)/
│   └── index.tsx          # Main screen with recording and playback
├── storage/
│   └── VoiceNoteStorage.ts  # Local storage management
└── type/
    └── audio.ts           # TypeScript type definitions
```

## Key Features Implementation

### Audio Recording
- Uses Expo AV for high-quality audio recording
- Automatic permission handling
- Recording duration tracking

### Playback Management
- Individual playback state tracking per note
- Automatic cleanup when playback finishes
- Error handling for audio operations

### UI/UX
- Glassmorphism design with blur effects
- Smooth animations for waveform visualization
- Responsive design for different screen sizes
- Modern color palette (Black, White, Blue, Gray)

### Data Persistence
- All voice notes are saved locally
- Automatic loading on app start
- Persistent storage across app sessions

## Scripts 📜

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Requirements 📋

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development) or Android Studio (for Android development)

## Permissions 🔐

The app requires the following permissions:
- **Microphone** - For recording audio

Permissions are automatically requested when you start recording.

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## License 📄

This project is private and proprietary.

## Author 👤

Created as part of React Native Task 3 - Audio Recorder

## Acknowledgments 🙏

- Built with [Expo](https://expo.dev)
- Icons from [Expo Vector Icons](https://docs.expo.dev/guides/icons/)
- Audio functionality powered by [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)

---

Made with ❤️ using React Native and Expo
