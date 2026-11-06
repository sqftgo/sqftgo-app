import type { Href } from "expo-router";

import type { DealerAccessStatus, UserRole } from "@/data/types";
import type { AuthPortal } from "@/lib/service-access";

let postAuthHref: Href | null = null;
let lastPortal: AuthPortal = "user";

export function setLastPortal(portal: AuthPortal) {
  lastPortal = portal;
}

export function getLastPortal(): AuthPortal {
  return lastPortal;
}

export function postAuthDestination(input: {
  portal: AuthPortal;
  role: UserRole;
  dealerAccess: DealerAccessStatus;
  needsMobile: boolean;
}): Href {
  if (input.needsMobile) return "/auth/verify-mobile" as Href;
  if (input.portal === "provider") return "/services/dashboard" as Href;
  if (input.portal === "dealer" && input.role !== "broker" && input.dealerAccess === "pending") {
    return "/dealer-pending" as Href;
  }
  if (input.role === "broker") return "/(dealer)" as Href;
  return "/(tabs)" as Href;
}

/** Where sign-in should land. Read by the auth screen after the session updates. */
export function setPostAuthHref(href: Href) {
  postAuthHref = href;
}

export function peekPostAuthHref(): Href | null {
  return postAuthHref;
}

export function clearPostAuthHref() {
  postAuthHref = null;
}
