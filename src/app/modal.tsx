import { Redirect, type Href } from "expo-router";

/** Expo template leftover — send users home. */
export default function ModalScreen() {
  return <Redirect href={"/(tabs)" as Href} />;
}
