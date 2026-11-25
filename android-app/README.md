# Calibre Repair — Repair Service Management System (Android Studio Project)

Complete Kotlin + Jetpack Compose + MVVM Android application integrated with Firebase Authentication and Cloud Firestore.

## Firebase & APK Build Instructions

1. Extract or clone the repository and open the `android-app` directory (containing `settings.gradle.kts` and `build.gradle.kts`) in **Android Studio (Ladybug or newer)** with **JDK 17** selected in **Settings → Build Tools → Gradle**.
2. Open your project in the **Firebase Console**.
3. Click **Add app → Android** and register package name:
   `com.repairservice.app`
4. Download the generated `google-services.json` file and place it in `android-app/app/google-services.json` (git-ignored for security).
5. In Firebase Console → **Authentication → Sign-in method**:
   - Enable **Email/Password** (used by `AuthScreen.kt` for registration, login, and password reset).
6. Run **File → Sync Project with Gradle Files** so Gradle 8.9 resolves `gradle/libs.versions.toml` and `app/build.gradle.kts`.
7. Build the APK via **Build → Build Bundle(s) / APK(s) → Build APK(s)** (or click **Run ▶** with USB Debugging enabled).
8. Note on Firestore Database ID:
   Update `FIRESTORE_DATABASE_ID` in `RepairServiceApp.kt` to match your Firestore database ID (`"(default)"` or your named Firestore database ID) so Android and Web share the same live Firestore database and `firestore.rules`.
9. Admin Access:
   Verified users whose UID exists in the Firestore `/admins/{uid}` collection automatically unlock the **Admin Dashboard** tab.

## Architecture (MVVM)
- `data/model/`: `Customer`, `RepairRequest`, `ServiceCategory`, `ServiceType`, `RepairStatus`
- `data/repository/RepairRepository.kt`: Firebase Auth + Firestore real-time `callbackFlow` listeners and validated writes
- `util/InputValidators.kt`: Blueprint-synchronized regex & length validators
- `ui/viewmodel/`: `AuthAndCustomerViewModel`, `RepairRequestViewModel`, `AdminDashboardViewModel`
- `ui/screens/`: `AuthScreen`, `HomeScreen`, `CustomerRegistrationScreen`, `RepairRequestFormScreen`, `MyRequestsScreen`, `AdminDashboardScreen`
- `ui/components/`: Reusable Material 3 UI components
- `ui/navigation/RepairNavGraph.kt`: Jetpack Compose Navigation & bottom bar
