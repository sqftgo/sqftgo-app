import { Redirect, type Href } from "expo-router";

/** Legacy tab route — dealer listings live at /(dealer)/properties. */
export default function PropertiesTabRedirect() {
  return <Redirect href={"/(dealer)/properties" as Href} />;
}
