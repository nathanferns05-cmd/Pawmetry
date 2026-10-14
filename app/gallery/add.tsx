import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
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
        <Pressable onPress={() => router.back()} disabled={uploading}>
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Add Photo</Text>
          <Text style={styles.subtitle}>
            Add a new memory to your pet's gallery
          </Text>
        </View>
      </View>

      {/* Pet selector */}
      {pets.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.label}>Select Pet</Text>

          <View style={styles.petList}>
            {pets.map((pet) => {
              const selected = selectedPet?.id === pet.id;

              return (
                <Pressable
                  key={pet.id}
                  style={[
                    styles.petButton,
                    selected && styles.petButtonSelected,
                  ]}
                  onPress={() => setSelectedPet(pet)}
                  disabled={uploading}
                >
                  <Text
                    style={[
                      styles.petButtonText,
                      selected && styles.petButtonTextSelected,
                    ]}
                  >
                    {pet.petName || "Pet"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Photo */}
      <Pressable
        style={styles.photoContainer}
        onPress={pickImage}
        disabled={uploading}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.camera}>📷</Text>

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

      {error !== "" && <Text style={styles.error}>{error}</Text>}

      {/* Upload button */}
      <Pressable
        style={[styles.uploadButton, uploading && styles.disabledButton]}
        onPress={handleUpload}
        disabled={uploading}
      >
        <Text style={styles.uploadButtonText}>
          {uploading ? "Uploading..." : "Add Photo"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5ECE3",
    paddingTop: 55,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  back: {
    fontSize: 42,
    color: "#7A4E35",
    marginRight: 12,
    lineHeight: 42,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#4A2E20",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#8C6B58",
  },

  section: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A2E20",
    marginBottom: 10,
  },

  petList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  petButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#E7D7C8",
  },

  petButtonSelected: {
    backgroundColor: "#7A4E35",
  },

  petButtonText: {
    color: "#6B4A37",
    fontWeight: "600",
  },

  petButtonTextSelected: {
    color: "#FFFFFF",
  },

  photoContainer: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 340,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#E7D7C8",
    borderWidth: 1,
    borderColor: "#D7C3B2",
  },

  preview: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  camera: {
    fontSize: 50,
    marginBottom: 15,
  },

  placeholderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A2E20",
    marginBottom: 7,
  },

  placeholderText: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#8C6B58",
  },

  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(74, 46, 32, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  uploadText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },

  error: {
    color: "#B3261E",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },

  uploadButton: {
    backgroundColor: "#7A4E35",
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
