export type ServiceAccess =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "inactive"
  | "suspended"
  | "unknown";

export type AuthPortal = "user" | "dealer" | "provider";

export function parseServiceAccess(value: unknown): ServiceAccess {
  if (
    value === "none" ||
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "inactive" ||
    value === "suspended" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}

export function serviceProviderDenial(access: ServiceAccess): string {
  switch (access) {
    case "pending":
      return "Your service provider profile is still under review. The dashboard opens after it is approved.";
    case "rejected":
      return "This service provider registration was not approved. Sign in as a customer, or contact support if this is a mistake.";
    case "inactive":
      return "This service provider profile is inactive. Contact support to restore access.";
    case "suspended":
      return "This account is suspended. Contact support.";
    case "unknown":
      return "We couldn't confirm this service provider account. Try again in a moment.";
    case "approved":
      return "";
    default:
      return "This account isn't a registered service provider. Use Customer to sign in, then apply from Services.";
  }
}
