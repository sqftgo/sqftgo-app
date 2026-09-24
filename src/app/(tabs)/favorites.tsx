import { Redirect, type Href } from "expo-router";

/** Legacy tab route — favorites live at /saved. */
export default function FavoritesTabRedirect() {
  return <Redirect href={"/saved" as Href} />;
}
