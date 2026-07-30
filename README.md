# SqftGo

A modern, full-featured Mobile & Web Real Estate Application built with **Expo SDK 54**, **React Native**, **Expo Router**, and **NativeWind v5 (Tailwind CSS v4)**.

SqftGo provides a seamless platform for users to discover, buy, rent, list, and manage real estate properties.

---

## ✨ Features

- **🏠 Home & Discovery**:
  - Featured properties showcase with interactive category filtering (Buy, Rent, Commercial, Plots, PG/Co-living).
  - Search bar with quick city selection modal.
  - Quick action shortcuts for real estate services.

- **🔍 Advanced Property Search & Filtering**:
  - Multi-criteria filter sheet (Price range, Bedrooms, Bathrooms, Property types, Furnishing, Parking, Amenities).
  - Real-time search by location, title, or property features.

- **📄 Detailed Property View**:
  - Image galleries and property specs (Bedrooms, Bathrooms, Area in Sq.Ft, Furnishing status, Facing direction).
  - Highlighting key features & amenities (Security, Parking, Gym, Pool, Elevator, etc.).
  - Integrated inquiry modal & contact options for property agents/owners.

- **➕ Property Listing & Management (Post Property)**:
  - Multi-step property submission flow.
  - Input details including title, pricing, location, property type, area, amenities, and image uploads.
  - Instant listing persistence via local state & storage.

- **📊 Owner & Agent Dashboard**:
  - Overview of posted property listings.
  - Analytics cards tracking total views, inquiries received, and listing status (Active / Pending / Closed).

- **📩 Inquiries Tracking**:
  - **My Inquiries**: View status and details of inquiries submitted for properties.
  - **Received Inquiries**: Property owners/agents can view and manage buyer inquiries.

- **❤️ Favorites & Saved Properties**:
  - One-tap property bookmarking with persistent storage using React Native Async Storage.

- **🛠️ Real Estate Services & Experts Directory**:
  - Browse services (Property Valuation, Home Loans, Legal Advice, Inspection, Interiors).
  - Connect directly with top local real estate agents and consultants.

- **👤 User Profile & Preferences**:
  - Dark / Light theme toggle.
  - Notification preferences and global city selection.
  - User session state management.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Expo (SDK 54)](https://expo.dev) & [React Native 0.81](https://reactnative.dev) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Routing** | [Expo Router v6](https://docs.expo.dev/router/introduction) (File-based navigation) |
| **Styling** | [NativeWind v5](https://www.nativewind.dev) & [Tailwind CSS v4](https://tailwindcss.com) |
| **State & Persistence** | React Context (`AppContext`) & `@react-native-async-storage/async-storage` |
| **Icons & UI** | `lucide-react-native`, `@expo/vector-icons`, Custom UI Design System |
| **Animations & FX** | `react-native-reanimated`, `expo-blur`, `expo-haptics` |

---

## Project Structure

```text
real-estate/
├── assets/                     # App icons, splash screens, and images
├── scripts/                    # Project utility scripts
├── app.json                    # Expo configuration
├── package.json
└── src/                        # Application source (Expo Router uses src/app)
    ├── app/                    # Routes only — every file is a screen
    │   ├── _layout.tsx         # Root Stack, auth guards, AppProvider
    │   ├── (tabs)/             # Bottom tab navigation
    │   │   ├── index.tsx       # Home
    │   │   ├── explore.tsx     # Search / Explore
    │   │   ├── favorites.tsx   # Saved properties
    │   │   ├── services.tsx    # Services & experts
    │   │   ├── profile.tsx     # Profile & settings
    │   │   ├── my-inquiries.tsx# Buyer inquiries
    │   │   ├── dashboard.tsx   # Dealer dashboard
    │   │   ├── properties.tsx  # Dealer listings
    │   │   └── inquiries.tsx   # Dealer inbox
    │   ├── property/[id].tsx   # Property details
    │   ├── edit-property/[id].tsx
    │   ├── post-property.tsx
    │   ├── auth.tsx
    │   ├── onboarding.tsx
    │   ├── analytics.tsx
    │   ├── subscription.tsx
    │   ├── my-visits.tsx
    │   ├── manage-visits.tsx
    │   ├── dealer-register.tsx
    │   ├── dealer-pending.tsx
    │   ├── dealer-kyc.tsx
    │   └── dealer-settings.tsx
    ├── components/             # Reusable UI
    │   └── ui/                 # Design-system components
    ├── context/                # AppContext & global state
    ├── data/                   # Types & mock/seed data
    ├── hooks/                  # Shared hooks
    ├── lib/                    # Utilities + API client
    │   └── api/                # Auth, properties, inquiries, visits, etc.
    ├── constants/              # Static config (cities, theme helpers)
    ├── theme/                  # Design tokens
    ├── tw/                     # NativeWind / CSS helpers
    └── global.css              # Tailwind entry
```

---

## 🔌 API mode (optional)

By default the app runs on **AsyncStorage mock** data (offline demos).

To talk to the Next.js BFF:

1. Set `EXPO_PUBLIC_API_URL` to your web origin (no trailing slash), e.g. `https://sqftgo.example.com`
2. Restart Expo. Auth and dealer mutations then use `Authorization: Bearer <token>` against `/api/*`.
3. Never call `/api/admin/*` from the app; role promotion stays on web admin.

Demo mock logins (when API URL is unset): `broker@svrepl.com` / `SunValley26`

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- [Node.js](https://nodejs.org/) (v18.x or later)
- [npm](https://www.npmjs.com/) or `pnpm` / `yarn`
- [Expo Go](https://expo.dev/go) app on your mobile device OR Android Studio / Xcode for emulators.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dini28/SunValley-App.git
   cd SunValley-App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **Start** | `npm start` / `npx expo start` | Launches the Expo development server & interactive CLI |
| **Android** | `npm run android` | Starts app directly on an connected Android emulator/device |
| **iOS** | `npm run ios` | Starts app directly on an iOS simulator (macOS required) |
| **Web** | `npm run web` | Launches the app in a local web browser |
| **Lint** | `npm run lint` | Runs ESLint to check for code style issues |
| **Reset** | `npm run reset-project` | Script to reset example project files |

---

## 📱 Supported Platforms

- 📱 **iOS** (native performance via React Native)
- 🤖 **Android** (edge-to-edge support enabled)
- 🌐 **Web** (universal layout support)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).