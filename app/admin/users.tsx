
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
  Search,
  Users,
  MapPin,
  Phone,
  Mail,
  UserRound,
  PawPrint,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from "lucide-react-native";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const GREEN = "#4D7C6B";
const GREEN_LIGHT = "#E8F0EB";
const CREAM = "#F5ECE3";
const BROWN = "#A1816D";
const DARK = "#3D5148";
const MUTED = "#81776F";
const BORDER = "#E9DDD4";
const RED = "#B45345";
const WHITE = "#FFFFFF";

type RegisteredUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  city: string;
};

type AdminPet = {
  id: string;
  petName: string;
  species: string;
  breed: string;
};

function getText(value: unknown, fallback = "Not specified"): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

function getInitials(name: string): string {
  if (name === "Unknown user") return "?";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

async function deletePetAndRecords(
  userId: string,
  petId: string
): Promise<void> {
  const petPath = ["users", userId, "pets", petId] as const;

  // Delete medication documents before deleting the pet.
  const medicationsRef = collection(
    db,
    ...petPath,
    "medications"
  );
  const medicationsSnapshot = await getDocs(medicationsRef);

  for (const medicationDoc of medicationsSnapshot.docs) {
    await deleteDoc(medicationDoc.ref);
  }

  // Delete gallery documents before deleting the pet.
  const galleryRef = collection(
    db,
    ...petPath,
    "gallery"
  );
  const gallerySnapshot = await getDocs(galleryRef);

  for (const photoDoc of gallerySnapshot.docs) {
    await deleteDoc(photoDoc.ref);
  }

  // Delete the pet only after its known subcollections are cleared.
  await deleteDoc(doc(db, ...petPath));
}

async function deleteUserAndAllPetData(
  userId: string
): Promise<void> {
  const petsSnapshot = await getDocs(
    collection(db, "users", userId, "pets")
  );

  for (const petDoc of petsSnapshot.docs) {
    await deletePetAndRecords(userId, petDoc.id);
  }

  // Delete the owner document after deleting its pet records.
  await deleteDoc(doc(db, "users", userId));
}

export default function AdminUsers() {
  const router = useRouter();

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [expandedUsers, setExpandedUsers] = useState<string[]>([]);
  const [petsByUser, setPetsByUser] = useState<
    Record<string, AdminPet[]>
  >({});
  const [loadingPetsFor, setLoadingPetsFor] = useState<string | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = useCallback(async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const snapshot = await getDocs(collection(db, "users"));

      const results: RegisteredUser[] = snapshot.docs.map((userDoc) => {
        const data = userDoc.data();

        return {
          id: userDoc.id,
          fullName: getText(data.fullName, "Unknown user"),
          email: getText(data.email, ""),
          phone: getText(data.phone, ""),
          country: getText(data.country, ""),
          state: getText(data.state, ""),
          city: getText(data.city, ""),
        };
      });

      results.sort((a, b) =>
        a.fullName.localeCompare(b.fullName)
      );

      setUsers(results);
    } catch (err) {
      console.error("Failed to load registered users:", err);
      setError(
        "Couldn't load registered users. Check your connection, administrator access, and Firestore rules."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadUsers(true);
    }, [loadUsers])
  );

  const loadPets = useCallback(async (userId: string) => {
    setLoadingPetsFor(userId);

    try {
      const snapshot = await getDocs(
        collection(db, "users", userId, "pets")
      );

      const pets: AdminPet[] = snapshot.docs.map((petDoc) => {
        const data = petDoc.data();

        return {
          id: petDoc.id,
          petName: getText(data.petName, "Unnamed pet"),
          species: getText(data.species, "Other"),
          breed: getText(data.breed, ""),
        };
      });

      pets.sort((a, b) => a.petName.localeCompare(b.petName));

      setPetsByUser((previous) => ({
        ...previous,
        [userId]: pets,
      }));
    } catch (err) {
      console.error("Failed to load pets:", err);

      Alert.alert(
        "Couldn't load pets",
        "Check your connection and administrator Firestore permissions."
      );
    } finally {
      setLoadingPetsFor(null);
    }
  }, []);

  const togglePets = useCallback(
    async (userId: string) => {
      if (expandedUsers.includes(userId)) {
        setExpandedUsers((previous) =>
          previous.filter((id) => id !== userId)
        );
        return;
      }

      setExpandedUsers((previous) => [...previous, userId]);

      if (!petsByUser[userId]) {
        await loadPets(userId);
      }
    },
    [expandedUsers, petsByUser, loadPets]
  );

  const confirmDeletePet = (user: RegisteredUser, pet: AdminPet) => {
    Alert.alert(
      "Delete pet and care records?",
      `This will permanently delete ${pet.petName}, its medication documents, and its gallery records. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete pet",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingId(`pet:${pet.id}`);

              try {
                await deletePetAndRecords(user.id, pet.id);

                setPetsByUser((previous) => ({
                  ...previous,
                  [user.id]: (previous[user.id] ?? []).filter(
                    (item) => item.id !== pet.id
                  ),
                }));

                Alert.alert(
                  "Pet deleted",
                  `${pet.petName} and its known Firestore care records were deleted.`
                );
              } catch (err) {
                console.error("Failed to delete pet:", err);

                Alert.alert(
                  "Deletion incomplete",
                  "Some records may already have been deleted. Refresh the pet list, check administrator delete permissions, and try again."
                );
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ]
    );
  };

  const confirmDeleteProfile = (user: RegisteredUser) => {
    Alert.alert(
      "Delete user profile only?",
      `This deletes the profile document for ${user.fullName}. It does NOT delete their pets or nested records, and it does NOT delete their Firebase Authentication account. Those records may become orphaned.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete profile",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingId(`profile:${user.id}`);

              try {
                await deleteDoc(doc(db, "users", user.id));

                setUsers((previous) =>
                  previous.filter((item) => item.id !== user.id)
                );

                setExpandedUsers((previous) =>
                  previous.filter((id) => id !== user.id)
                );

                Alert.alert(
                  "Profile deleted",
                  "The Firestore user profile was deleted. Nested records and the Firebase Authentication account remain."
                );
              } catch (err) {
                console.error("Failed to delete user profile:", err);

                Alert.alert(
                  "Deletion failed",
                  "The profile could not be deleted. Check your administrator delete permissions and try again."
                );
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ]
    );
  };

  const confirmDeleteUserAndData = (user: RegisteredUser) => {
    Alert.alert(
      "Delete user and all data?",
      `This permanently deletes the Firestore profile for ${user.fullName}, their pets, medication documents, and gallery records. It does NOT delete their Firebase Authentication account or remove uploaded images from Cloudinary. Continue only if you understand these limitations.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeletingId(`user:${user.id}`);

              try {
                await deleteUserAndAllPetData(user.id);

                setUsers((previous) =>
                  previous.filter((item) => item.id !== user.id)
                );

                setExpandedUsers((previous) =>
                  previous.filter((id) => id !== user.id)
                );

                setPetsByUser((previous) => {
                  const updated = { ...previous };
                  delete updated[user.id];
                  return updated;
                });

                Alert.alert(
                  "Firestore data deleted",
                  "The user profile and known nested pet records were deleted. The Firebase Authentication account and uploaded Cloudinary images still need separate cleanup."
                );
              } catch (err) {
                console.error("Failed to delete user data:", err);

                Alert.alert(
                  "Deletion incomplete",
                  "Some records may already have been deleted. Refresh the directory and check Firestore delete permissions before retrying. The operation is not atomic."
                );
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      user.fullName,
      user.email,
      user.phone,
      user.city,
      user.state,
      user.country,
    ].some((value) => value.toLowerCase().includes(query));
  });

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
            disabled={deletingId !== null}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={21} color={GREEN} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Registered Users</Text>
            <Text style={styles.headerSubtitle}>
              Pawmetry account directory
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Users size={22} color={GREEN} />
          </View>
        </View>

        <FlatList
          style={styles.list}
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadUsers(false)}
              tintColor={GREEN}
              colors={[GREEN]}
            />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.intro}>
                <Text style={styles.greeting}>Community overview</Text>
                <Text style={styles.heading}>Manage users</Text>
                <Text style={styles.subtitle}>
                  View owner details, manage pet records, and remove data
                  when necessary.
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Users size={22} color={GREEN} />
                </View>

                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>
                    Registered accounts
                  </Text>
                  <Text style={styles.summaryNumber}>
                    {loading ? "—" : users.length}
                  </Text>
                </View>
              </View>

              <View style={styles.searchBox}>
                <Search size={19} color={MUTED} />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name, email or location"
                  placeholderTextColor="#A69A90"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />

                {search.length > 0 && (
                  <Pressable onPress={() => setSearch("")}>
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  All registered users
                </Text>
                <Text style={styles.sectionCount}>
                  {loading ? "Loading..." : `${filteredUsers.length} users`}
                </Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.warningBanner}>
                <ShieldAlert size={18} color={BROWN} />
                <Text style={styles.warningText}>
                  Deletions are permanent. User profile deletion does not
                  remove nested data or the Firebase Authentication account.
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={GREEN} />
                <Text style={styles.stateText}>
                  Loading registered users...
                </Text>
              </View>
            ) : !error ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Users size={30} color={GREEN} />
                </View>

                <Text style={styles.emptyTitle}>
                  {search ? "No matching users" : "No registered users"}
                </Text>

                <Text style={styles.emptyText}>
                  {search
                    ? "Try a different name, email address or location."
                    : "Registered Pawmetry accounts will appear here."}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isExpanded = expandedUsers.includes(item.id);
            const isDeletingUser =
              deletingId === `user:${item.id}` ||
              deletingId === `profile:${item.id}`;

            return (
              <View style={styles.userCard}>
                <View style={styles.userTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(item.fullName)}
                    </Text>
                  </View>

                  <View style={styles.userHeading}>
                    <Text style={styles.userName}>{item.fullName}</Text>
                    <Text style={styles.userCaption}>
                      Registered owner
                    </Text>
                  </View>

                  <View style={styles.userIcon}>
                    <UserRound size={19} color={GREEN} />
                  </View>
                </View>

                {(item.email || item.phone || item.city ||
                  item.state || item.country) && (
                  <>
                    <View style={styles.divider} />

                    {item.email ? (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                          <Mail size={16} color={BROWN} />
                        </View>
                        <Text style={styles.detailText}>{item.email}</Text>
                      </View>
                    ) : null}

                    {item.phone ? (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                          <Phone size={16} color={BROWN} />
                        </View>
                        <Text style={styles.detailText}>{item.phone}</Text>
                      </View>
                    ) : null}

                    {item.city || item.state || item.country ? (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                          <MapPin size={16} color={BROWN} />
                        </View>
                        <Text style={styles.detailText}>
                          {[item.city, item.state, item.country]
                            .filter(Boolean)
                            .join(", ")}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}

                {!item.email && !item.phone && !item.city &&
                  !item.state && !item.country && (
                    <Text style={styles.noDetails}>
                      No additional contact details available.
                    </Text>
                  )}

                <View style={styles.actionDivider} />

                <Pressable
                  style={({ pressed }) => [
                    styles.managePetsButton,
                    pressed && styles.pressed,
                    (deletingId !== null || loadingPetsFor === item.id) &&
                      styles.disabledButton,
                  ]}
                  disabled={deletingId !== null || loadingPetsFor !== null}
                  onPress={() => void togglePets(item.id)}
                >
                  {loadingPetsFor === item.id ? (
                    <ActivityIndicator size="small" color={GREEN} />
                  ) : (
                    <PawPrint size={17} color={GREEN} />
                  )}

                  <Text style={styles.managePetsText}>
                    {isExpanded ? "Hide pets" : "Manage pets"}
                  </Text>

                  {isExpanded ? (
                    <ChevronUp size={17} color={GREEN} />
                  ) : (
                    <ChevronDown size={17} color={GREEN} />
                  )}
                </Pressable>

                {isExpanded && (
                  <View style={styles.petsPanel}>
                    <Text style={styles.petsHeading}>
                      Pets belonging to {item.fullName}
                    </Text>

                    {loadingPetsFor === item.id ? (
                      <View style={styles.petLoading}>
                        <ActivityIndicator color={GREEN} />
                        <Text style={styles.stateText}>
                          Loading pets...
                        </Text>
                      </View>
                    ) : (petsByUser[item.id] ?? []).length === 0 ? (
                      <Text style={styles.noPetsText}>
                        No pet profiles were found for this account.
                      </Text>
                    ) : (
                      (petsByUser[item.id] ?? []).map((pet) => (
                        <View key={pet.id} style={styles.petRow}>
                          <View style={styles.petIcon}>
                            <PawPrint size={18} color={GREEN} />
                          </View>

                          <View style={styles.petInfo}>
                            <Text style={styles.petName}>
                              {pet.petName}
                            </Text>
                            <Text style={styles.petMeta}>
                              {[pet.species, pet.breed]
                                .filter(Boolean)
                                .join(" · ")}
                            </Text>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${pet.petName}`}
                            disabled={deletingId !== null}
                            onPress={() => confirmDeletePet(item, pet)}
                            style={({ pressed }) => [
                              styles.deletePetButton,
                              pressed && styles.pressed,
                              deletingId !== null &&
                                styles.disabledButton,
                            ]}
                          >
                            {deletingId === `pet:${pet.id}` ? (
                              <ActivityIndicator size="small" color={RED} />
                            ) : (
                              <Trash2 size={17} color={RED} />
                            )}
                          </Pressable>
                        </View>
                      ))
                    )}
                  </View>
                )}

                <View style={styles.actionDivider} />

                <Pressable
                  style={({ pressed }) => [
                    styles.profileDeleteButton,
                    pressed && styles.pressed,
                    (deletingId !== null || isDeletingUser) &&
                      styles.disabledButton,
                  ]}
                  disabled={deletingId !== null}
                  onPress={() => confirmDeleteProfile(item)}
                >
                  {deletingId === `profile:${item.id}` ? (
                    <ActivityIndicator size="small" color={RED} />
                  ) : (
                    <Trash2 size={16} color={RED} />
                  )}
                  <Text style={styles.profileDeleteText}>
                    Delete profile only
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteAllButton,
                    pressed && styles.pressed,
                    deletingId !== null && styles.disabledButton,
                  ]}
                  disabled={deletingId !== null}
                  onPress={() => confirmDeleteUserAndData(item)}
                >
                  {deletingId === `user:${item.id}` ? (
                    <ActivityIndicator size="small" color={WHITE} />
                  ) : (
                    <Trash2 size={16} color={WHITE} />
                  )}
                  <Text style={styles.deleteAllText}>
                    Delete user and all Firestore data
                  </Text>
                </Pressable>
              </View>
            );
          }}
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
    borderBottomColor: BORDER,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: WHITE,
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
    marginBottom: 19,
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
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
  },
  summaryIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    color: MUTED,
    fontSize: 12,
  },
  summaryNumber: {
    color: DARK,
    fontSize: 25,
    fontWeight: "800",
    marginTop: 3,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 13,
    minHeight: 50,
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    color: DARK,
    fontSize: 13,
    paddingVertical: 12,
  },
  clearText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "700",
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
    flexShrink: 1,
  },
  sectionCount: {
    color: MUTED,
    fontSize: 11,
    marginLeft: 8,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#F5E9DA",
    borderColor: "#E7D5C1",
    borderWidth: 1,
    borderRadius: 13,
    padding: 12,
    marginBottom: 18,
  },
  warningText: {
    flex: 1,
    color: DARK,
    fontSize: 11,
    lineHeight: 17,
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
    backgroundColor: WHITE,
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
  userCard: {
    backgroundColor: WHITE,
    borderRadius: 19,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  userTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: GREEN,
    fontSize: 16,
    fontWeight: "800",
  },
  userHeading: {
    flex: 1,
  },
  userName: {
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
  },
  userCaption: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  userIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
  detailIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: {
    flex: 1,
    color: DARK,
    fontSize: 12,
    lineHeight: 18,
  },
  noDetails: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  actionDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
  managePetsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: GREEN_LIGHT,
  },
  managePetsText: {
    flex: 1,
    color: GREEN,
    fontSize: 12,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.5,
  },
  petsPanel: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FAF7F3",
    borderWidth: 1,
    borderColor: BORDER,
  },
  petsHeading: {
    color: DARK,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
  },
  petLoading: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noPetsText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 8,
  },
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
  },
  petIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: GREEN_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    color: DARK,
    fontSize: 13,
    fontWeight: "800",
  },
  petMeta: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  deletePetButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FBEDEA",
    borderWidth: 1,
    borderColor: "#F0D3CD",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7C8C1",
    backgroundColor: "#FFF8F6",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  profileDeleteText: {
    color: RED,
    fontSize: 12,
    fontWeight: "700",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    backgroundColor: RED,
    paddingVertical: 13,
    paddingHorizontal: 10,
    marginTop: 9,
  },
  deleteAllText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },
});
