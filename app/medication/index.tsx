import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";

import {
  deleteMedication,
  getMedications,
  getUserPets,
} from "../../services/userService";
import {
  cancelEndedMedicationReminders,
  cancelMedicationReminders,
} from "../../utils/notifications";

export default function MedicationScreen() {
  const router = useRouter();

  const [pets, setPets] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMedications = async (preferredPetId?: string) => {
    try {
      setLoading(true);

      const userPets = await getUserPets();
      setPets(userPets);

      if (userPets.length > 0) {
        // Stay on the pet the user was looking at, if it still exists.
        const pet =
          userPets.find((item) => item.id === preferredPetId) ||
          userPets[0];
        setSelectedPet(pet);

        const petMedications = await getMedications(pet.id);
        setMedications(petMedications);

        cancelEndedMedicationReminders(petMedications as any[]);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.log("Unable to load medications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Remembers the chosen pet across focus reloads without re-running them.
  const selectedPetIdRef = useRef<string | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      loadMedications(selectedPetIdRef.current);
      // Only reload when the screen regains focus.
    }, [])
  );

  const handlePetChange = async (pet: any) => {
    selectedPetIdRef.current = pet.id;
    setSelectedPet(pet);
    setLoading(true);

    try {
      const petMedications = await getMedications(pet.id);
      setMedications(petMedications);
    } catch (error) {
      console.log("Unable to load medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = (medication: any) => {
  if (!selectedPet) return;

  Alert.alert(
    "Remove Medication",
    `Are you sure you want to remove ${medication.name}?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelMedicationReminders(
              medication.notificationIds,
            );

            await deleteMedication(
              selectedPet.id,
              medication.id,
            );

            setMedications((current) =>
              current.filter(
                (item) => item.id !== medication.id,
              ),
            );
          } catch (error) {
            console.log(
              "Unable to delete medication:",
              error,
            );

            Alert.alert(
              "Error",
              "Unable to remove this medication.",
            );
          }
        },
      },
    ],
  );
};

const handleEditMedication = (medication: any) => {
  if (!selectedPet) return;

  router.push({
    pathname: "/medication/add",
    params: {
      medicationId: medication.id,
      petId: selectedPet.id,
    },
  });
};

  return (
    <ImageBackground
      source={require("../../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerEyebrow}>
              PAWMETRY HEALTH
            </Text>

            <Text style={styles.title}>
              Medication
            </Text>
          </View>

          <Pressable
            style={styles.headerAddButton}
            onPress={() => router.push("/medication/add")}
          >
            <Text style={styles.headerAddText}>+</Text>
          </Pressable>
        </View>

        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>💊</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Medication Reminders
            </Text>

            <Text style={styles.heroText}>
              Stay on top of your pet's treatment and never
              miss an important dose.
            </Text>
          </View>

          <View style={styles.heroDecorationOne} />
          <View style={styles.heroDecorationTwo} />
        </View>

        {/* PET SELECTOR */}
        {pets.length > 1 && (
          <View style={styles.petCard}>
            <View style={styles.petCardHeader}>
              <View>
                <Text style={styles.petTitle}>
                  Your Pets
                </Text>

                <Text style={styles.petSubtitle}>
                  Select a pet to view their medication
                </Text>
              </View>

              <View style={styles.pawCircle}>
                <Text style={styles.pawText}>🐾</Text>
              </View>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={pets}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.petList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.petButton,
                    selectedPet?.id === item.id &&
                      styles.selectedPetButton,
                  ]}
                  onPress={() => handlePetChange(item)}
                >
                  <Text
                    style={[
                      styles.petButtonText,
                      selectedPet?.id === item.id &&
                        styles.selectedPetButtonText,
                    ]}
                  >
                    {item.petName}
                  </Text>

                  {selectedPet?.id === item.id && (
                    <View style={styles.petCheck}>
                      <Text style={styles.petCheckText}>
                        ✓
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
            />
          </View>
        )}

        {/* LIST TITLE */}
        <View style={styles.listHeader}>
          <View style={styles.listHeaderText}>
            <Text style={styles.heading}>
              {selectedPet
                ? `${selectedPet.petName}'s Medications`
                : "Medications"}
            </Text>

            <Text style={styles.subtitle}>
              {medications.length > 0
                ? `${medications.length} medication${
                    medications.length === 1 ? "" : "s"
                  } scheduled`
                : "No medications scheduled"}
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {medications.length}
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="large"
                color="#4D7C6B"
              />

              <Text style={styles.loadingText}>
                Loading medications...
              </Text>
            </View>
          </View>
        ) : medications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIllustration}>
              <View style={styles.emptyCircleBack} />

              <View style={styles.emptyPill}>
                <Text style={styles.emptyPillText}>
                  +
                </Text>
              </View>
            </View>

            <Text style={styles.emptyTitle}>
              No medications yet
            </Text>

            <Text style={styles.emptyText}>
              Add your pet's medication schedule here so
              you can easily keep track of their treatment.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push("/medication/add")}
            >
              <Text style={styles.emptyButtonPlus}>
                +
              </Text>

              <Text style={styles.emptyButtonText}>
                Add Medication
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={medications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.medicationList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.medicationCard}>
                {/* Left Icon */}
                <View style={styles.medicationIconArea}>
                  <View style={styles.medicationIcon}>
                    <Text style={styles.medicationIconText}>
                      💊
                    </Text>
                  </View>

                  <View style={styles.verticalLine} />
                </View>

                {/* Main Information */}
                <View style={styles.medicationInfo}>
                  <View style={styles.medicationHeader}>
                    <Text style={styles.medicationName}>
                      {item.name}
                    </Text>

                    <View style={styles.activeBadge}>
                      <View style={styles.activeDot} />

                      <Text style={styles.activeText}>
                        ACTIVE
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dosageBadge}>
                    <Text style={styles.dosageIcon}>
                      ◉
                    </Text>

                    <Text style={styles.medicationDosage}>
                      {item.dosage}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.infoPill}>
                      <Text style={styles.infoIcon}>
                        ↻
                      </Text>

                      <Text style={styles.infoText}>
                        {item.frequency}
                      </Text>
                    </View>

                    <View style={styles.infoPill}>
                      <Text style={styles.infoIcon}>
                        ◷
                      </Text>

                      <Text style={styles.infoText}>
                        {item.time}
                      </Text>
                    </View>
                  </View>

                  {item.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesIcon}>
                        ✎
                      </Text>

                      <Text style={styles.notes}>
                        {item.notes}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.actionRow}>
  <Pressable
    style={styles.editButton}
    onPress={() => handleEditMedication(item)}
  >
    <Text style={styles.editButtonIcon}>✎</Text>
    <Text style={styles.editButtonText}>
      Edit
    </Text>
  </Pressable>

  <Pressable
    style={styles.removeButton}
    onPress={() => handleDeleteMedication(item)}
  >
    <Text style={styles.removeButtonIcon}>×</Text>
    <Text style={styles.removeButtonText}>
      Remove
    </Text>
  </Pressable>
</View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F1ED",
  },

  backgroundImage: {
    opacity: 0.2,
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 52,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6DDD7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5C4436",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  back: {
    fontSize: 35,
    color: "#493126",
    lineHeight: 38,
    marginTop: -3,
  },

  headerTitleContainer: {
    alignItems: "center",
  },

  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: "#4D7C6B",
    marginBottom: 2,
  },

  title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#3D2A20",
  },

  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4D7C6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 4,
  },

  headerAddText: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "400",
    marginTop: -2,
  },

  /* =========================
     HERO
  ========================= */

  heroCard: {
    height: 132,
    borderRadius: 25,
    backgroundColor: "#4D7C6B",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#385E50",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },

  heroIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  heroIcon: {
    fontSize: 36,
  },

  heroContent: {
    flex: 1,
    zIndex: 2,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 6,
  },

  heroText: {
    color: "#E7F2ED",
    fontSize: 12,
    lineHeight: 18,
    paddingRight: 5,
  },

  heroDecorationOne: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#FFFFFF",
    opacity: 0.07,
    right: -35,
    top: -45,
  },

  heroDecorationTwo: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    opacity: 0.06,
    right: 30,
    bottom: -35,
  },

  /* =========================
     PET SELECTOR
  ========================= */

  petCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    padding: 16,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: "#E7DED8",
    shadowColor: "#5C4436",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  petCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  petTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#443127",
  },

  petSubtitle: {
    color: "#927A6B",
    fontSize: 11,
    marginTop: 3,
  },

  pawCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#E9F2ED",
    alignItems: "center",
    justifyContent: "center",
  },

  pawText: {
    fontSize: 19,
  },

  petList: {
    paddingTop: 14,
  },

  petButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4EFEB",
    borderWidth: 1,
    borderColor: "#E5DAD3",
    borderRadius: 14,
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 10,
    marginRight: 9,
  },

  selectedPetButton: {
    backgroundColor: "#4D7C6B",
    borderColor: "#4D7C6B",
  },

  petButtonText: {
    color: "#6B4A3A",
    fontSize: 13,
    fontWeight: "800",
  },

  selectedPetButtonText: {
    color: "#FFFFFF",
  },

  petCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  petCheckText: {
    color: "#4D7C6B",
    fontSize: 12,
    fontWeight: "900",
  },

  /* =========================
     LIST HEADER
  ========================= */

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  listHeaderText: {
    flex: 1,
  },

  heading: {
    fontSize: 20,
    fontWeight: "900",
    color: "#3D2A20",
  },

  subtitle: {
    color: "#8A7060",
    fontSize: 12,
    marginTop: 4,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F1E5DC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  countText: {
    color: "#7A4E32",
    fontSize: 15,
    fontWeight: "900",
  },

  /* =========================
     LOADING
  ========================= */

  loadingContainer: {
    flex: 1,
    paddingTop: 8,
  },

  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7DED8",
  },

  loadingText: {
    color: "#80695B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },

  /* =========================
     EMPTY STATE
  ========================= */

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7DED8",
    shadowColor: "#5C4436",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  emptyIllustration: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  emptyCircleBack: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#E7F0EB",
  },

  emptyPill: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
    transform: [
      {
        rotate: "-12deg",
      },
    ],
  },

  emptyPillText: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "300",
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#443127",
    marginBottom: 8,
  },

  emptyText: {
    textAlign: "center",
    color: "#80695B",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 21,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4D7C6B",
    paddingHorizontal: 21,
    paddingVertical: 13,
    borderRadius: 15,
    shadowColor: "#4D7C6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  emptyButtonPlus: {
    color: "#FFFFFF",
    fontSize: 21,
    marginRight: 7,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  /* =========================
     MEDICATION CARDS
  ========================= */

  medicationList: {
    paddingBottom: 35,
  },

  medicationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 21,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E7DED8",
    shadowColor: "#5C4436",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  medicationIconArea: {
    alignItems: "center",
    marginRight: 13,
  },

  medicationIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F4E5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  medicationIconText: {
    fontSize: 27,
  },

  verticalLine: {
    width: 2,
    flex: 1,
    minHeight: 10,
    backgroundColor: "#E7DED8",
    marginTop: 7,
  },

  medicationInfo: {
    flex: 1,
    paddingTop: 1,
  },

  medicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  medicationName: {
    flex: 1,
    color: "#422D22",
    fontSize: 17,
    fontWeight: "900",
    marginRight: 7,
  },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F2ED",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4D7C6B",
    marginRight: 4,
  },

  activeText: {
    color: "#4D7C6B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  dosageBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FAF4EF",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 9,
  },

  dosageIcon: {
    color: "#B06D4F",
    fontSize: 9,
    marginRight: 5,
  },

  medicationDosage: {
    color: "#6B4A3A",
    fontSize: 12,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F7F5",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  infoIcon: {
    color: "#4D7C6B",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 4,
  },

  infoText: {
    color: "#5D756B",
    fontSize: 10,
    fontWeight: "700",
  },

  notesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FBF7F4",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 9,
  },

  notesIcon: {
    color: "#A1816D",
    fontSize: 12,
    marginRight: 5,
  },

  notes: {
    flex: 1,
    color: "#897365",
    fontSize: 10,
    lineHeight: 15,
  },

  actionRow: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 11,
  gap: 8,
},

editButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#E8F2ED",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderWidth: 1,
  borderColor: "#D4E6DD",
},

editButtonIcon: {
  color: "#4D7C6B",
  fontSize: 13,
  fontWeight: "900",
  marginRight: 5,
},

editButtonText: {
  color: "#4D7C6B",
  fontSize: 11,
  fontWeight: "900",
},

removeButton: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#FBEDEA",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderWidth: 1,
  borderColor: "#F0D5CF",
},

removeButtonIcon: {
  color: "#B75D45",
  fontSize: 17,
  fontWeight: "700",
  marginRight: 4,
},

removeButtonText: {
  color: "#B75D45",
  fontSize: 11,
  fontWeight: "900",
},
});