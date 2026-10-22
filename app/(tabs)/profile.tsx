import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Camera,
  LogOut,
  PawPrint,
  Save,
  User,
} from "lucide-react-native";
import Fuse from "fuse.js";
import { Dropdown } from "react-native-element-dropdown";

import dogBreeds from "../../data/dogBreeds.json";
import catBreeds from "../../data/catBreeds.json";

import {
  getOwnerProfile,
  getUserPets,
  updateOwnerProfile,
  updatePet,
} from "../../services/userService";

import { auth } from "../../config/firebaseConfig";
import { uploadImageToCloudinary } from "../../utils/cloudinary";

const speciesList = [
  { label: "Dog", value: "Dog" },
  { label: "Cat", value: "Cat" },
  { label: "Bird", value: "Bird" },
  { label: "Fish", value: "Fish" },
  { label: "Rabbit", value: "Rabbit" },
  { label: "Hamster", value: "Hamster" },
  { label: "Turtle", value: "Turtle" },
  { label: "Other", value: "Other" },
];

const genderList = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
];

const weightUnits = [
  { label: "Kilograms (kg)", value: "kg" },
  { label: "Pounds (lbs)", value: "lbs" },
];

const standardSpecies = [
  "Dog",
  "Cat",
  "Bird",
  "Fish",
  "Rabbit",
  "Hamster",
  "Turtle",
];

type ProfileData = {
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  emergencyContact: string;
};

type PetData = {
  id: string;
  petName: string;
  species: string;
  breed: string;
  gender: string;
  age: string;
  weight: string;
  weightUnit: string;
  vaccinated: boolean;
  microchipped: boolean;
  petPhoto: string;
};

export default function ProfileScreen() {
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);

          try {
            await signOut(auth);
            router.replace("/");
          } catch (error) {
            console.log("Logout failed:", error);
            Alert.alert("Error", "Unable to log out. Please try again.");
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    emergencyContact: "",
  });

  const [pets, setPets] = useState<PetData[]>([]);
  const [selectedPetIndex, setSelectedPetIndex] = useState(0);

  const [species, setSpecies] = useState("Dog");
  const [breedSearch, setBreedSearch] = useState("");
  const [breedSuggestions, setBreedSuggestions] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPet = pets[selectedPetIndex];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedPet) return;

    const isStandardSpecies = standardSpecies.includes(
      selectedPet.species,
    );

    setSpecies(
      isStandardSpecies
        ? selectedPet.species
        : "Other",
    );

    setBreedSearch(selectedPet.breed || "");
    setBreedSuggestions([]);
  }, [selectedPetIndex, pets]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileData, userPets] =
        await Promise.all([
          getOwnerProfile(),
          getUserPets(),
        ]);

      if (profileData) {
        setProfile({
          fullName: String(
            profileData.fullName || "",
          ),
          phone: String(
            profileData.phone || "",
          ),
          country: String(
            profileData.country || "",
          ),
          state: String(
            profileData.state || "",
          ),
          city: String(
            profileData.city || "",
          ),
          emergencyContact: String(
            profileData.emergencyContact || "",
          ),
        });
      }

      const formattedPets: PetData[] =
        userPets.map((pet: any) => {
          const rawWeight = String(
            pet.weight || "",
          ).trim();

          let parsedWeight = rawWeight;
          let parsedUnit = String(
            pet.weightUnit || "kg",
          );

          const weightMatch =
            rawWeight.match(
              /^([\d.]+)\s*(kg|kgs|lbs|lb)$/i,
            );

          if (weightMatch) {
            parsedWeight = weightMatch[1];

            parsedUnit = weightMatch[2]
              .toLowerCase()
              .startsWith("lb")
              ? "lbs"
              : "kg";
          }

          return {
            id: String(pet.id),
            petName: String(
              pet.petName || "",
            ),
            species: String(
              pet.species || "Dog",
            ),
            breed: String(
              pet.breed || "",
            ),
            gender: String(
              pet.gender || "Male",
            ),
            age: String(
              pet.age ?? "",
            ),
            weight: parsedWeight,
            weightUnit: parsedUnit,
            vaccinated:
              pet.vaccinated === true,
            microchipped:
              pet.microchipped === true,
            petPhoto: String(
              pet.petPhoto || "",
            ),
          };
        });

      setPets(formattedPets);
    } catch (error) {
      console.log(
        "Failed to load profile:",
        error,
      );

      setError(
        "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProfileField = (
    field: keyof ProfileData,
    value: string,
  ) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  const updatePetField = (
    field: keyof PetData,
    value: string | boolean,
  ) => {
    setPets((current) =>
      current.map((pet, index) =>
        index === selectedPetIndex
          ? {
              ...pet,
              [field]: value,
            }
          : pet,
      ),
    );

    setError("");
    setSuccess("");
  };

  /*
   * CHANGE PET PHOTO
   */
  const handleChangePetPhoto = async () => {
    if (!selectedPet) return;

    try {
      setError("");
      setSuccess("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError(
          "Please allow photo library access to change your pet's picture.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const selectedImage =
        result.assets[0].uri;

      setUploadingPhoto(true);

      const uploaded =
        await uploadImageToCloudinary(
          selectedImage,
        );

      updatePetField(
        "petPhoto",
        uploaded.url,
      );

      setSuccess(
        "Pet picture selected. Press Save Pet to save it.",
      );
    } catch (error) {
      console.log(
        "Failed to change pet photo:",
        error,
      );

      setError(
        "Unable to upload the new pet picture. Please try again.",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const searchBreed = (text: string) => {
    setBreedSearch(text);
    updatePetField("breed", text);

    if (
      !text.trim() ||
      (species !== "Dog" &&
        species !== "Cat")
    ) {
      setBreedSuggestions([]);
      return;
    }

    const breedList =
      species === "Dog"
        ? dogBreeds
        : catBreeds;

    const fuse = new Fuse(breedList, {
      threshold: 0.4,
    });

    const results = fuse.search(text);

    setBreedSuggestions(
      results
        .slice(0, 8)
        .map((item) =>
          String(item.item),
        ),
    );
  };

  const changeSpecies = (
    value: string,
  ) => {
    setSpecies(value);

    updatePetField(
      "species",
      value,
    );

    updatePetField(
      "breed",
      "",
    );

    setBreedSearch("");
    setBreedSuggestions([]);
  };

  const selectPet = (
    index: number,
  ) => {
    setSelectedPetIndex(index);
    setError("");
    setSuccess("");
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    if (!profile.fullName.trim()) {
      setError(
        "Please enter your full name.",
      );
      return;
    }

    if (!profile.phone.trim()) {
      setError(
        "Please enter your phone number.",
      );
      return;
    }

    if (!profile.country.trim()) {
      setError(
        "Please enter your country.",
      );
      return;
    }

    if (!profile.state.trim()) {
      setError(
        "Please enter your state.",
      );
      return;
    }

    if (!profile.city.trim()) {
      setError(
        "Please enter your city.",
      );
      return;
    }

    try {
      setSavingProfile(true);

      await updateOwnerProfile({
        fullName:
          profile.fullName.trim(),
        phone:
          profile.phone.trim(),
        country:
          profile.country.trim(),
        state:
          profile.state.trim(),
        city:
          profile.city.trim(),
        emergencyContact:
          profile.emergencyContact.trim(),
      });

      setSuccess(
        "Profile updated successfully.",
      );
    } catch (error) {
      console.log(
        "Failed to update profile:",
        error,
      );

      setError(
        "Unable to update your profile. Please try again.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePet = async () => {
    if (!selectedPet) return;

    setError("");
    setSuccess("");

    if (!selectedPet.petName.trim()) {
      setError(
        "Please enter your pet's name.",
      );
      return;
    }

    if (!selectedPet.weight.trim()) {
      setError(
        "Please enter your pet's weight.",
      );
      return;
    }

    if (
      (species === "Dog" ||
        species === "Cat") &&
      !selectedPet.breed.trim()
    ) {
      setError(
        "Please select your pet's breed.",
      );
      return;
    }

    try {
      setSavingPet(true);

      await updatePet(
        selectedPet.id,
        {
          petName:
            selectedPet.petName.trim(),
          species:
            selectedPet.species.trim(),
          breed:
            selectedPet.breed.trim(),
          gender:
            selectedPet.gender,
          age:
            parseInt(
              selectedPet.age,
              10,
            ) || 0,
          weight: `${selectedPet.weight.trim()} ${selectedPet.weightUnit}`,
          vaccinated:
            selectedPet.vaccinated,
          microchipped:
            selectedPet.microchipped,
          petPhoto:
            selectedPet.petPhoto,
        },
      );

      setSuccess(
        `${
          selectedPet.petName ||
          "Pet"
        } updated successfully.`,
      );
    } catch (error) {
      console.log(
        "Failed to update pet:",
        error,
      );

      setError(
        "Unable to update your pet. Please try again.",
      );
    } finally {
      setSavingPet(false);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("../../assets/images/Login_bg.jpg")}
        style={styles.container}
        resizeMode="cover"
        imageStyle={
          styles.backgroundImage
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#5B7F70"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading profile...
          </Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={
        styles.backgroundImage
      }
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardContainer
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <ArrowLeft
                size={21}
                color="#4A2D1F"
                strokeWidth={2}
              />
            </Pressable>

            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={styles.title}
              >
                Profile & Pets
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Manage your information
                and your pets
              </Text>
            </View>
          </View>

          {error ? (
            <View
              style={styles.errorBox}
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          ) : null}

          {success ? (
            <View
              style={
                styles.successBox
              }
            >
              <Text
                style={
                  styles.successText
                }
              >
                {success}
              </Text>
            </View>
          ) : null}

          {/* PERSONAL INFORMATION */}

          <View
            style={[
              styles.section,
              styles.profileSection,
            ]}
          >
            <View
              style={[
                styles.sectionHeader,
                styles.profileHeader,
              ]}
            >
              <View
                style={[
                  styles.sectionIcon,
                  styles.profileIcon,
                ]}
              >
                <User
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={1.9}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Personal information
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Your Pawmetry account details
                </Text>
              </View>
            </View>

            <Text style={styles.label}>
              Full name
            </Text>

            <TextInput
              style={styles.input}
              value={
                profile.fullName
              }
              onChangeText={(value) =>
                updateProfileField(
                  "fullName",
                  value,
                )
              }
              placeholder="Enter your full name"
              placeholderTextColor="#AA9688"
            />

            <Text style={styles.label}>
              Phone number
            </Text>

            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(value) =>
                updateProfileField(
                  "phone",
                  value,
                )
              }
              placeholder="Enter your phone number"
              placeholderTextColor="#AA9688"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>
              Emergency contact
            </Text>

            <TextInput
              style={styles.input}
              value={
                profile.emergencyContact
              }
              onChangeText={(value) =>
                updateProfileField(
                  "emergencyContact",
                  value,
                )
              }
              placeholder="Enter emergency contact"
              placeholderTextColor="#AA9688"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>
              Country
            </Text>

            <TextInput
              style={styles.input}
              value={profile.country}
              onChangeText={(value) =>
                updateProfileField(
                  "country",
                  value,
                )
              }
              placeholder="Enter your country"
              placeholderTextColor="#AA9688"
            />

            <Text style={styles.label}>
              State
            </Text>

            <TextInput
              style={styles.input}
              value={profile.state}
              onChangeText={(value) =>
                updateProfileField(
                  "state",
                  value,
                )
              }
              placeholder="Enter your state"
              placeholderTextColor="#AA9688"
            />

            <Text style={styles.label}>
              City
            </Text>

            <TextInput
              style={styles.input}
              value={profile.city}
              onChangeText={(value) =>
                updateProfileField(
                  "city",
                  value,
                )
              }
              placeholder="Enter your city"
              placeholderTextColor="#AA9688"
            />

            <Pressable
              style={[
                styles.saveButton,
                styles.profileSaveButton,
                savingProfile &&
                  styles.saveButtonDisabled,
              ]}
              onPress={
                handleSaveProfile
              }
              disabled={
                savingProfile
              }
            >
              {savingProfile ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Save
                    size={18}
                    color="#FFFFFF"
                    strokeWidth={2}
                  />

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Save Profile
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* PET */}

          <View
            style={[
              styles.section,
              styles.petSection,
            ]}
          >
            <View
              style={[
                styles.sectionHeader,
                styles.petHeader,
              ]}
            >
              <View
                style={[
                  styles.sectionIcon,
                  styles.petIcon,
                ]}
              >
                <PawPrint
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={1.9}
                />
              </View>

              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Your pets
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Update your pet's information
                </Text>
              </View>
            </View>

            {pets.length === 0 ? (
              <Text
                style={
                  styles.emptyText
                }
              >
                No pets were found on
                your account.
              </Text>
            ) : (
              <>
                {/* PET SELECTOR */}

                {pets.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    style={
                      styles.petSelector
                    }
                    contentContainerStyle={
                      styles.petSelectorContent
                    }
                  >
                    {pets.map(
                      (
                        pet,
                        index,
                      ) => (
                        <Pressable
                          key={pet.id}
                          style={[
                            styles.petChip,
                            index ===
                              selectedPetIndex &&
                              styles.petChipSelected,
                          ]}
                          onPress={() =>
                            selectPet(
                              index,
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.petChipText,
                              index ===
                                selectedPetIndex &&
                                styles.petChipTextSelected,
                            ]}
                          >
                            {pet.petName ||
                              `Pet ${
                                index +
                                1
                              }`}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </ScrollView>
                )}

                {selectedPet && (
                  <>
                    {/* PET PHOTO */}

                    <View
                      style={
                        styles.photoSection
                      }
                    >
                      <View
                        style={
                          styles.photoWrapper
                        }
                      >
                        {selectedPet.petPhoto ? (
                          <Image
                            source={{
                              uri: selectedPet.petPhoto,
                            }}
                            style={
                              styles.petPhoto
                            }
                          />
                        ) : (
                          <View
                            style={
                              styles.emptyPhoto
                            }
                          >
                            <PawPrint
                              size={42}
                              color="#7DA291"
                              strokeWidth={1.7}
                            />

                            <Text
                              style={
                                styles.noPhotoText
                              }
                            >
                              No photo
                            </Text>
                          </View>
                        )}
                      </View>

                      <Pressable
                        style={[
                          styles.changePhotoButton,
                          uploadingPhoto &&
                            styles.saveButtonDisabled,
                        ]}
                        onPress={
                          handleChangePetPhoto
                        }
                        disabled={
                          uploadingPhoto
                        }
                      >
                        {uploadingPhoto ? (
                          <ActivityIndicator
                            color="#FFFFFF"
                            size="small"
                          />
                        ) : (
                          <>
                            <Camera
                              size={17}
                              color="#FFFFFF"
                              strokeWidth={2}
                            />

                            <Text
                              style={
                                styles.changePhotoText
                              }
                            >
                              Change Pet Photo
                            </Text>
                          </>
                        )}
                      </Pressable>

                      <Text
                        style={
                          styles.photoHint
                        }
                      >
                        Choose a new photo from
                        your gallery
                      </Text>
                    </View>

                    {/* PET NAME */}

                    <Text
                      style={styles.label}
                    >
                      Pet name
                    </Text>

                    <TextInput
                      style={styles.input}
                      value={
                        selectedPet.petName
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updatePetField(
                          "petName",
                          value,
                        )
                      }
                      placeholder="Enter pet name"
                      placeholderTextColor="#AA9688"
                    />

                    {/* SPECIES */}

                    <Text
                      style={styles.label}
                    >
                      Species
                    </Text>

                    <Dropdown
                      style={
                        styles.dropdown
                      }
                      data={
                        speciesList
                      }
                      labelField="label"
                      valueField="value"
                      placeholder="Select species"
                      value={species}
                      onChange={(
                        item,
                      ) =>
                        changeSpecies(
                          item.value,
                        )
                      }
                    />

                    {/* OTHER SPECIES */}

                    {species ===
                      "Other" && (
                      <>
                        <Text
                          style={
                            styles.label
                          }
                        >
                          Animal type
                        </Text>

                        <TextInput
                          style={
                            styles.input
                          }
                          value={
                            selectedPet.species
                          }
                          onChangeText={(
                            value,
                          ) =>
                            updatePetField(
                              "species",
                              value,
                            )
                          }
                          placeholder="Enter animal type"
                          placeholderTextColor="#AA9688"
                        />
                      </>
                    )}

                    {/* BREED */}

                    {(species ===
                      "Dog" ||
                      species ===
                        "Cat") && (
                      <>
                        <Text
                          style={
                            styles.label
                          }
                        >
                          Breed
                        </Text>

                        <TextInput
                          style={
                            styles.input
                          }
                          value={
                            breedSearch
                          }
                          onChangeText={
                            searchBreed
                          }
                          placeholder="Search breed..."
                          placeholderTextColor="#AA9688"
                        />

                        {breedSuggestions.length >
                          0 && (
                          <View
                            style={
                              styles.suggestions
                            }
                          >
                            {breedSuggestions.map(
                              (
                                item,
                              ) => (
                                <Pressable
                                  key={
                                    item
                                  }
                                  style={
                                    styles.suggestion
                                  }
                                  onPress={() => {
                                    updatePetField(
                                      "breed",
                                      item,
                                    );

                                    setBreedSearch(
                                      item,
                                    );

                                    setBreedSuggestions(
                                      [],
                                    );
                                  }}
                                >
                                  <Text
                                    style={
                                      styles.suggestionText
                                    }
                                  >
                                    {
                                      item
                                    }
                                  </Text>
                                </Pressable>
                              ),
                            )}
                          </View>
                        )}
                      </>
                    )}

                    {/* GENDER */}

                    <Text
                      style={styles.label}
                    >
                      Gender
                    </Text>

                    <Dropdown
                      style={
                        styles.dropdown
                      }
                      data={
                        genderList
                      }
                      labelField="label"
                      valueField="value"
                      placeholder="Select gender"
                      value={
                        selectedPet.gender
                      }
                      onChange={(
                        item,
                      ) =>
                        updatePetField(
                          "gender",
                          item.value,
                        )
                      }
                    />

                    {/* AGE */}

                    <Text
                      style={styles.label}
                    >
                      Approximate age
                    </Text>

                    <TextInput
                      style={styles.input}
                      value={
                        selectedPet.age
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updatePetField(
                          "age",
                          value.replace(
                            /[^0-9]/g,
                            "",
                          ),
                        )
                      }
                      placeholder="Age in years"
                      placeholderTextColor="#AA9688"
                      keyboardType="number-pad"
                      maxLength={2}
                    />

                    {/* WEIGHT UNIT */}

                    <Text
                      style={styles.label}
                    >
                      Weight unit
                    </Text>

                    <Dropdown
                      style={
                        styles.dropdown
                      }
                      data={
                        weightUnits
                      }
                      labelField="label"
                      valueField="value"
                      placeholder="Select unit"
                      value={
                        selectedPet.weightUnit
                      }
                      onChange={(
                        item,
                      ) =>
                        updatePetField(
                          "weightUnit",
                          item.value,
                        )
                      }
                    />

                    {/* WEIGHT */}

                    <Text
                      style={styles.label}
                    >
                      Weight
                    </Text>

                    <TextInput
                      style={styles.input}
                      value={
                        selectedPet.weight
                      }
                      onChangeText={(
                        value,
                      ) =>
                        updatePetField(
                          "weight",
                          value.replace(
                            /[^0-9.]/g,
                            "",
                          ),
                        )
                      }
                      placeholder="Enter weight"
                      placeholderTextColor="#AA9688"
                      keyboardType="decimal-pad"
                    />

                    {/* VACCINATED */}

                    <View
                      style={
                        styles.switchContainer
                      }
                    >
                      <Text
                        style={
                          styles.switchText
                        }
                      >
                        Vaccinated
                      </Text>

                      <Switch
                        value={
                          selectedPet.vaccinated
                        }
                        onValueChange={(
                          value,
                        ) =>
                          updatePetField(
                            "vaccinated",
                            value,
                          )
                        }
                        trackColor={{
                          false:
                            "#D8CDC5",
                          true:
                            "#A9D8C4",
                        }}
                        thumbColor={
                          selectedPet.vaccinated
                            ? "#4D7C6B"
                            : "#F4F0ED"
                        }
                      />
                    </View>

                    {/* MICROCHIPPED */}

                    <View
                      style={
                        styles.switchContainer
                      }
                    >
                      <Text
                        style={
                          styles.switchText
                        }
                      >
                        Microchipped
                      </Text>

                      <Switch
                        value={
                          selectedPet.microchipped
                        }
                        onValueChange={(
                          value,
                        ) =>
                          updatePetField(
                            "microchipped",
                            value,
                          )
                        }
                        trackColor={{
                          false:
                            "#D8CDC5",
                          true:
                            "#A9D8C4",
                        }}
                        thumbColor={
                          selectedPet.microchipped
                            ? "#4D7C6B"
                            : "#F4F0ED"
                        }
                      />
                    </View>

                    {/* SAVE PET */}

                    <Pressable
                      style={[
                        styles.saveButton,
                        styles.petSaveButton,
                        savingPet &&
                          styles.saveButtonDisabled,
                      ]}
                      onPress={
                        handleSavePet
                      }
                      disabled={
                        savingPet
                      }
                    >
                      {savingPet ? (
                        <ActivityIndicator
                          color="#FFFFFF"
                        />
                      ) : (
                        <>
                          <Save
                            size={18}
                            color="#FFFFFF"
                            strokeWidth={2}
                          />

                          <Text
                            style={
                              styles.saveButtonText
                            }
                          >
                            Save Pet
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>

          <Pressable
            style={[
              styles.saveButton,
              styles.logoutButton,
              loggingOut && styles.saveButtonDisabled,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={18} color="#B75D45" strokeWidth={2} />

            <Text style={styles.logoutButtonText}>
              {loggingOut ? "Logging out..." : "Log Out"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  backgroundImage: {
    opacity: 0.2,
  },

  keyboardContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    fontSize: 13,
    color: "#6F5647",
    marginTop: 10,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9DDD4",
    marginRight: 13,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#4A2D1F",
  },

  subtitle: {
    fontSize: 12,
    color: "#8A6A55",
    marginTop: 3,
  },

  /* MESSAGES */

  errorBox: {
    backgroundColor: "#F7DDD9",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#EBC2BC",
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 13,
  },

  errorText: {
    color: "#A83E3E",
    fontSize: 12,
    fontWeight: "600",
  },

  successBox: {
    backgroundColor: "#DDEBE5",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#C7DED3",
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 13,
  },

  successText: {
    color: "#3F705E",
    fontSize: 12,
    fontWeight: "700",
  },

  /* SECTIONS */

  section: {
    borderRadius: 23,
    padding: 17,
    marginBottom: 18,
    borderWidth: 1,
    overflow: "hidden",
  },

  profileSection: {
    backgroundColor: "#FFFDFC",
    borderColor: "#E7D8CF",
  },

  petSection: {
    backgroundColor: "#FBFFFD",
    borderColor: "#D4E4DC",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },

  profileHeader: {
    borderBottomColor: "#F0E2DB",
  },

  petHeader: {
    borderBottomColor: "#DCEBE4",
  },

  sectionIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  profileIcon: {
    backgroundColor: "#B75D45",
  },

  petIcon: {
    backgroundColor: "#4D7C6B",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4A2D1F",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#8A6A55",
    marginTop: 3,
  },

  /* FORM */

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6F5647",
    marginBottom: 6,
    marginTop: 4,
  },

  input: {
    height: 47,
    borderRadius: 13,
    backgroundColor: "#F8F3EF",
    borderWidth: 1,
    borderColor: "#E8DAD1",
    paddingHorizontal: 13,
    fontSize: 13,
    color: "#4A2D1F",
    marginBottom: 13,
  },

  dropdown: {
    height: 47,
    borderRadius: 13,
    backgroundColor: "#F8F3EF",
    borderWidth: 1,
    borderColor: "#E8DAD1",
    paddingHorizontal: 13,
    marginBottom: 13,
  },

  /* PET PHOTO */

  photoSection: {
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 20,
  },

  photoWrapper: {
    width: 145,
    height: 145,
    borderRadius: 73,
    overflow: "hidden",
    backgroundColor: "#E8F0EC",
    borderWidth: 4,
    borderColor: "#D4E4DC",
    marginBottom: 12,
  },

  petPhoto: {
    width: "100%",
    height: "100%",
  },

  emptyPhoto: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0EC",
  },

  noPhotoText: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "600",
    color: "#6F8A7E",
  },

  changePhotoButton: {
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: "#4D7C6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  changePhotoText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  photoHint: {
    fontSize: 10,
    color: "#8A6A55",
    marginTop: 7,
  },

  /* SUGGESTIONS */

  suggestions: {
    marginTop: -7,
    marginBottom: 10,
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E9DDD4",
  },

  suggestion: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E7E1",
  },

  suggestionText: {
    fontSize: 13,
    color: "#4A2D1F",
  },

  /* PET SELECTOR */

  petSelector: {
    marginBottom: 16,
  },

  petSelectorContent: {
    gap: 8,
  },

  petChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: "#E8F0EC",
    borderWidth: 1,
    borderColor: "#D2E3DB",
  },

  petChipSelected: {
    backgroundColor: "#4D7C6B",
    borderColor: "#4D7C6B",
  },

  petChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#557064",
  },

  petChipTextSelected: {
    color: "#FFFFFF",
  },

  /* SWITCHES */

  switchContainer: {
    minHeight: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EAF3EE",
    borderRadius: 14,
    paddingHorizontal: 13,
    marginTop: 5,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#D8E8DF",
  },

  switchText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A665A",
  },

  /* BUTTONS */

  saveButton: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  profileSaveButton: {
    backgroundColor: "#B75D45",
    shadowColor: "#B75D45",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  petSaveButton: {
    backgroundColor: "#4D7C6B",
    shadowColor: "#4D7C6B",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  logoutButton: {
    borderWidth: 1.5,
    borderColor: "#B75D45",
    backgroundColor: "#FFFFFF",
    marginTop: 4,
    marginBottom: 24,
  },

  logoutButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B75D45",
  },

  /* EMPTY */

  emptyText: {
    fontSize: 13,
    color: "#8A6A55",
    lineHeight: 19,
  },
});