import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Analysis = {
  level: string;
  possibleCauses: string;
  monitor: string;
  nextStep: string;
  emergency: string;
};

export default function SymptomChecker() {
  const router = useRouter();

  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");

  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const checkSymptoms = async () => {
    setError("");
    setAnalysis(null);

    if (!symptoms.trim()) {
      setError("Please describe your pet's symptoms.");
      return;
    }

    if (!duration) {
      setError("Please select how long the symptoms have been present.");
      return;
    }

    if (!severity) {
      setError("Please select the severity of the symptoms.");
      return;
    }

    setChecking(true);

    try {
      const response = await fetch(
        "http://192.168.176.147:5001/pawmetry-62af8/us-central1/analyzeSymptoms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symptoms: symptoms.trim(),
            duration,
            severity,
            species: "Dog",
            age: "Unknown",
          }),
        },
      );

      console.log("Vet-Bot status:", response.status);

      const responseText = await response.text();

      console.log("Vet-Bot response:", responseText);

      if (!response.ok) {
        throw new Error(responseText || "Backend request failed.");
      }

      const data = JSON.parse(responseText);

      setAnalysis(data);
    } catch (error) {
      console.log("========== VET-BOT ERROR ==========");
      console.log(error);
      console.log("===================================");

      setError(
        error instanceof Error ? error.message : "Unknown Vet-Bot error",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        {/* =========================
            HEADER
        ========================= */}

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
              Symptom Checker
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* =========================
              VET-BOT INTRO
          ========================= */}

          <View style={styles.infoCard}>
            <View style={styles.infoTopRow}>
              <View style={styles.infoIconCircle}>
                <Text style={styles.infoIcon}>✚</Text>
              </View>

              <View style={styles.infoTitleContainer}>
                <Text style={styles.infoEyebrow}>
                  PAWMETRY AI
                </Text>

                <Text style={styles.infoTitle}>
                  Vet-Bot
                </Text>
              </View>

              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>
                  AI
                </Text>
              </View>
            </View>

            <Text style={styles.infoText}>
              Describe what you're noticing about your pet.
              Vet-Bot will help you understand the level of
              concern and what you should monitor.
            </Text>

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerIcon}>
                i
              </Text>

              <Text style={styles.disclaimer}>
                This is an informational screening tool and
                does not replace professional veterinary
                advice.
              </Text>
            </View>
          </View>

          {/* =========================
              SYMPTOMS
          ========================= */}

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>
                  1
                </Text>
              </View>

              <Text style={styles.label}>
                What symptoms are you noticing?
              </Text>
            </View>

            <View style={styles.inputCard}>
              <TextInput
                style={styles.textArea}
                placeholder="e.g. vomiting, coughing, loss of appetite..."
                placeholderTextColor="#A18D80"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.inputHint}>
                <Text style={styles.inputHintIcon}>
                  ✎
                </Text>

                <Text style={styles.inputHintText}>
                  Be as specific as possible
                </Text>
              </View>
            </View>
          </View>

          {/* =========================
              DURATION
          ========================= */}

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>
                  2
                </Text>
              </View>

              <Text style={styles.label}>
                How long has this been happening?
              </Text>
            </View>

            <View style={styles.options}>
              {[
                "Less than a day",
                "1–3 days",
                "More than 3 days",
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.option,
                    duration === option &&
                      styles.selectedOption,
                  ]}
                  onPress={() => setDuration(option)}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      duration === option &&
                        styles.selectedOptionIcon,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionIconText,
                        duration === option &&
                          styles.selectedOptionIconText,
                      ]}
                    >
                      ◷
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      duration === option &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>

                  {duration === option && (
                    <Text style={styles.checkMark}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* =========================
              SEVERITY
          ========================= */}

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>
                  3
                </Text>
              </View>

              <Text style={styles.label}>
                How severe does it seem?
              </Text>
            </View>

            <View style={styles.severityOptions}>
              {["Mild", "Moderate", "Severe"].map(
                (option) => (
                  <Pressable
                    key={option}
                    style={[
                      styles.severityOption,
                      severity === option &&
                        styles.selectedSeverity,
                      option === "Mild" &&
                        severity !== option &&
                        styles.mildOption,
                      option === "Moderate" &&
                        severity !== option &&
                        styles.moderateOption,
                      option === "Severe" &&
                        severity !== option &&
                        styles.severeOption,
                    ]}
                    onPress={() => setSeverity(option)}
                  >
                    <View
                      style={[
                        styles.severityDot,
                        option === "Mild" &&
                          styles.mildDot,
                        option === "Moderate" &&
                          styles.moderateDot,
                        option === "Severe" &&
                          styles.severeDot,
                        severity === option &&
                          styles.selectedSeverityDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.severityText,
                        severity === option &&
                          styles.selectedSeverityText,
                      ]}
                    >
                      {option}
                    </Text>

                    {severity === option && (
                      <Text style={styles.severityCheck}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ),
              )}
            </View>
          </View>

          {/* =========================
              ERROR
          ========================= */}

          {error ? (
            <View style={styles.errorBox}>
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>
                  !
                </Text>
              </View>

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* =========================
              CHECK BUTTON
          ========================= */}

          <Pressable
            style={[
              styles.checkButton,
              checking && styles.disabledButton,
            ]}
            onPress={checkSymptoms}
            disabled={checking}
          >
            {checking ? (
              <>
                <ActivityIndicator color="#FFFFFF" />

                <Text style={styles.checkingText}>
                  Analyzing symptoms...
                </Text>
              </>
            ) : (
              <>
                <View style={styles.checkButtonIcon}>
                  <Text style={styles.checkButtonIconText}>
                    ✦
                  </Text>
                </View>

                <Text style={styles.checkButtonText}>
                  Check Symptoms
                </Text>

                <Text style={styles.checkButtonArrow}>
                  →
                </Text>
              </>
            )}
          </Pressable>

          {/* =========================
              RESULTS
          ========================= */}

          {analysis && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeadingRow}>
                <View style={styles.resultHeadingIcon}>
                  <Text style={styles.resultHeadingIconText}>
                    ✓
                  </Text>
                </View>

                <View>
                  <Text style={styles.resultEyebrow}>
                    VET-BOT RESULTS
                  </Text>

                  <Text style={styles.resultHeading}>
                    Assessment
                  </Text>
                </View>
              </View>

              {/* Concern Level */}

              <View style={styles.concernCard}>
                <View style={styles.resultCardTop}>
                  <Text style={styles.resultLabel}>
                    Concern Level
                  </Text>

                  <View style={styles.resultCardIcon}>
                    <Text style={styles.resultCardIconText}>
                      !
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultLevel}>
                  {analysis.level}
                </Text>
              </View>

              {/* Possible Causes */}

              <View style={styles.resultCard}>
                <View style={styles.resultCardTop}>
                  <Text style={styles.resultLabel}>
                    Possible Causes
                  </Text>

                  <View style={styles.causesIcon}>
                    <Text style={styles.resultCardIconText}>
                      ?
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultText}>
                  {analysis.possibleCauses}
                </Text>
              </View>

              {/* Monitor */}

              <View style={styles.monitorCard}>
                <View style={styles.resultCardTop}>
                  <Text style={styles.resultLabel}>
                    What to Monitor
                  </Text>

                  <View style={styles.monitorIcon}>
                    <Text style={styles.resultCardIconText}>
                      ◉
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultText}>
                  {analysis.monitor}
                </Text>
              </View>

              {/* Next Step */}

              <View style={styles.nextStepCard}>
                <View style={styles.resultCardTop}>
                  <Text style={styles.resultLabel}>
                    Recommended Next Step
                  </Text>

                  <View style={styles.nextStepIcon}>
                    <Text style={styles.resultCardIconText}>
                      →
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultText}>
                  {analysis.nextStep}
                </Text>
              </View>

              {/* Emergency */}

              <View style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <View style={styles.warningIcon}>
                    <Text style={styles.warningIconText}>
                      !
                    </Text>
                  </View>

                  <Text style={styles.warningTitle}>
                    Emergency Warning Signs
                  </Text>
                </View>

                <Text style={styles.warningText}>
                  {analysis.emergency}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  /* =========================
     CONTAINER
  ========================= */

  container: {
    flex: 1,
    backgroundColor: "#F5F1ED",
  },

  backgroundImage: {
    opacity: 0.2,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(250, 247, 243, 0.62)",
    paddingTop: 52,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 16,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4D9D1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4D3A30",
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

  headerSpacer: {
    width: 44,
  },

  /* =========================
     CONTENT
  ========================= */

  content: {
    paddingHorizontal: 18,
    paddingBottom: 45,
  },

  /* =========================
     INFO CARD
  ========================= */

  infoCard: {
    backgroundColor: "#4D7C6B",
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
    overflow: "hidden",
    shadowColor: "#385E50",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },

  infoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  infoIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoIcon: {
    color: "#4D7C6B",
    fontSize: 25,
    fontWeight: "900",
  },

  infoTitleContainer: {
    flex: 1,
  },

  infoEyebrow: {
    color: "#CFE4DA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 1,
  },

  infoTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
  },

  aiBadge: {
    backgroundColor: "#E8F2ED",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
  },

  aiBadgeText: {
    color: "#4D7C6B",
    fontSize: 10,
    fontWeight: "900",
  },

  infoText: {
    fontSize: 13,
    color: "#EDF7F2",
    lineHeight: 20,
  },

  disclaimerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 14,
  },

  disclaimerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    color: "#4D7C6B",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 12,
    fontWeight: "900",
    marginRight: 8,
  },

  disclaimer: {
    flex: 1,
    fontSize: 10,
    color: "#D9ECE4",
    lineHeight: 15,
    fontStyle: "italic",
  },

  /* =========================
     SECTIONS
  ========================= */

  section: {
    marginBottom: 23,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  sectionNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#493126",
  },

  /* =========================
     SYMPTOM INPUT
  ========================= */

  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4DAD3",
    overflow: "hidden",
    shadowColor: "#5C4436",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  textArea: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    fontSize: 14,
    color: "#38261D",
    minHeight: 125,
  },

  inputHint: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0E8E2",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  inputHintIcon: {
    color: "#4D7C6B",
    fontSize: 12,
    marginRight: 5,
  },

  inputHintText: {
    color: "#9A8476",
    fontSize: 10,
    fontWeight: "600",
  },

  /* =========================
     DURATION
  ========================= */

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4DAD3",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  selectedOption: {
    backgroundColor: "#4D7C6B",
    borderColor: "#4D7C6B",
  },

  optionIcon: {
    width: 25,
    height: 25,
    borderRadius: 8,
    backgroundColor: "#EAF2EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  selectedOptionIcon: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  optionIconText: {
    color: "#4D7C6B",
    fontSize: 12,
    fontWeight: "900",
  },

  selectedOptionIconText: {
    color: "#FFFFFF",
  },

  optionText: {
    color: "#6C5547",
    fontSize: 11,
    fontWeight: "800",
  },

  selectedOptionText: {
    color: "#FFFFFF",
  },

  checkMark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 7,
  },

  /* =========================
     SEVERITY
  ========================= */

  severityOptions: {
    flexDirection: "row",
    gap: 9,
  },

  severityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4DAD3",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  mildOption: {
    backgroundColor: "#EEF6F1",
    borderColor: "#D6E8DD",
  },

  moderateOption: {
    backgroundColor: "#FFF5E7",
    borderColor: "#F0DDC0",
  },

  severeOption: {
    backgroundColor: "#FCEDEA",
    borderColor: "#EFD2CB",
  },

  selectedSeverity: {
    backgroundColor: "#4D7C6B",
    borderColor: "#4D7C6B",
  },

  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  mildDot: {
    backgroundColor: "#62A17F",
  },

  moderateDot: {
    backgroundColor: "#D69B42",
  },

  severeDot: {
    backgroundColor: "#C45E49",
  },

  selectedSeverityDot: {
    backgroundColor: "#FFFFFF",
  },

  severityText: {
    color: "#654D40",
    fontSize: 11,
    fontWeight: "800",
  },

  selectedSeverityText: {
    color: "#FFFFFF",
  },

  severityCheck: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 5,
  },

  /* =========================
     ERROR
  ========================= */

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCECEA",
    borderWidth: 1,
    borderColor: "#EFCFCA",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 13,
  },

  errorIcon: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: "#C85C48",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  errorIconText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  errorText: {
    flex: 1,
    color: "#A33F31",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },

  /* =========================
     CHECK BUTTON
  ========================= */

  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4D7C6B",
    borderRadius: 17,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#385E50",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.72,
  },

  checkButtonIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  checkButtonIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  checkButtonArrow: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  checkingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 9,
  },

  /* =========================
     RESULTS
  ========================= */

  resultContainer: {
    marginTop: 28,
  },

  resultHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  resultHeadingIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  resultHeadingIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  resultEyebrow: {
    color: "#4D7C6B",
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: "900",
  },

  resultHeading: {
    fontSize: 21,
    fontWeight: "900",
    color: "#3D2A20",
    marginTop: 1,
  },

  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E4DAD3",
    padding: 16,
    marginBottom: 11,
    shadowColor: "#5C4436",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },

  concernCard: {
    backgroundColor: "#EEF6F1",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D4E7DC",
    padding: 16,
    marginBottom: 11,
  },

  monitorCard: {
    backgroundColor: "#F0F6F8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D7E6EA",
    padding: 16,
    marginBottom: 11,
  },

  nextStepCard: {
    backgroundColor: "#F5F0FA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3D8EC",
    padding: 16,
    marginBottom: 11,
  },

  resultCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  resultLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    color: "#806B5D",
  },

  resultCardIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: "#DCEBE3",
    alignItems: "center",
    justifyContent: "center",
  },

  causesIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: "#F2E6DC",
    alignItems: "center",
    justifyContent: "center",
  },

  monitorIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: "#DDECEF",
    alignItems: "center",
    justifyContent: "center",
  },

  nextStepIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: "#E7DCEF",
    alignItems: "center",
    justifyContent: "center",
  },

  resultCardIconText: {
    color: "#4D7C6B",
    fontSize: 11,
    fontWeight: "900",
  },

  resultLevel: {
    fontSize: 20,
    fontWeight: "900",
    color: "#4D7C6B",
  },

  resultText: {
    fontSize: 14,
    color: "#5C4030",
    lineHeight: 21,
  },

  /* =========================
     WARNING
  ========================= */

  warningCard: {
    backgroundColor: "#FFF0E8",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EBCFC1",
    padding: 16,
    marginTop: 2,
  },

  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  warningIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "#C45E49",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  warningIconText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  warningTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#8A3D24",
  },

  warningText: {
    fontSize: 13,
    color: "#704331",
    lineHeight: 20,
  },
});