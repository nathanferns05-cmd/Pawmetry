import { StyleSheet, Text, View } from "react-native";

export default function Logo() {
  return (
    <View style={styles.container}>
      <Text style={styles.paw}>🐾</Text>
      <Text style={styles.title}>Pawmetry</Text>
      <Text style={styles.subtitle}>Your Pet's Health Companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 40,
  },

  paw: {
    fontSize: 70,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#2E7D5B",
    marginTop: 10,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#64748B",
  },
});
