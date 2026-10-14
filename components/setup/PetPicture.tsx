import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { uploadImageToCloudinary } from "../../utils/cloudinary";

type Props = {
  onImageSelected: (uri: string) => void;
};

export default function PetPicture({ onImageSelected }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Please allow gallery access to upload a pet photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const localUri = result.assets[0].uri;

    setImage(localUri);
    setUploading(true);

    try {
      const uploaded = await uploadImageToCloudinary(localUri);

      console.log("Cloudinary pet photo:", uploaded);

      // Send the Cloudinary URL to setup.tsx
      onImageSelected(uploaded.url);
   } catch (error) {
  console.log("========== CLOUDINARY UPLOAD ERROR ==========");
  console.log(error);
  console.log("==============================================");

  setImage(null);

  alert(
    error instanceof Error
      ? error.message
      : "Unable to upload the pet photo."
  );
}finally {
      setUploading(false);
    }
  };

  return (
    <Pressable
      style={styles.container}
      onPress={pickImage}
      disabled={uploading}
    >
      {image ? (
        <View>
          <Image source={{ uri: image }} style={styles.image} />

          {uploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.icon}>🐶</Text>
          <Text style={styles.text}>Add Pet Photo</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginBottom: 30,
  },

  image: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  loadingOverlay: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F7EFE8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D6B89A",
  },

  icon: {
    fontSize: 42,
  },

  text: {
    marginTop: 8,
    color: "#7A5A46",
    fontWeight: "600",
  },
});