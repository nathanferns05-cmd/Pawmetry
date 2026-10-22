import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import CustomButton from "../components/CustomButton";
import { getSignedInRoute } from "../services/authRouting";

export default function WelcomeScreen() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Only check the saved session once, when the app opens.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      try {
        if (user) {
          const rememberMe = await AsyncStorage.getItem("rememberMe");

          if (rememberMe === "true") {
            router.replace(await getSignedInRoute(user));
            return;
          }

          // "Remember me" was off: start a fresh session.
          await signOut(auth);
        }
      } catch (error) {
        console.log("Unable to restore session:", error);
      }

      setCheckingSession(false);
    });

    return unsubscribe;
  }, [router]);

  if (checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#9C532B" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/welcome-bg.jpg")}
      style={styles.background}
      resizeMode="cover"
      imageStyle={{ opacity: 0.7 }}
    >
      <BlurView
        intensity={50}
        tint='light'
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Top Section: Logo & Subtitle */}
          <View style={styles.logoGroupContainer}>
            {/* Multi-layered Deep Shadow Wrapper */}
            <View style={styles.logoWrapper}>
              {/* Soft Outer Blur Shadow */}
              <Image
                source={require("../assets/images/pawmetry-logo.png")}
                style={[styles.logo, styles.logoOuterShadow]}
                resizeMode="contain"
              />
              {/* Crisp Inner Shadow */}
              <Image
                source={require("../assets/images/pawmetry-logo.png")}
                style={[styles.logo, styles.logoInnerShadow]}
                resizeMode="contain"
              />
              {/* Main Foreground Logo */}
              <Image
                source={require("../assets/images/pawmetry-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

          <View style={styles.subtitleWrapper}>
  <Text style={styles.subtitle}>
    Your Pet's Health Companion
  </Text>
</View>
          </View>

          {/* Bottom Section: Buttons */}
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Log In"
              onPress={() => router.push("/login")}
            />
            <CustomButton
              title="Create Account"
              variant="outline"
              onPress={() => router.push("/register")}
            />
          </View>
        </View>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5ece3",
  },

  overlay: {
    flex: 1,
    
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 20,
  },

  logoGroupContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: -40,
  },

  logoWrapper: {
    width: "100%",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: "100%",
    height: 210,
    position: "absolute",
  },

  // Ambient Drop Shadows for PNG Logo
  logoOuterShadow: {
    tintColor: "#0A0402",
    opacity: 0.6,
    top: 8,
    left: 4,
  },

  logoInnerShadow: {
    tintColor: "#100502",
    opacity: 0.9,
    top: 4,
    left: 2,
  },

subtitleWrapper: {
  alignItems: "center",
  justifyContent: "center",
},

subtitle: {
  fontSize: 24,
  fontWeight: "800",
  color: "#9C532B",
  textAlign: "center",
  marginTop: 10,
  letterSpacing: 0.4,

  textShadowColor: "rgba(24, 23, 23, 0.85)",
  textShadowOffset: {
    width: 1,
    height: 2,
  },
  textShadowRadius: 2,
},


  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 14, // Balanced spacing so buttons don't clip into each other
  },
});