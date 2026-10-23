import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { addPetPhoto, getUserPets } from "../../services/userService";
import { uploadImageToCloudinary } from "../../utils/cloudinary";

type Pet = {
  id: string;
  petName?: string;
};

export default function AddGalleryPhoto() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const userPets = (await getUserPets()) as Pet[];

      setPets(userPets);

      if (params.petId) {
        const matchingPet = userPets.find((pet) => pet.id === params.petId);

        if (matchingPet) {
          setSelectedPet(matchingPet);
          return;
        }
      }

      if (userPets.length > 0) {
        setSelectedPet(userPets[0]);
      }
    } catch (error) {
      console.log("Unable to load pets:", error);
      setError("Unable to load your pets.");
    }
  };

  const pickImage = async () => {
    setError("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Please allow gallery access to choose a pet photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) return;

    setImage(result.assets[0].uri);
  };

  const handleUpload = async () => {
    setError("");

    if (!selectedPet) {
      setError("Please select a pet.");
      return;
    }

    if (!image) {
      setError("Please choose a photo first.");
      return;
    }

    setUploading(true);

    try {
      const uploaded = await uploadImageToCloudinary(image);

      await addPetPhoto(selectedPet.id, {
        url: uploaded.url,
        publicId: uploaded.publicId,
      });

      router.back();
    } catch (error) {
      console.log("Gallery upload failed:", error);

      setError("Unable to upload the photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={uploading}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>📷</Text>
          </View>

          <View>
            <Text style={styles.title}>Add Photo</Text>

            <Text style={styles.subtitle}>
              Add a new memory to the gallery
            </Text>
          </View>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Pet Selection */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconGreen}>
              <Text style={styles.sectionIconText}>🐾</Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>Pet</Text>

              <Text style={styles.sectionSubtitle}>
                Whose gallery is this photo for?
              </Text>
            </View>
          </View>

          {pets.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petList}
            >
              {pets.map((pet) => {
                const selected = selectedPet?.id === pet.id;

                return (
                  <Pressable
                    key={pet.id}
                    style={[
                      styles.petButton,
                      selected && styles.selectedPetButton,
                    ]}
                    onPress={() => setSelectedPet(pet)}
                    disabled={uploading}
                  >
                    <Text
                      style={[
                        styles.petButtonText,
                        selected && styles.selectedPetButtonText,
                      ]}
                    >
                      {pet.petName || "Pet"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {pets.length === 1 && selectedPet && (
            <View style={styles.selectedPetCard}>
              <View style={styles.petAvatar}>
                <Text style={styles.petAvatarText}>🐾</Text>
              </View>

              <View style={styles.petInfoText}>
                <Text style={styles.petInfoLabel}>Photo for</Text>

                <Text style={styles.petInfoName}>
                  {selectedPet.petName || "Your pet"}
                </Text>
              </View>

              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
          )}
        </View>

        {/* Photo */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBrown}>
              <Text style={styles.sectionIconText}>🖼️</Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>Photo</Text>

              <Text style={styles.sectionSubtitle}>
                Choose a picture from your phone
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.photoContainer,
              !image && styles.photoContainerEmpty,
            ]}
            onPress={pickImage}
            disabled={uploading}
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.preview} />
            ) : (
              <View style={styles.placeholder}>
                <View style={styles.placeholderIcon}>
                  <Text style={styles.placeholderIconText}>＋</Text>
                </View>

                <Text style={styles.placeholderTitle}>Choose a Photo</Text>

                <Text style={styles.placeholderText}>
                  Tap here to select a photo from your gallery
                </Text>
              </View>
            )}

            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />

                <Text style={styles.uploadText}>Uploading...</Text>
              </View>
            )}
          </Pressable>

          {image && !uploading && (
            <Pressable style={styles.changeButton} onPress={pickImage}>
              <Text style={styles.changeButtonText}>Change Photo</Text>
            </Pressable>
          )}
        </View>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>!</Text>

            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Save */}
        <Pressable
          style={[styles.saveButton, uploading && styles.disabledButton]}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveIcon}>✓</Text>

              <Text style={styles.saveButtonText}>Add Photo</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.bottomHint}>
          You can view and remove photos from the Gallery tab.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3EF",
    paddingTop: 52,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6B4A3A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  back: {
    fontSize: 34,
    color: "#4A2D1F",
    lineHeight: 36,
    marginTop: -3,
  },

  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#8A6047",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    fontSize: 21,
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#3E2A20",
  },

  subtitle: {
    fontSize: 11,
    color: "#907565",
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 45,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDE3DC",
    shadowColor: "#6B4A3A",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionIconGreen: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E6F1EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionIconBrown: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F4E7DE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionIconText: {
    fontSize: 19,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3E2A20",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#927A6B",
    marginTop: 2,
  },

  petList: {
    paddingVertical: 2,
  },

  petButton: {
    backgroundColor: "#F4EEE9",
    borderWidth: 1,
    borderColor: "#E5D9D0",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
    marginRight: 9,
  },

  selectedPetButton: {
    backgroundColor: "#4D7C6B",
    borderColor: "#4D7C6B",
  },

  petButtonText: {
    color: "#6B4A3A",
    fontWeight: "700",
    fontSize: 14,
  },

  selectedPetButtonText: {
    color: "#FFFFFF",
  },

  selectedPetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF6F2",
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
    borderColor: "#D5E7DE",
  },

  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#DCECE5",
    alignItems: "center",
    justifyContent: "center",
  },

  petAvatarText: {
    fontSize: 21,
  },

  petInfoText: {
    flex: 1,
    marginLeft: 12,
  },

  petInfoLabel: {
    color: "#789487",
    fontSize: 11,
    fontWeight: "600",
  },

  petInfoName: {
    color: "#365C4E",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
  },

  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  photoContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FAF7F4",
    borderWidth: 1,
    borderColor: "#E6DCD5",
  },

  photoContainerEmpty: {
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "#D9C7BA",
  },

  preview: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  placeholderIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#F4E7DE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  placeholderIconText: {
    fontSize: 26,
    color: "#8A6047",
    fontWeight: "700",
  },

  placeholderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3E2A20",
    marginBottom: 5,
  },

  placeholderText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#927A6B",
  },

  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(62, 42, 32, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  uploadText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
  },

  changeButton: {
    alignSelf: "center",
    backgroundColor: "#F4EEE9",
    borderWidth: 1,
    borderColor: "#E5D9D0",
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 14,
  },

  changeButtonText: {
    color: "#6B4A3A",
    fontWeight: "700",
    fontSize: 13,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#F3C9C5",
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
  },

  errorIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#C62828",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 23,
    fontWeight: "800",
    marginRight: 9,
  },

  errorText: {
    flex: 1,
    color: "#B3261E",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  saveButton: {
    flexDirection: "row",
    backgroundColor: "#4D7C6B",
    borderRadius: 17,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    shadowColor: "#4D7C6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },

  saveIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 8,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  bottomHint: {
    textAlign: "center",
    color: "#9A8375",
    fontSize: 11,
    marginTop: 13,
    paddingHorizontal: 20,
  },
});
