import { useRouter } from "expo-router";
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  CircleCheck,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getUserPets } from "../../services/userService";

type Pet = {
  id: string;
  petName?: string;
  species?: string;
  breed?: string;
  weight?: string | number;
  weightUnit?: string;
  vaccinated?: boolean;
  microchipped?: boolean;
};

export default function HealthScreen() {
  const router = useRouter();

  const [pet, setPet] = useState<Pet | null>(null);

  useEffect(() => {
    loadPet();
  }, []);

  async function loadPet() {
    try {
      const pets = await getUserPets();

      if (pets.length > 0) {
        setPet(pets[0] as Pet);
      }
    } catch (error) {
      console.log("Failed to load pet:", error);
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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft
                size={21}
                color="#4A3024"
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.title}>
                Health
              </Text>

              <Text style={styles.subtitle}>
                Manage your pet's health and care
              </Text>
            </View>
          </View>

          {/* Health overview */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewIcon}>
              <HeartPulse
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.overviewText}>
              <Text style={styles.overviewTitle}>
                Your pet's wellbeing
              </Text>

              <Text style={styles.overviewDescription}>
                Keep track of symptoms, medications and important health
                information in one place.
              </Text>
            </View>
          </View>

          {/* Health Snapshot */}
          <View style={styles.snapshotSection}>
            <View style={styles.snapshotHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  Health snapshot
                </Text>

                <Text style={styles.sectionSubtle}>
                  What's already recorded for{" "}
                  {pet?.petName || "your pet"}
                </Text>
              </View>
            </View>

            <View style={styles.healthPanel}>
              <View style={styles.healthPanelHeader}>
                <View style={styles.healthPanelIcon}>
                  <HeartPulse
                    size={20}
                    color="#FFFFFF"
                    strokeWidth={2}
                  />
                </View>

                <View>
                  <Text style={styles.healthPanelTitle}>
                    Health information
                  </Text>

                  <Text style={styles.healthPanelSubtitle}>
                    Current information on file
                  </Text>
                </View>
              </View>

              <View style={styles.healthRows}>
                <HealthRow
                  label="Vaccinations"
                  value={
                    pet?.vaccinated === true
                      ? "Recorded"
                      : pet?.vaccinated === false
                      ? "Not vaccinated"
                      : "Not added"
                  }
                  positive={pet?.vaccinated === true}
                />

                <HealthRow
                  label="Microchip"
                  value={
                    pet?.microchipped === true
                      ? "Active"
                      : "Not added"
                  }
                  positive={pet?.microchipped === true}
                />

                <HealthRow
                  label="Weight"
                  value={weightText || "Not added"}
                />

                <HealthRow
                  label="Next checkup"
                  value="Not added"
                  last
                />
              </View>
            </View>
          </View>

          {/* Main health tools */}
          <Text style={styles.sectionTitle}>
            Health & Care
          </Text>

          {/* Symptom Checker */}
          <TouchableOpacity
            style={[
              styles.featureCard,
              styles.symptomCard,
            ]}
            onPress={() =>
              router.push("/symptom-checker")
            }
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconContainer,
                styles.symptomIcon,
              ]}
            >
              <Stethoscope
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>
                Symptom Checker
              </Text>

              <Text style={styles.cardDescription}>
                Check your pet's symptoms with Vet-Bot
              </Text>

              <View style={styles.cardAction}>
                <Text style={styles.symptomActionText}>
                  Check symptoms
                </Text>

                <ChevronRight
                  size={15}
                  color="#B75D45"
                />
              </View>
            </View>

            <Activity
              size={20}
              color="#E8B9A8"
              strokeWidth={2}
              style={styles.backgroundIcon}
            />
          </TouchableOpacity>

          {/* Medications */}
          <TouchableOpacity
            style={[
              styles.featureCard,
              styles.medicationCard,
            ]}
            onPress={() =>
              router.push("/medication")
            }
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.iconContainer,
                styles.medicationIcon,
              ]}
            >
              <Pill
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>
                Medications
              </Text>

              <Text style={styles.cardDescription}>
                View and manage your pet's medications
              </Text>

              <View style={styles.cardAction}>
                <Text
                  style={styles.medicationActionText}
                >
                  Manage medications
                </Text>

                <ChevronRight
                  size={15}
                  color="#4D7C6B"
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* More features */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              More Health Features
            </Text>

            <View style={styles.futureBadge}>
              <Text style={styles.futureBadgeText}>
                PLANNED
              </Text>
            </View>
          </View>

          <View style={styles.comingSoon}>
            <View style={styles.comingSoonIcon}>
              <HeartPulse
                size={21}
                color="#6B5A91"
              />
            </View>

            <View style={styles.comingSoonContent}>
              <Text style={styles.comingSoonTitle}>
                More care tools
              </Text>

              <Text style={styles.comingSoonText}>
                Vaccination records, health records, weight
                tracking and vet appointments are planned for
                future updates.
              </Text>
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function HealthRow({
  label,
  value,
  positive = false,
  last = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.healthRow,
        last && styles.healthRowLast,
      ]}
    >
      <Text style={styles.healthLabel}>
        {label}
      </Text>

      <View style={styles.healthValueWrap}>
        {positive && (
          <CircleCheck
            size={14}
            color="#4D7C6B"
            strokeWidth={2.2}
          />
        )}

        <Text
          style={[
            styles.healthValue,
            positive &&
              styles.healthValuePositive,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function getWeightText(
  pet: Pet | null
): string {
  if (!pet?.weight) return "";

  const rawWeight = String(
    pet.weight
  ).trim();

  if (
    /\b(kg|lbs?|lb)\b/i.test(
      rawWeight
    )
  ) {
    return rawWeight;
  }

  return `${rawWeight} ${
    pet.weightUnit || "kg"
  }`;
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

  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 40,
  },

  /* Header */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#E9D8CA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: "#4A3024",
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    color: "#8B6B57",
    marginTop: 3,
  },

  /* Overview */

  overviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5B7F70",
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    overflow: "hidden",
  },

  overviewIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  overviewText: {
    flex: 1,
  },

  overviewTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 5,
  },

  overviewDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#E8F0EC",
  },

  /* Health Snapshot */

  snapshotSection: {
    marginBottom: 28,
  },

  snapshotHeading: {
    marginBottom: 12,
  },

  sectionSubtle: {
    fontSize: 11,
    color: "#9A806F",
    marginTop: 3,
  },

  healthPanel: {
    backgroundColor: "#E8E1EF",
    borderRadius: 22,
    overflow: "hidden",
  },

  healthPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#6B5A91",
  },

  healthPanelIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  healthPanelTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  healthPanelSubtitle: {
    fontSize: 10,
    color: "#E7E0EF",
    marginTop: 2,
  },

  healthRows: {
    paddingHorizontal: 16,
    backgroundColor: "#F0EBF3",
  },

  healthRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E3DCE8",
  },

  healthRowLast: {
    borderBottomWidth: 0,
  },

  healthLabel: {
    fontSize: 11,
    color: "#806F87",
  },

  healthValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  healthValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A2D1F",
  },

  healthValuePositive: {
    color: "#4D7C6B",
  },

  /* Sections */

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A3024",
    marginBottom: 13,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 13,
  },

  futureBadge: {
    backgroundColor: "#E7DFF2",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 13,
  },

  futureBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6B5A91",
    letterSpacing: 0.6,
  },

  /* Feature cards */

  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    padding: 17,
    marginBottom: 13,
    overflow: "hidden",
    minHeight: 108,
  },

  symptomCard: {
    backgroundColor: "#F5DED5",
  },

  medicationCard: {
    backgroundColor: "#DDEBE5",
  },

  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  symptomIcon: {
    backgroundColor: "#B75D45",
  },

  medicationIcon: {
    backgroundColor: "#4D7C6B",
  },

  cardText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4A3024",
  },

  cardDescription: {
    fontSize: 13,
    color: "#765F51",
    marginTop: 4,
    lineHeight: 18,
    paddingRight: 5,
  },

  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  symptomActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B75D45",
    marginRight: 3,
  },

  medicationActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4D7C6B",
    marginRight: 3,
  },

  backgroundIcon: {
    position: "absolute",
    right: 12,
    bottom: 8,
    opacity: 0.45,
  },

  /* Coming soon */

  comingSoon: {
    flexDirection: "row",
    backgroundColor: "#E8E1EF",
    borderRadius: 22,
    padding: 18,
    alignItems: "flex-start",
  },

  comingSoonIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#D8CEE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  comingSoonContent: {
    flex: 1,
  },

  comingSoonTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#514367",
    marginBottom: 5,
  },

  comingSoonText: {
    fontSize: 13,
    color: "#756A83",
    lineHeight: 19,
  },

  bottomSpace: {
    height: 30,
  },
});