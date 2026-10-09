import { Redirect } from "expo-router";

/** Entry point — starts at Login (mockup B.1). */
export default function Index() {
  return <Redirect href="/login" />;
}
