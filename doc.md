# 1. Delete ALL build caches

rm -rf dist
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/app/src/main/assets/public

# 2. Rebuild React app

npm run build

# 3. Sync Capacitor config (injects cleartext settings into native files)

npx cap sync

# 4. Run on emulator/device

npx cap run android
