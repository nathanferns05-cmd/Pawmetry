import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor: "#f5ece3",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="register"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />

        <Stack.Screen
          name="setup"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen
          name="verify-email"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="medication/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="medication/add"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />

        <Stack.Screen
  name="admin"
  options={{
    headerShown: false,
    gestureEnabled: false,
  }}
/>

        <Stack.Screen
          name="symptom-checker/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="gallery/add"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Modal",
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}