
# Run and deploy IN Production

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

** Export The APK **

# First of All Install Android Studio

# 1. Delete ALL build caches If any

rm -rf dist
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/app/src/main/assets/public

# 2. Rebuild The React app

npm run build

# 3. Sync Capacitor config (injects cleartext settings into native files)

npx cap sync

# 4. Optional Run on emulator/device

npx cap run android
