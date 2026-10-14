
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Pill,
  PawPrint,
  UserRound,
} from "lucide-react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const GREEN = "#4D7C6B";
const GREEN_LIGHT = "#E8F0EB";
const CREAM = "#F5ECE3";
const BROWN = "#A1816D";
const DARK = "#3D5148";
const MUTED = "#81776F";
const BORDER = "#E9DDD4";

type MedicationRecord = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  startDate: string;
  endDate: string;
  notes: string;
  active: boolean;
  petName: string;
  species: string;
  ownerName: string;
  ownerEmail: string;
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === "object" && "toDate" in value) {
    const timestamp = value as { toDate: () => Date };

    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString();
    }
  }

  return "Not specified";
}

function getText(value: unknown, fallback = "Not specified"): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

export default function AdminMedications() {
  const router = useRouter();

  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadMedications = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const results: MedicationRecord[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();

        const petsSnapshot = await getDocs(
          collection(db, "users", userDoc.id, "pets")
        );

        for (const petDoc of petsSnapshot.docs) {
          const pet = petDoc.data();

          const medicationSnapshot = await getDocs(
            collection(
              db,
              "users",
              userDoc.id,
              "pets",
              petDoc.id,
              "medications"
            )
          );

          for (const medicationDoc of medicationSnapshot.docs) {
            const medication = medicationDoc.data();

            results.push({
              id: `${userDoc.id}_${petDoc.id}_${medicationDoc.id}`,
              name: getText(medication.name, "Unnamed medication"),
              dosage: displayValue(medication.dosage),
              frequency: displayValue(medication.frequency),
              time: displayValue(medication.time),
              startDate: displayValue(medication.startDate),
              endDate: displayValue(medication.endDate),
              notes: getText(medication.notes, ""),
              active: medication.active === true,
              petName: getText(pet.petName, "Unnamed pet"),
              species: getText(pet.species, "Pet"),
              ownerName: getText(user.fullName, "Unknown owner"),
              ownerEmail: getText(user.email, ""),
            });
          }
        }
      }

      setMedications(results);
    } catch (err) {
      console.error("Failed to load medications:", err);
      setError(
        "Couldn't load medication records. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadMedications(true);
    }, [loadMedications])
  );

  const activeCount = medications.filter((item) => item.active).length;

  return (
    <ImageBackground
      source={require("../../assets/images/Login_bg.jpg")}
      style={styles.background}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to admin dashboard"
            onPress={() => router.replace("/admin")}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={21} color={GREEN} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Medications</Text>
            <Text style={styles.headerSubtitle}>
              Pet medication records
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Pill size={22} color={GREEN} />
          </View>
        </View>

        <FlatList
          style={styles.list}
          data={medications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadMedications(false)}
              tintColor={GREEN}
              colors={[GREEN]}
            />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.intro}>
                <Text style={styles.greeting}>Health overview</Text>
                <Text style={styles.heading}>Medication records</Text>
                <Text style={styles.subtitle}>
                  Review prescribed medication details across registered pets.
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Pill size={20} color={GREEN} />
                  </View>
                  <Text style={styles.summaryNumber}>
                    {medications.length}
                  </Text>
                  <Text style={styles.summaryLabel}>Total records</Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <Clock3 size={20} color={GREEN} />
                  </View>
                  <Text style={styles.summaryNumber}>{activeCount}</Text>
                  <Text style={styles.summaryLabel}>Active records</Text>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>All medications</Text>
                <Text style={styles.sectionCount}>
                  {medications.length} records
                </Text>
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={GREEN} />
                <Text style={styles.stateText}>
                  Loading medication records...
                </Text>
              </View>
            ) : !error ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Pill size={30} color={GREEN} />
                </View>
                <Text style={styles.emptyTitle}>No medications yet</Text>
                <Text style={styles.emptyText}>
                  Medication records will appear here when they are added for
                  registered pets.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.medicationCard}>
              <View style={styles.cardTop}>
                <View style={styles.medicationIcon}>
                  <Pill size={22} color={GREEN} />
                </View>

                <View style={styles.medicationHeading}>
                  <Text style={styles.medicationName}>{item.name}</Text>
                  <Text style={styles.dosage}>{item.dosage}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.active ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.active ? styles.activeText : styles.inactiveText,
                    ]}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Clock3 size={16} color={BROWN} />
                <Text style={styles.detailLabel}>Frequency</Text>
                <Text style={styles.detailValue}>{item.frequency}</Text>
              </View>

              <View style={styles.detailRow}>
                <Clock3 size={16} color={BROWN} />
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{item.time}</Text>
              </View>

              <View style={styles.detailRow}>
                <CalendarDays size={16} color={BROWN} />
                <Text style={styles.detailLabel}>Start date</Text>
                <Text style={styles.detailValue}>{item.startDate}</Text>
              </View>

              <View style={styles.detailRow}>
                <CalendarDays size={16} color={BROWN} />
                <Text style={styles.detailLabel}>End date</Text>
                <Text style={styles.detailValue}>{item.endDate}</Text>
              </View>

              <View style={styles.petSection}>
                <View style={styles.petIcon}>
                  <PawPrint size={18} color={GREEN} />
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{item.petName}</Text>
                  <Text style={styles.petSpecies}>{item.species}</Text>
                </View>
              </View>

              <View style={styles.ownerSection}>
                <UserRound size={16} color={BROWN} />
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>{item.ownerName}</Text>
                  {item.ownerEmail ? (
                    <Text style={styles.ownerEmail}>{item.ownerEmail}</Text>
                  ) : null}
                </View>
              </View>

              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: CREAM,
  },
  backgroundImage: {
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: DARK,
    fontSize: 19,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  intro: {
    marginBottom: 20,
  },
  greeting: {
    color: GREEN,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  heading: {
    color: DARK,
    fontSize: 25,
    fontWeight: "800",
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 27,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryNumber: {
    color: DARK,
    fontSize: 26,
    fontWeight: "800",
  },
  summaryLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionCount: {
    color: MUTED,
    fontSize: 11,
  },
  errorText: {
    color: "#B42318",
    backgroundColor: "#FCE9E7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    lineHeight: 19,
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },
  stateText: {
    color: MUTED,
    fontSize: 13,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "800",
  },
  emptyText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  medicationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  medicationIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  medicationHeading: {
    flex: 1,
  },
  medicationName: {
    color: DARK,
    fontSize: 16,
    fontWeight: "800",
  },
  dosage: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: GREEN_LIGHT,
  },
  inactiveBadge: {
    backgroundColor: "#F0EAE5",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  activeText: {
    color: GREEN,
  },
  inactiveText: {
    color: MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 9,
  },
  detailLabel: {
    color: MUTED,
    fontSize: 12,
    flex: 1,
  },
  detailValue: {
    color: DARK,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  petSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CREAM,
    borderRadius: 13,
    padding: 12,
    marginTop: 5,
  },
  petIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    color: DARK,
    fontSize: 13,
    fontWeight: "800",
  },
  petSpecies: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },
  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 14,
    paddingHorizontal: 3,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    color: DARK,
    fontSize: 12,
    fontWeight: "700",
  },
  ownerEmail: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },
  notesBox: {
    marginTop: 13,
    backgroundColor: "#F8F5F1",
    padding: 12,
    borderRadius: 12,
  },
  notesLabel: {
    color: DARK,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 5,
  },
  notesText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
});
