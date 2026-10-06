import { Redirect, type Href } from "expo-router";
import React from "react";

/**
 * Target of the Google OAuth deep link. Tokens are parsed by `apiGoogleSignIn` from the
 * auth-session result, so this route only needs to return the user to the app.
 */
export default function AuthCallbackScreen() {
  return <Redirect href={"/" as Href} />;
}
