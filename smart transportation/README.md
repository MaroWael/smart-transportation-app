# Smart Transportation — Expo Frontend

This is the Expo React Native mobile application for Smart Transportation. It is one of two independent applications in this repository:

- **Frontend**: `smart transportation/` (this folder)
- **Backend**: `backend/` (Express.js, deployed separately on Vercel)

This project was created with `create-expo-app` and is connected to an Expo EAS project.

---

## Get Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the app:

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a:

- [development build](https://expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development

---

## Communicating with the Backend

The frontend uses a centralized API client at `src/lib/api.ts`. It:

- Uses a configurable API base URL (`http://localhost:5000/api` in development)
- Falls back to `EXPO_PUBLIC_API_URL` for production overrides
- Provides typed request methods (`api.get`, `api.post`, etc.)
- Exposes `healthCheck()` which calls `GET /api/health` on the backend

**Never** add Neon credentials (`DATABASE_URL`, `DIRECT_URL`), `JWT_SECRET`, or any backend secret to Expo environment variables (`EXPO_PUBLIC_*`).

### Testing on a physical Android device

On a physical device, `localhost` refers to the device itself, not your computer. In `src/lib/api.ts`, change the development base URL to your computer's LAN IP:

```ts
if (__DEV__) {
  return 'http://192.168.x.x:5000/api'; // your computer's LAN IP
}
```

Make sure the device and computer are on the same Wi-Fi network, and that CORS allows the frontend origin.

---

## EAS Builds

EAS builds are handled in the cloud — no local Xcode or Android Studio required.

```bash
# Login to EAS (one time)
npx eas-cli@latest login

# Create a development build (for Expo Go with native modules)
npx eas-cli@latest build --platform android --profile development

# Production Android build
npx eas-cli@latest build --platform android --profile production

# Submit to a store
npx eas-cli@latest submit --platform android
```

EAS is already initialized and connected (`owner: marowael`, projectId in `app.json`).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android |
| `npm run ios` | Start on iOS |
| `npm run web` | Start on web |
| `npm run lint` | Run Expo lint |
| `npx tsc --noEmit` | TypeScript typecheck |

---

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [EAS Build](https://docs.expo.dev/eas/index)
