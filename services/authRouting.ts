import { getIdTokenResult, type User } from "firebase/auth";

import { userProfileExists } from "./userService";

// Decides where a signed-in user belongs: email verification, the admin
// dashboard, first-time setup, or the main app.
export async function getSignedInRoute(user: User) {
  if (!user.emailVerified) {
    return "/verify-email" as const;
  }

  // Force a refresh so newly granted custom claims are picked up.
  const tokenResult = await getIdTokenResult(user, true);

  if (tokenResult.claims.admin === true) {
    return "/admin" as const;
  }

  return (await userProfileExists())
    ? ("/(tabs)/home" as const)
    : ("/setup" as const);
}
