
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  BackHandler,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";

export default function AdminLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      setChecking(true);
      setAuthorized(false);

      if (!user) {
        router.replace("/login");
        setChecking(false);
        return;
      }

      try {
        const token = await getIdTokenResult(user, true);

        if (!active) return;

        if (!user.emailVerified) {
          router.replace("/verify-email");
          return;
        }

        if (token.claims.admin === true) {
          setAuthorized(true);
        } else {
          router.replace("/(tabs)/home");
        }
      } catch {
        router.replace("/(tabs)/home");
      } finally {
        if (active) setChecking(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => true
      );

      return () => subscription.remove();
    }, [])
  );

  if (checking || !authorized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f5ece3",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#795548" />
        <Text style={{ marginTop: 12, color: "#5d4037" }}>
          Verifying administrator access...
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="users" />
      <Stack.Screen name="pets" />
      <Stack.Screen name="medications" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}
