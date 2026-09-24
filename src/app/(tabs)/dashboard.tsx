import { Redirect, type Href } from "expo-router";

/** Legacy tab route — dealer dashboard lives at /(dealer). */
export default function DashboardTabRedirect() {
  return <Redirect href={"/(dealer)" as Href} />;
}
