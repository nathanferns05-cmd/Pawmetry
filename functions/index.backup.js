require("dotenv").config();

const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

exports.analyzeSymptoms = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Only POST requests are allowed.",
      });
    }

    try {
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

      const {
        symptoms,
        duration,
        severity,
        species,
        age,
      } = req.body || {};

      if (!symptoms || !symptoms.trim()) {
        return res.status(400).json({
          error: "Symptoms are required.",
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

      const result = JSON.parse(response.text);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Gemini symptom analysis failed:", error);

      return res.status(500).json({
        error: "Unable to analyze symptoms right now.",
      });
    }
  }
);