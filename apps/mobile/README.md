# Mobile app (Expo)

Expo Router app for the critical Local-First flow: daily check-in -> deterministic triage -> biological state/traffic light -> local persistence.

- Clinical data stays on-device.
- Production builds must use `EncryptedSqliteLocalStore` (`src/core/memory/encrypted-sqlite-store.ts`) backed by `op-sqlite` + SQLCipher with a device-secure encryption key.
- The current screen uses `InMemoryLocalStore` as a development placeholder until native dependencies are installed and the device runtime is available.

Run from repository root after installing dependencies:
`npm install` then `npm run mobile:start`.
