
require("dotenv").config();

const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

const MAX_SYMPTOMS_LENGTH = 2000;
const MAX_FIELD_LENGTH = 50;

/**
 * Verifies the Firebase ID token in the Authorization header.
 * @param {object} req The incoming request.
 * @return {Promise<object|null>} The decoded token, or null if missing.
 */
async function verifyRequestToken(req) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer (.+)$/);

  if (!match) {
    return null;
  }

  return getAuth().verifyIdToken(match[1]);
}

/**
 * Returns a trimmed string capped at maxLength, or "" for non-strings.
 * @param {*} value The value to clean.
 * @param {number} maxLength The maximum allowed length.
 * @return {string} The cleaned string.
 */
function cleanText(value, maxLength) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().slice(0, maxLength);
}

/**
 * Checks whether an error came from an invalid or expired ID token.
 * @param {object} error The caught error.
 * @return {boolean} True for token errors.
 */
function isTokenError(error) {
  return (
    error.code === "auth/argument-error" ||
    error.code === "auth/id-token-expired" ||
    error.code === "auth/id-token-revoked" ||
    error.code === "auth/invalid-id-token"
  );
}

exports.analyzeSymptoms = onRequest(
  {
    cors: true,
    maxInstances: 5,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Only POST requests are allowed.",
      });
    }

    try {
      // Only signed-in, verified users may use Vet-Bot.
      const decodedToken = await verifyRequestToken(req);

      if (!decodedToken) {
        return res.status(401).json({
          error: "Authentication required.",
        });
      }

      if (decodedToken.email_verified !== true) {
        return res.status(403).json({
          error: "Please verify your email first.",
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing.");
        return res.status(500).json({
          error: "Gemini API key is not configured.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
      });

      const body = req.body || {};
      const symptoms = cleanText(body.symptoms, MAX_SYMPTOMS_LENGTH + 1);
      const duration = cleanText(body.duration, MAX_FIELD_LENGTH);
      const severity = cleanText(body.severity, MAX_FIELD_LENGTH);
      const species = cleanText(body.species, MAX_FIELD_LENGTH);
      const age = cleanText(body.age, MAX_FIELD_LENGTH);

      if (!symptoms) {
        return res.status(400).json({
          error: "Symptoms are required.",
        });
      }

      if (symptoms.length > MAX_SYMPTOMS_LENGTH) {
        return res.status(400).json({
          error: `Please keep symptoms under ${MAX_SYMPTOMS_LENGTH} characters.`,
        });
      }

      const prompt = `
You are Vet-Bot, an educational pet health assistant.

You are NOT a veterinarian and must NOT provide a definitive diagnosis.

Analyze the pet information and symptoms below.

Pet species: ${species || "Unknown"}
Pet age: ${age || "Unknown"}
Duration: ${duration || "Unknown"}
Reported severity: ${severity || "Unknown"}

Symptoms:
${symptoms}

Your response must:
- Explain possible causes in simple language.
- Never claim certainty or give a definitive diagnosis.
- Recommend appropriate next steps.
- Clearly identify emergency situations.
- If symptoms could indicate a serious or life-threatening problem, recommend contacting an emergency veterinarian immediately.
- Do not recommend prescription medication or medication dosages.
- Do not tell the owner to ignore concerning symptoms.
- Encourage veterinary evaluation when appropriate.

Return ONLY valid JSON matching this structure:

{
  "level": "monitor" | "vet" | "urgent",
  "possibleCauses": ["string"],
  "monitor": "string",
  "nextStep": "string",
  "emergency": "string"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              level: {
                type: "string",
                enum: ["monitor", "vet", "urgent"],
              },
              possibleCauses: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              monitor: {
                type: "string",
              },
              nextStep: {
                type: "string",
              },
              emergency: {
                type: "string",
              },
            },
            required: [
              "level",
              "possibleCauses",
              "monitor",
              "nextStep",
              "emergency",
            ],
          },
        },
      });

      let result;

      try {
        result = JSON.parse(response.text || "");
      } catch (parseError) {
        console.error("Gemini returned invalid JSON:", parseError, response.text);

        return res.status(502).json({
          error: "Vet-Bot could not produce an answer. Please try again.",
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      if (isTokenError(error)) {
        return res.status(401).json({
          error: "Invalid or expired authentication token.",
        });
      }

      console.error("Gemini symptom analysis failed:", error);

      return res.status(500).json({
        error: "Unable to analyze symptoms right now.",
      });
    }
  }
);

exports.getAdminOverview = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Only GET requests are allowed.",
      });
    }

    try {
      // Verify the caller's Firebase ID token.
      const decodedToken = await verifyRequestToken(req);

      if (!decodedToken) {
        return res.status(401).json({
          error: "Authentication required.",
        });
      }

      // Only trusted admins may access this endpoint.
      if (decodedToken.admin !== true) {
        return res.status(403).json({
          error: "Admin access required.",
        });
      }

      const usersSnapshot = await db.collection("users").get();

      const users = [];
      const pets = [];
      const medications = [];

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();

        users.push({
          id: userDoc.id,
          fullName: user.fullName || "Unknown",
          email: user.email || "",
          phone: user.phone || "",
          city: user.city || "",
          createdAt: user.createdAt?.toDate
            ? user.createdAt.toDate().toISOString()
            : null,
        });

        const petsSnapshot = await userDoc.ref
          .collection("pets")
          .get();

        for (const petDoc of petsSnapshot.docs) {
          const pet = petDoc.data();

          pets.push({
            id: petDoc.id,
            ownerId: userDoc.id,
            ownerName: user.fullName || "Unknown",
            petName: pet.petName || "Unknown",
            species: pet.species || "",
            breed: pet.breed || "",
            gender: pet.gender || "",
            age: pet.age ?? null,
            weight: pet.weight ?? null,
            vaccinated: pet.vaccinated ?? false,
            microchipped: pet.microchipped ?? false,
          });

          const medsSnapshot = await petDoc.ref
            .collection("medications")
            .get();

          for (const medDoc of medsSnapshot.docs) {
            const med = medDoc.data();

            medications.push({
              id: medDoc.id,
              ownerId: userDoc.id,
              petId: petDoc.id,
              ownerName: user.fullName || "Unknown",
              petName: pet.petName || "Unknown",
              name: med.name || "",
              dosage: med.dosage || "",
              frequency: med.frequency || "",
              time: med.time || "",
              startDate: med.startDate || "",
              endDate: med.endDate || "",
              active: med.active ?? false,
            });
          }
        }
      }

      return res.status(200).json({
        users,
        pets,
        medications,
        reports: {
          totalUsers: users.length,
          totalPets: pets.length,
          totalMedications: medications.length,
          activeMedications: medications.filter(
            (med) => med.active === true
          ).length,
          vaccinatedPets: pets.filter(
            (pet) => pet.vaccinated === true
          ).length,
          microchippedPets: pets.filter(
            (pet) => pet.microchipped === true
          ).length,
        },
      });
    } catch (error) {
      if (isTokenError(error)) {
        return res.status(401).json({
          error: "Invalid or expired authentication token.",
        });
      }

      console.error("Admin overview failed:", error);

      return res.status(500).json({
        error: "Unable to load admin overview.",
      });
    }
  }
);
