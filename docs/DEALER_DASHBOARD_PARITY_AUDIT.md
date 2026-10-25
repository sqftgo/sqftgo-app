# Dealer Dashboard — Web-to-App Parity Audit

**Date:** 2026-04-25  
**Web repo:** `f:/real-state` (`/dealer/dashboard/*`)  
**App repo:** `f:/real-estate` (`(dealer)/*` + related stack routes)  
**Method:** Audit → research/plan → coordinated implementation → verification matrix  

---

## 1. Web functionality inventory (summary)

| # | Web route | Purpose | Key actions | Primary APIs |
|---|-----------|---------|-------------|--------------|
| 1 | `/dealer/dashboard` | Overview KPIs + queues | Confirm tour, CTAs | properties?mine, inquiries, visits PATCH |
| 2 | `/dealer/dashboard/properties` | Inventory | Filter status/type/sort, grid/table, submit, draft, delete, view | properties CRUD |
| 3 | `/dealer/dashboard/add-property` | Create listing | 6-step wizard, draft/publish, quota + packs | POST properties, uploads, listing-quota |
| 4 | `/dealer/dashboard/edit-property/[id]` | Edit listing | Flat form, status, SEO (no media edit) | GET/PATCH property |
| 5 | `/dealer/dashboard/projects` | Project inventory | Status filter, submit, to-draft, delete | projects CRUD |
| 6 | `/dealer/dashboard/add-project` | Create project | 6-step wizard | POST projects |
| 7 | `/dealer/dashboard/edit-project/[id]` | Edit project | Draft / submit | GET/PATCH project |
| 8 | `/dealer/dashboard/inquiries` | Leads + messages | Search, reply→thread, archive, call/email, compose | inquiries + messages |
| 9 | `/dealer/dashboard/analytics` | Performance | Category/status filters, KPIs, charts, top listings | GET dealer/analytics |
| 10 | `/dealer/dashboard/profile` | Business identity | 6 tabs: preview/personal/business/KYC/services/subscription | dealers PATCH, KYC |
| 11 | `/dealer/dashboard/settings` | Account prefs | Language/tz (local), password reset, deactivate stub | forgot-password |
| 12 | `/dealer/dashboard/subscription` | Plans & packs | Subscribe Starter, buy packs, history, FAQ | subscription + Razorpay |

**Shell nav:** Dashboard · Properties (list/add/drafts) · Projects (list/add/drafts) · Communications · Analytics · Plans · Profile · Settings.

Full interactive detail: agent audit of `f:/real-state/src/app/(dealer)/dealer/dashboard/**` (2026-04-25).

---

## 2. Web → app feature parity matrix

| Web capability | App surface | Status | Notes |
|----------------|-------------|--------|-------|
| Dashboard KPIs (active / leads / visits) | `(dealer)/index` | Implemented | Align lead metric + refresh (see §7) |
| Confirm tour | dashboard + `manage-visits` | Partially Implemented → fix | Await + toast |
| Recent listings + latest inquiries | `(dealer)/index` | Implemented | Vertical list + messages strip |
| Analytics summary teaser | `(dealer)/index` | Implemented | |
| Quick actions | `(dealer)/index` | Implemented | + projects/analytics |
| Needs attention / KYC CTA | `(dealer)/index` | Implemented | Mobile adaptation |
| Properties list + status filter | `(dealer)/properties` | Implemented | |
| Properties type filter + sort | `(dealer)/properties` | Missing → implement | Client-side like web |
| Move to Draft | `(dealer)/properties` | Missing → implement | Pending Review / Rejected |
| Submit for review / delete | `(dealer)/properties` | Implemented | Errors already toasted |
| Grid/table toggle | — | Not Applicable | Mobile: list cards only |
| Add property wizard + quota | `post-property` | Implemented | |
| Edit property | `edit-property/[id]` | Implemented | Media edit limited (web also limited) |
| Projects list + status filter | `dealer-projects` | Partially → implement filter | |
| Submit / delete project | `dealer-projects` | Implemented | |
| Move project to draft | `dealer-projects` | Missing → implement | |
| Add/edit project | `post-project`, `edit-project/[id]` | Implemented | Single-scroll vs web steps (OK mobile) |
| Inquiries inbox + archive | `(dealer)/inquiries` | Implemented | Fire-and-forget → fix |
| Inquiry search | `(dealer)/inquiries` | Missing → implement | |
| Reply → message thread | `(dealer)/inquiries` | Implemented | |
| Messages compose / chat | `(dealer)/inquiries` | Implemented | |
| Call / email lead | Call yes; email mailto | Partially Implemented | Add mailto |
| Analytics KPIs + charts | `(dealer)/analytics` | Implemented | Silent fallback → fix |
| Analytics category/status filters | `(dealer)/analytics` | Missing → implement | Client filter on payload |
| Business profile | `dealer-settings` | Implemented | Naming ≠ web “settings” |
| KYC submit + docs | `dealer-kyc` | Implemented | |
| Subscription + packs | `subscription` | Implemented | Starter ₹99 aligned |
| Account settings (lang/tz) | `/settings` | Partially Implemented | Local prefs; password live |
| Deactivate account | — | Not Applicable | Web stub only |
| View tracking metrics | — | Not Applicable | Web also unavailable |

---

## 3. Gap analysis (severity × priority)

| ID | Gap | Severity | Priority | Resolution in this cycle |
|----|-----|----------|----------|--------------------------|
| G01 | Visit status updates fire-and-forget | High | P0 | Await `ActionResult` + toast/alert |
| G02 | Inquiry mark-read / archive swallow errors | High | P0 | Return `Promise<ActionResult>` + UI feedback |
| G03 | Analytics silent local fallback | High | P0 | API mode surfaces error; derive only offline |
| G04 | Properties missing type filter + sort | Medium | P0 | Chip + sort control |
| G05 | Properties missing Move to Draft | Medium | P0 | Action when Pending Review / Rejected |
| G06 | Inquiry text search missing | Medium | P1 | Search field over leads |
| G07 | Projects missing status filter / to-draft | Medium | P1 | Chip filter + To draft action |
| G08 | Dashboard refresh uses public catalog | Medium | P1 | `refreshMyProperties` |
| G09 | Dashboard “New Leads” shows total inquiries | Low | P1 | Value = new count; hint total |
| G10 | Analytics missing filters | Medium | P1 | Status + type chips on derived view of API data |
| G11 | Email lead action | Low | P2 | `mailto:` button |
| G12 | Reschedule visit UI | Low | P2 | Deferred (API exists) |
| G13 | Edit-property media | Low | P2 | Matches web limitation |
| G14 | Grid/table toggle | — | — | N/A on mobile |

---

## 4. Data representation recommendations

| Data | Best representation | Rationale |
|------|---------------------|-----------|
| Portfolio KPIs | `StatCard` / `StatGrid` | Glanceable totals; tappable to drill-down |
| Needs attention | Compact alert list (not nested cards) | Action-oriented queue |
| Recent listings | Vertical media rows | Scan title/price/status; same as web list rows |
| Visits / inquiries | Status-badged list rows + primary CTA | Decision: confirm / reply / archive |
| Inventory (many rows) | FlatList + chips (status/type) + sort | Mobile substitute for DataTable |
| Analytics trends | Bar / donut charts + KPI strip | Trends ≠ tables |
| Projects | Card list + status chips | Same density as listings |
| Empty / error | `EmptyState` / `ErrorState` | Actionable recovery |
| Quota | Inline banner (warn when at cap) | Contextual, not a KPI tile |

**Rule:** Do not force every dataset into a card. Prefer lists for records, stats for aggregates, charts for trends.

---

## 5. Unified UI/UX & reusable components

| Pattern | Owner | Usage |
|---------|-------|-------|
| Screen chrome | `Screen` / `ScreenNavbar` | All dealer stack + tabs |
| Primary CTA | `Button` primary | List property, submit, confirm |
| Secondary / destructive | `Button` secondary / destructive | Cancel, delete |
| Filters | `ChipGroup` / `SegmentedControl` | Status, type, open/all |
| Metrics | `StatCard` + `StatGrid` | Dashboard + analytics |
| Status | `StatusBadge` + `lib/status-labels` | Properties, visits, inquiries |
| Rows | List cards with thumb + meta + actions | Properties, projects, leads |
| Feedback | `toast` + `appAlert` | Success / confirm / errors |
| Empty / loading / error | `EmptyState`, `ListSkeleton`, `ErrorState` | All lists |

Spacing: `spacing.lg/xl` screen pad; `radius.lg` surfaces; tokens only (no new hex).

---

## 6. Implementation plan (this cycle)

1. Harden async mutations (visits, inquiries) with user-visible outcomes.  
2. Properties: type filter, sort, move-to-draft.  
3. Projects: status filter, move-to-draft.  
4. Inbox: search + mailto + awaited archive/read.  
5. Analytics: fail loudly in API mode; client status/type filters.  
6. Dashboard: correct lead KPI + mine refresh + awaited confirm.  
7. Update verification matrix (§8).

Out of scope this cycle: visit reschedule UI, edit-media parity beyond web, admin-only flows, fabricated view metrics.

---

## 7. Implementation changelog

Recorded as code lands in the same PR/session:

- [x] AppContext inquiry helpers return `Promise<ActionResult>`
- [x] `fetchDealerAnalytics` throws in API mode on failure
- [x] `(dealer)/index` KPI + refresh + confirm tour
- [x] `manage-visits` awaited status changes (+ call)
- [x] `(dealer)/properties` type/sort/draft
- [x] `dealer-projects` status filter + to-draft
- [x] `(dealer)/inquiries` search + mailto + await
- [x] `(dealer)/analytics` filters + error path

---

## 8. Verification matrix

| Feature | Status | How verified |
|---------|--------|--------------|
| Dashboard KPIs | Verified (code) | New leads = `status===new`; pull refreshes mine |
| Confirm tour | Verified (code) | Awaits result; toast/alert |
| Properties filters/sort/draft | Verified (code) | Type + sort + Move to draft actions |
| Inquiry search / archive / read | Verified (code) | Search filter; awaited mutations |
| Mailto lead | Verified (code) | `Linking.openURL(mailto:)` |
| Projects filter / to-draft | Verified (code) | Chip filter + action |
| Analytics API error | Verified (code) | ErrorState when API fails |
| Analytics filters | Verified (code) | Client chips on listings-derived slices |
| Visit call / status mutations | Verified (code) | `manage-visits` await + toast |
| Subscription / KYC / profile | Implemented (prior) | Smoke only this cycle — runtime QA pending |
| Visit reschedule | Blocked | No UI this cycle |
| View metrics | Not Applicable | Unavailable on web |

**Legend:** Implemented · Verified · Partially Implemented · Blocked · Not Applicable  

---

## 9. Remaining blockers / limitations

1. **View / impression tracking** — not in API; do not invent numbers.  
2. **Visit reschedule** — `rescheduleVisit` exists; UI deferred.  
3. **Settings language/timezone** — local-only on web; no server contract.  
4. **Account deactivation** — web stub; do not fake.  
5. **Edit listing media** — web edit form also omits media step.  
6. **Grid/table toggle** — desktop-only pattern; mobile uses list cards.  
7. **End-to-end device QA** — requires signed-in broker against live BFF; mark runtime Verified after manual pass.
