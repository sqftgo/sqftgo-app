# SqftGo — Web Repository Analysis & Mobile App Parity Blueprint

- **Web repository (functional source of truth):** `F:\real-state` — Next.js 16.2 (App Router), React 19.2, Supabase (`@supabase/ssr`), TanStack Query 5, zod 4, Tailwind v4, Razorpay (REST + checkout.js), Upstash rate limiting.
- **Mobile repository (target):** `F:\real-estate` — Expo SDK 54, expo-router 6, React Native 0.81, NativeWind 5 preview, single `AppContext` state store, Bearer-token client against the web API.
- **Shared backend:** the mobile app has no backend of its own; it calls the web app's `/api/*` route handlers (`EXPO_PUBLIC_API_URL`, default `https://www.sqftgo.com`).
- **Scope decision:** the 18-page **Admin console is WEB-ONLY** (confirmed with product owner). Mobile covers buyers/clients, property owners, dealers (brokers) and service providers.
- **Nothing was modified in either repository** during this analysis. This document is the only artifact.

### How to read this document

- Statements with a file path are **facts discovered in code**. Paths starting with `src\` under "Web" are relative to `F:\real-state`; mobile paths are relative to `F:\real-estate`.
- Sections titled **Recommendation / MOBILE RECOMMENDATION / Required Action** are **proposals**, not facts.
- Percentages in the parity table are **analyst estimates** based on the code audit.

---

## 1. Complete Repository Analysis

### 1.1 Architecture (web)

| Layer | Location | Notes |
|---|---|---|
| Pages (App Router) | `src\app\(public)`, `src\app\(dealer)\dealer`, `src\app\(admin)\admin` | 63 page routes; all client components except `/signup`, `/register`, `/dealers/dashboard` (server redirects) and `/destinations/[slug]` (server page). |
| API (BFF) | `src\app\api\**\route.ts` (71 files) + `src\app\auth\callback\route.ts` | Thin route handlers, zod validation (`src\lib\validation\*`), row mappers (`src\lib\mappers\*`), service-role Supabase client for writes. |
| Middleware | `src\proxy.ts` → `src\lib\supabase\middleware.ts` | Session refresh, maintenance redirect, page-level role guards. Skips `/api`. |
| Client data | `src\services\*.ts` (18 domain wrappers), `src\hooks\queries\marketplace.ts`, `src\context\AppContext.tsx` | React Query only for properties/projects/dealers/admin-users (`src\lib\queryKeys.ts`); everything else is context `useState`. |
| Providers | `src\providers\AppProviders.tsx`, `AuthProvider.tsx`, `QueryProvider.tsx` | staleTime 30s, retry 1. |
| Features | `src\features\*` | home, properties, projects, inquiries, visits, messages, kyc, billing, payments, destinations, dealers, admin, notifications, catalog, locations, leads. |
| UI kit | `src\components\ui\*` | Button, Badge, Panel, Dialog/ConfirmDialog, DataTable, FormField, CustomSelect, StatCard, StepProgress, Skeleton, EmptyState, ErrorState, charts. |
| DB | `supabase\migrations\*.sql` (41 migrations) | RLS as defence in depth; writes through BFF service role. |

### 1.2 Roles & permissions (fact)

| Role (DB `app_role`) | UI name | How obtained | Capabilities |
|---|---|---|---|
| guest | — | not signed in | Browse home, listings, property, projects, dealers, services, destinations; send inquiry; book visit (public, rate-limited); guest favorites in localStorage. |
| `user` | Client / Buyer / Owner | default signup | Favorites, my inquiries, my visits, service bookings, post property (if `allow_user_listings`, cap `max_listings_per_user` default 3, lister status none→pending→approved/rejected), service provider profile. |
| `broker` | Dealer | signup with `intent=dealer`, KYC approval, or admin | Dealer dashboard: properties, projects, inquiries, messages, visits, analytics, profile, KYC, subscription, listing packs. |
| `admin` | Superadmin | single admin enforced by trigger | Admin console (WEB-ONLY). |
| service provider | (not a role) | `directory_profiles` row with `service_type_id` | Manage service profile, verification, booking requests. |

Additional state: `profile_status` active/suspended; `listing_status` (lister) none/pending/approved/rejected; directory `verification_status` unverified/pending/verified/rejected; KYC draft/pending/approved/rejected.

Guards: `src\lib\authz.ts` (`canAccessAdminRoutes`, `canAccessDealerDashboard`, `canCreatePropertyListing`), `src\lib\ownership.ts`, middleware path rules (`/admin*` admin, `/dealer/dashboard*` broker/admin, account pages require sign-in).

### 1.3 Authentication (fact)

- Email/password login `POST /api/auth/login` (10/min), signup `POST /api/auth/signup` (5/min, `intent: user|dealer`, `admin@sqftgo.com` reserved), forgot password (always ok), update password, logout, `/auth/callback` (email confirm, recovery, Google OAuth).
- Google OAuth only via browser `signInWithOAuth` (`src\services\auth.ts`).
- `authenticateApiRequest` (`src\lib\api\auth.ts`) accepts **Bearer token first, then cookie** for 66 of 70 handlers.
- **Cookie-only endpoints (block mobile):** `GET /api/auth/me` (reads `supabase.auth.getUser()` from cookies only, `src\app\api\auth\me\route.ts:15-23`), `POST /api/auth/update-password` (`src\app\api\auth\update-password\route.ts:27-35`), `POST /api/auth/logout`, `GET /auth/callback`.
- Login/signup return `accessToken` but **no refresh token** (`authSessionPayload`, `src\lib\mappers\profile.ts`); JWT expiry 3600s.
- Some public list GETs read through the cookie client, so a Bearer-only call reads with anon RLS (fine for public data).
- Maintenance mode is enforced only for web pages; `/api` is never blocked and `GET /api/platform/settings` does not expose the flag.

### 1.4 Data models (fact, `src\types\*.ts`)

- **Property:** `type` (Home, Villa, Hotel, Agricultural Land, Apartment, Office Space, Commercial Space, Shop, Industrial Plot); `purpose` (buy, sell, rent, lease); `furnished` (Furnished, Semi-Furnished, Unfurnished); `status` (Active, Pending Review, Sold, Rented, Draft, Rejected); price, size, bhk, bathrooms, parking, yearBuilt, city, locality, nearbyHospital/School/Transportation, amenities[], images[] (≤30), reraId/reraApproved, featured, rejectionReason, verificationChecks, priceBreakdown, seoTitle/seoDescription, owner fields, inquiryCount.
- **Project:** status (Draft, Pending Review, Active, Sold, Rejected); lifecycle (Upcoming, Under Construction, Ready); ownershipRole (Owner, Builder, Marketing Partner); price/size ranges, propertyTypes[], configurations[], launch/possession dates, contact name/phone, images, amenities, SEO.
- **Inquiry:** new/read/archived. **Visit:** pending/confirmed/completed/cancelled (UI "Pending Approval" etc.). **MessageThread:** kind direct/support, status open/resolved/archived. **Notification:** type, forRole, entity. **DirectoryProfile:** category, serviceTypeId, verificationStatus, listingActive, logo/cover, businessHours, servicesOffered, lat/lng. **ServiceBooking:** pending/confirmed/cancelled/completed. **ServiceVerification:** draft/pending/approved/rejected. **ListingPlan / ListingOrder**, **DealerSubscription** (plans starter/professional/enterprise in enum; only `starter` defined), **DealerKyc**, **PlatformSettings**, **ListingFilter**, catalog (Category, Location, Amenity, ServiceType).

### 1.5 API surface (fact, grouped)

| Group | Endpoints | Mobile-relevant notes |
|---|---|---|
| Auth | `/api/auth/{login,signup,me,logout,forgot-password,update-password}`, `/auth/callback` | `me` GET and `update-password` are cookie-only. |
| Properties | `GET/POST /api/properties`, `GET/PATCH/DELETE /api/properties/[id]`, `GET/POST /api/properties/[id]/inquiries`, `POST /api/properties/[id]/visits` | List supports `mine,status,city,type,purpose,featured,search,minPrice,maxPrice,limit(≤200),offset` and returns `total`. **PATCH/DELETE allowed only for broker owner or admin — role `user` cannot edit own listing.** |
| Projects | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]` | Pending Review requires ≥1 image; no notifications. |
| Inquiries | `GET /api/inquiries`, `PATCH/DELETE /api/inquiries/[id]` | Update schema is `{status}` only (`src\lib\validation\inquiry.ts:12-14`). |
| Visits | `GET /api/visits`, `PATCH /api/visits/[id]` | Reschedule, cancel (visitor), confirm/complete (owner); notifications. |
| Favorites | `GET/POST /api/favorites`, `DELETE /api/favorites/[propertyId]` | — |
| Messaging | `GET/POST /api/messages/threads`, `GET/PATCH /api/messages/threads/[id]`, `POST .../messages` | Role `user` may open only `support` threads; reply notifies participants. |
| Notifications | `GET /api/notifications`, `PATCH/DELETE /[id]`, `POST /mark-all-read` | No realtime, no push. |
| Leads | `GET/POST /api/enquiries`, `/api/assistance` | Public POST, rate-limited; `enquiryCreateSchema` requires email. |
| Directory | `GET/POST /api/dealers`, `GET/PATCH/DELETE /api/dealers/[id]` | `surface=dealers|services`, one profile per user. |
| Services | `GET /api/service-types`, `GET/POST /api/services/[id]/bookings`, `GET/PATCH /api/service-bookings[/id]`, `GET/POST /api/service-verifications` | No notifications for bookings. |
| Dealer | `/api/dealer/{analytics,kyc,kyc/documents,listing-quota,subscription,subscription/order,subscription/verify}` | — |
| Payments | `GET /api/listing-plans`, `POST /api/payments/razorpay/{order,verify}`, webhooks | Broker-only. |
| Uploads | `POST /api/uploads/{avatar,property-image}` | 5MB, magic-byte check, public URL. |
| Catalog | `/api/{categories,locations,amenities,service-types,listing-filters}` | Public GET active only. |
| Platform | `GET /api/platform/settings` | siteName, tagline, support, allowUserListings, maxListingsPerUser, priceRanges, currency. |
| Admin | `/api/admin/*`, `/api/logs` | WEB-ONLY. |

### 1.6 Business logic to preserve (fact)

1. **Listing approval:** `platform_settings.require_listing_approval` → submissions land as Pending Review (else Active). Non-admins may only set Draft or Pending Review. Rejected requires reason; Active/Pending clears it.
2. **Owner (user) limits:** `allow_user_listings`, `max_listings_per_user` (default 3, counts non-rejected), first submission sets lister status pending; approval sets approved + `listing_verified_at`.
3. **Dealer quota** (`src\lib\dealer-listing-quota.ts`): free = `max_listings_per_dealer` (default 3); used = non-rejected properties (drafts count); purchased = `listing_slots_purchased`; active Starter subscription = unlimited. At cap → 403 `{code:"LISTING_QUOTA", checkoutPath, used, quota}`.
4. **Active city enforcement:** API `requireActiveCity` + DB trigger rewrite to canonical spelling; error 23514 when inactive.
5. **Nearby landmarks** (hospital, school, transport) required for non-draft, non-admin property submissions.
6. **Inquiry/visit** public endpoints are rate-limited, require Active listing, bind to signed-in profile, notify owner.
7. **Visit rules:** date ≥ today, time `h:mm AM/PM`, slots 10AM–5PM excluding 1PM (web UI).
8. **Messaging:** recipient looked up by email; broker attaching propertyId must own it; replies reopen resolved threads.
9. **Payments:** Razorpay order → checkout → HMAC verify → idempotent fulfilment (listing slots RPC `increment_listing_slots` / subscription activation 30 days); webhook `payment.captured` as backup.
10. **Favorites:** guest favorites in local storage, merged to server on login.
11. **Platform price ranges** drive budget options (`useBudgetPriceOptions`).
12. **Dynamic listing filters** (`/api/listing-filters`): 11 system filters + admin custom text/toggle/multi matched client-side against whitelisted property fields (`src\lib\listing-filters\match.ts`).

### 1.7 Third-party integrations (fact)

Supabase (auth, Postgres, storage buckets `property-images`, `avatars`, `dealer-kyc`), Razorpay REST + checkout.js, Upstash Redis rate limit, Google Maps keyless iframes (no SDK, no pins), Unsplash images (fallbacks), recharts, framer-motion, lucide-react, FontAwesome. No email service beyond Supabase Auth, no analytics injection, no push.

### 1.8 Mobile app current state (fact summary)

- Navigation: root `Stack.Protected` groups — onboarding → auth → app. **Guests cannot browse.** Admins rejected. User tabs: Home, Explore, Services, Dealers, Profile. Dealer tabs: Dashboard, Properties, Inbox, Analytics, Profile.
- State: `src\context\AppContext.tsx` (~1,800 lines) owns every domain, with API-mode and mock-mode branches; writes mostly optimistic with `.catch(() => {})`.
- API client: Bearer token from AsyncStorage (`sqftgo_access_token`), no refresh, 401 clears token but not `session`.
- Known data-integrity issues: seed directory profiles merged into API data; fabricated property facts (facing, vaastu, water, reviews, rating, agent avatars, placeholder gallery); fake RERA ID generation in `post-property.tsx:220`; broker profile falls back to `directoryProfiles[0]`; partner plan prices (₹999/₹2,499/₹5,999) do not match web (Starter ₹99 only); dealer reply text dropped by API; KYC soft-fail saves local "pending".
- Unreachable/dead: `(tabs)/{dashboard,favorites,inquiries,properties}`, `(dealer)/{settings,subscription}`, `/analytics`, `/my-listings` (unlinked), `/modal`, `/services` route clash (`app/services.tsx` vs `app/(tabs)/services.tsx`), template components.

---

## 2. Complete Route & Screen Inventory

Legend for **App Equivalent**: existing mobile route, `PARTIAL:` route exists with gaps, `CREATE:` new screen required, `WEB-ONLY`, `n/a` (redirect).

### 2.1 Public & customer routes

| # | Route | Screen/Page | Purpose | User Role | Key Actions | API/Data | App Equivalent | Priority |
|---|---|---|---|---|---|---|---|---|
| 01 | `/` | Home | Discovery entry | Guest/All | Hero search (purpose tabs, city, locality, type, budget), carousels (Top Picks, Dealer Projects, Prominent, Highlighted, Trusted Developers, Newly Added), Sell CTA | `GET /api/properties`, `/api/projects`, `/api/dealers`, `/api/platform/settings` | `(tabs)/index` (PARTIAL) | P0 |
| 02 | `/listings` | Browse Properties | Search, filter, sort | Guest/All | Header filters, filter panel/drawer, sort, grid/list/map, favorite, contact owner | `GET /api/properties?limit=100`, `/api/listing-filters`, `/api/amenities`, `/api/categories`, `/api/locations` | `(tabs)/explore` | P0 |
| 03 | `/property/[id]` | Property Detail | Evaluate & contact | Guest/All | Gallery+lightbox, save, share, inquiry, book visit, call/WhatsApp, similar | `GET /api/properties/[id]`, `POST .../inquiries`, `POST .../visits` | `property/[id]` (PARTIAL) | P0 |
| 04 | `/projects/[id]` | Project Detail | View project | Guest/All | Gallery, inventory, amenities, call dealer | `GET /api/projects/[id]` | `project/[id]` | P1 |
| 05 | `/dealers` | Dealer Directory | Find dealers | Guest/All | City, search, category chips, view profile | `GET /api/dealers` | `(tabs)/brokers` (PARTIAL) | P1 |
| 06 | `/dealers/[id]` | Dealer Profile | Trust & listings | Guest/All | Call, email, view listings | `GET /api/dealers/[id]`, properties | `broker/[id]` (PARTIAL) | P1 |
| 07 | `/dealers/dashboard` | Redirect | → `/dealer/dashboard` | — | — | — | n/a | P3 |
| 08 | `/destinations` | Destinations | Browse heritage cities | Guest/All | Region chips, wedding toggle, sort, grid/compact | static `destinations.ts` + `/api/locations`, properties | `destinations` (PARTIAL) | P2 |
| 09 | `/destinations/[slug]` | Destination Detail | City guide + venues | Guest/All | Browse listings, venue enquiry, related | static + `/api/locations`, properties, `POST /api/enquiries` | `destinations/[slug]` (PARTIAL) | P2 |
| 10 | `/favorites` | Shortlist | Saved properties | Signed-in (web guard) | Remove, open | `/api/favorites` | `saved` | P0 |
| 11 | `/login` | Login / Signup tabs | Authenticate | Guest | Email/password, Google, forgot link, demo fill (dev) | `/api/auth/login`, `/api/auth/signup`, Supabase OAuth | `auth/index` | P0 |
| 12 | `/signup` | Redirect | → `/login?tab=signup` | Guest | — | — | `auth/index` (signup mode) | P0 |
| 13 | `/register` | Redirect | → `/login?tab=signup` | Guest | — | — | n/a | P3 |
| 14 | `/forgot-password` | Forgot Password | Request reset email | Guest | Submit email | `POST /api/auth/forgot-password` | `auth/index` (inline) | P0 |
| 15 | `/update-password` | Update Password | Set new password from link | Recovery session | New + confirm | `POST /api/auth/update-password` (cookie) | CREATE: `auth/update-password` + deep link | P0 |
| 16 | `/help` | Help Center | FAQs & contact | All | Search FAQ, category chips, contact cards | static | CREATE: `help` (today: static alert in profile) | P2 |
| 17 | `/maintenance` | Maintenance | Platform offline notice | All | Login link | middleware flag | CREATE: `maintenance` | P1 |
| 18 | `/my-inquiries` | My Inquiries | Sent inquiries history | User | View property | `GET /api/inquiries` | `my-inquiries` (PARTIAL) | P1 |
| 19 | `/my-listings` | My Listings | Owner listings + slots | User | Add, edit, view, status/rejection | `GET /api/properties?mine=1`, `/api/inquiries?received=1`, platform settings | `my-listings` (PARTIAL, unlinked) | P0 |
| 20 | `/my-listings/[id]/edit` | Edit My Listing | Owner edits listing | User (owner) | Edit fields, save | `PATCH /api/properties/[id]` (server rejects role user) | `edit-property/[id]` (PARTIAL) | P0 |
| 21 | `/my-service-bookings` | My Service Bookings | Bookings I made | User | Cancel pending | `GET/PATCH /api/service-bookings` | `my-service-bookings` | P1 |
| 22 | `/my-visits` | My Visits | Site visits | User | Upcoming/Past tabs, reschedule, cancel | `GET/PATCH /api/visits` | `my-visits` (PARTIAL) | P1 |
| 23 | `/post-property` | Post Property Wizard | Owner listing creation | User/Broker | 6 steps, photo upload, submit | `POST /api/properties`, `/api/uploads/property-image`, `/api/locations` | `post-property` (PARTIAL) | P0 |
| 24 | `/privacy` | Privacy Policy | Legal | All | TOC, sections | static | CREATE: `legal/privacy` | P2 |
| 25 | `/terms` | Terms | Legal | All | TOC, sections | static | CREATE: `legal/terms` | P2 |
| 26 | `/profile` | Profile | Account hub | Signed-in | Edit, role links, KPIs, saved preview, sign out | `/api/auth/me`, favorites, inquiries | `(tabs)/profile` (PARTIAL) | P1 |
| 27 | `/profile/edit` | Edit Profile | Update account | Signed-in | Avatar upload, name, phone, city, bio | `PATCH /api/auth/me`, `POST /api/uploads/avatar` | PARTIAL: sheet in profile; CREATE `profile/edit` | P1 |
| 28 | `/services` | Services Directory | Find service providers | Guest/All | Search, category, call/email, view profile, list business | `GET /api/dealers?surface=services`, `/api/service-types` | `(tabs)/services` (PARTIAL) | P1 |
| 29 | `/services/[id]` | Service Profile | Provider details + booking | Guest/All (book: signed-in) | Book (datetime, phone, message), call, email, map | directory profile, `POST /api/services/[id]/bookings` | CREATE: `service/[id]` | P0 |
| 30 | `/services/manage` | Manage Service Profile | Provider back-office | Provider (user) | Edit profile, submit verification, confirm/decline/complete bookings | `/api/dealers/[id]`, `/api/service-verifications`, `/api/services/[id]/bookings`, `/api/service-bookings/[id]` | CREATE: `services/manage` | P0 |
| 31 | `/services/register` | Register Service Business | Become provider | Signed-in | Firm, owner, service type, city, address, email, mobile, description, services, GST, pledge | `POST /api/dealers`, `POST /api/service-verifications` | PARTIAL: `dealer-register` (not service-type aware); CREATE `services/register` | P1 |
| 32 | `/settings` | Settings | Preferences | Signed-in | Notification/language/visibility toggles (not persisted), reset password email | `forgot-password` | PARTIAL: profile toggles; CREATE `settings` | P2 |

### 2.2 Dealer routes

| # | Route | Screen/Page | Purpose | User Role | Key Actions | API/Data | App Equivalent | Priority |
|---|---|---|---|---|---|---|---|---|
| 33 | `/dealer/register` | Dealer Signup (2 steps) | Dealer onboarding | Guest | Account + firm details | `/api/auth/signup (intent=dealer)`, `POST /api/dealers` | `dealer-register` (+ `auth/index` dealer mode) | P0 |
| 34 | `/dealer/dashboard` | Dealer Dashboard | Overview | Broker | KPIs, recent listings, confirm tour, latest messages, quick actions | properties mine, inquiries, visits | `(dealer)/index` | P1 |
| 35 | `/dealer/dashboard/properties` (+`?status=Draft`) | My Properties | Manage inventory | Broker | Status/type filters, sort, grid/table, view, edit, submit, move to draft, delete | `GET /api/properties?mine=1`, `PATCH/DELETE` | `(dealer)/properties` (PARTIAL filters) | P0 |
| 36 | `/dealer/dashboard/add-property` | Add Property (6 steps) | Create listing | Broker | Quota check, buy pack, form, save draft, publish, preview | `/api/dealer/listing-quota`, `/api/listing-plans`, `POST /api/properties`, uploads | `post-property` (PARTIAL) | P0 |
| 37 | `/dealer/dashboard/edit-property/[id]` | Edit Property | Update listing | Broker (owner) | Edit fields, SEO preview, status | `GET/PATCH /api/properties/[id]` | `edit-property/[id]` (PARTIAL) | P0 |
| 38 | `/dealer/dashboard/projects` (+Draft) | My Projects | Manage projects | Broker | Filter, edit, submit, to draft, delete | `GET /api/projects?mine=1`, `PATCH/DELETE` | `dealer-projects` | P1 |
| 39 | `/dealer/dashboard/add-project` | Add Project (6 steps) | Create project | Broker | Form, images, dates, SEO | `POST /api/projects` | `post-project` (PARTIAL) | P1 |
| 40 | `/dealer/dashboard/edit-project/[id]` | Edit Project | Update project | Broker (owner) | Edit, save draft/submit | `GET/PATCH /api/projects/[id]` | `edit-project/[id]` (PARTIAL) | P1 |
| 41 | `/dealer/dashboard/inquiries` (`?tab=messages`) | Communications | Leads + inbox | Broker | Search, reply (creates thread), mark read, archive, call, email; threads, compose, send | `/api/inquiries`, `/api/messages/threads*` | `(dealer)/inquiries` (PARTIAL: reply broken) | P0 |
| 42 | `/dealer/dashboard/analytics` | Analytics | Performance | Broker | Category/status filters, KPIs, monthly trend, city donut, top listings | `GET /api/dealer/analytics` | `(dealer)/analytics` (PARTIAL) | P2 |
| 43 | `/dealer/dashboard/profile` | Dealer Profile (6 tabs) | Business identity | Broker | Personal, Business & Branding, KYC & RERA, Services & Hours, Subscription, Preview; save | `PATCH /api/dealers/[id]`, `/api/dealer/kyc*`, subscription | `(tabs)/profile` dealer view + `dealer-kyc` (PARTIAL) | P1 |
| 44 | `/dealer/dashboard/settings` | Dealer Settings | Account prefs | Broker | Language, timezone, toggles (local), reset password | `forgot-password` | `dealer-settings` (PARTIAL) | P1 |
| 45 | `/dealer/dashboard/subscription` | Plans & Billing | Subscription + packs | Broker | Subscribe Starter ₹99/month, buy packs, payment history, FAQ | `/api/dealer/subscription*`, `/api/listing-plans`, `/api/payments/razorpay/*` | `subscription` (PARTIAL: wrong plans) | P0 |

### 2.3 Admin routes (WEB-ONLY)

| # | Route | Screen/Page | Purpose | User Role | Key Actions | API/Data | App Equivalent | Priority |
|---|---|---|---|---|---|---|---|---|
| 46 | `/admin` | Admin Dashboard | Platform KPIs | Admin | Stat cards, recent properties/activity | `/api/admin/analytics` | WEB-ONLY | — |
| 47 | `/admin/approvals` | Approvals | Moderate properties/projects | Admin | Approve, reject with reason, preview modal | properties/projects PATCH | WEB-ONLY | — |
| 48 | `/admin/properties` | Properties | Manage all listings | Admin | Search, filter, status, featured, delete | `/api/properties` | WEB-ONLY | — |
| 49 | `/admin/projects` | Projects | Manage projects | Admin | Featured, approve, reject, delete | `/api/projects` | WEB-ONLY | — |
| 50 | `/admin/users` | Users | Manage accounts | Admin | Role, +10 slots, verify/revoke lister, suspend | `/api/admin/users` | WEB-ONLY | — |
| 51 | `/admin/dealers` | Dealers | Manage directory | Admin | Grant/revoke dashboard, verify, remove | `/api/admin/users`, `/api/dealers` | WEB-ONLY | — |
| 52 | `/admin/kyc` | KYC Reviews | Review dealer KYC | Admin | Approve/reject | `/api/admin/kyc` | WEB-ONLY | — |
| 53 | `/admin/services` | Service Types | Taxonomy | Admin | Add, toggle, delete | `/api/service-types` | WEB-ONLY | — |
| 54 | `/admin/service-verifications` | Service Verify | Review providers | Admin | Approve/reject | `/api/admin/service-verifications` | WEB-ONLY | — |
| 55 | `/admin/categories` | Categories | Taxonomy | Admin | Add, toggle, delete | `/api/categories` | WEB-ONLY | — |
| 56 | `/admin/amenities` | Amenities | Taxonomy | Admin | Add, toggle, delete | `/api/amenities` | WEB-ONLY | — |
| 57 | `/admin/locations` | Locations | Active cities | Admin | Add, toggle, delete | `/api/locations` | WEB-ONLY | — |
| 58 | `/admin/filters` | Search Filters | Filter config | Admin | Add custom, rename, reorder, toggle | `/api/listing-filters` | WEB-ONLY | — |
| 59 | `/admin/pricing` | Pricing | Budget ranges | Admin | Edit buy/rent min/max | `/api/admin/settings` | WEB-ONLY | — |
| 60 | `/admin/listing-plans` | Listing Packs | Pack catalogue | Admin | Add, edit, hide | `/api/admin/listing-plans` | WEB-ONLY | — |
| 61 | `/admin/reports` | Reports | Charts + print | Admin | KPIs, charts, print PDF | context | WEB-ONLY | — |
| 62 | `/admin/messages` | Messages | Support console | Admin | Threads, resolve, new ticket | `/api/messages/threads*` | WEB-ONLY | — |
| 63 | `/admin/settings` | Platform Settings | Global config | Admin | Site info, limits, approval, maintenance | `/api/admin/settings` | WEB-ONLY | — |

### 2.4 Utility routes

| # | Route | Screen/Page | Purpose | User Role | Key Actions | API/Data | App Equivalent | Priority |
|---|---|---|---|---|---|---|---|---|
| 64 | `/auth/callback` | Auth callback | Email confirm, recovery, OAuth exchange | — | Redirect by role | Supabase code exchange | CREATE: deep link handler `sqftgo://auth/callback` | P0 |
| 65 | `not-found` / `error.tsx` (root, public, dealer, admin) | 404 & error boundaries | Recovery | All | Home, retry | — | CREATE: `+not-found.tsx`, route `ErrorBoundary` exports | P2 |

### 2.5 Modals & flows that behave like screens

| # | Route | Screen/Page | Purpose | User Role | Key Actions | API/Data | App Equivalent | Priority |
|---|---|---|---|---|---|---|---|---|
| M01 | listings/property | ContactOwnerModal | Contact + inquiry | All | Call, WhatsApp, inquiry form | `POST .../inquiries` | PARTIAL: `StickyCta` + sheet | P0 |
| M02 | `/property/[id]` (mobile web) | Contact drawer | Inquiry + visit forms | All | Submit inquiry/visit | inquiries, visits | PARTIAL: `modal-sheet` forms | P0 |
| M03 | `/listings` | Filter drawer (FilterPanel) | Advanced filters | All | All filters | listing-filters | `filter-sheet` | P0 |
| M04 | `/property/[id]` | Gallery lightbox | Full-screen photos | All | Swipe, thumbnails | images | CREATE | P1 |
| M05 | `/destinations/[slug]` | WeddingInquiryModal | Venue enquiry | All | Name, phone, email, date, guests, notes | `POST /api/enquiries` | CREATE | P1 |
| M06 | `/my-visits` | Reschedule dialog | Change visit date/time | User | Date (≥today), slot | `PATCH /api/visits/[id]` | CREATE (sheet) | P0 |
| M07 | `/my-visits` | Cancel confirm | Cancel visit | User | Confirm | `PATCH /api/visits/[id]` | CREATE (action sheet) | P0 |
| M08 | dealer inquiries | Reply dialog | Reply to lead | Broker | Send reply → thread | `POST /api/messages/threads`, `PATCH /api/inquiries/[id]` | PARTIAL (broken) | P0 |
| M09 | dealer messages | Compose overlay | New thread by email | Broker | Recipient, subject, body | `POST /api/messages/threads` | exists | P1 |
| M10 | dealer forms | "Preview both formats" | Card preview | Broker | Toggle grid/list | local | CREATE (optional) | P3 |
| M11 | subscription/add-property | Razorpay checkout | Payment | Broker | Pay | order/verify | `razorpay-checkout-modal` | P0 |
| M12 | `/admin/approvals` | ListingPreviewModal | Moderation preview | Admin | Approve/reject | — | WEB-ONLY | — |
| M13 | many | ConfirmDialog (delete/status) | Destructive confirm | All | Confirm/cancel | various | `app-alert` | P1 |
| M14 | navbar | City selector | Choose active city | All | Pick city | `/api/locations` | `CitySelectionModal` (static list) | P1 |

**Mobile-only screens that already exist and should be kept:** `onboarding`, `dealer-pending`, `dealer-kyc` (web keeps KYC inside dealer profile tab), `manage-visits` (web: dashboard "Confirm Tour"), `projects` (web: home rail only).

---

## 3. Complete Feature Inventory

Status is the **mobile app's** status relative to the web feature.

| # | Feature | Web Location | Description | User Action | App Required | Status | Priority |
|---|---|---|---|---|---|---|---|
| 01 | Email/password login | `/login`, `/api/auth/login` | Sign in, role redirect | Sign in | Yes | COMPLETE | P0 |
| 02 | Customer signup | `/login?tab=signup` | Name, email, password ≥8 | Create account | Yes | COMPLETE | P0 |
| 03 | Dealer signup | `/dealer/register` | intent=dealer + directory profile | Register firm | Yes | COMPLETE | P0 |
| 04 | Google OAuth | `/login`, `/auth/callback` | Supabase OAuth | Continue with Google | Yes | MISSING | P1 |
| 05 | Forgot password | `/forgot-password` | Reset email | Request link | Yes | COMPLETE | P0 |
| 06 | Update password | `/update-password`, settings | Recovery/new password | Set password | Yes | PARTIAL (API cookie-only; mobile Bearer call fails) | P0 |
| 07 | Session persistence & refresh | `AuthProvider` | Cookie session auto-refresh | Stay signed in | Yes | PARTIAL (no refresh token, `me` 401, AsyncStorage) | P0 |
| 08 | Guest browsing | middleware rules | Public catalogue | Browse without account | Yes | MISSING (login wall) | P0 |
| 09 | Role routing | login redirect, guards | user/broker portals | Land on right home | Yes | COMPLETE | P0 |
| 10 | Maintenance & suspended handling | middleware | Redirect to `/maintenance`, suspended → login | See notice | Yes | MISSING | P1 |
| 11 | Profile hub | `/profile` | Avatar, KPIs, completion, saved preview | View account | Yes | PARTIAL | P1 |
| 12 | Profile edit | `/profile/edit` | name, phone, city, bio | Save profile | Yes | PARTIAL (bio unmapped, silent local fallback) | P1 |
| 13 | Avatar upload | `/profile/edit` | `/api/uploads/avatar` | Change photo | Yes | MISSING (helper unused) | P1 |
| 14 | Preferences | `/settings` | Toggles (not persisted on web) | Toggle prefs | Yes | COMPLETE (device-only parity) | P3 |
| 15 | Help / FAQ | `/help` | FAQ search, categories, contact | Get help | Yes | NEEDS-MOBILE-ADAPTATION | P2 |
| 16 | Legal pages | `/privacy`, `/terms` | Long-form legal | Read | Yes | NEEDS-MOBILE-ADAPTATION | P2 |
| 17 | Active city selection | navbar, `useActiveCities` | Cities from `/api/locations` + All Bharat | Pick city | Yes | PARTIAL (static `CITIES`) | P1 |
| 18 | Home feed | `/` | 9 sections | Discover | Yes | NEEDS-MOBILE-ADAPTATION | P2 |
| 19 | Hero quick search | `HomeHero` | purpose, city, locality, type, budget | Search | Yes | PARTIAL | P1 |
| 20 | Text/locality search | `/listings` | title/locality | Search | Yes | COMPLETE | P0 |
| 21 | Core filters | `/listings` header | city, type, purpose, budget | Filter | Yes | COMPLETE | P0 |
| 22 | Advanced & admin-defined filters | `FilterPanel` | BHK, size, RERA, featured, furnishing, amenities, custom | Filter | Yes | PARTIAL (verify custom text/toggle/multi) | P1 |
| 23 | Sorting | `/listings` | latest, price asc/desc, size | Sort | Yes | COMPLETE | P1 |
| 24 | Pagination beyond 100 | `/api/properties` offset | Both clients cap at 100 | Scroll more | Yes | NEEDS-MOBILE-ADAPTATION (infinite scroll) | P0 |
| 25 | Map view | `CityMap` iframe | City map (no pins) | View map | Yes | MISSING | P2 |
| 26 | Grid/List toggle | `/listings` | Card layouts | Switch view | Optional | NEEDS-MOBILE-ADAPTATION | P3 |
| 27 | Projects list & detail | home rail, `/projects/[id]` | Project showcase | Browse project | Yes | COMPLETE | P1 |
| 28 | Dealer directory | `/dealers` | Search, category, city | Find dealer | Yes | PARTIAL (seed profiles leak into API mode) | P0 |
| 29 | Dealer public profile | `/dealers/[id]` | About, credentials, office, listings | View, call, email | Yes | PARTIAL (wrong fallback, city listings) | P1 |
| 30 | Destinations list | `/destinations` | Region chips, wedding filter, sort | Browse cities | Yes | PARTIAL | P2 |
| 31 | Destination detail | `/destinations/[slug]` | History, venues, estates, listings, localities | Explore city | Yes | PARTIAL | P2 |
| 32 | Wedding venue enquiry | `WeddingInquiryModal` | `POST /api/enquiries` | Send enquiry | Yes | MISSING | P1 |
| 33 | Property fetch by id | `/property/[id]` | `GET /api/properties/[id]` | Open any listing | Yes | PARTIAL (context-only lookup) | P0 |
| 34 | Gallery + lightbox | `PropertyDetailGallery` | Collage, lightbox | View photos | Yes | PARTIAL (no lightbox, placeholder photos) | P1 |
| 35 | Specs, description, amenities | `PropertyDetailInfo` | Key facts | Read | Yes | PARTIAL (fabricated facing/vaastu/reviews/rating) | P0 |
| 36 | Price & charges | `PropertyDetailInfo` | Breakdown | Read costs | Yes | COMPLETE (must use real `priceBreakdown`) | P2 |
| 37 | Location & landmarks | `PropertyDetailInfo` | Map + nearby | Read | Yes | PARTIAL (static image) | P1 |
| 38 | Similar listings | `PropertyDetailView` | Same city, 2 items | Browse similar | Yes | MISSING | P2 |
| 39 | Share | property header | Copy URL | Share | Yes | COMPLETE | P3 |
| 40 | Favorites | heart, `/favorites` | Server sync | Save/unsave | Yes | COMPLETE | P0 |
| 41 | Guest favorites merge | `useFavorites` | localStorage → server on login | Save as guest | Yes | MISSING | P1 |
| 42 | Send inquiry | `InquiryForm` | name, phone, email, message, presets | Inquire | Yes | COMPLETE | P0 |
| 43 | Call / WhatsApp owner | `ContactOwnerModal` | Linking | Call | Yes | COMPLETE | P0 |
| 44 | Book site visit | `VisitBookingForm` | date ≥ today, slot | Book | Yes | PARTIAL (free-text date) | P0 |
| 45 | My inquiries | `/my-inquiries` | History | Review | Yes | PARTIAL (shows local-only "dealer reply") | P1 |
| 46 | My visits | `/my-visits` | Upcoming/Past tabs | Review | Yes | PARTIAL (no tabs) | P1 |
| 47 | Reschedule/cancel visit | `/my-visits` dialogs | `PATCH /api/visits/[id]` | Change/cancel | Yes | MISSING | P0 |
| 48 | In-app notifications | navbar/sheet | list, read, mark all | Read alerts | Yes | COMPLETE | P1 |
| 49 | Owner post property | `/post-property` | 6-step wizard | List property | Yes | PARTIAL (fake RERA id, default amenities/image) | P0 |
| 50 | Multi-image upload | wizard/forms | up to 30 images | Add photos | Yes | MISSING (1 image) | P0 |
| 51 | My listings + slots | `/my-listings` | quota, lister status | Manage | Yes | PARTIAL (unlinked, hardcoded cap 2) | P0 |
| 52 | Owner edit listing | `/my-listings/[id]/edit` | edit fields | Edit | Yes | PARTIAL (API forbids role user PATCH) | P0 |
| 53 | Rejection reason display | lists | reason text | Fix & resubmit | Yes | PARTIAL | P1 |
| 54 | Services directory | `/services` | providers + types | Browse | Yes | PARTIAL (mock branch, route clash) | P1 |
| 55 | Service category view | `/services?category=` | filtered list | Filter | Yes | PARTIAL (static `services/[category]`) | P1 |
| 56 | Service provider profile | `/services/[id]` | details + map | View | Yes | MISSING | P0 |
| 57 | Book a service | `/services/[id]` | datetime, phone, message | Book | Yes | PARTIAL (`preferredAt` = now+24h) | P0 |
| 58 | My service bookings | `/my-service-bookings` | list + cancel | Cancel | Yes | COMPLETE | P1 |
| 59 | Service provider registration | `/services/register` | service type aware | Register | Yes | PARTIAL (dealer-register only) | P1 |
| 60 | Service manage | `/services/manage` | profile, booking requests | Confirm/decline/complete | Yes | MISSING | P0 |
| 61 | Service verification submit | `/services/manage` | reg ID, notes | Submit | Yes | MISSING | P1 |
| 62 | Dealer pending state | (mobile-only) | awaiting approval | Wait/refresh | Yes | COMPLETE | P1 |
| 63 | Dealer dashboard | `/dealer/dashboard` | KPIs, recent, visits | Overview | Yes | COMPLETE | P1 |
| 64 | Dealer property actions | `/dealer/dashboard/properties` | submit, draft, delete | Manage | Yes | COMPLETE | P0 |
| 65 | Dealer property filters | same | type, sort, drafts view | Filter | Yes | PARTIAL | P2 |
| 66 | Dealer add property (full) | `PropertyForm` | 6 steps, SEO, RERA, landmarks, images | Create | Yes | PARTIAL | P0 |
| 67 | Edit property (full) | edit routes | all fields + images | Edit | Yes | PARTIAL (subset of fields) | P0 |
| 68 | Listing quota + packs | add-property, subscription | Razorpay packs | Buy slots | Yes | COMPLETE | P0 |
| 69 | Projects CRUD | `ProjectForm` | types, configs, amenities, dates, images, SEO | Create/edit | Yes | PARTIAL (hardcoded types, no amenities, 1 image) | P1 |
| 70 | Inquiry triage | `DealerInquiriesPanel` | read, archive, call, email | Triage | Yes | COMPLETE (errors swallowed) | P1 |
| 71 | Inquiry reply → thread | `DealerInquiriesPanel` | creates direct thread | Reply | Yes | PARTIAL (reply text dropped by API) | P0 |
| 72 | Dealer message threads | `DealerMessagesPanel` | list, compose, send | Message | Yes | COMPLETE | P1 |
| 73 | Visit management | dashboard / `manage-visits` | confirm, complete, cancel | Manage | Yes | COMPLETE | P1 |
| 74 | Dealer analytics | `/analytics` | KPIs, trend, donut, top | Review | Yes | PARTIAL (silent local fallback) | P2 |
| 75 | Dealer business profile | `/dealer/dashboard/profile` | firm, branding, specialties, services, hours, listingActive | Edit | Yes | PARTIAL | P1 |
| 76 | KYC submission | `DealerKycPanel` | PAN, Aadhaar last 4, docs | Submit | Yes | PARTIAL (soft-fail local pending) | P0 |
| 77 | Partner subscription | `/subscription` | Starter ₹99/30d | Subscribe | Yes | PARTIAL (wrong plan catalogue) | P0 |
| 78 | Dealer settings | `/dealer/dashboard/settings` | password reset, prefs | Configure | Yes | PARTIAL | P1 |
| 79 | Admin dashboard | `/admin` | KPIs | — | No | WEB-ONLY | — |
| 80 | Listing moderation | `/admin/approvals` | approve/reject | — | No | WEB-ONLY | — |
| 81 | Admin property management | `/admin/properties` | status, featured | — | No | WEB-ONLY | — |
| 82 | Admin project management | `/admin/projects` | status, featured | — | No | WEB-ONLY | — |
| 83 | User management | `/admin/users` | role, slots, suspend | — | No | WEB-ONLY | — |
| 84 | Dealer management | `/admin/dealers` | access, verify | — | No | WEB-ONLY | — |
| 85 | KYC review | `/admin/kyc` | approve/reject | — | No | WEB-ONLY | — |
| 86 | Service verification review | `/admin/service-verifications` | approve/reject | — | No | WEB-ONLY | — |
| 87 | Service types taxonomy | `/admin/services` | CRUD | — | No | WEB-ONLY | — |
| 88 | Categories/amenities/locations | `/admin/*` | CRUD | — | No | WEB-ONLY | — |
| 89 | Search filter config | `/admin/filters` | CRUD/reorder | — | No | WEB-ONLY | — |
| 90 | Price ranges | `/admin/pricing` | edit | — | No | WEB-ONLY | — |
| 91 | Listing pack catalogue | `/admin/listing-plans` | CRUD | — | No | WEB-ONLY | — |
| 92 | Platform settings/maintenance | `/admin/settings` | config | — | No | WEB-ONLY | — |
| 93 | Reports & print | `/admin/reports` | charts | — | No | WEB-ONLY | — |
| 94 | Support console | `/admin/messages` | threads | — | No | WEB-ONLY | — |
| 95 | Loading/empty/error states | all pages | consistent states | — | Yes | PARTIAL | P1 |
| 96 | 404 & error boundary | `not-found.tsx`, `error.tsx` | recovery | Go home/retry | Yes | MISSING | P2 |
| 97 | Activity logging | `POST /api/logs` (dealer actions) | audit trail | — | Optional | MISSING | P3 |

---

## 4. Web → Mobile Feature Parity

| Web Feature | Web Screen | App Equivalent | Functional Match | UX Match | Gap | Required Action |
|---|---|---|---|---|---|---|
| Login / signup | `/login` | `auth/index` | 85% | 75% | No Google; no update-password deep link | Add Google (expo-auth-session) + recovery deep link |
| Session | AuthProvider | AppContext session | 50% | 60% | No refresh; `GET /api/auth/me` cookie-only; token in AsyncStorage | Backend Bearer support + refresh; SecureStore |
| Guest browsing | public pages | — | 0% | 0% | Login wall | Make catalogue public; gate actions with sign-in sheet |
| Home | `/` | `(tabs)/index` | 70% | 65% | Silent "show all" fallback; mock notifications | Prioritized sections; honest empty state |
| Search & filters | `/listings` | `(tabs)/explore` + `filter-sheet` | 80% | 75% | 100 cap, client-side filtering, custom filters unverified | Server params + infinite scroll |
| Map | `CityMap` | — | 0% | 0% | No map | Native map / static map with pins (P2) |
| Property detail | `/property/[id]` | `property/[id]` | 60% | 55% | No fetch-by-id, fabricated facts, no lightbox/similar, text date | Rebuild on real data |
| Inquiry | `InquiryForm` | property sheet | 95% | 80% | Presets, trust copy | Add quick-message chips |
| Visit booking | `VisitBookingForm` | property sheet | 70% | 40% | Free-text date | Native date picker + slot chips |
| My visits | `/my-visits` | `my-visits` | 50% | 50% | No tabs/reschedule/cancel | Segmented control + action sheet |
| My inquiries | `/my-inquiries` | `my-inquiries` | 80% | 70% | Fake reply display | Show threads instead |
| Favorites | `/favorites` | `saved` | 90% | 80% | No guest favorites | Local guest store + merge |
| Owner listing | `/post-property`, `/my-listings` | `post-property`, `my-listings` | 55% | 50% | Fake RERA, 1 image, unlinked list, cap 2, owner edit blocked by API | Rebuild wizard; link My Listings; backend owner PATCH |
| Dealer properties | `/dealer/.../properties` | `(dealer)/properties` | 85% | 75% | No type/sort filters | Filter sheet |
| Dealer add/edit property | `PropertyForm` | `post-property`, `edit-property` | 55% | 50% | Subset of fields, 1 image, no SEO | Shared multi-step form |
| Projects | `ProjectForm`, `/projects` | `post-project`, `dealer-projects`, `edit-project` | 65% | 60% | Hardcoded types, no amenities/dates/SEO | Shared multi-step form |
| Inquiries & reply | `DealerInquiriesPanel` | `(dealer)/inquiries` | 60% | 70% | Reply text lost; errors swallowed | Reply creates direct thread (web parity) |
| Messages | `DealerMessagesPanel` | `(dealer)/inquiries` Messages tab | 90% | 75% | — | Chat-style thread screen |
| Visits (dealer) | dashboard | `manage-visits` | 90% | 75% | Fire-and-forget | Await + error toast |
| Analytics | `/analytics` | `(dealer)/analytics` | 75% | 70% | Silent fallback; filters | Show error state; charts |
| Dealer profile | `/dealer/.../profile` | `(tabs)/profile` dealer view | 60% | 45% | Bank/Social "coming soon" (not web), logo/cover, specialties | Split into dedicated Business Profile screens |
| KYC | `DealerKycPanel` | `dealer-kyc` | 75% | 70% | Soft-fail success | Hard-fail on API error |
| Subscription | `/subscription` | `subscription` | 50% | 60% | Plans ₹999/2,499/5,999 vs web ₹99 Starter | Single plan from web catalogue |
| Listing packs | `BuyListingPlanButton` | `ListingPacksPanel` | 95% | 80% | — | Keep |
| Dealer settings | `/settings` | `dealer-settings` | 60% | 70% | update-password cookie-only | Use reset email or backend fix |
| Services directory | `/services` | `(tabs)/services` | 65% | 60% | Mock branch, route clash | Single API-backed directory |
| Service profile + booking | `/services/[id]` | — / `broker/[id]` | 30% | 30% | No screen; fixed datetime | Create screen + datetime picker |
| Service register/manage | `/services/register`, `/manage` | `dealer-register` | 20% | 20% | No manage, verification, booking requests | Create screens |
| Destinations | `/destinations*` | `destinations*` | 60% | 65% | No region/sort/wedding filters; no venue enquiry | Add chips + enquiry sheet |
| Notifications | navbar | `notifications-sheet` | 90% | 75% | Type squashed into 4 tags | Map full type set |
| Profile & settings | `/profile`, `/settings` | `(tabs)/profile` | 65% | 50% | Avatar, bio, fake loan pre-approval | Remove fake features; add avatar |
| Help & legal | `/help`, `/privacy`, `/terms` | static alerts | 30% | 20% | Alerts instead of screens | Dedicated screens |
| Maintenance/suspended | middleware | — | 0% | 0% | Not handled | Backend flag + screen |

---

## 5. Major User Flows

```text
FLOW 01: First launch onboarding & city
ENTRY: App install / first open
FLOW:
Onboarding slides (role intent, city)
↓ Choose city (from /api/locations active)
Home (guest)
↓ Optional "Sign in"
Auth
↓
Home (signed-in)
REQUIRED APIs:
- GET /api/locations
- GET /api/platform/settings
STATES:
- Loading: skeleton city grid
- Empty: fallback city list
- Error: retry banner, continue with default
- Success: city persisted
MOBILE ADAPTATION: Reduce onboarding to 2 screens (value + city). Role choice moves to signup. Do not block browsing on login.
```

```text
FLOW 02: Guest browse → action requires sign-in
ENTRY: Home / Explore as guest
FLOW:
Property detail
↓ Tap Save / Book visit / My listings
Sign-in sheet (login | signup)
↓ Authenticate
Return to original action (resume intent)
↓
Success
REQUIRED APIs:
- GET /api/properties, GET /api/properties/[id]
- POST /api/auth/login
STATES:
- Loading / Error on auth / Success resume
MOBILE ADAPTATION: Bottom-sheet auth that preserves navigation stack; inquiry and visit stay public (web parity).
```

```text
FLOW 03: Customer signup
ENTRY: Auth screen "Create account"
FLOW:
Signup form (name, email, password ≥8, confirm)
↓ Submit
Either signed in (dev skip-confirm) OR "Confirm your email" screen
↓ Email link (deep link /auth/callback)
Signed in → Home
REQUIRED APIs:
- POST /api/auth/signup (intent=user)
- /auth/callback (deep link)
STATES:
- Validation errors inline; 429 rate-limit message; confirm-email state; success
MOBILE ADAPTATION: One-column form, password visibility toggle, "Open mail app" button on confirm state.
```

```text
FLOW 04: Dealer signup → KYC → verified
ENTRY: Auth "I'm a dealer" / Profile "Become a dealer"
FLOW:
Account step (name, email, phone, password)
↓
Firm step (firm, RERA optional, category, city)
↓ Submit (role becomes broker immediately on web)
Dealer dashboard
↓ KYC: PAN, Aadhaar last 4, documents → Submit
KYC pending → admin approves (web) → directory verified badge
REQUIRED APIs:
- POST /api/auth/signup (intent=dealer)
- POST /api/dealers
- GET/PUT /api/dealer/kyc, POST /api/dealer/kyc/documents
STATES:
- Loading, upload progress, KYC pending/approved/rejected (with reason), error (must not fake success)
MOBILE ADAPTATION: 2-step form with progress header; KYC as a checklist card on dealer dashboard. Note: web does not gate the dashboard on KYC; mobile `dealer-pending` should reflect the same rule (only gate when role is not broker yet).
```

```text
FLOW 05: Login & role routing
ENTRY: Auth screen
FLOW:
Email + password
↓ Submit
user → (tabs) Home ; broker → (dealer) Dashboard ; admin → "Use web console" message
REQUIRED APIs:
- POST /api/auth/login
- GET /api/auth/me (needs Bearer support)
STATES:
- 401 invalid creds, 403 suspended, 429 rate limit, success
MOBILE ADAPTATION: Single login form (no customer/dealer toggle needed; role comes from server).
```

```text
FLOW 06: Forgot / reset password
ENTRY: Auth "Forgot password"
FLOW:
Email sheet → Submit (always ok)
↓ Email link → deep link sqftgo://auth/callback?type=recovery
Update password screen (new + confirm ≥8)
↓ Submit
Login
REQUIRED APIs:
- POST /api/auth/forgot-password
- POST /api/auth/update-password (needs Bearer support) or Supabase client updateUser
STATES:
- Sent confirmation, invalid/expired link, success
MOBILE ADAPTATION: Universal link / scheme redirect configured in Supabase redirect URLs.
```

```text
FLOW 07: Search, filter, sort
ENTRY: Home hero search / Explore tab
FLOW:
Explore (city + search field)
↓ Tap "Filters"
Filter sheet (purpose, type, budget, BHK, size, furnishing, amenities, RERA, featured, custom)
↓ Apply
Results list (infinite scroll, sort menu)
↓ Tap card
Property detail
REQUIRED APIs:
- GET /api/properties?city&type&purpose&minPrice&maxPrice&search&limit&offset
- GET /api/listing-filters, /api/amenities, /api/categories, /api/platform/settings (price ranges)
STATES:
- Skeleton cards, empty ("No matches" + reset), error banner + retry, success with count
MOBILE ADAPTATION: Sticky search bar, active-filter chips row, filter sheet with live result count on Apply button.
```

```text
FLOW 08: Property detail → inquiry
ENTRY: Property card
FLOW:
Property detail (gallery, price, key facts, about, amenities, costs, location, similar)
↓ Tap "Contact"
Contact sheet (call, WhatsApp, message form with quick chips)
↓ Submit
Success state ("Owner notified")
REQUIRED APIs:
- GET /api/properties/[id]
- POST /api/properties/[id]/inquiries
STATES:
- Loading skeleton, not found (non-active), validation errors, 429, success
MOBILE ADAPTATION: Sticky bottom CTA bar (price + Contact + Visit), form prefilled from profile.
```

```text
FLOW 09: Book a site visit
ENTRY: Property detail "Book visit"
FLOW:
Visit sheet: date picker (≥ today, default tomorrow), time slot chips (10AM–5PM, no 1PM), notes
↓ Confirm
Success → "View in My Visits"
REQUIRED APIs:
- POST /api/properties/[id]/visits
STATES:
- Validation, 429, success
MOBILE ADAPTATION: Native date picker + horizontally scrolling slot chips.
```

```text
FLOW 10: Manage my visits
ENTRY: Profile → My visits
FLOW:
Segmented: Upcoming | Past
↓ Tap visit → action sheet (Reschedule / Cancel / Call host)
Reschedule sheet (date + slot) or Cancel confirm
↓
Updated card + toast
REQUIRED APIs:
- GET /api/visits
- PATCH /api/visits/[id]
STATES:
- Loading, empty per tab, error, success
MOBILE ADAPTATION: Swipe actions on rows plus action sheet.
```

```text
FLOW 11: Favorites (guest + signed in)
ENTRY: Heart on any card
FLOW:
Guest: save locally → on login merge to server
Signed in: POST/DELETE favorite
↓
Saved screen
REQUIRED APIs:
- GET/POST /api/favorites, DELETE /api/favorites/[propertyId]
- GET /api/properties/[id] for saved items outside loaded page
STATES:
- Optimistic toggle with rollback on error, empty saved state
MOBILE ADAPTATION: Haptic on toggle; Saved reachable from Profile and Home header.
```

```text
FLOW 12: Owner posts a property
ENTRY: Profile → "List a property" / Home sell banner
FLOW:
Eligibility check (allowUserListings, slots left, lister not rejected)
↓
Wizard: Type & purpose → Location (city, locality, 3 landmarks) → Specs (BHK, size, furnishing, amenities, description) → Photos (≤30) → Price → Review
↓ Submit (Pending Review or Active per platform setting)
Success (honest copy: "Submitted for review")
↓ Later: approved / rejected (reason) notification
My listings → edit & resubmit
REQUIRED APIs:
- GET /api/platform/settings, GET /api/properties?mine=1
- POST /api/uploads/property-image, POST /api/properties
- PATCH /api/properties/[id] (backend must allow owner role user)
STATES:
- Draft autosave, upload progress per photo, quota reached, rejected lister, error, success
MOBILE ADAPTATION: Full-screen stepper with progress bar, sticky Next/Back, "Save draft" in header.
```

```text
FLOW 13: Dealer adds property with quota
ENTRY: Dealer Properties "+"
FLOW:
Quota check → if at cap: Listing packs sheet → Razorpay → verify → quota refreshed
↓
6-step form (Basic, Location & Details, Pricing, Amenities, Media & SEO, Review)
↓ Save draft / Publish (Pending Review)
Properties list (status badge)
REQUIRED APIs:
- GET /api/dealer/listing-quota, GET /api/listing-plans
- POST /api/payments/razorpay/order, /verify
- POST /api/properties (handle 403 LISTING_QUOTA)
STATES:
- Checking slots, at-cap, payment cancelled/failed, publish validation, success
MOBILE ADAPTATION: Quota pill in header ("2 of 3 slots"); packs in bottom sheet.
```

```text
FLOW 14: Dealer subscription
ENTRY: Dealer Profile → Plans & Billing
FLOW:
Plan card (Starter ₹99 / 30 days, unlimited listings)
↓ Subscribe
Razorpay checkout (WebView)
↓ Verify
Active banner + payment history
REQUIRED APIs:
- GET /api/dealer/subscription
- POST /api/dealer/subscription/order, /verify
STATES:
- Billing disabled (no keys), pending, active, past_due/expired, error
MOBILE ADAPTATION: Single plan hero card; FAQ in accordion.
```

```text
FLOW 15: Dealer project create & submit
ENTRY: Dealer Projects "+"
FLOW:
Basic → Location & Inventory → Pricing & Timeline → Amenities → Media & SEO → Review
↓ Save draft / Submit (needs ≥1 image)
Projects list
REQUIRED APIs:
- POST/PATCH /api/projects, POST /api/uploads/property-image
STATES:
- Validation (ranges), image required, success
MOBILE ADAPTATION: Same stepper component as property form.
```

```text
FLOW 16: Dealer inquiry triage & reply
ENTRY: Dealer Inbox tab (badge = new inquiries)
FLOW:
Inquiry list (search)
↓ Tap inquiry → detail
Reply composer
↓ Send → creates direct thread (POST /api/messages/threads with propertyId) → mark read
Thread screen
REQUIRED APIs:
- GET /api/inquiries
- POST /api/messages/threads
- PATCH /api/inquiries/[id]
STATES:
- Unread dot, sending, failure (must surface), success
MOBILE ADAPTATION: Swipe to archive / mark read; call & email quick actions.
```

```text
FLOW 17: Dealer messaging
ENTRY: Inbox → Messages segment
FLOW:
Thread list → thread (chat bubbles) → send
or Compose (recipient email, subject, body)
REQUIRED APIs:
- GET/POST /api/messages/threads, GET /api/messages/threads/[id], POST .../messages
STATES:
- 404 recipient not found, archived thread read-only, success
MOBILE ADAPTATION: iMessage-style thread with keyboard-avoiding composer.
```

```text
FLOW 18: Dealer visit management
ENTRY: Dashboard upcoming visits / Manage visits
FLOW:
Visit list → Confirm / Complete / Cancel / Reschedule
REQUIRED APIs:
- GET /api/visits, PATCH /api/visits/[id]
STATES:
- Loading, empty, error (no silent failure), success
MOBILE ADAPTATION: Grouped by date; action sheet per visit.
```

```text
FLOW 19: Dealer analytics
ENTRY: Analytics tab
FLOW:
KPIs → monthly inquiries trend → city split → top listings → filter chips
REQUIRED APIs:
- GET /api/dealer/analytics
STATES:
- Skeleton, error + retry (no fabricated fallback), empty (no listings)
MOBILE ADAPTATION: Swipeable KPI cards; simple charts (react-native-svg).
```

```text
FLOW 20: Dealer business profile
ENTRY: Dealer Profile tab
FLOW:
Profile overview (preview as customers see it)
↓ Edit sections: Personal, Business & Branding, Services & Hours, Visibility
↓ Save
REQUIRED APIs:
- PATCH /api/auth/me, PATCH /api/dealers/[id], POST /api/uploads/avatar (logo/cover via upload)
STATES:
- Validation, saving, success, error
MOBILE ADAPTATION: Grouped settings list → push screens per section (no 6-tab page).
```

```text
FLOW 21: Service discovery → booking
ENTRY: Services tab
FLOW:
Category chips + search → provider list
↓ Tap provider
Service profile (about, services offered, contact, map)
↓ "Book a visit"
Booking sheet (date+time picker, phone, message) → sign-in if guest
↓ Submit
Success → My service bookings
REQUIRED APIs:
- GET /api/service-types, GET /api/dealers?surface=services, GET /api/dealers/[id]
- POST /api/services/[id]/bookings
STATES:
- Loading, empty category, error, success
MOBILE ADAPTATION: Category grid → list → detail push; booking in sheet.
```

```text
FLOW 22: Become a service provider & manage
ENTRY: Services tab "List your business" / Profile
FLOW:
Register form (firm, owner, service type, city, address, email, mobile, description, services, GST, pledge)
↓ Submit → verification submitted
Manage screen: profile edit, verification status (reason), booking requests (Confirm / Decline / Complete)
REQUIRED APIs:
- POST /api/dealers, POST /api/service-verifications
- PATCH /api/dealers/[id], GET /api/services/[id]/bookings, PATCH /api/service-bookings/[id]
STATES:
- Unverified/pending/verified/rejected, empty requests, success
MOBILE ADAPTATION: "My Business" section in Profile for providers; requests list with swipe actions.
```

```text
FLOW 23: Buyer service bookings
ENTRY: Profile → Service bookings
FLOW:
List → Cancel pending (confirm) → status updated
REQUIRED APIs:
- GET /api/service-bookings, PATCH /api/service-bookings/[id]
STATES:
- Loading, empty, error, success
MOBILE ADAPTATION: Status-colored badges by booking status (not a single tone).
```

```text
FLOW 24: Destinations → venue enquiry
ENTRY: Home "Destinations"
FLOW:
Destinations (region chips, wedding toggle, sort)
↓
Destination detail (about, venues, estates, live listings, localities)
↓ "Enquire" on venue
Enquiry sheet (name, phone, email required, date, guests, notes)
↓ Submit
Success
REQUIRED APIs:
- GET /api/locations, GET /api/properties?city
- POST /api/enquiries
STATES:
- Inactive city "not found", success
MOBILE ADAPTATION: Hero image header collapsing into nav bar; venues as horizontal carousel. Email must be required in UI (web bug: marked optional but API requires it).
```

```text
FLOW 25: Notifications
ENTRY: Bell in Home header
FLOW:
Notifications list → tap → deep link to entity (property, visit, inquiry, thread)
↓ Mark all read
REQUIRED APIs:
- GET /api/notifications, PATCH /api/notifications/[id], POST /api/notifications/mark-all-read
STATES:
- Empty, unread badges, error
MOBILE ADAPTATION: Full-screen list (not a cramped sheet) with entity routing; pull-to-refresh; future push (not in web).
```

```text
FLOW 26: Profile edit & avatar
ENTRY: Profile → Edit
FLOW:
Avatar picker (camera/library) → upload
↓ Name, phone, city (active), bio
↓ Save
Profile
REQUIRED APIs:
- POST /api/uploads/avatar, PATCH /api/auth/me
STATES:
- Upload progress, validation, error (no silent local fallback), success
MOBILE ADAPTATION: iOS grouped form; avatar action sheet.
```

```text
FLOW 27: Settings, help, legal, logout
ENTRY: Profile → Settings
FLOW:
Settings list (notifications, language, password reset, help, privacy, terms, sign out)
REQUIRED APIs:
- POST /api/auth/forgot-password, POST /api/auth/logout
STATES:
- Confirm sign out, success
MOBILE ADAPTATION: Standard iOS settings list with disclosure rows.
```

```text
FLOW 28: Edge — maintenance, suspended, quota, rate limits
ENTRY: Any API call
FLOW:
403 suspended → sign out + message
429 → "Too many attempts, retry in N s" (Retry-After)
403 LISTING_QUOTA → packs sheet
Maintenance (needs API flag) → maintenance screen
REQUIRED APIs:
- All; GET /api/platform/settings (add maintenance flag — backend)
STATES:
- Blocking screens, inline errors
MOBILE ADAPTATION: Central API error handler mapping codes to UI.
```

---

## 6. Screen-by-Screen UX Audit

```text
SCREEN: Home
ROUTE: web `/` → mobile `(tabs)/index`
PURPOSE: Discovery entry
CURRENT EXPERIENCE: Web stacks 9 sections incl. 4 overlapping property carousels; mobile has switcher, category cards, Top Picks, buttons, banner, feed, dealers.
FUNCTIONALITY:
- Hero search, purpose tabs, top picks, projects, developers, newly added, sell CTA
- APIs: properties, projects, dealers, platform settings
PROBLEMS:
1. Web: redundant carousels; "Projects" section actually shows properties (HomeProminentProjects).
2. Web: hardcoded hero stats (1,200+ listings, 100% RERA).
3. Mobile: if no city listings, silently shows all listings; mock notifications.
CONTENT PROBLEMS:
- Repeated property rails; marketing stats not backed by data
UI PROBLEMS:
- Crowded; 9–11px uppercase labels (web)
MOBILE RECOMMENDATION: Large-title header (city selector + bell) → search pill → purpose segmented control → "Top picks" rail → "New projects" rail → "Explore by type" grid → "Trusted dealers" rail → sell CTA card. Max 5 sections. Honest empty state per city.
PRIORITY: P1
```

```text
SCREEN: Explore / Listings
ROUTE: `/listings` → `(tabs)/explore`
PURPOSE: Search & filter
CURRENT EXPERIENCE: Web header filters + sidebar + grid/list/map; mobile list + filter sheet + chips.
FUNCTIONALITY:
- All filters, sort, favorites, contact
- APIs: properties (limit 100), listing-filters
PROBLEMS:
1. 100-item cap, client-side filtering in both clients.
2. Filters not reflected in URL/deep link.
3. Map has no pins (web) / none (mobile).
CONTENT PROBLEMS:
- List cards on web include description + hardcoded "Verified Owner"
UI PROBLEMS:
- Web header bar crowded with 5 controls
MOBILE RECOMMENDATION: Search pill + horizontal quick chips (Buy/Rent, BHK, Budget) + "Filters (n)" button → sheet; infinite list with result count; sort menu in nav bar; optional map toggle (P2).
PRIORITY: P0
```

```text
SCREEN: Property Detail
ROUTE: `/property/[id]` → `property/[id]`
PURPOSE: Evaluate and contact
CURRENT EXPERIENCE: Web ~9 blocks + sticky forms; mobile many sections incl. fabricated content.
FUNCTIONALITY:
- Gallery, price, specs, about, amenities, costs, trust audit, location, similar, inquiry, visit, favorite, share
- APIs: GET property, POST inquiry, POST visit
PROBLEMS:
1. Web: hardcoded "Trust & Verification Audit", generated price breakdown, phone fallback 9876543210.
2. Mobile: fabricated facing/vaastu/water/reviews/rating/agent avatars, Unsplash map, no fetch-by-id.
3. Mobile: visit date free-text.
CONTENT PROBLEMS:
- Trust claims repeated (badges, audit, form disclaimer); long description
UI PROBLEMS:
- Dense; CTA duplication
MOBILE RECOMMENDATION: Full-bleed gallery (tap → lightbox) → title/price/location block → 4 key-fact tiles → "About" (3 lines + Read more) → Amenities (6 + "See all" sheet) → Costs (collapsed accordion) → Location (static map + landmarks) → Listed by (owner/dealer row) → Similar rail. Sticky bottom bar: price + "Visit" + "Contact". Show only real data; hide sections with no data.
PRIORITY: P0
```

```text
SCREEN: Post Property (owner) / Add Property (dealer)
ROUTE: `/post-property`, `/dealer/dashboard/add-property` → `post-property`
PURPOSE: Create listing
CURRENT EXPERIENCE: Web two different forms (6-step wizard vs 6-step dealer form); mobile single 858-line form.
FUNCTIONALITY:
- Type, purpose, location, landmarks, specs, amenities, photos, price, RERA, SEO, review
- APIs: uploads, POST properties, quota
PROBLEMS:
1. Mobile generates fake RERA IDs; default amenities and Unsplash image injected.
2. One image only; no SEO; no sell purpose parity check.
3. Web copy says "live instantly" while approval is required.
CONTENT PROBLEMS:
- Misleading success copy
UI PROBLEMS:
- Long single scroll (mobile), 65 hardcoded colors
MOBILE RECOMMENDATION: One shared `ListingForm` stepper for owners and dealers (dealer-only steps: RERA/SEO). Progress bar, one topic per step, photo grid with reorder, sticky footer. Honest submit copy based on `require_listing_approval`.
PRIORITY: P0
```

```text
SCREEN: My Listings (owner)
ROUTE: `/my-listings` → `my-listings`
PURPOSE: Owner inventory + slots
CURRENT EXPERIENCE: Unlinked on mobile; cap hardcoded 2 (web copy also says 2).
FUNCTIONALITY:
- KPIs, rows with status/rejection, add, edit
PROBLEMS:
1. Unreachable on mobile.
2. Cap mismatch (server default 3).
3. Owner edits rejected by API.
CONTENT PROBLEMS:
- Wrong quota copy
UI PROBLEMS:
- n/a
MOBILE RECOMMENDATION: Profile row "My listings (2/3)" → list with status badges, rejection reason inline, swipe to edit.
PRIORITY: P0
```

```text
SCREEN: My Visits
ROUTE: `/my-visits` → `my-visits`
PURPOSE: Manage site visits
CURRENT EXPERIENCE: Web tabs + reschedule/cancel; mobile read-only list.
FUNCTIONALITY:
- Tabs, reschedule, cancel, host contact
PROBLEMS:
1. Missing reschedule/cancel on mobile.
2. No refresh.
3. "← Back" text control inconsistent.
CONTENT PROBLEMS: none major
UI PROBLEMS: inconsistent back control
MOBILE RECOMMENDATION: Segmented Upcoming/Past, cards with date block, action sheet.
PRIORITY: P0
```

```text
SCREEN: Services Directory
ROUTE: `/services` → `(tabs)/services` (+ legacy `services.tsx`, `services/[category]`)
PURPOSE: Find providers
CURRENT EXPERIENCE: Web hero + explainer + sidebar + 2-col cards + CTA; mobile API/mock split, static category screen.
FUNCTIONALITY:
- Search, categories, call/email, profile, register CTA
PROBLEMS:
1. Three overlapping mobile screens; route clash at `/services`.
2. Static providers in category screen.
3. No provider detail or booking screen.
CONTENT PROBLEMS:
- Web explainer cards and CTA band repeat value prop
UI PROBLEMS:
- Web sticky sidebar + chips duplicates
MOBILE RECOMMENDATION: Category grid (icons from service types) → provider list → provider detail → booking sheet. Delete legacy screens.
PRIORITY: P0
```

```text
SCREEN: Dealer Inbox (Inquiries + Messages)
ROUTE: `/dealer/dashboard/inquiries` → `(dealer)/inquiries`
PURPOSE: Lead handling
CURRENT EXPERIENCE: Two tabs; reply dialog; threads.
FUNCTIONALITY:
- Search, reply, read, archive, call, email, threads, compose
PROBLEMS:
1. Mobile reply sends `replyMessage` that the API drops (schema `{status}` only); buyer never sees it.
2. Errors swallowed.
3. 591-line screen mixing two features.
CONTENT PROBLEMS: none
UI PROBLEMS: dense rows
MOBILE RECOMMENDATION: Segmented "Leads | Messages"; lead detail screen with reply → thread; chat thread screen.
PRIORITY: P0
```

```text
SCREEN: Dealer Business Profile
ROUTE: `/dealer/dashboard/profile` → `(tabs)/profile` dealer view
PURPOSE: Business identity, KYC, plan
CURRENT EXPERIENCE: Web 1,191 lines, 6 tabs, duplicate preview, subscription repeated; mobile 1,650-line combined profile with "Coming soon" tabs.
FUNCTIONALITY:
- Personal, firm/branding, specialties, services, hours, visibility, KYC, subscription
PROBLEMS:
1. Overloaded single screen on both platforms.
2. Fake defaults ("5+ Yrs", "2 Experts").
3. Mobile Bank/Social tabs not in web.
CONTENT PROBLEMS:
- Repeated subscription info, metrics with fake defaults
UI PROBLEMS:
- Tabs overflow; micro labels
MOBILE RECOMMENDATION: Profile tab = header card (logo, firm, verified badge, completion ring) + grouped rows: Business details, Services & hours, Public visibility, KYC & verification, Plans & billing, Settings. Each row pushes a focused screen. Remove Bank/Social.
PRIORITY: P1
```

```text
SCREEN: Subscription / Plans & Billing
ROUTE: `/dealer/dashboard/subscription` → `subscription`
PURPOSE: Paid plan + packs
CURRENT EXPERIENCE: Web 7 stacked sections; mobile 3 static plan cards that do not exist on backend.
FUNCTIONALITY:
- Subscribe, packs, history, FAQ
PROBLEMS:
1. Mobile plan catalogue wrong (Professional/Enterprise return "Unknown plan").
2. No role check on mobile.
3. Pack overlaps unlimited plan (business issue, web).
CONTENT PROBLEMS:
- FAQ and how-it-works verbose
UI PROBLEMS:
- Long page
MOBILE RECOMMENDATION: Current status card → single plan card → packs (if not unlimited) → history (collapsed) → FAQ accordion.
PRIORITY: P0
```

```text
SCREEN: Buyer Profile
ROUTE: `/profile` → `(tabs)/profile`
PURPOSE: Account hub
CURRENT EXPERIENCE: Mobile includes EMI calculator, fake loan pre-approval, static FAQ/terms alerts, device-only toggles.
FUNCTIONALITY:
- Edit profile, saved, inquiries, visits, bookings, listings, settings
PROBLEMS:
1. Fake "Request Partner Bank Pre-Approval".
2. Bio not mapped; avatar missing.
3. Two different notification-pref storage keys.
CONTENT PROBLEMS:
- Too many unrelated tools in one screen
UI PROBLEMS:
- 1,650 lines; mixed patterns
MOBILE RECOMMENDATION: Header (avatar, name, city, completion) → "Activity" group (Saved, Inquiries, Visits, Service bookings) → "Selling" group (My listings, List a property) → "Business" group (provider/dealer) → "Settings & support". Move EMI calculator into property detail costs section.
PRIORITY: P1
```

```text
SCREEN: Destination Detail
ROUTE: `/destinations/[slug]` → `destinations/[slug]`
PURPOSE: City guide + wedding venues
CURRENT EXPERIENCE: Web 7 sections; mobile static + live listings.
FUNCTIONALITY:
- History, venues + enquiry, estates, listings, localities, related
PROBLEMS:
1. No enquiry on mobile.
2. Web modal email optional vs API required.
3. Long history text.
CONTENT PROBLEMS:
- Long editorial copy, "illustrative" estates
UI PROBLEMS:
- Very long scroll
MOBILE RECOMMENDATION: Collapsing hero → stat chips → About (expandable) → Venues carousel (enquire) → Live listings rail → Localities chips → Related.
PRIORITY: P2
```

```text
SCREEN: Auth
ROUTE: `/login` → `auth/index`
PURPOSE: Sign in / up
CURRENT EXPERIENCE: Mobile customer/dealer toggle; web tabs + slideshow + Google.
PROBLEMS:
1. No Google on mobile.
2. Role toggle duplicates server role.
3. "Keep me logged in" no-op on web.
MOBILE RECOMMENDATION: Logo, segmented Sign in / Create account, Continue with Google, email form, "I'm a dealer" link to dealer registration.
PRIORITY: P0
```

```text
SCREEN: Onboarding
ROUTE: mobile-only `onboarding`
PURPOSE: First-run setup
CURRENT EXPERIENCE: 4 slides, 998 lines; intent choice never saved; static city list incl. "coming soon".
PROBLEMS:
1. Collects data it discards.
2. Blocks browsing.
3. Static cities.
MOBILE RECOMMENDATION: 2 screens: value proposition → city picker (API). Skip button.
PRIORITY: P1
```

```text
SCREEN: Dealer Dashboard / Properties / Projects / Analytics
ROUTE: `/dealer/dashboard*` → `(dealer)/*`, `dealer-projects`
PURPOSE: Dealer operations
CURRENT EXPERIENCE: Functional; filters partial; fire-and-forget writes.
PROBLEMS:
1. Silent failures.
2. Missing type/sort filters.
3. Analytics silent local fallback.
MOBILE RECOMMENDATION: Dashboard: greeting + KPI cards + "Needs attention" list (new leads, pending visits, rejected listings) + quick actions. Properties: segmented status + filter sheet + swipe actions.
PRIORITY: P1
```

---

## 7. Content-Heavy Screens

| Screen | Problem | Information to Keep | Information to Reduce | Recommended Pattern |
|---|---|---|---|---|
| Home (web `/`) | 9 sections, 4 overlapping property rails, fake stats | Search, top picks, projects, dealers, sell CTA | Prominent + Highlighted + Newly Added rails, hero stats | 5 prioritized sections, horizontal rails, "See all" links |
| Property Detail | ~9 blocks, repeated trust claims, long description, fabricated data | Photos, price, key facts, location, contact | Audit block, generated breakdown, disclaimers | Summary card + accordions (Costs, Amenities, Location) + sticky CTA |
| Dealer Profile (web 1,191 lines / mobile 1,650) | 6 tabs, duplicate preview, subscription repeated | Firm identity, contact, services, KYC status | Preview duplication, plan details, fake metrics | Grouped list → push screens; completion ring |
| Subscription | 7 sections incl. FAQ, how-it-works | Status, plan, packs, history | How-it-works copy, long FAQ | Status card + accordion FAQ + collapsed history |
| Destination Detail | Long history, 7 sections | Hero, venues, live listings | History text, estate typologies | Expandable About; carousels; tabs (Venues / Listings / Areas) |
| Services Directory | Hero + explainer + directory + CTA band | Categories, providers | Explainer cards, CTA band | Category grid → list; single "List your business" row |
| Privacy / Terms | 7–8 long sections, sticky TOC | All legal text (must keep) | — (can't remove) | Section list → detail screens or accordions; readable 16pt body |
| Post Property (mobile single scroll) | All fields in one long form | All required fields | Optional fields upfront | Stepper with one topic per step; optional fields collapsed |
| Buyer Profile (mobile) | EMI tool, loan, FAQ, terms, toggles, menus in one screen | Account, activity, listings, settings | EMI (move), fake loan, static FAQ alerts | Grouped iOS list with sections |

---

## 8. UI Consistency Audit

| Component | Current Variations | Problem | Recommendation |
|---|---|---|---|
| Buttons | Web: `Button` 5 variants, always uppercase bold; plus inline Tailwind buttons. Mobile: ad-hoc `Pressable` styles per screen, no shared Button | Inconsistent height, casing, color | CREATE `Button` (primary, secondary, tertiary, destructive; sm/md/lg; loading) |
| Cards | Web: PropertyCard grid/list, DestinationCard dark, WeddingVenueCard, dealer cards. Mobile: `property-card`, `expert-card`, `service-card`, inline cards in dealer screens | Different radius/shadow/padding | MERGE into `Card` base + `PropertyCard`, `PersonCard` (dealer/provider), `StatCard` |
| Inputs | Web: FormField/TextInput/TextArea, CustomSelect. Mobile: raw `TextInput` styled per screen | No shared validation display | CREATE `TextField`, `SelectField` (sheet picker), `DateField`, `TextArea` |
| Typography | Web: 9–11px uppercase black labels, `font-serif` mapped to sans. Mobile: token type scale but `themed-text` and `ui/text` unused | Micro text, unused layers | REFACTOR to single `Text` with variants; REMOVE unused text layers |
| Colors | Web brand tokens + overridden `blue-*`/`emerald-*` + hardcoded hex. Mobile `tokens.ts` + 65 literals in post-property + template `constants/theme.ts` | Drift between platforms; literals | REFACTOR: tokens only; REMOVE `constants/theme.ts` |
| Icons | Web lucide + FontAwesome. Mobile iconoir (`icons.tsx`) + unused `icon-symbol`, `lucide-react-native` installed unused | Multiple icon sets | KEEP iconoir via `icons.tsx`; REMOVE unused sets |
| Spacing | Web double paddings (`pt-32`+`pt-24`, `p-6` inside shell). Mobile token spacing, inline values | Irregular rhythm | REFACTOR to 4-pt scale, screen padding 20 |
| Border radius | Web `rounded-xl`/`3xl` mix. Mobile 4–20 | Inconsistent | Standardize 10 / 16 / 24 / pill |
| Navigation / back | Mobile: "← Back" text, ChevronLeft buttons, `ScreenNavbar onBack` | Three patterns | KEEP `ScreenNavbar`; REMOVE others |
| Tabs | Mobile: two near-duplicate custom tab bars; material top tabs at bottom (swipeable) | Duplicate code; swipe conflicts with carousels | MERGE into one `TabBar`; use bottom tabs (non-swipe) |
| Segmented controls | Web pill tabs, chips; mobile chips | No segmented control | CREATE `SegmentedControl` |
| Modals / sheets | Web Dialog + hand-rolled overlays (compose). Mobile `modal-sheet`, RN Modal, `app-alert` | Mixed | KEEP `modal-sheet` (rename `Sheet`), `app-alert`; MERGE others |
| Lists | Web DataTable, panels. Mobile inline rows, `menu-row` | No list row primitive | CREATE `ListRow` (leading, title, subtitle, trailing, chevron, swipe actions) |
| Forms | Web stepper (StepProgress only in wizard; dealer forms custom sidebar). Mobile single scroll forms | Three stepper styles | CREATE `Stepper` / `FormStep` |
| Status badges | Web `Badge` status map. Mobile `STATUS_TONE` maps in 4 files, unused `ui/badge` | Duplicates | MERGE into `StatusBadge` + `lib/status-labels.ts` |
| Empty states | Web `EmptyState`; mobile `empty-state` | Mostly fine | KEEP; add illustration/icon + action |
| Loading states | Web PageLoader/skeleton/info Alert/text. Mobile spinners, `auth-loading` | Mixed | CREATE `Skeleton` set (card, row, detail) |
| Error states | Web ErrorState + Alert + `alert()`. Mobile mostly silent | Errors hidden | CREATE `ErrorState` + `Toast`; never swallow |
| Success states | Web inline Alert, toasts, success screens with timed redirects | Inconsistent | CREATE `Toast` + `SuccessScreen` |
| Price formatting | Mobile `formatIndianPrice` vs `formatIndianCurrency` | Two formats | MERGE into `lib/format.ts` |

---

## 9. Premium iOS-Inspired Mobile Direction (Recommendation)

**Principle:** Preserve functionality → Adapt interaction → Simplify presentation.

- **Hierarchy:** iOS large titles on root tab screens collapsing to inline titles on scroll; one primary action per screen; secondary actions in nav bar or overflow menu.
- **Whitespace:** 20pt screen margins, 24pt between sections, 12pt within groups.
- **Typography:** Inter (already bundled) with a strict scale; minimum 11pt for badges only; body 16–17pt; no uppercase black micro-labels.
- **Surfaces:** cream grouped background, white cards with hairline border (`StyleSheet.hairlineWidth`) and very soft shadow; 16pt card radius, 24pt sheet radius.
- **Color discipline:** navy for text and secondary actions, terracotta only for the primary CTA and key highlights, gold reserved for "Featured".
- **Navigation:** 5-tab bottom bar with SF-like icons, haptic on tab change; stack push for detail; sheets for filters, forms under 5 fields, pickers, confirmations.
- **Motion:** shared-element-like image transitions card→detail (Reanimated), spring sheets, skeleton shimmer, haptics on save/favorite/success.
- **Honesty as premium:** no fabricated stats, ratings, reviews, verification claims or RERA IDs. Hide empty sections instead of filling them.

| Desktop pattern | Mobile translation |
|---|---|
| Sidebar (dealer DashboardShell) | Bottom tabs + Profile grouped list |
| Data tables (dealer properties) | Cards / list rows with swipe actions |
| Filter sidebar + header bar | Quick chips + Filter bottom sheet |
| Dialog / ConfirmDialog | Action sheet / bottom sheet |
| Multi-column detail + sticky sidebar forms | Single column + sticky bottom CTA bar + form sheet |
| Tabs inside profile (6) | Grouped rows pushing focused screens |
| Hover cards / carousels with arrows | Swipeable horizontal rails with snap |
| Lightbox with thumbnails | Full-screen pager with pinch-zoom |
| Google Maps iframe | Static map image / native map (P2) with "Open in Maps" |
| Print reports | Not needed (admin web-only) |

---

## 10. Design System Recommendation

Values reconcile the web brand (`src\app\globals.css`) with the existing mobile tokens (`src\theme\tokens.ts`) so both platforms read as one brand.

```text
COLORS
Primary:         #C95B3C  (terracotta — primary CTA; pressed #B1482B; soft #FBE3DB)
Secondary:       #1B3864  (indigo/navy — secondary actions, links, selected states)
Background:      #FAF8F5  (cream grouped background)
Surface:         #FFFFFF  (cards, sheets); Surface-2 #F4EFE6 (sand, inset groups)
Text:            #1C2530  (charcoal)
Secondary Text:  #5B6470
Muted:           #8E959E  (placeholders, disabled)
Border:          #E7E1D7  (hairline); Divider #EFEAE2
Success:         #467E54  (forest; soft #E3EFE6)
Warning:         #B45309  (soft #FDF0DC)
Error:           #C2412D  (soft #FBE4E0)
Accent (Featured): #DFAB34 (gold; soft #F4E8C5)

TYPOGRAPHY  (Inter; Fredoka for logo only)
Display:     34 / 41, Bold (700)       — large titles
Title:       28 / 34, Bold (700)       — screen headers, price on detail
Heading:     22 / 28, SemiBold (600)   — section titles
Subheading:  17 / 22, SemiBold (600)   — card titles, row titles
Body:        16 / 22, Regular (400)    — default; long-form 17 / 24
Callout:     15 / 20, Medium (500)     — buttons, chips
Caption:     13 / 18, Medium (500)     — metadata
Micro:       11 / 13, SemiBold (600)   — badges only (minimum size)

SPACING  (4-pt grid)
XS:  4
SM:  8
MD:  16   (12 allowed inside groups)
LG:  24   (20 = screen horizontal margin)
XL:  32   (48 for hero spacing)

RADIUS
Small:  10  (inputs, chips, small buttons, thumbnails)
Medium: 16  (cards, list groups, buttons md/lg)
Large:  24  (sheets, hero media, modals)
Pill:   999 (segmented controls, tags, avatars)

ELEVATION
Level 0: hairline border only
Level 1: shadow 0 1 2 rgba(28,37,48,0.06) + hairline (cards)
Level 2: shadow 0 8 24 rgba(28,37,48,0.12) (sheets, sticky CTA bar)

COMPONENTS
Buttons:    Height 52 (lg) / 44 (md) / 34 (sm); radius 16/16/10; sentence case; Primary terracotta filled, Secondary navy tint (navy text on #E8ECF3), Tertiary text-only, Destructive red text/filled in confirmations; loading spinner replaces label; full-width in sheets and footers.
Cards:      White, radius 16, padding 16, Level 1; media cards with 4:3 image, radius 16 top; no more than 3 lines of metadata.
Inputs:     Height 52, radius 10, Surface-2 fill, label above (Caption), helper/error text below; sheet-based pickers for selects; native date/time pickers.
Navigation: Bottom tabs (5) with labels, 49pt bar + safe area, terracotta active tint; stack headers with large titles on roots, inline titles on pushes, chevron back.
Tabs:       SegmentedControl (pill, 36pt) for 2–4 peers; horizontal chip scroller for >4 filters.
Sheets:     Radius 24, grabber, detents (medium/large), sticky footer for actions; used for filters, forms ≤5 fields, pickers, confirm.
Modals:     Full-screen for multi-step flows (listing form, KYC); action sheets for destructive choices.
Lists:      Inset grouped style (radius 16), rows 52–64pt, leading icon/avatar, chevron, swipe actions for edit/archive/delete.
Badges:     Pill, Micro type, tinted soft background by tone (success/warning/error/info/neutral/featured).
Toasts:     Bottom, auto-dismiss 3s, success/error tones; haptic feedback.
```

---

## 11. Reusable Component Plan

| Component | Existing? | Duplicate Versions | Recommendation | Priority |
|---|---|---|---|---|
| `Button` | No (mobile); Web `Button.tsx` | Inline Pressables in every screen | CREATE (variants, sizes, loading) | P1 |
| `Text` | Partial (`themed-text`, `ui/text` unused; tokens used inline) | 3 | MERGE into one variant-based `Text` | P1 |
| `PropertyCard` | Yes `ui/property-card` | Web grid/list; mobile full/compact; dealer inline cards | KEEP & standardize (full, compact, row); fix `className` favorite button | P1 |
| `PersonCard` (dealer/provider) | Yes `expert-card`, `service-card` | 3 | MERGE | P1 |
| `SearchBar` | Yes `search-bar`, `explore-navbar` | 2 | Standardize | P1 |
| `FilterSheet` | Yes `filter-sheet` | 1 | KEEP; add server params + result count | P0 |
| `Chip` / `SegmentedControl` | Chip yes; Segmented no | — | KEEP Chip; CREATE SegmentedControl | P1 |
| `Sheet` | Yes `modal-sheet` | RN Modal usages | KEEP (rename), migrate others | P1 |
| `ActionSheet` / confirm | `app-alert` | Alert.alert remnants | KEEP `app-alert` as confirm; CREATE ActionSheet | P1 |
| `ScreenHeader` | Yes `screen-navbar` | text "← Back", ChevronLeft | KEEP; REMOVE others | P1 |
| `TabBar` | Inline in both layouts | 2 | MERGE | P1 |
| `ListRow` / `ListGroup` | `menu-row` | inline rows | REFACTOR into generic ListRow | P1 |
| `StatusBadge` | `ui/badge` unused; `STATUS_TONE` x4 | 5 | MERGE with `lib/status-labels.ts` | P1 |
| `TextField`, `TextArea`, `SelectField`, `DateField`, `TimeSlotPicker` | No | per-screen TextInputs | CREATE | P0 |
| `Stepper` / `FormStep` | No | — | CREATE (listing, project, KYC, registration) | P0 |
| `ListingForm` (shared owner/dealer, create/edit) | No (post-property, edit-property separate) | 2 mobile + 3 web | CREATE | P0 |
| `ProjectForm` | No (post-project, edit-project) | 2 | CREATE | P1 |
| `PhotoGridUploader` (multi, reorder, progress) | No (`media-upload` single) | — | CREATE | P0 |
| `Gallery` + `Lightbox` | `PropertyGallery` | — | REFACTOR + CREATE lightbox | P1 |
| `StickyCTA` | Yes `property/StickyCta` | — | KEEP; generalize | P1 |
| `EmptyState` | Yes | — | KEEP | P2 |
| `ErrorState` | `auth-error` only | — | CREATE generic | P1 |
| `Skeleton` set | No | spinners | CREATE | P1 |
| `Toast` | No | alerts | CREATE | P1 |
| `KpiCard` / `StatCard` | Inline in dealer dashboard/analytics | 2 | CREATE | P2 |
| `Chart` (line, donut) | No (analytics lists) | — | CREATE with react-native-svg | P2 |
| `CityPicker` | `CitySelectionModal` | — | REFACTOR to API cities | P1 |
| `ChatThread` / `Composer` | Inline in dealer inquiries | — | CREATE | P1 |
| `PriceText` / formatters | `formatIndianPrice`, `formatIndianCurrency` | 2 | MERGE | P2 |
| `RazorpayCheckout` | Yes | — | KEEP | P0 |
| `AuthGate` (sign-in sheet for guest actions) | No | — | CREATE | P0 |

---

## 12. Mobile Adaptation Matrix

| Web Pattern | Current Behavior | Mobile Problem | Recommended Mobile Pattern |
|---|---|---|---|
| Fixed glass navbar + city dropdown | Desktop links, shortlist badge, avatar menu | No room | Large-title header with city button + bell; tabs for sections |
| Mobile web floating tab bar | Home/Search/Dealers/Services | Already a pattern | Native bottom tabs (Home, Explore, Services, Saved, Profile) |
| UserDropdown (role menus) | Role-based link list | Hidden navigation | Profile tab grouped sections per role |
| DashboardShell sidebar | Persistent sections | Consumes space | Dealer bottom tabs (Dashboard, Listings, Inbox, Analytics, Profile) + Profile list |
| Listings header filter bar | 5 inline controls | Crowded | Quick chips + filter sheet |
| FilterPanel sidebar/drawer | Long checkbox lists | Hard to tap | Sheet with sections, chips, steppers, toggles |
| Grid/List/Map toggle | Three views | Low value | Single list; map toggle P2 |
| DataTable (dealer properties) | Columns + dropdown actions | Unreadable | Card rows + swipe actions + action sheet |
| ConfirmDialog | Centered modal | Thumb reach | Action sheet with destructive style |
| Dialog forms (reply, compose, reschedule) | Centered modal | Keyboard overlap | Bottom sheet with keyboard avoidance or pushed screen |
| Property detail 8/4 grid + sticky sidebar forms | Side-by-side | No sidebar | Sticky bottom CTA + form sheets |
| Gallery collage + lightbox | Collage | Small targets | Full-bleed pager + full-screen lightbox |
| Hover/arrow carousels | Arrow buttons | No hover | Snap scroll rails with peek |
| Multi-step forms with step sidebar | Left step list | No width | Top progress bar + sticky footer |
| Profile tabs (6) | Horizontal tabs | Overflow | Grouped list → push screens |
| Sticky TOC (legal) | Side TOC | No width | Section index list → detail, or accordions |
| Charts (recharts) | Wide charts | Width | Compact SVG charts, swipeable KPI cards |
| Toast via `alert()` | Browser alert | Jarring | Native toast + haptic |
| Google Maps iframe | Embedded map | Heavy WebView | Static map + "Open in Maps" deep link |
| Footer (contact, socials, newsletter) | Site footer | N/A on mobile | Settings → "Contact & support" rows; drop fake newsletter |
| Query-string state (`?status=Draft`, `?tab=messages`) | URL params | No URL bar | Segmented controls + typed route params for deep links |
| Timed redirects after success | `setTimeout` push | Disorienting | Explicit success screen with primary next action |

---

## 13. Priority Matrix

| Priority | Area | Issue | Impact | Effort | Recommendation |
|---|---|---|---|---|---|
| P0 | Auth (backend) | `GET /api/auth/me` and `update-password` cookie-only; no refresh token | High | Medium | Add Bearer support + refresh endpoint (or Supabase client on device) in web repo |
| P0 | Auth (mobile) | Token in AsyncStorage; 401 leaves stale session | High | Low | SecureStore + central 401 handler + refresh |
| P0 | Navigation | Guests blocked by login wall | High | Medium | Public catalogue + `AuthGate` sheet for actions |
| P0 | Data integrity | Seed directory merged in API mode; fabricated property facts, reviews, ratings, fake RERA IDs, broker fallback profile | High | Low | Remove all mock/seed paths from API mode |
| P0 | Search | 100-item cap, client-side filtering | High | Medium | Server params + offset infinite scroll |
| P0 | Property detail | No fetch by id | High | Low | `apiGetProperty` with cache |
| P0 | Visits | Free-text date; no reschedule/cancel | High | Medium | Date/slot pickers; reschedule/cancel sheets |
| P0 | Inquiries | Dealer reply dropped by API | High | Low | Reply creates direct thread (web parity) |
| P0 | Listing form | 1 image, fake RERA, default injections, partial edit | High | High | Shared `ListingForm` with `PhotoGridUploader` |
| P0 | Owner listings | `my-listings` unlinked, cap hardcoded, owner PATCH blocked (backend) | High | Medium | Link screen, use platform settings; backend owner edit |
| P0 | Services | No provider profile, booking time hardcoded, no manage screen | High | Medium | Create `service/[id]`, booking sheet, `services/manage` |
| P0 | Payments | Mobile plan catalogue ≠ backend | High | Low | Single Starter plan from web catalogue |
| P0 | KYC | Soft-fail fake success | High | Low | Surface API errors |
| P1 | Auth | Google OAuth missing | Medium | Medium | expo-auth-session/web-browser + deep link |
| P1 | City | Static city list | Medium | Low | `/api/locations` active cities |
| P1 | Profile | Bio/avatar, silent profile save fallback, fake loan feature | Medium | Low | Fix mapping, avatar upload, remove fake features |
| P1 | Navigation | Dead routes, `/services` clash, duplicated tab bars | Medium | Low | Clean route tree |
| P1 | Dealer profile | Overloaded screen, fake defaults, non-web tabs | Medium | Medium | Grouped list + focused edit screens |
| P1 | Projects | Hardcoded types, no amenities/dates/SEO, 1 image | Medium | Medium | Shared `ProjectForm` |
| P1 | Writes | Fire-and-forget `.catch(() => {})` | Medium | Medium | Await + toast + rollback |
| P1 | Wedding enquiry | Missing | Medium | Low | Enquiry sheet (email required) |
| P1 | Maintenance / suspended | Not handled | Medium | Low (mobile) | Backend flag + screen; 403 handler |
| P1 | Notifications | Sheet, type squashed | Medium | Low | Full screen with entity deep links |
| P1 | State architecture | 1,800-line `AppContext` | Medium | High | Split into domain hooks with React Query |
| P2 | Home | Overlapping rails | Medium | Low | 5-section layout |
| P2 | Property detail | Lightbox, similar listings | Medium | Low | Add |
| P2 | Destinations | Filters/sort, long copy | Low | Low | Chips + expandable sections |
| P2 | Help/Legal | Static alerts | Low | Low | Dedicated screens |
| P2 | Analytics | Silent fallback, no charts | Low | Medium | Error state + SVG charts |
| P2 | Map | Missing | Medium | Medium | Static map / native map |
| P2 | Design system | Tokens vs literals, template theme | Medium | Medium | Token-only styling, remove template files |
| P2 | Cards/badges/formatters | Duplicates | Medium | Low | Merge |
| P3 | Animation | Limited polish | Low | Medium | Shared transitions, haptics, skeleton shimmer |
| P3 | Grid/list toggle, card preview modal | Optional | Low | Low | Optional |
| P3 | Dark mode | Half-implemented | Low | Medium | Either complete tokens or lock light mode |
| P3 | Activity logs | Not sent from mobile | Low | Low | Optional `POST /api/logs` for dealer actions |

---

## 14. Implementation Roadmap

```text
PHASE 0 (prerequisite, web repo — requires explicit approval since web is source of truth)
Backend contract fixes for a native client
↓
PHASE 1
Functional parity
↓
PHASE 2
Navigation & core user flows
↓
PHASE 3
Design system
↓
PHASE 4
Reusable components
↓
PHASE 5
Screen-by-screen UI improvements
↓
PHASE 6
Content simplification
↓
PHASE 7
Interactions & animations
↓
PHASE 8
QA & web/app parity verification
```

**Phase 0 — Backend contract (web repo, small, approval required).**
- `GET /api/auth/me` and `POST /api/auth/update-password` accept Bearer via `authenticateApiRequest`.
- Session refresh: return `refreshToken` + add `POST /api/auth/refresh`, or adopt `@supabase/supabase-js` on device with a SecureStore adapter (decide once).
- Allow role `user` to PATCH (Draft/Pending Review only) and DELETE own listings, matching the owner flow the web UI already exposes.
- Expose `maintenanceMode` in `GET /api/platform/settings`.
- Add mobile redirect URLs (`sqftgo://auth/callback`) to Supabase auth config.
- Reasoning: these are the only items that block parity regardless of mobile work; fixing them first prevents building workarounds.

**Phase 1 — Functional parity (mobile).**
- Remove mock/seed data from API mode (directory merge, fabricated facts, fake RERA, placeholder gallery, broker fallback, partner plans, fake loan).
- Guest browsing + `AuthGate`; property fetch by id; server-side filters + infinite scroll; visit date/slot pickers + reschedule/cancel; inquiry reply → thread; multi-image listing form with all fields; owner My Listings linked; services provider profile, booking datetime, register (service type), manage (verification + booking requests); wedding enquiry; avatar + bio; Google sign-in; recovery deep link; KYC hard-fail; correct subscription plan; city list from API; maintenance/suspended handling.
- Reasoning: users must be able to complete every web task before any visual work; visual polish on fake or broken flows is wasted effort.

**Phase 2 — Navigation & core flows.**
- Clean route tree (delete dead tabs, `/modal`, duplicate `services.tsx`, `(dealer)/settings|subscription` copies, orphan `/analytics`), single tab bar, guest-first root, Profile grouped hub per role, deep links for notifications.
- Split `AppContext` into domain hooks backed by React Query (cache, retries, invalidation) while preserving business rules.
- Reasoning: stable information architecture and data layer must exist before components are standardized on top of them.

**Phase 3 — Design system.**
- Implement Section 10 tokens in `src\theme\tokens.ts`; remove `constants/theme.ts`, template components and unused icon/text layers; decide NativeWind vs StyleSheet (one approach) and fix the `className` on RN `Pressable` issue.
- Reasoning: tokens first so every subsequent component inherits consistent values.

**Phase 4 — Reusable components.**
- Build Section 11 components (Button, Text, TextField family, Stepper, ListingForm, PhotoGridUploader, Sheet, ActionSheet, ListRow, StatusBadge, Skeleton, ErrorState, Toast, SegmentedControl, ChatThread, Charts).
- Reasoning: screens in Phase 5 become composition work, eliminating duplication found in the audit.

**Phase 5 — Screen-by-screen UI.**
- Order: Property Detail → Explore → Home → Listing Form → Dealer Inbox → Services (directory/profile/manage) → Profile hubs → Dealer Business Profile → Subscription → Visits/Inquiries/Bookings → Destinations → Analytics → Settings/Help/Legal.
- Reasoning: highest-traffic and revenue-adjacent screens first.

**Phase 6 — Content simplification.**
- Apply Section 7 patterns; rewrite misleading copy (approval status, quotas from settings, no fabricated trust claims); progressive disclosure for long text.
- Reasoning: content decisions are easier once layouts exist and real data is visible.

**Phase 7 — Interactions & animations.**
- Shared image transitions, sheet springs, haptics, skeleton shimmer, pull-to-refresh everywhere, swipe actions.
- Reasoning: polish last so it is not reworked.

**Phase 8 — QA & parity verification.**
- Walk all 28 flows on iOS and Android against production API for each role (guest, user, owner, dealer, provider); check every feature row in Section 3 reaches COMPLETE or documented WEB-ONLY; verify rate-limit, quota, suspended and maintenance edge cases; accessibility (Dynamic Type, VoiceOver labels, 44pt targets).

**Web-side issues found (report only, not mobile scope):** owner edit redirects to dealer dashboard; edit status dropdown offers server-rejected statuses; `/favorites` guards guests; "All Bharat" shows zero dealers; wedding modal email optional vs required; misleading "live instantly"/"2 listings" copy; hardcoded trust/audit/price breakdown; Help/Settings unlinked; mojibake labels (`Γé╣`); ₹99 plan vs ₹99 pack overlap; KYC/service documents not viewable by admin.

---

## 15. Final Gap Summary

```text
========================================
FINAL WEB → MOBILE GAP SUMMARY
========================================

TOTAL ROUTES: 65 UI routes (63 page routes + /auth/callback + 404/error) and 71 API route files
TOTAL SCREENS: 79 (65 routes + 14 screen-like modals/flows); 47 routes + 13 modals required in the app, 18 admin pages + 1 modal WEB-ONLY
TOTAL FEATURES: 97
TOTAL USER FLOWS: 28

FEATURE STATUS
----------------------------------------
COMPLETE: 24
PARTIAL: 37
MISSING: 15
WEB-ONLY: 16
NEEDS MOBILE ADAPTATION: 5

UI/UX
----------------------------------------
SCREENS REQUIRING MAJOR REDESIGN: 10 (Property Detail, Home, Buyer/Dealer Profile, Listing Form, Dealer Business Profile, Subscription, Services directory+category, Dealer Inbox, Onboarding, Destination Detail)
SCREENS REQUIRING MINOR REFINEMENT: 24
CONTENT-HEAVY SCREENS: 9
INCONSISTENT COMPONENTS: 19 of 20 audited (only Empty State is consistent)

PRIORITY
----------------------------------------
P0: 33 features (+13 priority-matrix items)
P1: 33 features (+11 priority-matrix items)
P2: 11 features (+8 priority-matrix items)
P3: 4 features (+4 priority-matrix items)

TOP 10 REQUIRED CHANGES
----------------------------------------
1. Fix the auth contract for native clients: Bearer support on GET /api/auth/me and update-password, refresh tokens, SecureStore, central 401/403/429 handling.
2. Allow guest browsing of the public catalogue; gate only account actions with a sign-in sheet that resumes the action.
3. Remove every mock/seed/fabricated data path from API mode (seed dealers, fake reviews/ratings/facts, fake RERA IDs, placeholder photos, broker fallback, fake loan feature, wrong plan catalogue).
4. Make dealer inquiry replies real: create a direct message thread like the web, surface errors, show threads to buyers.
5. Load property detail by id and move search to server-side filters with offset-based infinite scroll.
6. Build one shared multi-step ListingForm (owner + dealer, create + edit) with multi-image upload (≤30), landmarks, RERA, SEO and honest approval copy; link My Listings and use platform quota settings; enable owner edits on the backend.
7. Complete the visit lifecycle: native date + slot pickers, Upcoming/Past tabs, reschedule and cancel.
8. Reach services marketplace parity: provider profile screen, real booking date/time, service-type-aware registration, Manage screen with verification and booking requests.
9. Correct revenue and trust flows: single Starter plan from the web catalogue, KYC hard-fail on API errors, active cities from /api/locations, wedding venue enquiry.
10. Consolidate navigation and the design system: delete dead/duplicate routes and template files, one tab bar, token-only styling, shared Button/TextField/ListRow/Sheet/StatusBadge/Skeleton/Toast components, split AppContext into React Query domain hooks.

RECOMMENDED IMPLEMENTATION ORDER
----------------------------------------
1. Functional parity (preceded by the small Phase 0 backend contract fixes in the web repo, with approval)
2. Navigation & core user flows (route cleanup, guest-first root, role hubs, data-layer split)
3. Design system (tokens, typography, spacing, radius; remove template theme)
4. Reusable components (forms, stepper, uploader, sheets, rows, badges, states)
5. Screen-by-screen UI improvements (Property Detail → Explore → Home → Listing Form → Inbox → Services → Profiles → Subscription → rest)
6. Content simplification (progressive disclosure, honest copy, remove fabricated claims)
7. Interactions & animations (transitions, haptics, swipe actions, skeleton shimmer)
8. QA & web/app parity verification (28 flows × 5 roles, edge cases, accessibility)
```
