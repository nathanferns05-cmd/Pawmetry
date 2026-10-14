import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import {
  ChevronRight,
  CircleCheck,
  Footprints,
  HeartPulse,
  Pill,
  ShieldCheck,
  Scissors,
  Syringe,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getMedications,
  getOwnerProfile,
  getUserPets,
} from "../../services/userService";

type Pet = {
  id: string;
  petName?: string;
  species?: string;
  breed?: string;
  weight?: string | number;
  weightUnit?: string;
  petPhoto?: string;
  vaccinated?: boolean;
  microchipped?: boolean;
};

type Medication = {
  id: string;
  name?: string;
  dosage?: string;
  frequency?: string;
  time?: string;
  active?: boolean;
};

export default function Dashboard() {
  const router = useRouter();

  const [pet, setPet] = useState<Pet | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhoto, setOwnerPhoto] = useState("");

useFocusEffect(
  useCallback(() => {
    loadDashboard();
  }, [])
);

  async function loadDashboard() {
    try {
      const [pets, profile] = await Promise.all([
        getUserPets(),
        getOwnerProfile(),
      ]);

      if (profile?.fullName) {
        setOwnerName(profile.fullName);
      }

      if (profile?.profilePhoto) {
        setOwnerPhoto(profile.profilePhoto);
      }

      if (!pets.length) return;

      const selectedPet = pets[0] as Pet;
      setPet(selectedPet);

      try {
        const meds = await getMedications(selectedPet.id);

        setMedications(
          meds.filter(
            (medication: any) => medication.active !== false
          ) as Medication[]
        );
      } catch (error) {
        console.log("Failed to load medications:", error);
      }
    } catch (error) {
      console.log("Failed to load dashboard:", error);
    }
  }

  const weightText = getWeightText(pet);

  return (
    <ImageBackground
      source={require("../../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* WELCOME */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeSmall}>PAWMETRY</Text>

            <Text style={styles.welcomeTitle}>
              Hello,{" "}
              {ownerName
                ? ownerName.trim().split(/\s+/)[0]
                : "there"}
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Here's your pet's care overview
            </Text>
          </View>

          {/* USER PROFILE PHOTO */}
          <View style={styles.welcomeIcon}>
            {ownerPhoto ? (
              <Image
                source={{ uri: ownerPhoto }}
                style={styles.ownerProfileImage}
              />
            ) : (
              <HeartPulse
                size={23}
                color="#FFFFFF"
                strokeWidth={2}
              />
            )}
          </View>
        </View>

        {/* PET CARD */}
        <View style={styles.petHero}>
          <View style={styles.petHeroDecoration} />

          {/* Pet image */}
          <View style={styles.petHeroImageWrap}>
            {pet?.petPhoto ? (
              <Image
                source={{ uri: pet.petPhoto }}
                style={styles.petHeroImage}
              />
            ) : (
              <View style={styles.petHeroPlaceholder}>
                <HeartPulse
                  size={31}
                  color="#FAA1E8"
                  strokeWidth={1.8}
                />
              </View>
            )}
          </View>

          {/* Pet information */}
          <View style={styles.petHeroInfo}>
            <Text style={styles.petLabel}>MY PET</Text>

            <View style={styles.petNameRow}>
              <Text style={styles.petName}>
                {pet?.petName || "Your Pet"}
              </Text>

              {pet?.microchipped === true && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck
                    size={13}
                    color="#4D7C6B"
                    strokeWidth={2.2}
                  />
                </View>
              )}
            </View>

            <Text style={styles.petDetails}>
              {pet?.species || "Pet"}
              {pet?.breed ? `  •  ${pet.breed}` : ""}
            </Text>

            <View style={styles.petBadges}>
              <View style={styles.petWeightBadge}>
                <Text style={styles.petWeight}>
                  {weightText || "Weight not added"}
                </Text>
              </View>

              {pet?.vaccinated === true && (
                <View style={styles.vaccinatedBadge}>
                  <CircleCheck
                    size={12}
                    color="#4D7C6B"
                    strokeWidth={2.3}
                  />

                  <Text style={styles.vaccinatedText}>
                    Vaccinated
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* TODAY */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Today</Text>

            <Text style={styles.sectionSubtle}>
              The things that matter most right now
            </Text>
          </View>
        </View>

        <View style={styles.todayGrid}>
          {/* MEDICATION */}
          <Pressable
            style={[styles.todayTile, styles.medicationTile]}
            onPress={() => router.push("/medication")}
          >
            <View style={[styles.tileIcon, styles.blueIcon]}>
              <Pill
                size={20}
                color="#537DB5"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.tileNumber}>
              {medications.length}
            </Text>

            <Text style={styles.tileLabel}>
              Active medications
            </Text>

            <View style={styles.tileAction}>
              <Text style={styles.tileActionText}>
                View reminders
              </Text>

              <ChevronRight
                size={13}
                color="#537DB5"
                strokeWidth={2.5}
              />
            </View>
          </Pressable>

          {/* SCHEDULED WALK */}
          <View
            style={[
              styles.todayTile,
              styles.walkTile,
            ]}
          >
            <View style={[styles.tileIcon, styles.greenIcon]}>
              <Footprints
                size={20}
                color="#4D7C6B"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.walkTitle}>
              Scheduled Walk
            </Text>

            <Text style={styles.tileLabel}>
              Plan and track your pet's walks
            </Text>

            <View style={styles.tileAction}>
              <Text style={styles.tileActionTextGreen}>
                Coming soon
              </Text>

              <ChevronRight
                size={13}
                color="#4D7C6B"
                strokeWidth={2.5}
              />
            </View>
          </View>
        </View>

        {/* CARE */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Care
            </Text>

            <Text style={styles.sectionSubtle}>
              Keep your pet's routine in one place
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/medication")}
          >
            <Text style={styles.sectionLink}>
              Manage
            </Text>
          </Pressable>
        </View>

        <View style={styles.carePanel}>
          {/* MEDICATION */}
          <Pressable
            style={styles.careRow}
            onPress={() => router.push("/medication")}
          >
            <View
              style={[
                styles.careCheck,
                styles.medicationCareIcon,
              ]}
            >
              <Pill
                size={20}
                color="#537DB5"
                strokeWidth={2}
              />
            </View>

            <View style={styles.careText}>
              <Text style={styles.careTitle}>
                Medication reminders
              </Text>

              <Text style={styles.careSubtitle}>
                {medications.length} active reminder
                {medications.length === 1
                  ? ""
                  : "s"} to keep track of
              </Text>
            </View>

            <ChevronRight
              size={18}
              color="#537DB5"
              strokeWidth={2}
            />
          </Pressable>

          <View style={styles.careRule} />

          {/* WALKS */}
          <View style={styles.careRow}>
            <View
              style={[
                styles.careCheck,
                styles.walkCareIcon,
              ]}
            >
              <Footprints
                size={20}
                color="#4D7C6B"
                strokeWidth={2}
              />
            </View>

            <View style={styles.careText}>
              <Text style={styles.careTitle}>
                Walks
              </Text>

              <Text style={styles.careSubtitle}>
                Plan and track your pet's walks
              </Text>
            </View>

            <View
              style={[
                styles.soonMiniBadge,
                styles.walkBadge,
              ]}
            >
              <Text
                style={[
                  styles.soonMiniText,
                  styles.walkBadgeText,
                ]}
              >
                SOON
              </Text>
            </View>
          </View>

          <View style={styles.careRule} />

          {/* GROOMING */}
          <View style={styles.careRow}>
            <View
              style={[
                styles.careCheck,
                styles.groomingCareIcon,
              ]}
            >
              <Scissors
                size={20}
                color="#B75D45"
                strokeWidth={2}
              />
            </View>

            <View style={styles.careText}>
              <Text style={styles.careTitle}>
                Grooming
              </Text>

              <Text style={styles.careSubtitle}>
                Keep track of grooming and care routines
              </Text>
            </View>

            <View
              style={[
                styles.soonMiniBadge,
                styles.groomingBadge,
              ]}
            >
              <Text
                style={[
                  styles.soonMiniText,
                  styles.groomingBadgeText,
                ]}
              >
                SOON
              </Text>
            </View>
          </View>

          <View style={styles.careRule} />

          {/* VACCINATIONS */}
          <View style={styles.careRow}>
            <View
              style={[
                styles.careCheck,
                styles.vaccineCareIcon,
              ]}
            >
              <Syringe
                size={20}
                color="#806A91"
                strokeWidth={2}
              />
            </View>

            <View style={styles.careText}>
              <Text style={styles.careTitle}>
                Vaccinations
              </Text>

              <Text style={styles.careSubtitle}>
                Keep your pet's vaccination schedule up to date
              </Text>
            </View>

            <View
              style={[
                styles.soonMiniBadge,
                styles.vaccineBadge,
              ]}
            >
              <Text
                style={[
                  styles.soonMiniText,
                  styles.vaccineBadgeText,
                ]}
              >
                SOON
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </ImageBackground>
  );
}

function getWeightText(pet: Pet | null): string {
  if (!pet?.weight) return "";

  const rawWeight = String(pet.weight).trim();

  if (/\b(kg|lbs?|lb)\b/i.test(rawWeight)) {
    return rawWeight;
  }

  return `${rawWeight} ${pet.weightUnit || "kg"}`;
}

const styles = StyleSheet.create({
  /* Background */

  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  backgroundImage: {
    opacity: 0.2,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 40,
  },

  /* Welcome */

  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  welcomeSmall: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: "#B75D45",
  },

  welcomeTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#3F281D",
    marginTop: 3,
  },

  welcomeSubtitle: {
    fontSize: 12,
    color: "#8B6B57",
    marginTop: 4,
  },

  welcomeIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#5B7F70",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  ownerProfileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },

  /* Pet */

  petHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 13,
    marginBottom: 29,
    overflow: "hidden",
    position: "relative",
    minHeight: 125,
    borderWidth: 1,
    borderColor: "#E5EDE9",
  },

  petHeroDecoration: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#AAFED3",
    right: -35,
    top: -35,
    opacity: 0.7,
  },

  petHeroImageWrap: {
    width: 100,
    height: 100,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 15,
    backgroundColor: "#E8F0EC",
    borderWidth: 2,
    borderColor: "#DDEBE5",
  },

  petHeroImage: {
    width: "100%",
    height: "100%",
  },

  petHeroPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0EC",
  },

  petHeroInfo: {
    flex: 1,
    justifyContent: "center",
  },

  petLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#B75D45",
    marginBottom: 2,
  },

  petNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  petName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A2D1F",
  },

  verifiedBadge: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#E0EEE6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  petDetails: {
    fontSize: 11,
    color: "#6F5040",
    marginTop: 3,
  },

  petBadges: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 9,
  },

  petWeightBadge: {
    backgroundColor: "#DDEBE5",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  petWeight: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0C0C0C",
  },

  vaccinatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DDEBE5",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },

  vaccinatedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4D7C6B",
  },

  /* Sections */

  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 11,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#4A2D1F",
  },

  sectionSubtle: {
    fontSize: 10,
    color: "#9A806F",
    marginTop: 3,
  },

  sectionLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B75D45",
    marginBottom: 1,
  },

  /* Today */

  todayGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 29,
  },

  todayTile: {
    flex: 1,
    minHeight: 153,
    borderRadius: 21,
    padding: 14,
    overflow: "hidden",
  },

  medicationTile: {
    backgroundColor: "#E8EEF7",
    borderWidth: 1,
    borderColor: "#D8E2F0",
  },

  walkTile: {
    backgroundColor: "#DDEBE5",
    borderWidth: 1,
    borderColor: "#CFE1D9",
  },

  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  blueIcon: {
    backgroundColor: "#D7E2F1",
  },

  greenIcon: {
    backgroundColor: "#CFE3D9",
  },

  tileNumber: {
    fontSize: 23,
    fontWeight: "800",
    color: "#4A2D1F",
  },

  walkTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4A2D1F",
    marginTop: 2,
  },

  tileLabel: {
    fontSize: 10,
    color: "#806655",
    marginTop: 3,
    lineHeight: 14,
  },

  tileAction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  tileActionText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#537DB5",
    marginRight: 2,
  },

  tileActionTextGreen: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4D7C6B",
    marginRight: 2,
  },

  /* Care */

  carePanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E9DDD4",
    marginBottom: 25,
    overflow: "hidden",
  },

  careRow: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
  },

  careCheck: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  careText: {
    flex: 1,
  },

  careTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4A2D1F",
  },

  careSubtitle: {
    fontSize: 10,
    color: "#8A6A55",
    marginTop: 3,
    lineHeight: 14,
  },

  careRule: {
    height: 1,
    backgroundColor: "#F0E7E1",
    marginLeft: 52,
  },

  medicationCareIcon: {
    backgroundColor: "#DCE7F5",
  },

  walkCareIcon: {
    backgroundColor: "#DDEBE5",
  },

  groomingCareIcon: {
    backgroundColor: "#F5DED5",
  },

  vaccineCareIcon: {
    backgroundColor: "#E8E1EF",
  },

  soonMiniBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  soonMiniText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  walkBadge: {
    backgroundColor: "#DDEBE5",
  },

  walkBadgeText: {
    color: "#4D7C6B",
  },

  groomingBadge: {
    backgroundColor: "#F5DED5",
  },

  groomingBadgeText: {
    color: "#B75D45",
  },

  vaccineBadge: {
    backgroundColor: "#E8E1EF",
  },

  vaccineBadgeText: {
    color: "#806A91",
  },

  bottomSpace: {
    height: 30,
  },
});