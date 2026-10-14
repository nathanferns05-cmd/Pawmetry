
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  PawPrint,
  Search,
  UserRound,
  Weight,
  Trash2,
} from "lucide-react-native";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const COLORS = {
  background: "#F5ECE3",
  green: "#4D7C6B",
  greenLight: "#E8F0EB",
  brown: "#A1816D",
  dark: "#3D5148",
  muted: "#81776F",
  border: "#E9DDD4",
  white: "#FFFFFF",
  red: "#B45345",
};

type AdminPet = {
  id: string;
  userId: string;
  petId: string;
  petName: string;
  species: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  vaccinated: boolean;
  microchipped: boolean;
  ownerName: string;
  ownerEmail: string;
};

function getText(value: unknown, fallback = "Not provided"): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function getBoolean(value: unknown): boolean {
  return value === true;
}

export default function AdminPets() {
  const router = useRouter();

  const [pets, setPets] = useState<AdminPet[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allPets: AdminPet[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();

        const petsSnapshot = await getDocs(
          collection(db, "users", userDoc.id, "pets")
        );

        for (const petDoc of petsSnapshot.docs) {
          const petData = petDoc.data();

          allPets.push({
            id: `${userDoc.id}_${petDoc.id}`,
            userId: userDoc.id,
            petId: petDoc.id,
            petName: getText(petData.petName, "Unnamed pet"),
            species: getText(petData.species, "Unknown species"),
            breed: getText(petData.breed),
            gender: getText(petData.gender),
            age: getText(petData.age),
            weight: getText(petData.weight),
            vaccinated: getBoolean(petData.vaccinated),
            microchipped: getBoolean(petData.microchipped),
            ownerName: getText(userData.fullName, "Unknown owner"),
            ownerEmail: getText(userData.email, "No email"),
          });
        }
      }

      allPets.sort((a, b) => a.petName.localeCompare(b.petName));
      setPets(allPets);
    } catch (err) {
      console.error("Failed to load admin pets:", err);
      setError(
        "Unable to load pets. Check your connection and administrator access."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPets();
    }, [loadPets])
  );

  const confirmDeletePet = (pet: AdminPet) => {
    Alert.alert(
      "Delete pet?",
      `Permanently delete ${pet.petName} and its medication and gallery records? The owner's profile will remain.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete pet",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingId(pet.id);

              try {
                const petPath = [
                  "users",
                  pet.userId,
                  "pets",
                  pet.petId,
                ] as const;

                // Delete medication documents.
                const medications = await getDocs(
                  collection(db, ...petPath, "medications")
                );

                for (const medication of medications.docs) {
                  await deleteDoc(medication.ref);
                }

                // Delete gallery documents.
                const gallery = await getDocs(
                  collection(db, ...petPath, "gallery")
                );

                for (const photo of gallery.docs) {
                  await deleteDoc(photo.ref);
                }

                // Delete the pet document last.
                await deleteDoc(doc(db, ...petPath));

                setPets((previous) =>
                  previous.filter((item) => item.id !== pet.id)
                );

                Alert.alert(
                  "Pet deleted",
                  `${pet.petName} was deleted successfully. The owner's profile was kept.`
                );
              } catch (err) {
                console.error("Failed to delete pet:", err);

                Alert.alert(
                  "Deletion incomplete",
                  "Some records may already have been deleted. Refresh the list and check your Firestore permissions before trying again."
                );

                await loadPets(true);
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ]
    );
  };

  const filteredPets = pets.filter((pet) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      pet.petName,
      pet.species,
      pet.breed,
      pet.gender,
      pet.ownerName,
      pet.ownerEmail,
    ].some((value) => value.toLowerCase().includes(query));
  });

  const vaccinatedCount = pets.filter((pet) => pet.vaccinated).length;

  const renderPet = ({ item }: { item: AdminPet }) => (
    <View style={styles.petCard}>
      <View style={styles.petTopRow}>
        <View style={styles.petAvatar}>
          <PawPrint size={23} color={COLORS.green} />
        </View>

        <View style={styles.petMainInfo}>
          <Text style={styles.petName}>{item.petName}</Text>
          <Text style={styles.petSubtitle}>
            {item.species}
            {item.breed !== "Not provided" ? ` · ${item.breed}` : ""}
          </Text>
        </View>

        <View style={styles.genderBadge}>
          <Text style={styles.genderText}>{item.gender}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <UserRound size={16} color={COLORS.brown} />

        <View style={styles.detailTextContainer}>
          <Text style={styles.detailLabel}>Registered owner</Text>
          <Text style={styles.detailValue}>{item.ownerName}</Text>
          <Text style={styles.detailSecondary}>{item.ownerEmail}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoBox}>
          <CalendarDays size={16} color={COLORS.green} />
          <Text style={styles.infoLabel}>Age</Text>
          <Text style={styles.infoValue}>{item.age}</Text>
        </View>

        <View style={styles.infoBox}>
          <Weight size={16} color={COLORS.green} />
          <Text style={styles.infoLabel}>Weight</Text>
          <Text style={styles.infoValue}>{item.weight}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            item.vaccinated ? styles.statusGood : styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.vaccinated
                ? styles.statusGoodText
                : styles.statusPendingText,
            ]}
          >
            {item.vaccinated ? "Vaccinated" : "Not vaccinated"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            item.microchipped ? styles.statusGood : styles.statusPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              item.microchipped
                ? styles.statusGoodText
                : styles.statusPendingText,
            ]}
          >
            {item.microchipped ? "Microchipped" : "Not microchipped"}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.petName}`}
        disabled={deletingId !== null}
        onPress={() => confirmDeletePet(item)}
        style={({ pressed }) => [
          styles.deletePetButton,
          pressed && styles.buttonPressed,
          deletingId !== null && styles.buttonDisabled,
        ]}
      >
        {deletingId === item.id ? (
          <ActivityIndicator size="small" color={COLORS.red} />
        ) : (
          <Trash2 size={17} color={COLORS.red} />
        )}

        <Text style={styles.deletePetText}>
          {deletingId === item.id ? "Deleting..." : "Delete pet"}
        </Text>
      </Pressable>
    </View>
  );

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
            style={styles.backButton}
            onPress={() => router.replace("/admin")}
            accessibilityRole="button"
            accessibilityLabel="Back to admin dashboard"
          >
            <ArrowLeft size={21} color={COLORS.green} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Registered Pets</Text>
            <Text style={styles.headerSubtitle}>
              View and manage pets registered on Pawmetry
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <PawPrint size={23} color={COLORS.green} />
            </View>

            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Total registered pets</Text>
              <Text style={styles.summaryNumber}>{pets.length}</Text>
            </View>

            <View style={styles.summaryRight}>
              <Text style={styles.summaryVaccinated}>{vaccinatedCount}</Text>
              <Text style={styles.summarySmall}>Vaccinated</Text>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Search size={19} color={COLORS.muted} />

            <TextInput
              style={styles.searchInput}
              placeholder="Search pets, breed, or owner..."
              placeholderTextColor="#A49A92"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Pets</Text>

            <Text style={styles.resultCount}>
              {filteredPets.length}{" "}
              {filteredPets.length === 1 ? "pet" : "pets"}
            </Text>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.stateText}>
                Loading registered pets...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerState}>
              <Text style={styles.errorText}>{error}</Text>

              <Pressable
                style={styles.retryButton}
                onPress={() => void loadPets()}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              style={styles.list}
              data={filteredPets}
              keyExtractor={(item) => item.id}
              renderItem={renderPet}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.listContent,
                filteredPets.length === 0 && styles.emptyListContent,
              ]}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void loadPets(true)}
                  tintColor={COLORS.green}
                  colors={[COLORS.green]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <PawPrint size={28} color={COLORS.brown} />
                  </View>

                  <Text style={styles.emptyTitle}>
                    {search ? "No matching pets" : "No pets registered yet"}
                  </Text>

                  <Text style={styles.emptySubtitle}>
                    {search
                      ? "Try another pet name, breed, or owner."
                      : "Registered pets will appear here."}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    opacity: 0.2,
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
    borderBottomColor: COLORS.border,
    backgroundColor: "transparent",
    gap: 13,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.dark,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 17,
  },
  summaryIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  summaryNumber: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: "800",
    color: COLORS.dark,
  },
  summaryRight: {
    alignItems: "flex-end",
    paddingLeft: 10,
  },
  summaryVaccinated: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.green,
  },
  summarySmall: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.muted,
  },
  searchContainer: {
    height: 49,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 21,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dark,
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  resultCount: {
    fontSize: 12,
    color: COLORS.muted,
  },
  list: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listContent: {
    paddingBottom: 24,
    gap: 13,
  },
  petCard: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  petTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  petMainInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  petSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.muted,
  },
  genderBadge: {
    backgroundColor: "#F5EEE8",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginLeft: 8,
  },
  genderText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.brown,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.dark,
  },
  detailSecondary: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 3,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#FAF7F3",
    borderRadius: 13,
    padding: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 7,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.dark,
    marginTop: 3,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  statusBadge: {
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusGood: {
    backgroundColor: COLORS.greenLight,
  },
  statusPending: {
    backgroundColor: "#F7EAE5",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  statusGoodText: {
    color: COLORS.green,
  },
  statusPendingText: {
    color: COLORS.red,
  },
  deletePetButton: {
    marginTop: 15,
    minHeight: 43,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7C8C1",
    backgroundColor: "#FFF8F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deletePetText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  stateText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.red,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: COLORS.green,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#EFE3D8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 7,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
  },
});
