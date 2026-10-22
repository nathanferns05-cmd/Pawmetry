import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addMedication,
  deleteMedication,
  getMedication,
  getUserPets,
  updateMedication,
} from "../../services/userService";

import {
  cancelMedicationReminders,
  scheduleMedicationReminders,
  setupNotifications,
} from "../../utils/notifications";

// Reads "08:30 AM" / "20:30" style times saved by older app versions.
function parseTimeText(text: string | undefined) {
  const match = text?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]) % 24;
  const minute = Number(match[2]) % 60;
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

export default function AddMedication() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    medicationId?: string;
    petId?: string;
  }>();
  const isEditing = Boolean(params.medicationId && params.petId);
  const [existingNotificationIds, setExistingNotificationIds] =
    useState<string[]>([]);
  const [active, setActive] = useState(true);

  const [pets, setPets] = useState<any[]>([]);
  const [selectedPet, setSelectedPet] = useState<any>(null);

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");

  const [frequency, setFrequency] =
    useState("Once a day");

  const [time, setTime] = useState(new Date());

  const [startDate, setStartDate] =
    useState(new Date());

  const [endDate, setEndDate] =
    useState(new Date());

  const [notes, setNotes] = useState("");

  const [showTimePicker, setShowTimePicker] =
    useState(false);

  const [showStartPicker, setShowStartPicker] =
    useState(false);

  const [showEndPicker, setShowEndPicker] =
    useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const userPets = await getUserPets();

      setPets(userPets);

      if (userPets.length > 0) {
        setSelectedPet(
          userPets.find((pet) => pet.id === params.petId) ||
            userPets[0],
        );
      }

      if (isEditing) {
        await loadMedication();
      }
    } catch (error) {
      setError("Unable to load your pets.");
    }
  };

  const loadMedication = async () => {
    const medication = await getMedication(
      params.petId as string,
      params.medicationId as string,
    );

    if (!medication) {
      setError("This medication no longer exists.");
      return;
    }

    setName(medication.name || "");
    setDosage(medication.dosage || "");
    setFrequency(medication.frequency || "Once a day");
    setNotes(medication.notes || "");
    setActive(medication.active ?? true);
    setExistingNotificationIds(medication.notificationIds || []);

    const reminder =
      typeof medication.reminderHour === "number" &&
      typeof medication.reminderMinute === "number"
        ? {
            hour: medication.reminderHour,
            minute: medication.reminderMinute,
          }
        : parseTimeText(medication.time);

    if (reminder) {
      const reminderTime = new Date();
      reminderTime.setHours(reminder.hour, reminder.minute, 0, 0);
      setTime(reminderTime);
    }

    if (medication.startDate) {
      setStartDate(new Date(medication.startDate));
    }

    if (medication.endDate) {
      setEndDate(new Date(medication.endDate));
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    setError("");

    if (!selectedPet) {
      setError("Please select a pet.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter the medication name.");
      return;
    }

    if (!dosage.trim()) {
      setError("Please enter the dosage.");
      return;
    }

    if (endDate < startDate) {
      setError(
        "The end date cannot be before the start date."
      );
      return;
    }

    setSaving(true);

    try {
      // Replace the old reminders rather than stacking new ones on top.
      if (isEditing) {
        await cancelMedicationReminders(existingNotificationIds);
      }

      let notificationIds: string[] = [];

      const notificationsEnabled =
        active && (await setupNotifications());

      if (notificationsEnabled) {
        notificationIds = await scheduleMedicationReminders({
          medicationName: name.trim(),
          dosage: dosage.trim(),
          frequency,
          hour: time.getHours(),
          minute: time.getMinutes(),
          startDate,
          endDate,
        });
      }

      const medicationData = {
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        time: formatTime(time),
        reminderHour: time.getHours(),
        reminderMinute: time.getMinutes(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        notes: notes.trim(),
        active,
        notificationIds,
      };

      if (isEditing && selectedPet.id === params.petId) {
        await updateMedication(
          selectedPet.id,
          params.medicationId as string,
          medicationData,
        );
      } else {
        await addMedication(selectedPet.id, medicationData);

        // Editing moved this medication to another pet.
        if (isEditing) {
          await deleteMedication(
            params.petId as string,
            params.medicationId as string,
          );
        }
      }

      router.back();
    } catch (error) {
      console.log(error);

      setError(
        "Unable to save this medication. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>✚</Text>
          </View>

          <View>
            <Text style={styles.title}>
              {isEditing ? "Edit Medication" : "Add Medication"}
            </Text>

            <Text style={styles.subtitle}>
              Keep your pet's medication on track
            </Text>
          </View>
        </View>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Pet Selection */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconGreen}>
              <Text style={styles.sectionIconText}>
                🐾
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Pet
              </Text>

              <Text style={styles.sectionSubtitle}>
                Who is this medication for?
              </Text>
            </View>
          </View>

          {pets.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petList}
            >
              {pets.map((pet) => (
                <Pressable
                  key={pet.id}
                  style={[
                    styles.petButton,
                    selectedPet?.id === pet.id &&
                      styles.selectedPetButton,
                  ]}
                  onPress={() => setSelectedPet(pet)}
                >
                  <Text
                    style={[
                      styles.petButtonText,
                      selectedPet?.id === pet.id &&
                        styles.selectedPetButtonText,
                    ]}
                  >
                    {pet.petName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {pets.length === 1 && selectedPet && (
            <View style={styles.selectedPetCard}>
              <View style={styles.petAvatar}>
                <Text style={styles.petAvatarText}>
                  🐾
                </Text>
              </View>

              <View style={styles.petInfoText}>
                <Text style={styles.petInfoLabel}>
                  Medication for
                </Text>

                <Text style={styles.petInfoName}>
                  {selectedPet.petName}
                </Text>
              </View>

              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>
          )}
        </View>

        {/* Medication Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBrown}>
              <Text style={styles.sectionIconText}>
                💊
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Medication Details
              </Text>

              <Text style={styles.sectionSubtitle}>
                Enter the medication information
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Medication Name
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Amoxicillin"
              placeholderTextColor="#A58B7B"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Dosage
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. 1 tablet"
              placeholderTextColor="#A58B7B"
              value={dosage}
              onChangeText={setDosage}
            />
          </View>

          <View style={styles.fieldLast}>
            <Text style={styles.label}>
              Frequency
            </Text>

            <View style={styles.frequencyContainer}>
              {[
                "Once a day",
                "Twice a day",
                "Three times a day",
                "As needed",
              ].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.frequencyButton,
                    frequency === option &&
                      styles.selectedFrequency,
                  ]}
                  onPress={() => setFrequency(option)}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === option &&
                        styles.selectedFrequencyText,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconPurple}>
              <Text style={styles.sectionIconText}>
                🕐
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Schedule
              </Text>

              <Text style={styles.sectionSubtitle}>
                Set when the medication should be given
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Reminder Time
            </Text>

            <Pressable
              style={styles.scheduleButton}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.scheduleIcon}>
                <Text>🕐</Text>
              </View>

              <View style={styles.scheduleTextContainer}>
                <Text style={styles.scheduleLabel}>
                  Reminder
                </Text>

                <Text style={styles.scheduleValue}>
                  {formatTime(time)}
                </Text>
              </View>

              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);

                  if (selectedTime) {
                    setTime(selectedTime);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.label}>
                Start Date
              </Text>

              <Pressable
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateIcon}>📅</Text>

                <Text style={styles.dateButtonText}>
                  {formatDate(startDate)}
                </Text>
              </Pressable>

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  minimumDate={isEditing ? undefined : new Date()}
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);

                    if (selectedDate) {
                      setStartDate(selectedDate);

                      if (selectedDate > endDate) {
                        setEndDate(selectedDate);
                      }
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.label}>
                End Date
              </Text>

              <Pressable
                style={styles.dateButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={styles.dateIcon}>📅</Text>

                <Text style={styles.dateButtonText}>
                  {formatDate(endDate)}
                </Text>
              </Pressable>

              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  minimumDate={startDate}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);

                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconPeach}>
              <Text style={styles.sectionIconText}>
                📝
              </Text>
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Notes
              </Text>

              <Text style={styles.sectionSubtitle}>
                Add any helpful instructions
              </Text>
            </View>
          </View>

          <TextInput
            style={[
              styles.input,
              styles.notesInput,
            ]}
            placeholder="e.g. Give after food"
            placeholderTextColor="#A58B7B"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>!</Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Save */}
        <Pressable
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.saveIcon}>
                ✓
              </Text>

              <Text style={styles.saveButtonText}>
                Save Medication
              </Text>
            </>
          )}
        </Pressable>

        <Text style={styles.bottomHint}>
          You can manage this medication from the Health tab.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F3EF",
    paddingTop: 52,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6B4A3A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  back: {
    fontSize: 34,
    color: "#4A2D1F",
    lineHeight: 36,
    marginTop: -3,
  },

  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#3E2A20",
  },

  subtitle: {
    fontSize: 11,
    color: "#907565",
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 45,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EDE3DC",
    shadowColor: "#6B4A3A",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionIconGreen: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E6F1EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionIconBrown: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F4E7DE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionIconPurple: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#ECE8F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionIconPeach: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#F9E9DE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionIconText: {
    fontSize: 19,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3E2A20",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#927A6B",
    marginTop: 2,
  },

  field: {
    marginBottom: 17,
  },

  fieldLast: {
    marginBottom: 0,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#604738",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FAF7F4",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6DCD5",
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    color: "#2D160B",
  },

  notesInput: {
    minHeight: 105,
    paddingTop: 14,
  },

  petList: {
    paddingVertical: 2,
  },

  petButton: {
    backgroundColor: "#F4EEE9",
    borderWidth: 1,
    borderColor: "#E5D9D0",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
    marginRight: 9,
  },

  selectedPetButton: {
    backgroundColor: "#4D7C6B",
    borderColor: "#4D7C6B",
  },

  petButtonText: {
    color: "#6B4A3A",
    fontWeight: "700",
    fontSize: 14,
  },

  selectedPetButtonText: {
    color: "#FFFFFF",
  },

  selectedPetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF6F2",
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
    borderColor: "#D5E7DE",
  },

  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#DCECE5",
    alignItems: "center",
    justifyContent: "center",
  },

  petAvatarText: {
    fontSize: 21,
  },

  petInfoText: {
    flex: 1,
    marginLeft: 12,
  },

  petInfoLabel: {
    color: "#789487",
    fontSize: 11,
    fontWeight: "600",
  },

  petInfoName: {
    color: "#365C4E",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
  },

  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4D7C6B",
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  frequencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  frequencyButton: {
    backgroundColor: "#F4EEE9",
    borderWidth: 1,
    borderColor: "#E5D9D0",
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  selectedFrequency: {
    backgroundColor: "#7A4E32",
    borderColor: "#7A4E32",
  },

  frequencyText: {
    color: "#6B4A3A",
    fontWeight: "600",
    fontSize: 13,
  },

  selectedFrequencyText: {
    color: "#FFFFFF",
  },

  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F5FB",
    borderWidth: 1,
    borderColor: "#E4DDEE",
    borderRadius: 16,
    padding: 13,
  },

  scheduleIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#EDE7F5",
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleTextContainer: {
    flex: 1,
    marginLeft: 11,
  },

  scheduleLabel: {
    fontSize: 11,
    color: "#8C7B9D",
    fontWeight: "600",
  },

  scheduleValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4D3D5C",
    marginTop: 2,
  },

  chevron: {
    fontSize: 25,
    color: "#9B8AA9",
    marginRight: 4,
  },

  dateRow: {
    flexDirection: "row",
    gap: 10,
  },

  dateColumn: {
    flex: 1,
  },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F3",
    borderWidth: 1,
    borderColor: "#E9DCD3",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 13,
  },

  dateIcon: {
    fontSize: 16,
    marginRight: 7,
  },

  dateButtonText: {
    color: "#4A2D1F",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#F3C9C5",
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
  },

  errorIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: "#C62828",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 23,
    fontWeight: "800",
    marginRight: 9,
  },

  errorText: {
    flex: 1,
    color: "#B3261E",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  saveButton: {
    flexDirection: "row",
    backgroundColor: "#4D7C6B",
    borderRadius: 17,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    shadowColor: "#4D7C6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },

  saveIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 8,
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  bottomHint: {
    textAlign: "center",
    color: "#9A8375",
    fontSize: 11,
    marginTop: 13,
    paddingHorizontal: 20,
  },
});