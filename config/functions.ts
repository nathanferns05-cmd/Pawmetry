const PROJECT_ID = "pawmetry-62af8";
const REGION = "us-central1";

// Base URL for the Cloud Functions HTTP endpoints.
// - EXPO_PUBLIC_FUNCTIONS_BASE_URL overrides everything.
// - EXPO_PUBLIC_FUNCTIONS_IP points at a local emulator on your network.
// - Otherwise the deployed functions are used.
function getFunctionsBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL;

  if (baseUrl) {
    return baseUrl.replace(/\/+$/, "");
  }

  const emulatorIp = process.env.EXPO_PUBLIC_FUNCTIONS_IP;

  if (emulatorIp) {
    return `http://${emulatorIp}:5001/${PROJECT_ID}/${REGION}`;
  }

  return `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;
}

export function getFunctionUrl(name: string) {
  return `${getFunctionsBaseUrl()}/${name}`;
}
