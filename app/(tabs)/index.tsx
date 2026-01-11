import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadVoiceNotes, saveVoiceNotes } from "../storage/VoiceNoteStorage";
import { VoiceNote } from "../type/audio";

export default function HomeScreen() {
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const insets = useSafeAreaInsets();

  // Animated bars for recording visualization
  const bar1 = new Animated.Value(10);
  const bar2 = new Animated.Value(20);
  const bar3 = new Animated.Value(15);

  // Animated bars for playback visualization
  const playBar1 = new Animated.Value(8);
  const playBar2 = new Animated.Value(16);
  const playBar3 = new Animated.Value(12);
  const playBar4 = new Animated.Value(18);
  const playBar5 = new Animated.Value(14);

  useEffect(() => {
    loadSavedVoiceNotes();
  }, []);

  // Start/stop playback animation
  useEffect(() => {
    if (playingUri) {
      startPlaybackAnimation();
    } else {
      stopPlaybackAnimation();
    }
  }, [playingUri]);

  async function loadSavedVoiceNotes() {
    const saved = await loadVoiceNotes();
    setVoiceNotes(saved);
  }

  // Convert text to Title Case while preserving spaces
  function toTitleCase(text: string): string {
    if (text.length === 0) return text;
    
    // Split by spaces but preserve them
    const parts = text.split(/(\s+)/);
    
    return parts
      .map((part) => {
        // If it's whitespace, keep it as is
        if (/^\s+$/.test(part)) {
          return part;
        }
        // If it's a word, capitalize first letter
        if (part.length > 0) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        return part;
      })
      .join("");
  }

  // Show title modal
  function handleRecordPress() {
    if (recording) {
      stopRecording();
    } else {
      setTempTitle("");
      setShowTitleModal(true);
    }
  }

  // Start recording
  async function startRecording() {
    if (!tempTitle.trim()) {
      alert("Please enter a name for the voice note");
      return;
    }

    setNoteTitle(tempTitle);
    setShowTitleModal(false);

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
    try {
      // If clicking the same note that's playing, stop it
      if (sound && playingUri === uri) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (err) {
          console.error("Error stopping sound:", err);
        }
        setSound(null);
        setPlayingUri(null);
        return;
      }

      // Stop any currently playing sound
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.stopAsync();
            await sound.unloadAsync();
          }
        } catch (err) {
          console.error("Error stopping previous sound:", err);
        }
        setSound(null);
        setPlayingUri(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      setPlayingUri(uri);
      await newSound.playAsync();

      // Reset when playback finishes
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setSound(null);
          setPlayingUri(null);
        }
      });
    } catch (err) {
      console.error("Error playing voice note:", err);
      setSound(null);
      setPlayingUri(null);
    }
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

  // Playback animation
  const playbackAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  function startPlaybackAnimation() {
    stopPlaybackAnimation();
    playbackAnimationRef.current = Animated.loop(
      Animated.parallel([
        animateBar(playBar1, 8, 24, 400),
        animateBar(playBar2, 12, 28, 350),
        animateBar(playBar3, 10, 22, 450),
        animateBar(playBar4, 14, 26, 380),
        animateBar(playBar5, 9, 20, 420),
      ])
    );
    playbackAnimationRef.current.start();
  }

  function stopPlaybackAnimation() {
    if (playbackAnimationRef.current) {
      playbackAnimationRef.current.stop();
      playbackAnimationRef.current = null;
    }
    playBar1.setValue(8);
    playBar2.setValue(16);
    playBar3.setValue(12);
    playBar4.setValue(18);
    playBar5.setValue(14);
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
    <View style={styles.background}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Voice Notes</Text>
          <Text style={styles.subtitle}>Record and manage your audio</Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.search}
              placeholder="Search your notes..."
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Recording indicator */}
        {recording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.waveContainer}>
              <Animated.View style={[styles.waveBar, { height: bar1 }]} />
              <Animated.View style={[styles.waveBar, { height: bar2 }]} />
              <Animated.View style={[styles.waveBar, { height: bar3 }]} />
              <Animated.View style={[styles.waveBar, { height: bar2 }]} />
              <Animated.View style={[styles.waveBar, { height: bar1 }]} />
              <Animated.View style={[styles.waveBar, { height: bar3 }]} />
              <Animated.View style={[styles.waveBar, { height: bar2 }]} />
              <Animated.View style={[styles.waveBar, { height: bar1 }]} />
            </View>
            <Text style={styles.recordingTitle}>{noteTitle}</Text>
          </View>
        )}

        {/* Title Modal */}
        <Modal
          visible={showTitleModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTitleModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Note Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter note title..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                value={tempTitle}
                onChangeText={(text) => setTempTitle(toTitleCase(text))}
                autoFocus={true}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalCancelButton,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={() => {
                    setShowTitleModal(false);
                    setTempTitle("");
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalConfirmButton,
                    !tempTitle.trim() && styles.modalButtonDisabled,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={startRecording}
                  disabled={!tempTitle.trim()}
                >
                  <Text style={styles.modalConfirmText}>Start Recording</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Voice notes list */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your Notes</Text>
          <Text style={styles.listCount}>{filteredNotes.length}</Text>
        </View>
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.note}>
              <View style={styles.noteIconContainer}>
                <Ionicons
                  name="musical-notes"
                  size={24}
                  color="#3B82F6"
                />
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {playingUri === item.uri && (
                  <View style={styles.playbackWaveContainer}>
                    <Animated.View style={[styles.playbackWaveBar, { height: playBar1 }]} />
                    <Animated.View style={[styles.playbackWaveBar, { height: playBar2 }]} />
                    <Animated.View style={[styles.playbackWaveBar, { height: playBar3 }]} />
                    <Animated.View style={[styles.playbackWaveBar, { height: playBar4 }]} />
                    <Animated.View style={[styles.playbackWaveBar, { height: playBar5 }]} />
                  </View>
                )}
                <View style={styles.noteMetaRow}>
                  <Text style={styles.noteMeta}>
                    {Math.floor(item.duration / 60)}:
                    {(item.duration % 60).toString().padStart(2, "0")}
                  </Text>
                  <Text style={styles.noteDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.noteActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.playButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => playVoiceNote(item.uri)}
                >
                  <Ionicons
                    name={playingUri === item.uri ? "pause" : "play"}
                    size={20}
                    color="#3B82F6"
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
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#EF4444"
                  />
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="mic-outline"
                  size={40}
                  color="#9CA3AF"
                />
              </View>
              <Text style={styles.emptyText}>No voice notes yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first recording below
              </Text>
            </View>
          }
        />

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.recordButton,
              recording && styles.recordButtonActive,
              pressed && styles.recordButtonPressed,
            ]}
            onPress={handleRecordPress}
          >
            <Ionicons
              name={recording ? "stop-circle" : "mic"}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.recordButtonText}>
              {recording ? "Stop" : "Record"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#E8F0FE",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerSection: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1A1F36",
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  search: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1A1F36",
    fontWeight: "500",
  },
  recordingIndicator: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1F36",
    textAlign: "center",
    marginTop: 12,
  },
  recordButtonContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#3B82F6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  recordButtonActive: {
    backgroundColor: "#000000",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1F36",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1A1F36",
    fontWeight: "500",
    minHeight: 56,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  modalConfirmButton: {
    backgroundColor: "#3B82F6",
  },
  modalButtonDisabled: {
    backgroundColor: "#D1D5DB",
    opacity: 0.6,
  },
  modalButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recordButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  waveContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 6,
    paddingVertical: 12,
  },
  waveBar: {
    width: 5,
    backgroundColor: "#0066FF",
    borderRadius: 3,
    minHeight: 8,
  },
  playbackWaveContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: 8,
    marginBottom: 8,
    height: 28,
  },
  playbackWaveBar: {
    width: 3,
    backgroundColor: "#0066FF",
    borderRadius: 2,
    minHeight: 8,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1F36",
    letterSpacing: -0.3,
  },
  listCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listContent: {
    paddingBottom: 8,
  },
  note: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  noteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  noteContent: {
    flex: 1,
    minWidth: 0,
  },
  noteTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: "#1A1F36",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  noteMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noteMeta: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  noteDate: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  noteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  playButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  actionButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1F36",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
});
