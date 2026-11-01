# Trader Kavach Android app

The project keeps one React + Vite codebase for the website and the Android app. Firebase authentication, Firestore data, the existing Worker/API and Cashfree payment flow remain in the web application and are bundled into the Capacitor app.

## Local Android setup

1. Install Node.js 22, Android Studio and JDK 21.
2. Run `npm install` to install the Capacitor dependencies and refresh the npm lockfile.
3. Run `npm run cap:add:android` once to generate the native Android project.
4. Run `npm run cap:sync` after web changes.
5. Run `npm run cap:android` to open the Android project in Android Studio.

For a local debug APK, run `cd android && ./gradlew assembleDebug`. The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Build automation

The GitHub Actions workflow builds the web app, generates the Android project, syncs Capacitor and uploads a debug APK artifact for pull requests and manual workflow dispatches.

## Release checklist

- Configure and verify the production Firebase web app settings.
- Verify the Cashfree checkout and payment-return flow on a physical Android device.
- Verify external links, keyboard behavior, status/navigation bars and back navigation.
- Add the final launcher icon, splash screen and Android signing configuration before publishing.
- Keep signing keys and production secrets out of the repository.
