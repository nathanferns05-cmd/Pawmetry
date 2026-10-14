import { useRouter } from "expo-router";
import { reload, sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";

import CustomButton from "../components/CustomButton";
import { auth } from "../config/firebaseConfig";

export default function VerifyEmail() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const checkVerification = async () => {
    if (!auth.currentUser) {
      router.replace("/login");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await reload(auth.currentUser);

      if (auth.currentUser.emailVerified) {
        router.replace("/setup");
      } else {
        setError(
          "Please verify your email using the link sent to your inbox."
        );
      }
    } catch (error: any) {
      switch (error.code) {
        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many attempts. Please try again later."
          );
          break;

        default:
          setError(
            "Unable to check your email verification. Please try again."
          );
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await sendEmailVerification(auth.currentUser);

      setMessage(
        "A new verification email has been sent to your email address."
      );
    } catch (error: any) {
      switch (error.code) {
        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many verification emails have been requested. Please try again later."
          );
          break;

        default:
          setError(
            "Unable to send the verification email. Please try again."
          );
          break;
      }
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.5 }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>

        <Text style={styles.message}>
          We've sent a verification link to your email address.
        </Text>

        <Text style={styles.message}>
          Please verify your email before continuing with your Pawmetry setup.
        </Text>

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {message ? (
          <Text style={styles.successText}>
            {message}
          </Text>
        ) : null}

        <CustomButton
          title={loading ? "Checking..." : "I've Verified My Email"}
          onPress={checkVerification}
          fontSize={18}
        />

        <Text style={styles.resend} onPress={resendVerification}>
          Didn't receive the email? Resend
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFF8F2",
  },

  content: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4A2D1F",
    textAlign: "center",
    marginBottom: 20,
  },

  message: {
    fontSize: 16,
    color: "#6B4A3A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 15,
  },

  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },

  successText: {
    color: "green",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },

  resend: {
    color: "#4A2D1F",
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});