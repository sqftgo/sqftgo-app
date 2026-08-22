/**
 * Dealer Portal — Profile screen.
 * Re-uses the shared ProfileScreen which detects canAccessDealerDashboard
 * and renders the full dealer profile panel (Personal, Firm & Branding,
 * KYC & Licenses, Bank, Socials, Growth Plan tabs) automatically.
 *
 * The Settings and Subscription tabs are accessible via links within the
 * dealer profile panel, or navigate to /(dealer)/settings and
 * /(dealer)/subscription respectively.
 */
export { default } from "@/app/(tabs)/profile";
