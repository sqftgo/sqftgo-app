# Buyer / User — Web-to-App Parity Audit

**Date:** 2026-04-25  
**Web:** `f:/real-state` public + account routes (not dealer/admin)  
**App:** `f:/real-estate` `(tabs)` + buyer stack routes  
**Method:** Audit → plan → coordinated implementation → verification  

---

## 1. Web buyer inventory (summary)

| # | Web route | Purpose | Guest? | Key actions |
|---|-----------|---------|--------|-------------|
| 1 | `/` | Home discovery | Yes | Search → listings, carousels, sell CTA |
| 2 | `/listings` | Browse/filter | Yes | Filters, sort, favorite, open detail |
| 3 | `/property/[id]` | Detail + lead | Browse yes; **forms login-walled on web** | Inquire, book visit, save, call/WA |
| 4 | `/favorites` | Shortlist | — | Not in app (removed) |
| 5 | `/projects/[id]` | Project detail | Yes | Call dealer (no index route) |
| 6 | `/dealers`, `/dealers/[id]` | Directory + profile | Yes | Search, tel/mail, listings |
| 7 | `/destinations*` | City guides | Yes | Wedding enquiry (guest OK) |
| 8 | `/services*` | Service directory + book | Browse yes; book login | Book, register, manage |
| 9 | `/my-visits` | Site visits | No | Cancel, reschedule |
| 10 | `/my-inquiries` | Sent inquiries | No | Open property |
| 11 | `/my-listings`, post/edit | Owner FSBO | No | CRUD, received leads |
| 12 | `/profile`, `/settings` | Account | No | Edit, password, prefs (local) |
| 13 | Auth | Login/signup/forgot/update-password | Guest | Email, Google |
| 14 | `/help`, `/terms`, `/privacy` | Support/legal | Yes | FAQ, static docs |

**Guest APIs (web):** inquiry + visit POST allow unauthenticated (rate-limited). Favorites API auth-only; UI uses localStorage for guests.

---

## 2. App mapping & parity matrix

| Web capability | App surface | Status |
|----------------|-------------|--------|
| Home discovery | `(tabs)/index` | Implemented (fewer rails — OK mobile) |
| Listings browse + filters | `(tabs)/explore` | Implemented |
| Property detail + inquire/visit | `property/[id]` | Implemented — **guest visit API fix** |
| Favorites / Saved | — | **Removed from app** (product decision) |
| AuthGate resume after sign-in | AuthGate | Missing → **pending action** |
| Destinations + wedding enquire | `destinations*` | Implemented |
| Dealers directory/profile | `brokers`, `broker/[id]` | Implemented (tel/WA/email like web) |
| Projects list/detail | `projects`, `project/[id]` | Partially → **share + browse city** |
| Services browse/book | services tab + `service/[id]` | Implemented; **gate list-business CTA** |
| My visits / inquiries / listings | stack routes | Implemented |
| Settings / profile / password | `settings/*` | Implemented |
| Help / legal | `help`, `legal/[doc]` | Implemented |
| Onboarding intent → explore | onboarding | Missing → **persist purpose** |
| Buyer in-app messaging | — | Not Applicable (web also external/inquiry) |
| Map view | — | Not Applicable this cycle |
| Update-password deep link | — | Blocked (Supabase redirect config) |

---

## 3. Gaps (this cycle)

| ID | Gap | Sev | Fix |
|----|-----|-----|-----|
| U01 | `apiCreateVisit` not `public: true` | P0 | Add public flag |
| U02 | AuthGate drops deferred action | P0 | Resume after login |
| U03–U04 | Favorites / Saved | — | **Removed** from mobile app |
| U05 | Services “List business” no soft gate | P1 | `requireAuth` |
| U06 | Onboarding intent discarded | P1 | Persist → explore purpose |
| U07 | Project detail thin | P1 | Share + WA + city explore |
| U08 | Buyer messaging | — | N/A (matches web) |

---

## 4. Data representation (buyer)

| Data | Representation |
|------|----------------|
| Home rails | Horizontal cards + section headers |
| Explore results | Vertical `PropertyCard` list + chips |
| KPIs on profile | Compact stat row |
| Visits / inquiries | Status-badged lists |
| Empty/error | `EmptyState` / `ErrorState` |

---

## 5. Implementation changelog

- [x] Guest visit POST `public: true`
- [x] AuthGate pending-action resume
- [x] Favorites / Saved removed from app
- [x] Services list-business soft gate
- [x] Onboarding intent → preferred purpose
- [x] Project detail share / WhatsApp / explore city
- [x] Docs + verification matrix

---

## 6. Verification matrix

| Feature | Status |
|---------|--------|
| Guest book visit | Verified (code) |
| AuthGate resume | Verified (code) |
| Favorites removed | Verified (code) |
| Services CTA gate | Verified (code) |
| Intent → explore | Verified (code) |
| Project share/contact | Verified (code) |
| Runtime device QA | Pending signed-in buyer pass |

## 7. Blockers

1. Password-recovery deep link needs Supabase redirect URLs.  
2. Map browse — deferred.  
3. Web property detail still walls guests; app is ahead for inquire/visit.
