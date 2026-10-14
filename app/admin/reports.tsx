
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  PawPrint,
  Pill,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { collection, getDocs } from "firebase/firestore";
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
  track: "#F0E8E1",
};

type SpeciesCount = {
  name: string;
  count: number;
};

type ReportData = {
  users: number;
  pets: number;
  medications: number;
  activeMedications: number;
  vaccinatedPets: number;
  microchippedPets: number;
  species: SpeciesCount[];
};

const EMPTY_REPORT: ReportData = {
  users: 0,
  pets: 0,
  medications: 0,
  activeMedications: 0,
  vaccinatedPets: 0,
  microchippedPets: 0,
  species: [],
};

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent = false,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <View style={[styles.metricCard, accent && styles.metricCardAccent]}>
      <View style={styles.metricTop}>
        <View
          style={[
            styles.metricIcon,
            accent && styles.metricIconAccent,
          ]}
        >
          {icon}
        </View>

        <View style={styles.metricIndicator}>
          <View
            style={[
              styles.metricDot,
              accent && styles.metricDotAccent,
            ]}
          />
          <Text style={styles.metricIndicatorText}>Live</Text>
        </View>
      </View>

      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

function ProgressRow({
  label,
  count,
  total,
  color = COLORS.green,
}: {
  label: string;
  count: number;
  total: number;
  color?: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressName}>{label}</Text>
        <Text style={styles.progressCount}>
          {count}{" "}
          <Text style={styles.progressPercent}>
            ({Math.round(percentage)}%)
          </Text>
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(100, Math.max(0, percentage))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function AdminReports() {
  const router = useRouter();

  const [report, setReport] = useState<ReportData>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const usersSnapshot = await getDocs(collection(db, "users"));

      let petCount = 0;
      let medicationCount = 0;
      let activeMedicationCount = 0;
      let vaccinatedCount = 0;
      let microchippedCount = 0;

      const speciesCounts: Record<string, number> = {};

      for (const userDoc of usersSnapshot.docs) {
        const petsSnapshot = await getDocs(
          collection(db, "users", userDoc.id, "pets")
        );

        for (const petDoc of petsSnapshot.docs) {
          const pet = petDoc.data();

          petCount += 1;

          const species =
            typeof pet.species === "string" && pet.species.trim()
              ? pet.species.trim()
              : "Other";

          speciesCounts[species] = (speciesCounts[species] ?? 0) + 1;

          if (pet.vaccinated === true) vaccinatedCount += 1;
          if (pet.microchipped === true) microchippedCount += 1;

          const medicationsSnapshot = await getDocs(
            collection(
              db,
              "users",
              userDoc.id,
              "pets",
              petDoc.id,
              "medications"
            )
          );

          medicationCount += medicationsSnapshot.size;

          medicationsSnapshot.docs.forEach((medicationDoc) => {
            if (medicationDoc.data().active === true) {
              activeMedicationCount += 1;
            }
          });
        }
      }

      const sortedSpecies = Object.entries(speciesCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      setReport({
        users: usersSnapshot.size,
        pets: petCount,
        medications: medicationCount,
        activeMedications: activeMedicationCount,
        vaccinatedPets: vaccinatedCount,
        microchippedPets: microchippedCount,
        species: sortedSpecies,
      });
    } catch (err) {
      console.error("Failed to load admin reports:", err);
      setError(
        "Reports could not be loaded. Check your connection and administrator access."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports])
  );

  const vaccinationRate =
    report.pets > 0
      ? Math.round((report.vaccinatedPets / report.pets) * 100)
      : 0;

  const microchipRate =
    report.pets > 0
      ? Math.round((report.microchippedPets / report.pets) * 100)
      : 0;

  const maxSpeciesCount = Math.max(
    1,
    ...report.species.map((item) => item.count)
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
            <Text style={styles.headerTitle}>Reports & Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Pawmetry platform overview
            </Text>
          </View>

          <Pressable
            style={styles.refreshButton}
            onPress={() => void loadReports(true)}
            disabled={loading || refreshing}
            accessibilityRole="button"
            accessibilityLabel="Refresh reports"
          >
            <RefreshCw size={18} color={COLORS.green} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.stateTitle}>Preparing your reports</Text>
            <Text style={styles.stateSubtitle}>
              Collecting platform statistics from Firestore...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <View style={styles.errorIcon}>
              <BarChart3 size={28} color={COLORS.red} />
            </View>

            <Text style={styles.stateTitle}>Unable to load reports</Text>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => void loadReports()}
            >
              <RefreshCw size={16} color={COLORS.white} />
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void loadReports(true)}
                tintColor={COLORS.green}
                colors={[COLORS.green]}
              />
            }
          >
            <View style={styles.reportIntro}>
              <View style={styles.introIcon}>
                <BarChart3 size={23} color={COLORS.green} />
              </View>

              <View style={styles.introText}>
                <Text style={styles.eyebrow}>ADMINISTRATION</Text>
                <Text style={styles.introTitle}>Platform insights</Text>
                <Text style={styles.introSubtitle}>
                  An overview of registered accounts, pets, and care records.
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Platform at a glance</Text>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live data</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <MetricCard
                title="Registered users"
                value={report.users}
                subtitle="Owner accounts"
                icon={<Users size={20} color={COLORS.green} />}
              />

              <MetricCard
                title="Registered pets"
                value={report.pets}
                subtitle="Pet profiles"
                icon={<PawPrint size={20} color={COLORS.green} />}
                accent
              />

              <MetricCard
                title="Medication records"
                value={report.medications}
                subtitle={`${report.activeMedications} marked active`}
                icon={<Pill size={20} color={COLORS.green} />}
              />

              <MetricCard
                title="Vaccination coverage"
                value={`${vaccinationRate}%`}
                subtitle={`${report.vaccinatedPets} of ${report.pets} pets`}
                icon={<ShieldCheck size={20} color={COLORS.green} />}
                accent
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pet care overview</Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <View style={styles.panelIcon}>
                  <ShieldCheck size={19} color={COLORS.green} />
                </View>

                <View style={styles.panelHeadingText}>
                  <Text style={styles.panelTitle}>
                    Health & identification
                  </Text>
                  <Text style={styles.panelSubtitle}>
                    Recorded care indicators across pet profiles
                  </Text>
                </View>
              </View>

              <View style={styles.coverageSummary}>
                <View style={styles.coverageBlock}>
                  <Text style={styles.coverageValue}>
                    {vaccinationRate}%
                  </Text>
                  <Text style={styles.coverageLabel}>Vaccinated</Text>
                </View>

                <View style={styles.coverageDivider} />

                <View style={styles.coverageBlock}>
                  <Text style={styles.coverageValue}>{microchipRate}%</Text>
                  <Text style={styles.coverageLabel}>Microchipped</Text>
                </View>
              </View>

              <ProgressRow
                label="Vaccinated pets"
                count={report.vaccinatedPets}
                total={report.pets}
              />

              <ProgressRow
                label="Microchipped pets"
                count={report.microchippedPets}
                total={report.pets}
                color={COLORS.brown}
              />

              <Text style={styles.panelFootnote}>
                Coverage is calculated from the vaccination and microchip
                flags currently saved in pet profiles.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Species distribution</Text>
              <Text style={styles.sectionMeta}>
                {report.pets} total pets
              </Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <View style={styles.panelIcon}>
                  <PawPrint size={19} color={COLORS.green} />
                </View>

                <View style={styles.panelHeadingText}>
                  <Text style={styles.panelTitle}>Pets by species</Text>
                  <Text style={styles.panelSubtitle}>
                    Breakdown of registered pet profiles
                  </Text>
                </View>
              </View>

              {report.species.length === 0 ? (
                <View style={styles.chartEmpty}>
                  <PawPrint size={25} color={COLORS.brown} />
                  <Text style={styles.chartEmptyText}>
                    Species data will appear when pets are registered.
                  </Text>
                </View>
              ) : (
                <View style={styles.speciesList}>
                  {report.species.map((item, index) => (
                    <View key={item.name} style={styles.speciesRow}>
                      <View style={styles.speciesNameRow}>
                        <View
                          style={[
                            styles.speciesIndex,
                            index === 0 && styles.speciesIndexPrimary,
                          ]}
                        >
                          <Text
                            style={[
                              styles.speciesIndexText,
                              index === 0 &&
                                styles.speciesIndexTextPrimary,
                            ]}
                          >
                            {index + 1}
                          </Text>
                        </View>

                        <Text style={styles.speciesName}>{item.name}</Text>
                        <Text style={styles.speciesCount}>{item.count}</Text>
                      </View>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${
                                (item.count / maxSpeciesCount) * 100
                              }%`,
                              backgroundColor:
                                index === 0 ? COLORS.green : COLORS.brown,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Care records</Text>
            </View>

            <View style={styles.panel}>
              <View style={styles.recordRow}>
                <View style={styles.recordIcon}>
                  <Pill size={19} color={COLORS.green} />
                </View>

                <View style={styles.recordInfo}>
                  <Text style={styles.recordTitle}>All medications</Text>
                  <Text style={styles.recordSubtitle}>
                    Medication documents saved for registered pets
                  </Text>
                </View>

                <Text style={styles.recordValue}>{report.medications}</Text>
              </View>

              <View style={styles.recordDivider} />

              <View style={styles.recordRow}>
                <View style={styles.recordIcon}>
                  <CheckCircle2 size={19} color={COLORS.green} />
                </View>

                <View style={styles.recordInfo}>
                  <Text style={styles.recordTitle}>Active medications</Text>
                  <Text style={styles.recordSubtitle}>
                    Records with the active flag enabled
                  </Text>
                </View>

                <Text style={styles.recordValue}>
                  {report.activeMedications}
                </Text>
              </View>

              <View style={styles.recordDivider} />

              <View style={styles.recordRow}>
                <View style={styles.recordIcon}>
                  <ClipboardList size={19} color={COLORS.green} />
                </View>

                <View style={styles.recordInfo}>
                  <Text style={styles.recordTitle}>
                    Care profile coverage
                  </Text>
                  <Text style={styles.recordSubtitle}>
                    Pets with vaccination or microchip information
                  </Text>
                </View>

                <Text style={styles.recordValue}>
                  {report.vaccinatedPets + report.microchippedPets > 0
                    ? new Set(
                        [
                          ...(report.vaccinatedPets > 0
                            ? ["vaccinated"]
                            : []),
                          ...(report.microchippedPets > 0
                            ? ["microchipped"]
                            : []),
                        ]
                      ).size
                    : 0}
                  <Text style={styles.recordValueSuffix}> indicators</Text>
                </Text>
              </View>
            </View>

            <View style={styles.footerNote}>
              <BarChart3 size={16} color={COLORS.muted} />
              <Text style={styles.footerText}>
                Figures reflect the records accessible to this administrator
                at the time of refresh. These are operational summaries, not
                clinical assessments.
              </Text>
            </View>
          </ScrollView>
        )}
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
    borderBottomColor: COLORS.border,
    gap: 13,
    backgroundColor: "transparent",
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
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.dark,
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 21,
    paddingBottom: 32,
  },
  reportIntro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 25,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  introText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: COLORS.green,
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.dark,
  },
  introSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.greenLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.green,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 25,
  },
  metricCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "42%",
    minHeight: 157,
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricCardAccent: {
    backgroundColor: "#F0F5F1",
    borderColor: "#DCE8DF",
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  metricIconAccent: {
    backgroundColor: "#DDEAE1",
  },
  metricIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  metricDotAccent: {
    backgroundColor: COLORS.brown,
  },
  metricIndicatorText: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.muted,
  },
  metricValue: {
    fontSize: 27,
    fontWeight: "800",
    color: COLORS.dark,
  },
  metricTitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
  },
  metricSubtitle: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
  },
  panel: {
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    marginBottom: 24,
  },
  panelHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 19,
  },
  panelIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  panelHeadingText: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
  },
  panelSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
    marginTop: 4,
  },
  coverageSummary: {
    flexDirection: "row",
    backgroundColor: "#FAF7F3",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
  },
  coverageBlock: {
    flex: 1,
    alignItems: "center",
  },
  coverageValue: {
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.dark,
  },
  coverageLabel: {
    marginTop: 4,
    fontSize: 11,
    color: COLORS.muted,
  },
  coverageDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  progressRow: {
    marginBottom: 16,
  },
  progressLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.dark,
  },
  progressCount: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.dark,
  },
  progressPercent: {
    fontWeight: "400",
    color: COLORS.muted,
  },
  progressTrack: {
    height: 7,
    borderRadius: 5,
    backgroundColor: COLORS.track,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 5,
  },
  panelFootnote: {
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.muted,
    marginTop: 1,
  },
  sectionMeta: {
    fontSize: 11,
    color: COLORS.muted,
  },
  speciesList: {
    gap: 19,
  },
  speciesRow: {
    gap: 9,
  },
  speciesNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  speciesIndex: {
    width: 25,
    height: 25,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4EEE8",
  },
  speciesIndexPrimary: {
    backgroundColor: COLORS.greenLight,
  },
  speciesIndexText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.brown,
  },
  speciesIndexTextPrimary: {
    color: COLORS.green,
  },
  speciesName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.dark,
  },
  speciesCount: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
  },
  chartEmpty: {
    alignItems: "center",
    paddingVertical: 22,
    gap: 10,
  },
  chartEmptyText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 4,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.dark,
  },
  recordSubtitle: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.muted,
    marginTop: 4,
  },
  recordValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.dark,
  },
  recordValueSuffix: {
    fontSize: 9,
    fontWeight: "500",
    color: COLORS.muted,
  },
  recordDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 3,
    marginTop: -4,
  },
  footerText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    color: COLORS.muted,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    textAlign: "center",
    marginTop: 15,
  },
  stateSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 7,
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#F7EAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 17,
    backgroundColor: COLORS.green,
    paddingHorizontal: 19,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
  },
});
