import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  deletePetPhoto,
  getPetPhotos,
  getUserPets,
} from "../../services/userService";

type Pet = {
  id: string;
  petName?: string;
};

type PetPhoto = {
  id: string;
  url?: string;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function GalleryScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [pet, setPet] = useState<Pet | null>(null);
  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reload whenever the tab is shown, so newly added photos appear.
  useFocusEffect(
    useCallback(() => {
      loadGallery();
    }, [])
  );

  useEffect(() => {
    if (photos.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % photos.length;

        scrollRef.current?.scrollTo({
          x: next * SCREEN_WIDTH,
          animated: true,
        });

        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [photos.length]);

  async function loadGallery() {
    try {
      const pets = await getUserPets();

      if (!pets.length) return;

      const selectedPet = pets[0] as Pet;
      setPet(selectedPet);

      const petPhotos = await getPetPhotos(selectedPet.id);
      setPhotos(petPhotos as PetPhoto[]);
    } catch (error) {
      console.log("Failed to load gallery:", error);
    }
  }

  function handleDeletePhoto(photo: PetPhoto) {
    if (!pet || deletingId) return;

    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo from the gallery?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingId(photo.id);

            try {
              await deletePetPhoto(pet.id, photo.id);

              const remaining = photos.filter(
                (item) => item.id !== photo.id
              );
              const nextIndex = Math.min(
                activeIndex,
                Math.max(remaining.length - 1, 0)
              );

              setPhotos(remaining);
              setActiveIndex(nextIndex);

              scrollRef.current?.scrollTo({
                x: nextIndex * SCREEN_WIDTH,
                animated: false,
              });
            } catch (error) {
              console.log("Failed to remove photo:", error);
              Alert.alert(
                "Error",
                "Unable to remove this photo. Please try again."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }

  function handleScroll(event: any) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>MEMORIES</Text>
          <Text style={styles.title}>
            {pet?.petName || "Pet"}'s Gallery
          </Text>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={() => router.push("/gallery/add")}
        >
          <Plus size={21} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>
      </View>

      {photos.length > 0 ? (
        <>
          {/* FULL-SCREEN CAROUSEL */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.carousel}
          >
            {photos.map((photo, index) => (
              <View key={photo.id} style={styles.slide}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.fullPhoto}
                  resizeMode="contain"
                />

                <View style={styles.photoNumber}>
                  <Text style={styles.photoNumberText}>
                    {index + 1} / {photos.length}
                  </Text>
                </View>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(photo)}
                  disabled={deletingId !== null}
                  accessibilityLabel="Remove photo"
                >
                  {deletingId === photo.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Trash2 size={18} color="#FFFFFF" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {/* CONTROLS */}
          {photos.length > 1 && (
            <View style={styles.controls}>
              <Pressable
                style={styles.arrowButton}
                onPress={() => {
                  const previous =
                    activeIndex === 0
                      ? photos.length - 1
                      : activeIndex - 1;

                  setActiveIndex(previous);

                  scrollRef.current?.scrollTo({
                    x: previous * SCREEN_WIDTH,
                    animated: true,
                  });
                }}
              >
                <ChevronLeft size={21} color="#4A2D1F" strokeWidth={2} />
              </Pressable>

              <View style={styles.dots}>
                {photos.map((photo, index) => (
                  <View
                    key={photo.id}
                    style={[
                      styles.dot,
                      index === activeIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>

              <Pressable
                style={styles.arrowButton}
                onPress={() => {
                  const next = (activeIndex + 1) % photos.length;

                  setActiveIndex(next);

                  scrollRef.current?.scrollTo({
                    x: next * SCREEN_WIDTH,
                    animated: true,
                  });
                }}
              >
                <ChevronRight size={21} color="#4A2D1F" strokeWidth={2} />
              </Pressable>
            </View>
          )}

          <View style={styles.autoPlay}>
            <View style={styles.autoPlayDot} />
            <Text style={styles.autoPlayText}>
              Photos change automatically every 5 seconds
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyCircle}>
            <Plus size={31} color="#8A6A55" strokeWidth={1.7} />
          </View>

          <Text style={styles.emptyTitle}>No memories yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first photo of {pet?.petName || "your pet"}.
          </Text>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/gallery/add")}
          >
            <Plus size={18} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.addButtonText}>Add Photo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#241A15",
  },

  topBar: {
    height: 92,
    paddingTop: 43,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#241A15",
    zIndex: 2,
  },

  backButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#8A6047",
    alignItems: "center",
    justifyContent: "center",
  },

  titleWrap: {
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: "#CDB9AA",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },

  carousel: {
    flex: 1,
  },

  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 92,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#241A15",
  },

  fullPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 145,
  },

  photoNumber: {
    position: "absolute",
    right: 18,
    bottom: 25,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  photoNumberText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  deleteButton: {
    position: "absolute",
    top: 16,
    right: 18,
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "rgba(183,93,69,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },

  controls: {
    position: "absolute",
    bottom: 52,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  arrowButton: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#FFF8F2",
    alignItems: "center",
    justifyContent: "center",
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#8E7A6E",
  },

  activeDot: {
    width: 17,
    backgroundColor: "#FFFFFF",
  },

  autoPlay: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },

  autoPlayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#8A6047",
    marginRight: 6,
  },

  autoPlayText: {
    fontSize: 9,
    color: "#B9A79C",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F2E7DE",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 15,
  },

  emptySubtitle: {
    fontSize: 12,
    color: "#B9A79C",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 18,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8A6047",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 20,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },
});
