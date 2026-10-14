import { useRouter } from "expo-router";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  getIdTokenResult,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomButton from "../components/CustomButton";
import { auth } from "../config/firebaseConfig";
import { userProfileExists } from "../services/userService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  
const handleLogin = async () => {
  if (loading) return;

  setError("");

  if (!email.trim() || !password) {
    setError("Please enter your email and password.");
    return;
  }

  setLoading(true);

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const user = credential.user;

    if (rememberMe) {
      await AsyncStorage.setItem("rememberMe", "true");
    } else {
      await AsyncStorage.removeItem("rememberMe");
    }

    // Ensure the latest custom claims are loaded.
    const tokenResult = await getIdTokenResult(user, true);

    // Email verification is required for admin access.
    if (!user.emailVerified) {
      router.replace("/verify-email");
      return;
    }

    // Send administrators directly to the admin dashboard.
    if (tokenResult.claims.admin === true) {
      router.replace("/admin");
      return;
    }

    // Preserve the existing normal-user flow.
    const profileExists = await userProfileExists();

    if (profileExists) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/setup");
    }
  } catch (error: any) {
    console.log("LOGIN ERROR:", error);
    console.log("LOGIN ERROR CODE:", error?.code);

    setError(
      error?.code
        ? `${error.code}: ${error.message}`
        : "Unable to log in. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  const handleForgotPassword = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setError(
        "If an account exists with this email, a password reset link has been sent.",
      );
    } catch (error: any) {
      console.log("PASSWORD RESET ERROR:", error);

      switch (error.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;

        case "auth/too-many-requests":
          setError("Too many requests. Please try again later.");
          break;

        default:
          setError(
            "If an account exists with this email, a password reset link has been sent.",
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
      <Text style={styles.title}>Good To See you Again!</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8A6A5A"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="username"
        autoComplete="email"
        importantForAutofill="yes"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError("");
        }}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#8A6A5A"
          secureTextEntry={!showPassword}
          textContentType="password"
          autoComplete="password"
          importantForAutofill="yes"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError("");
          }}
        />

        <Pressable
          style={styles.eyeButton}
          onPress={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? (
            <EyeOff size={22} color="#8A6A5A" />
          ) : (
            <Eye size={22} color="#8A6A5A" />
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.optionsContainer}>
        <View style={styles.rememberContainer}>
          <Switch value={rememberMe} onValueChange={setRememberMe} />

          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        <Pressable onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </Pressable>
      </View>

      <CustomButton
        title={loading ? "Logging in..." : "Log In"}
        onPress={handleLogin}
      />

      <Pressable onPress={() => router.push("/register")}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </Pressable>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#4A2D1F",
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#D8C3B5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    color: "#2D160B",
  },

  errorText: {
    color: "red",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 15,
  },

  forgotPassword: {
    color: "#8B5E3C",
    fontWeight: "600",
  },

  link: {
    color: "#4A2D1F",
    textAlign: "center",
    marginTop: 20,
    textDecorationLine: "underline",
  },

  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  rememberText: {
    fontSize: 15,
    color: "#4A2D1F",
    marginLeft: 8,
    fontWeight: "600",
  },

  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  passwordContainer: {
    position: "relative",
    marginBottom: 16,
  },

  passwordInput: {
    borderWidth: 1,
    borderColor: "#D8C3B5",
    borderRadius: 10,
    padding: 12,
    paddingRight: 48,
    backgroundColor: "#FFFFFF",
    color: "#2D160B",
  },

  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
});
