import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline";
  fontSize?: number;
};

export default function CustomButton({
  title,
  onPress,
  variant = "filled",
  fontSize = 28,
}: Props) {
  const isFilled = variant === "filled";

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(255,255,255,0.15)" }}
      style={({ pressed }) => [
        styles.button,
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
      ]}
    >
      <View style={styles.container}>
        <Image
          source={
            isFilled
              ? require("../assets/images/bone-brown.png")
              : require("../assets/images/bone-cream.png")
          }
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.textOverlay}>
          <Text
            style={[
              styles.text,
              isFilled ? styles.filledText : styles.outlineText,
              { fontSize },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    alignItems: "center",
  },

  container: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.45,
    shadowRadius: 10,

    elevation: 10,
  },

  image: {
    width: "118%",
    height: 125,
  },

  textOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontWeight: "900",
    textAlign: "center",
    includeFontPadding: false,
    marginTop: -2,
  },

  filledText: {
    color: "#FFFFFF",
    textShadowColor: "#0B0401",
    textShadowOffset: { width: 1.5, height: 2.5 },
    textShadowRadius: 9,
  },

  outlineText: {
    color: "#30180D",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 7,
  },
});
