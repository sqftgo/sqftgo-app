import { Redirect, type Href } from "expo-router";

/** Legacy tab route — dealer inbox lives at /(dealer)/inquiries. */
export default function InquiriesTabRedirect() {
  return <Redirect href={"/(dealer)/inquiries" as Href} />;
}
