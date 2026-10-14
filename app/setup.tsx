import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
  TextInput,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import {
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import Fuse from "fuse.js";

import CustomButton from "../components/CustomButton";
import FormInput from "../components/setup/FormInput";
import PetPicture from "../components/setup/PetPicture";

import { Dropdown } from "react-native-element-dropdown";

import dogBreeds from "../data/dogBreeds.json";
import catBreeds from "../data/catBreeds.json";

import {
  Country,
  State,
  City,
} from "country-state-city";

import {
  saveOwnerProfile,
  savePet,
} from "../services/userService";

const speciesList = [
  {
    label: "Dog",
    value: "Dog",
  },
  {
    label: "Cat",
    value: "Cat",
  },
  {
    label: "Bird",
    value: "Bird",
  },
  {
    label: "Fish",
    value: "Fish",
  },
  {
    label: "Rabbit",
    value: "Rabbit",
  },
  {
    label: "Hamster",
    value: "Hamster",
  },
  {
    label: "Turtle",
    value: "Turtle",
  },
  {
    label: "Other",
    value: "Other",
  },
];

const genderList = [
  {
    label: "Male",
    value: "Male",
  },
  {
    label: "Female",
    value: "Female",
  },
];

const weightUnits = [
  {
    label: "Kilograms (kg)",
    value: "kg",
  },
  {
    label: "Pounds (lbs)",
    value: "lbs",
  },
];

const getFriendlyErrorMessage = (error: any): string => {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";

    case "auth/invalid-email":
      return "That email address doesn't look right.";

    case "auth/weak-password":
      return "Your password is too weak. Use at least 6 characters.";

    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";

    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";

    case "permission-denied":
      return "You don't have permission to do that. Please try logging in again.";

    case "unavailable":
      return "Can't reach the server right now. Check your connection and try again.";

    default:
      return "Something went wrong. Please try again.";
  }
};

export default function SetupScreen() {
  const router = useRouter();

  /* Owner Details */
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Owner Location
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [countryCode, setCountryCode] = useState("");
  const [stateCode, setStateCode] = useState("");

  // Search states
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const [countrySuggestions, setCountrySuggestions] = useState<any[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<any[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);

  const [emergencyContact, setEmergencyContact] = useState("");

  /* Pet Details */
  const [petPhoto, setPetPhoto] = useState("");
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [otherSpecies, setOtherSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [breedSearch, setBreedSearch] = useState("");
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);
  const [gender, setGender] = useState("Male");
  const [ageYears, setAgeYears] = useState("");
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [vaccinated, setVaccinated] = useState(true);
  const [microchipped, setMicrochipped] = useState(false);

  /* Step */
  const [step, setStep] = useState(1);
  const [profileError, setProfileError] = useState("");
  const [petError, setPetError] = useState("");

  /* Country Search */
  const searchCountry = (text: string) => {
    setCountrySearch(text);

    if (!text) {
      setCountrySuggestions([]);
      return;
    }

    const countries = Country.getAllCountries();

    const fuse = new Fuse(countries, {
      keys: ["name"],
      threshold: 0.3,
    });

    const result = fuse.search(text);

    setCountrySuggestions(
      result.map((item) => item.item)
    );
  };

  /* State Search */
  const searchState = (text: string) => {
    setStateSearch(text);

    if (!text) {
      setStateSuggestions([]);
      return;
    }

    const states = State.getStatesOfCountry(countryCode);

    const fuse = new Fuse(states, {
      keys: ["name"],
      threshold: 0.3,
    });

    const result = fuse.search(text);

    setStateSuggestions(
      result.map((item) => item.item)
    );
  };

  /* City Search */
  const searchCity = (text: string) => {
    setCitySearch(text);

    if (!text) {
      setCitySuggestions([]);
      return;
    }

    const cities = City.getCitiesOfState(
      countryCode,
      stateCode
    );

    const fuse = new Fuse(cities, {
      keys: ["name"],
      threshold: 0.3,
    });

    const result = fuse.search(text);

    setCitySuggestions(
      result.map((item) => item.item)
    );
  };

  /* Breed Search */
  const searchBreed = (text: string) => {
    setBreedSearch(text);

    if (text.trim() === "") {
      setBreedSuggestions([]);
      return;
    }

    const breedList =
      species === "Dog"
        ? dogBreeds
        : species === "Cat"
        ? catBreeds
        : [];

    const fuse = new Fuse(breedList, {
      threshold: 0.4,
    });

    const results = fuse.search(text);

    setBreedSuggestions(
      results.map((item) => item.item)
    );
  };

  /* STEP 1 */
  const handleNext = () => {
    setProfileError("");

    if (
      !fullName ||
      !phone ||
      !country ||
      !state ||
      !city ||
      !emergencyContact
    ) {
      setProfileError("Please complete your profile.");
      return;
    }

    const countryIso = (countryCode || "US") as CountryCode;

    if (!isValidPhoneNumber(phone, countryIso)) {
      setProfileError(
        "Please enter a valid phone number for your selected country."
      );
      return;
    }

    if (!isValidPhoneNumber(emergencyContact, countryIso)) {
      setProfileError(
        "Please enter a valid emergency contact number."
      );
      return;
    }

    setStep(2);
  };

  /* STEP 2 */
  const handleFinish = async () => {
    setPetError("");

    if (
      !petName ||
      !weight ||
      ((species === "Dog" || species === "Cat") && !breed) ||
      (species === "Other" && !otherSpecies)
    ) {
      setPetError(
        "Please complete your pet's profile."
      );
      return;
    }

    try {
      /* Save owner WITHOUT profile picture */
      await saveOwnerProfile({
        fullName,
        phone,
        country,
        state,
        city,
        emergencyContact,
      });

      /* Save pet WITH pet picture */
      await savePet({
        petName,
        species:
          species === "Other"
            ? otherSpecies
            : species,
        breed,
        gender,
        age: parseInt(ageYears) || 0,
        weight: `${weight} ${weightUnit}`,
        vaccinated,
        microchipped,
        petPhoto,
      });

      router.replace("/(tabs)/home");
    } catch (error: any) {
      setPetError(
        getFriendlyErrorMessage(error)
      );
    }
  };

  const countries = Country.getAllCountries().map(
    (item) => ({
      label: item.name,
      value: item.isoCode,
    })
  );

  const states = State.getStatesOfCountry(
    countryCode
  ).map((item) => ({
    label: item.name,
    value: item.isoCode,
  }));

  const cities = City.getCitiesOfState(
    countryCode,
    stateCode
  ).map((item) => ({
    label: item.name,
    value: item.name,
  }));

  return (
    <ImageBackground
      source={require("../assets/images/Login_bg.jpg")}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.5 }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          {step === 1
            ? "Complete Your Profile"
            : "Your Pet"}
        </Text>

        <Text style={styles.step}>
          {step === 1
            ? "Step 1 of 2"
            : "Step 2 of 2"}
        </Text>

        {/* ========================= */}
        {/* STEP 1 - OWNER */}
        {/* ========================= */}

        {step === 1 ? (
          <>
            <FormInput
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <FormInput
              label="Phone Number"
              placeholder="Enter Mobile Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* COUNTRY */}

            <Text style={styles.label}>
              Country
            </Text>

            <FormInput
              label=""
              placeholder="Search country..."
              value={countrySearch}
              onChangeText={searchCountry}
            />

            <View>
              {countrySuggestions.map(
                (item, index) => (
                  <Text
                    key={index}
                    style={styles.suggestion}
                    onPress={() => {
                      setCountry(item.name);
                      setCountryCode(item.isoCode);

                      setCountrySearch(
                        item.name
                      );

                      setCountrySuggestions([]);

                      setState("");
                      setCity("");

                      setStateCode("");
                    }}
                  >
                    {item.name}
                  </Text>
                )
              )}
            </View>

            {/* STATE */}

            <Text style={styles.label}>
              State
            </Text>

            <FormInput
              label=""
              placeholder="Search state..."
              value={stateSearch}
              onChangeText={searchState}
            />

            <View>
              {stateSuggestions.map(
                (item, index) => (
                  <Text
                    key={index}
                    style={styles.suggestion}
                    onPress={() => {
                      setState(item.name);
                      setStateCode(
                        item.isoCode
                      );

                      setStateSearch(
                        item.name
                      );

                      setStateSuggestions([]);

                      setCity("");
                      setCitySearch("");
                    }}
                  >
                    {item.name}
                  </Text>
                )
              )}
            </View>

            {/* CITY */}

            <Text style={styles.label}>
              City
            </Text>

            <FormInput
              label=""
              placeholder="Search city..."
              value={citySearch}
              onChangeText={searchCity}
            />

            <View>
              {citySuggestions.map(
                (item, index) => (
                  <Text
                    key={index}
                    style={styles.suggestion}
                    onPress={() => {
                      setCity(item.name);

                      setCitySearch(
                        item.name
                      );

                      setCitySuggestions([]);
                    }}
                  >
                    {item.name}
                  </Text>
                )
              )}
            </View>

            <FormInput
              label="Emergency Contact"
              placeholder="Enter Emergency Contact Number"
              keyboardType="phone-pad"
              value={emergencyContact}
              onChangeText={
                setEmergencyContact
              }
            />

            {profileError !== "" && (
              <Text style={styles.errorText}>
                {profileError}
              </Text>
            )}

            <View style={{ marginTop: 20 }}>
              <CustomButton
                title="Next"
                onPress={handleNext}
              />
            </View>
          </>
        ) : (
          /* ========================= */
          /* STEP 2 - PET */
          /* ========================= */

          <>
            <PetPicture
              onImageSelected={setPetPhoto}
            />

            <FormInput
              label="Pet Name"
              placeholder="Enter pet name"
              value={petName}
              onChangeText={setPetName}
            />

            <Text style={styles.label}>
              Species
            </Text>

            <Dropdown
              style={styles.dropdown}
              data={speciesList}
              labelField="label"
              valueField="value"
              placeholder="Select Species"
              value={species}
              onChange={(item) => {
                setSpecies(item.value);

                setBreed("");
                setBreedSearch("");

                if (item.value !== "Other") {
                  setOtherSpecies("");
                }
              }}
            />

            {/* OTHER SPECIES */}

            {species === "Other" && (
              <FormInput
                label="Animal Type"
                placeholder="Enter animal name"
                value={otherSpecies}
                onChangeText={
                  setOtherSpecies
                }
              />
            )}

            {/* BREED */}

            {(species === "Dog" ||
              species === "Cat") && (
              <>
                <Text style={styles.label}>
                  Breed
                </Text>

                <FormInput
                  label=""
                  placeholder="Search breed..."
                  value={breedSearch}
                  onChangeText={searchBreed}
                />

                <View>
                  {breedSuggestions.map(
                    (item, index) => (
                      <Text
                        key={index}
                        style={
                          styles.suggestion
                        }
                        onPress={() => {
                          setBreed(item);
                          setBreedSearch(item);
                          setBreedSuggestions(
                            []
                          );
                        }}
                      >
                        {item}
                      </Text>
                    )
                  )}
                </View>
              </>
            )}

            {/* GENDER */}

            <Text style={styles.label}>
              Gender
            </Text>

            <Dropdown
              style={styles.dropdown}
              data={genderList}
              labelField="label"
              valueField="value"
              placeholder="Select Gender"
              value={gender}
              onChange={(item) => {
                setGender(item.value);
              }}
            />

            {/* AGE */}

            <Text style={styles.label}>
              Approximate Age
            </Text>

            <TextInput
              style={styles.dateInput}
              value={ageYears}
              onChangeText={(text) =>
                setAgeYears(
                  text.replace(
                    /[^0-9]/g,
                    ""
                  )
                )
              }
              placeholder="Age in years"
              placeholderTextColor="#9E7E68"
              keyboardType="number-pad"
              maxLength={2}
            />

            {/* WEIGHT UNIT */}

            <Text style={styles.label}>
              Weight Unit
            </Text>

            <Dropdown
              style={styles.dropdown}
              data={weightUnits}
              labelField="label"
              valueField="value"
              placeholder="Select Unit"
              value={weightUnit}
              onChange={(item) => {
                setWeightUnit(item.value);
              }}
            />

            {/* WEIGHT */}

            <FormInput
              label="Weight"
              placeholder="Enter weight"
              value={weight}
              keyboardType="numeric"
              onChangeText={(text) => {
                const numberOnly =
                  text.replace(
                    /[^0-9]/g,
                    ""
                  );

                setWeight(numberOnly);
              }}
            />

            {/* VACCINATED */}

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                Vaccinated
              </Text>

              <Switch
                value={vaccinated}
                onValueChange={
                  setVaccinated
                }
              />
            </View>

            {/* MICROCHIPPED */}

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                Microchipped
              </Text>

              <Switch
                value={microchipped}
                onValueChange={
                  setMicrochipped
                }
              />
            </View>

            {petError !== "" && (
              <Text style={styles.errorText}>
                {petError}
              </Text>
            )}

            <View style={{ marginTop: 25 }}>
              <CustomButton
                title="Finish Setup"
                onPress={handleFinish}
              />
            </View>
          </>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F2",
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#4B2B1A",
    textAlign: "center",
    marginTop: 20,
  },

  step: {
    fontSize: 18,
    color: "#8B5E3C",
    textAlign: "center",
    marginBottom: 30,
    marginTop: 5,
  },

  petTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4B2B1A",
    textAlign: "center",
    marginTop: 80,
  },

  dateInput: {
    height: 55,
    borderWidth: 1,
    borderColor: "#E7D8CC",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    justifyContent: "center",
    marginBottom: 18,
  },

  petSubtitle: {
    fontSize: 16,
    color: "#7A5A46",
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 20,
  },

  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginTop: 12,
  },

  switchText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#4B2B1A",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B2B1A",
    marginBottom: 8,
    marginTop: 12,
  },

  dropdown: {
    height: 55,
    borderWidth: 1,
    borderColor: "#D8C3B5",
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
  },

  suggestion: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginTop: 5,
    borderRadius: 10,
    fontSize: 16,
    color: "#4B2B1A",
  },

  errorText: {
    color: "#C0392B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
});