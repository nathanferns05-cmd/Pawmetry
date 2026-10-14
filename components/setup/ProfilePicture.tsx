import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  onImageSelected: (uri: string) => void;
};

export default function ProfilePicture({
  onImageSelected,
}: Props) {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      onImageSelected(uri);
    }
  };

  return (
    <Pressable onPress={pickImage} style={styles.container}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.camera}>📷</Text>
          <Text style={styles.text}>Add Photo</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginBottom: 35,
  },

  image: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F7EFE8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D6B89A",
    borderStyle: "dashed",
  },

  camera: {
    fontSize: 40,
  },

  text: {
    marginTop: 10,
    color: "#7A5A46",
    fontWeight: "600",
  },
});