import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Animated, FlatList, Image, ImageBackground, Pressable, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadVoiceNotes, saveVoiceNotes } from "../storage/VoiceNoteStorage";
import { VoiceNote } from "../type/audio";

export default function HomeScreen() {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const insets = useSafeAreaInsets();

  // Animated bars for recording visualization
  const bar1 = new Animated.Value(10);
  const bar2 = new Animated.Value(20);
  const bar3 = new Animated.Value(15);

  useEffect(() => {
    loadSavedVoiceNotes();
  }, []);

  async function loadSavedVoiceNotes() {
    const saved = await loadVoiceNotes();
    setVoiceNotes(saved);
  }

  // Start recording
  async function startRecording() {
    if (!noteTitle.trim()) {
      alert("Please enter a name for the voice note");
      return;
    }

    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      startWaveAnimation();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  // Stop recording
  async function stopRecording() {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    const duration = Math.floor((status.durationMillis ?? 0) / 1000);

    if (!uri) return;

    const newVoiceNote: VoiceNote = {
      id: Date.now().toString(),
      title: noteTitle,
      uri,
      duration,
      createdAt: new Date(),
    };

    const updated = [newVoiceNote, ...voiceNotes];
    setVoiceNotes(updated);
    await saveVoiceNotes(updated);

    setRecording(null);
    setNoteTitle("");
  }

  // Play / Stop audio
  async function playVoiceNote(uri: string) {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri });
    setSound(newSound);
    await newSound.playAsync();
  }

  // Delete note
  async function deleteVoiceNote(id: string) {
    const filtered = voiceNotes.filter((note) => note.id !== id);
    setVoiceNotes(filtered);
    await saveVoiceNotes(filtered);
  }

  // Filter notes by search query
  const filteredNotes = voiceNotes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Waveform animation
  function startWaveAnimation() {
    Animated.loop(
      Animated.parallel([
        animateBar(bar1, 10, 40, 300),
        animateBar(bar2, 15, 30, 200),
        animateBar(bar3, 20, 35, 250),
      ])
    ).start();
  }

  function animateBar(
    bar: Animated.Value,
    min: number,
    max: number,
    duration: number
  ) {
    return Animated.sequence([
      Animated.timing(bar, { toValue: max, duration, useNativeDriver: false }),
      Animated.timing(bar, { toValue: min, duration, useNativeDriver: false }),
    ]);
  }

  return (
    <ImageBackground
      source={require("../../assets/images/unnamed.jpg")}
      style={styles.background}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Audio Recorder</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.search}
            placeholder="Search notes..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter voice note title"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={noteTitle}
              onChangeText={setNoteTitle}
            />
            <Pressable
              style={({ pressed }) => [
                styles.recordButton,
                (!noteTitle && !recording) && styles.recordButtonDisabled,
                pressed && styles.recordButtonPressed,
              ]}
              onPress={recording ? stopRecording : startRecording}
              disabled={!noteTitle && !recording}
            >
              <Image
                source={
                  recording
                    ? require("../../assets/images/download.png")
                    : require("../../assets/images/add.png")
                }
                style={styles.recordIcon}
              />
            </Pressable>
          </View>

          {/* Recording waveform */}
          {recording && (
            <View style={styles.waveContainer}>
              <Animated.View style={[styles.waveBar, { height: bar1 }]} />
              <Animated.View style={[styles.waveBar, { height: bar2 }]} />
              <Animated.View style={[styles.waveBar, { height: bar3 }]} />
            </View>
          )}
        </View>

        {/* Voice notes list */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.note}>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.noteMeta}>
                  {Math.floor(item.duration / 60)}:
                  {(item.duration % 60).toString().padStart(2, "0")}
                </Text>
              </View>

              <View style={styles.noteActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => playVoiceNote(item.uri)}
                >
                  <Image
                    source={
                      sound
                        ? require("../../assets/images/pause.png")
                        : require("../../assets/images/play.png")
                    }
                    style={styles.playIcon}
                  />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.deleteButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => deleteVoiceNote(item.id)}
                >
                  <Image
                    source={require("../../assets/images/delete.png")}
                    style={styles.deleteIcon}
                  />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No voice notes yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first recording above
              </Text>
            </View>
          }
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerSection: {
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  searchSection: {
    marginBottom: 16,
  },
  search: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recordingSection: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  recordIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  waveContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 8,
    paddingVertical: 16,
  },
  waveBar: {
    width: 6,
    backgroundColor: "#FF4444",
    borderRadius: 3,
    minHeight: 10,
  },
  listContent: {
    paddingBottom: 8,
  },
  note: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  noteContent: {
    flex: 1,
    minWidth: 0,
  },
  noteTitle: {
    fontWeight: "600",
    fontSize: 18,
    color: "#1A1A1A",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  noteMeta: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  playIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  deleteIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
