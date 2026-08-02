# PENDING — Google Sign-In (Expo / mobile)

**Status:** Not implemented in the app UI. Email/password auth works today.  
**Website:** Google login already works on `https://www.sqftgo.com` via Supabase OAuth.

---

## Why it was removed from Expo

Browser-based Google OAuth inside **Expo Go** (redirect to `exp://…`) is unreliable on Android — after picking a Google account, the system browser often does not return to the app, so the user stays logged out.

That approach (WebBrowser / WebView + redirect) is **not** what most production apps use.

---

## Recommended approach (what other apps use)

Follow the official **Expo + Supabase** pattern:

| Step | What |
|------|------|
| 1 | Native Google account picker via [`@react-native-google-signin/google-signin`](https://docs.expo.dev/guides/google-authentication/) |
| 2 | Read Google **ID token** |
| 3 | `supabase.auth.signInWithIdToken({ provider: "google", token })` — [Supabase RN guide](https://supabase.com/docs/guides/auth/social-login/auth-google?platform=react-native) |
| 4 | Store Supabase `access_token` and call existing BFF `/api/auth/me` (same as password login) |

**Requires a development / production build** — does **not** work in Expo Go (needs native modules).

---

## How to implement later

### 1. Install

```bash
cd D:\sqftgo-app
npx expo install @react-native-google-signin/google-signin @supabase/supabase-js
```

Add config plugin in `app.json` → `plugins`:

```json
"@react-native-google-signin/google-signin"
```

Ensure Android package / iOS bundle exist (already set if kept):

- Android: `com.sqftgo.app`
- iOS: `com.sqftgo.app`

### 2. Environment

```env
EXPO_PUBLIC_API_URL=https://www.sqftgo.com
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = the **Web** OAuth client ID (same one used by Supabase Google provider on the website).

### 3. Google Cloud — Android client

1. [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) → **Create client** → **Android**
2. Package name: `com.sqftgo.app`
3. SHA-1 from debug/release keystore (after `npx expo run:android` or EAS)
4. Create client (no secret needed for Android)

Keep the existing **Web** client for Supabase dashboard + `webClientId` in the app.

### 4. Supabase

Auth → Providers → Google:

- Web Client ID + Secret already configured for the website  
- If ID-token login fails with nonce errors, enable **Skip Nonce Check** (documented by Supabase for some mobile setups)

### 5. App code sketch

```ts
import { GoogleSignin, isSuccessResponse } from "@react-native-google-signin/google-signin";
import { createClient } from "@supabase/supabase-js";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

await GoogleSignin.hasPlayServices();
const response = await GoogleSignin.signIn();
if (!isSuccessResponse(response) || !response.data.idToken) throw new Error("No ID token");

const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "google",
  token: response.data.idToken,
});
// then setAccessToken(data.session.access_token) and hydrate via /api/auth/me
```

Wire a **Continue with Google** button on Sign In and Sign Up (same handler).  
New Google users get `profiles` via existing `handle_new_user` trigger (`role: user`). Dealer path can continue to `/dealer-register` after login.

### 6. Build (not Expo Go)

```bash
npx expo prebuild --platform android
npx expo run:android
```

Or:

```bash
eas build -p android --profile development
```

Open the **SqftGo** app install, not Expo Go.

---

## Out of scope / do not use for production mobile

- Expo Go + `exp://` OAuth redirects  
- In-app WebView wrapping Google’s login page  
- Putting Google Client **Secret** in the mobile app  

---

## Checklist when picking this up

- [ ] Install `@react-native-google-signin/google-signin` + plugin  
- [ ] Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`  
- [ ] Create Google **Android** OAuth client (`com.sqftgo.app` + SHA-1)  
- [ ] Implement `signInWithIdToken` + Bearer session in app  
- [ ] Add Continue with Google on auth screen  
- [ ] Test on development build (USB / emulator)  
- [ ] Test new Google user + existing Google user (same email as web)  
