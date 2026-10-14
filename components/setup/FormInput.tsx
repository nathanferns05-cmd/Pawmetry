import { StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
};

export default function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: Props) {
  return (
    <View style={styles.container}>
     {label !== "" && (
  <Text style={styles.label}>
    {label}
  </Text>
)}

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9E7E68"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 18,
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B2B1A",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E7D8CC",
    padding: 15,
    fontSize: 16,
    color: "#2D160B",
  },
});