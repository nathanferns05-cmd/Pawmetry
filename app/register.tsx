import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react-native";

import { useState } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import CustomButton from "../components/CustomButton";
import { auth } from "../config/firebaseConfig";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isStrongPassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const handleRegister = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    // Strong password validation
    const strongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password);

    if (!strongPassword) {
      setError("Please create a strong password.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await sendEmailVerification(userCredential.user);

      router.replace("/verify-email");
    } catch (error: any) {
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("This email is already registered.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;

        case "auth/operation-not-allowed":
          setError("Email registration is currently unavailable.");
          break;

        default:
          setError("Something went wrong. Please try again.");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.5 }}
    >
      <Text style={styles.title}>
        Join Our Pet Care Community Let's Get Started!
      </Text>

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
          textContentType="newPassword"
          autoComplete="password-new"
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

      <Text style={styles.passwordRequirements}>
        {password.length === 0
          ? ""
          : !/.{8,}/.test(password)
            ? "• At least 8 characters"
            : !/[A-Z]/.test(password)
              ? "• One uppercase letter"
              : !/[a-z]/.test(password)
                ? "• One lowercase letter"
                : !/[0-9]/.test(password)
                  ? "• One number"
                  : !/[^A-Za-z0-9]/.test(password)
                    ? "• One special character"
                    : ""}
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <CustomButton
        title={loading ? "Creating account..." : "Register"}
        onPress={handleRegister}
      />

      <Text style={styles.link} onPress={() => router.push("/login")}>
        Already have an account? Log in
      </Text>
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
  passwordRequirements: {
    color: "red",
    fontSize: 13,
    marginTop: -10,
    marginBottom: 15,
  },
  errorText: {
    color: "red",
    fontSize: 13,
    marginBottom: 15,
  },
  link: {
    color: "#4A2D1F",
    textAlign: "center",
    marginTop: 16,
    textDecorationLine: "underline",
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
