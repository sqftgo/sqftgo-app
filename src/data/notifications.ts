export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  tag: "Price Drop" | "Verified" | "Callback" | "New Match";
}

export const seedNotifications: AppNotification[] = [
  {
    id: "n-1",
    title: "Price drop on a saved home",
    message:
      "Ultra Luxury Green-Facing Villa in C-Scheme dropped by ₹15 Lakhs. Tap to see the new price.",
    time: "2 hrs ago",
    read: false,
    tag: "Price Drop",
  },
  {
    id: "n-2",
    title: "Verification completed",
    message:
      "Premium 3 BHK Flat in Vesu passed the 5-point physical and legal verification check.",
    time: "5 hrs ago",
    read: false,
    tag: "Verified",
  },
  {
    id: "n-3",
    title: "New homes match your search",
    message: "3 new listings in Udaipur match your recent search for 3 BHK homes.",
    time: "1 day ago",
    read: true,
    tag: "New Match",
  },
  {
    id: "n-4",
    title: "Callback confirmed",
    message:
      "Rajesh Mehta from Capital Heights Brokerage accepted your callback request for 5:30 PM today.",
    time: "1 day ago",
    read: true,
    tag: "Callback",
  },
];
