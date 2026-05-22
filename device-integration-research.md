# Device Integration Research: Longitivity / Champions Longevity Dashboard

**Project:** Champions Longevity Dashboard (React Native / Expo with expo-dev-client)
**Author:** Research Document
**Date:** 2026-05-22
**Status:** Draft — Ready for Engineering Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Library Evaluation](#2-library-evaluation)
3. [Full Data Availability Matrix](#3-full-data-availability-matrix)
4. [Permission & Consent Flows](#4-permission--consent-flows)
5. [Fitbit Web API — OAuth2 and Key Endpoints](#5-fitbit-web-api--oauth2-and-key-endpoints)
6. [Data Sync Architecture](#6-data-sync-architecture)
7. [Architecture Diagram](#7-architecture-diagram)
8. [Library Recommendation](#8-library-recommendation)
9. [Phase 1 vs Phase 2 Data Availability Summary](#9-phase-1-vs-phase-2-data-availability-summary)

---

## 1. Executive Summary

The Champions Longevity Dashboard requires real-time and historical biometric data to power six performance systems: Cardiovascular, Metabolic, Sleep Architecture, Recovery Capacity, Cognitive, and Longevity Index. Data must be sourced from multiple device ecosystems — Apple HealthKit (iOS), Google Health Connect (Android), and Fitbit (cross-platform via server-side API) — with fallback to manual entry and camera-based PPG for users without wearables.

This document evaluates the available React Native libraries for native health platform integration, maps data availability across all six systems and all source platforms, specifies the exact permission and consent flows required for App Store and Play Store approval, details the Fitbit OAuth2 server-side integration strategy, and proposes a tiered sync architecture that balances data freshness, battery impact, and third-party API rate limits.

**Key findings:**

- `react-native-health` (HealthKit) and `react-native-health-connect` (Health Connect) are the recommended native libraries. Both are compatible with Expo's custom dev client (expo-dev-client) via bare workflow or config plugins.
- Fitbit integration must be handled server-side (Supabase Edge Function) due to OAuth2 client-secret requirements; Fitbit's API cannot be called directly from a mobile client.
- Apple Watch is required for continuous HRV, SpO2, ECG, skin temperature, and blood oxygen. iPhone-only users have access to a significantly reduced data set.
- Health Connect requires Android 9+ (API 28) but the full data type set (including sleep stages and SpO2) requires Android 14+ (API 34) where Health Connect is built into the OS.
- Phase 1 (MVP) should focus on HealthKit + manual entry. Phase 2 adds Health Connect and Fitbit API.

---

## 2. Library Evaluation

### 2.1 react-native-health (Apple HealthKit)

| Attribute | Detail |
|---|---|
| Repository | https://github.com/agencyenterprise/react-native-health |
| GitHub Stars | ~2,000 |
| Latest Release | v1.x (actively maintained as of 2025) |
| Maintained By | Agency Enterprise — OSS with active community PRs |
| License | MIT |
| Native Module Type | Old Architecture (JSI/TurboModules bridge); New Architecture not yet fully supported |
| Expo Compatibility | **Compatible via expo-dev-client** with a config plugin or bare workflow. Cannot be used in Expo Go. Requires custom development build. |
| iOS Minimum | iOS 13+ |
| Apple Watch | Read data written by Apple Watch companion app via HealthKit; no direct Watch SDK call needed |
| TypeScript | Full TypeScript definitions included |
| Key Limitations | Background delivery requires `HKObserverQuery` setup; not available in managed Expo workflow |
| Installation | `npx expo install react-native-health` then add config plugin to `app.json` |

**Config plugin entry (`app.json`):**

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-health",
        {
          "iCloudContainerEnvironment": "Production"
        }
      ]
    ]
  }
}
```

**Maturity Assessment:** Production-ready. Used in thousands of health apps. The most mature HealthKit binding available for React Native. Has coverage for all HKQuantityType, HKCategoryType, HKCorrelationType, and HKWorkoutType identifiers relevant to this project.

---

### 2.2 react-native-health-connect (Google Health Connect)

| Attribute | Detail |
|---|---|
| Repository | https://github.com/matinzd/react-native-health-connect |
| GitHub Stars | ~600 |
| Latest Release | v3.x (active) |
| Maintained By | Community-maintained; Matinzd (primary) + contributors |
| License | MIT |
| Native Module Type | Supports New Architecture (TurboModules) in v3+ |
| Expo Compatibility | **Compatible via expo-dev-client** with config plugin. Expo Go not supported. |
| Android Minimum | Android 9 (API 28) for Health Connect app; Android 14 (API 34) for built-in Health Connect |
| TypeScript | Full TypeScript definitions |
| Key Limitations | Health Connect must be installed from Play Store on Android 9-13; pre-installed on Android 14+. Data availability varies greatly by Android version and installed wearable apps. |
| Installation | `npx expo install react-native-health-connect` |

**Alternative considered:** `@kingstinct/react-native-healthkit` — excellent TypeScript-first alternative for HealthKit but smaller community (700 stars). Evaluated and rejected in favor of react-native-health due to broader data type coverage and more documentation.

**Maturity Assessment:** Newer but rapidly maturing. Health Connect itself is relatively new (GA 2022). Library covers all major record types. Background sync requires WorkManager setup.

---

### 2.3 Fitbit via Fitbit Web API (Server-Side)

| Attribute | Detail |
|---|---|
| API Version | Fitbit Web API v1 (stable) |
| Authentication | OAuth2 Authorization Code Flow with PKCE |
| Client Secret | Required — must never be exposed in mobile client |
| Integration Pattern | Supabase Edge Function acts as OAuth2 proxy and data fetcher |
| Rate Limits | 150 API calls per user per hour (per resource type) |
| Webhook / Push | Fitbit Subscriptions API (push notifications to server endpoint) |
| Data Granularity | Intraday data available at 1-min intervals for heart rate, steps, calories (requires Partner API access for full intraday) |
| Device Support | All Fitbit trackers and smartwatches; Fitbit app on Android/iOS |
| React Native Library | None recommended — all calls go through Supabase Edge Function |
| Expo Compatibility | N/A (server-side only) |

**Why server-side only:** The Fitbit OAuth2 flow requires a `client_secret` that cannot be embedded in a mobile app binary (App Store / Play Store policies and basic security practice). The Supabase Edge Function serves as the OAuth2 callback handler, token store, and data proxy.

---

### 2.4 Library Comparison Summary

| Criteria | react-native-health | react-native-health-connect | Fitbit Web API |
|---|---|---|---|
| Platform | iOS only | Android only | iOS + Android (server) |
| Stars | ~2,000 | ~600 | N/A |
| Expo Dev Client | Yes (config plugin) | Yes (config plugin) | N/A |
| New Architecture | Partial | Yes (v3+) | N/A |
| Maintenance | Active | Active | Fitbit-maintained |
| Data Richness | Excellent | Good | Good |
| Background Sync | HKObserverQuery | WorkManager | Fitbit Subscriptions API |
| Production Readiness | High | Medium-High | High |

---

## 3. Full Data Availability Matrix

The following matrix maps each data point required by the six performance systems against its availability in each data source. Availability codes:

- **Y** — Available, standard access
- **Y*** — Available, requires specific hardware (noted)
- **P** — Partial or derived (calculation required)
- **N** — Not available
- **M** — Manual entry only
- **[AW]** — Requires Apple Watch (not iPhone-only)
- **[A14]** — Requires Android 14+ (API 34) for Health Connect
- **[PA]** — Requires Fitbit Partner API (additional approval from Fitbit)

---

### 3.1 Cardiovascular System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Resting Heart Rate | `HKQuantityTypeIdentifierRestingHeartRate` | Y | Y (`RestingHeartRateRecord`) | Y (`/heart`) | P | Y |
| Heart Rate (current) | `HKQuantityTypeIdentifierHeartRate` | Y [AW] | Y (`HeartRateRecord`) | Y (`/heart`) | Y | Y |
| Heart Rate Variability (SDNN) | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Y [AW] | Y (`HeartRateVariabilityRmssdRecord`) [A14] | Y (`/hrv`) | P | Y |
| VO2 Max | `HKQuantityTypeIdentifierVO2Max` | Y [AW] | Y (`Vo2MaxRecord`) [A14] | Y (estimated) | N | Y |
| Cardio Fitness Score | `HKQuantityTypeIdentifierVO2Max` | Y [AW] | P | P | N | Y |
| Blood Pressure (systolic) | `HKQuantityTypeIdentifierBloodPressureSystolic` | Y (manual/cuff) | Y (`BloodPressureRecord`) | N | N | Y |
| Blood Pressure (diastolic) | `HKQuantityTypeIdentifierBloodPressureDiastolic` | Y (manual/cuff) | Y (`BloodPressureRecord`) | N | N | Y |
| ECG / Atrial Fibrillation | `HKDataTypeIdentifierElectrocardiogram` | Y [AW] | N | N | N | N |
| Workout Heart Rate Zones | `HKQuantityTypeIdentifierHeartRate` (during workout) | Y [AW] | Y (`ExerciseSessionRecord`) | Y | N | Y |
| Peripheral Perfusion Index | N/A in HealthKit | N | N | N | P | N |

---

### 3.2 Metabolic System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Active Energy Burned | `HKQuantityTypeIdentifierActiveEnergyBurned` | Y | Y (`ActiveCaloriesBurnedRecord`) | Y (`/activities`) | N | Y |
| Basal Energy Burned | `HKQuantityTypeIdentifierBasalEnergyBurned` | Y | Y (`BasalMetabolicRateRecord`) | Y (estimated) | N | Y |
| Step Count | `HKQuantityTypeIdentifierStepCount` | Y | Y (`StepsRecord`) | Y (`/activities/steps`) | N | Y |
| Distance Walking/Running | `HKQuantityTypeIdentifierDistanceWalkingRunning` | Y | Y (`DistanceRecord`) | Y (`/activities/distance`) | N | Y |
| Blood Glucose | `HKQuantityTypeIdentifierBloodGlucose` | Y (CGM/manual) | Y (`BloodGlucoseRecord`) | N | N | Y |
| Dietary Carbohydrates | `HKQuantityTypeIdentifierDietaryCarbohydrates` | Y (manual/app) | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |
| Dietary Protein | `HKQuantityTypeIdentifierDietaryProtein` | Y | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |
| Dietary Fat | `HKQuantityTypeIdentifierDietaryFat` | Y | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |
| Body Mass | `HKQuantityTypeIdentifierBodyMass` | Y | Y (`WeightRecord`) | Y (`/body/weight`) | N | Y |
| Body Fat Percentage | `HKQuantityTypeIdentifierBodyFatPercentage` | Y | Y (`BodyFatRecord`) | Y (`/body/fat`) | N | Y |
| BMI | `HKQuantityTypeIdentifierBodyMassIndex` | Y | Y (`BmiRecord`) | Y (derived) | N | Y |
| Lean Body Mass | `HKQuantityTypeIdentifierLeanBodyMass` | Y | N | N | N | Y |
| Waist Circumference | `HKQuantityTypeIdentifierWaistCircumference` | Y | N | N | N | Y |
| Insulin Delivery | `HKQuantityTypeIdentifierInsulinDelivery` | Y | N | N | N | Y |
| Water Intake | `HKQuantityTypeIdentifierDietaryWater` | Y | Y (`HydrationRecord`) | Y (`/foods/water`) | N | Y |

---

### 3.3 Sleep Architecture System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Total Sleep Time | `HKCategoryTypeIdentifierSleepAnalysis` | Y [AW preferred] | Y (`SleepSessionRecord`) [A14] | Y (`/sleep`) | N | Y |
| Time in Bed | `HKCategoryTypeIdentifierSleepAnalysis` | Y | Y (`SleepSessionRecord`) [A14] | Y (`/sleep`) | N | Y |
| Sleep Stages (REM) | `HKCategoryValueSleepAnalysisAsleepREM` | Y [AW] | Y (`SleepStageRecord`) [A14] | Y (`/sleep`) | N | N |
| Sleep Stages (Deep/SWS) | `HKCategoryValueSleepAnalysisAsleepDeep` | Y [AW] | Y (`SleepStageRecord`) [A14] | Y (`/sleep`) | N | N |
| Sleep Stages (Light) | `HKCategoryValueSleepAnalysisAsleepCore` | Y [AW] | Y (`SleepStageRecord`) [A14] | Y (`/sleep`) | N | N |
| Wake After Sleep Onset | Derived from `HKCategoryTypeIdentifierSleepAnalysis` | P | P | Y (`/sleep`) | N | N |
| Sleep Onset Latency | Derived from `HKCategoryTypeIdentifierSleepAnalysis` | P | P | Y (`/sleep`) | N | Y |
| Sleep Efficiency | Derived metric | P | P | Y (`/sleep`) | N | N |
| Respiratory Rate (sleep) | `HKQuantityTypeIdentifierRespiratoryRate` | Y [AW] | Y (`RespiratoryRateRecord`) [A14] | Y (Fitbit Sense/Versa 3+) | N | N |
| Blood Oxygen (SpO2, sleep) | `HKQuantityTypeIdentifierOxygenSaturation` | Y [AW] | Y (`OxygenSaturationRecord`) [A14] | Y (Fitbit Sense/Versa 3+) | N | N |
| Snoring Detection | N/A in HealthKit | N | N | N | N | Y (app) |
| Heart Rate During Sleep | `HKQuantityTypeIdentifierHeartRate` | Y [AW] | Y [A14] | Y | N | N |
| HRV During Sleep | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Y [AW] | Y [A14] | Y (`/hrv`) | N | N |

**Note:** Sleep stage data on Apple Watch requires watchOS 9+ (Series 4 or newer). Sleep stages in Health Connect require Android 14+ and a compatible app (e.g., Samsung Health, Fitbit) writing stage-level data.

---

### 3.4 Recovery Capacity System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| HRV (SDNN, resting) | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Y [AW] | Y [A14] | Y (`/hrv`) | P | Y |
| Resting Heart Rate Trend | `HKQuantityTypeIdentifierRestingHeartRate` | Y | Y | Y | P | Y |
| Skin Temperature | `HKQuantityTypeIdentifierAppleSleepingWristTemperature` | Y [AW, watchOS 9+] | N | Y (Fitbit Sense/Versa 3+ only) | N | N |
| Blood Oxygen (SpO2) | `HKQuantityTypeIdentifierOxygenSaturation` | Y [AW] | Y [A14] | Y (Fitbit Sense/Versa 3+) | N | Y |
| Respiratory Rate | `HKQuantityTypeIdentifierRespiratoryRate` | Y [AW] | Y [A14] | Y (Fitbit Sense+) | N | N |
| Workout Recovery HR | Derived from `HKQuantityTypeIdentifierHeartRate` | P [AW] | P | N | N | Y |
| Exercise Load / Strain | Derived metric (ATL/CTL) | P | P | N | N | Y |
| Perceived Exertion (RPE) | N/A | N | N | N | N | Y |
| Muscle Soreness | N/A | N | N | N | N | Y |
| Readiness Score | N/A in HealthKit | N | N | N | N | Y (derived) |

**Note:** `HKQuantityTypeIdentifierAppleSleepingWristTemperature` is available only on Apple Watch Series 8+ and Ultra. Fitbit skin temperature is available on Fitbit Sense, Sense 2, Versa 3, and Versa 4 only.

---

### 3.5 Cognitive Performance System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Mindful Minutes | `HKCategoryTypeIdentifierMindfulSession` | Y | N | N | N | Y |
| Mood / Mental State | N/A in HealthKit | N | N | N | N | Y |
| Perceived Stress Level | N/A in HealthKit | N | N | N | N | Y |
| Reaction Time | N/A in HealthKit | N | N | N | N | Y (in-app test) |
| Cognitive Fatigue | N/A in HealthKit | N | N | N | N | Y (in-app test) |
| Screen Time | N/A in HealthKit | N | N | N | N | Y (iOS Screen Time API — separate) |
| Audio Exposure | `HKQuantityTypeIdentifierEnvironmentalAudioExposure` | Y | N | N | N | N |
| Sleep-Cognition Correlation | Derived | P | P | P | N | P |
| Alcohol Consumption | `HKQuantityTypeIdentifierNumberOfAlcoholicBeverages` | Y | N | N | N | Y |
| Caffeine Intake | `HKQuantityTypeIdentifierDietaryCaffeine` | Y | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |

**Note:** Cognitive data is the weakest category for passive device collection. The majority of cognitive metrics require in-app assessments or manual entry. Future integrations could include Oura Ring (via unofficial API) or WHOOP for readiness/strain scores.

---

### 3.6 Longevity Index System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| VO2 Max | `HKQuantityTypeIdentifierVO2Max` | Y [AW] | Y [A14] | Y (estimated) | N | Y |
| Grip Strength | N/A in HealthKit | N | N | N | N | Y |
| Gait Speed | `HKQuantityTypeIdentifierWalkingSpeed` | Y | N | N | N | Y |
| Six-Minute Walk Test | Derived from `HKQuantityTypeIdentifierDistanceWalkingRunning` | P | P | P | N | Y |
| Standing Time | `HKQuantityTypeIdentifierAppleStandTime` | Y [AW] | N | N | N | N |
| Low Heart Rate Events | `HKCategoryTypeIdentifierLowHeartRateEvent` | Y [AW] | N | N | N | N |
| High Heart Rate Events | `HKCategoryTypeIdentifierHighHeartRateEvent` | Y [AW] | N | N | N | N |
| Irregular Rhythm Notifications | `HKCategoryTypeIdentifierIrregularHeartRhythmEvent` | Y [AW] | N | N | N | N |
| Walking Heart Rate Average | `HKQuantityTypeIdentifierWalkingHeartRateAverage` | Y [AW] | N | N | N | N |
| Stair Climbing Speed | `HKQuantityTypeIdentifierStairAscentSpeed` | Y [AW] | N | N | N | N |
| Double Support Percentage | `HKQuantityTypeIdentifierWalkingDoubleSupportPercentage` | Y | N | N | N | N |
| Walking Asymmetry | `HKQuantityTypeIdentifierWalkingAsymmetryPercentage` | Y | N | N | N | N |
| Apple Fitness Age (Cardio) | Derived from VO2 Max | P [AW] | P | P | N | P |

---

## 4. Permission & Consent Flows

### 4.1 Apple HealthKit (iOS)

#### 4.1.1 Info.plist Keys

The following keys are required in `ios/[AppName]/Info.plist`. With react-native-health and the config plugin, these are automatically injected during `expo prebuild`. Verify their presence after prebuild.

```xml
<!-- Required: Explain why the app reads health data -->
<key>NSHealthShareUsageDescription</key>
<string>Champions Longevity Dashboard reads your health data to calculate your six performance scores and track your longevity metrics over time.</string>

<!-- Required: Explain why the app writes health data (if applicable) -->
<key>NSHealthUpdateUsageDescription</key>
<string>Champions Longevity Dashboard may write mindfulness sessions and manual health entries to Apple Health so your data stays in sync.</string>

<!-- Required for HealthKit entitlement -->
<key>com.apple.developer.healthkit</key>
<true/>

<!-- Required for background delivery (if used) -->
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>
```

#### 4.1.2 Entitlements File

The `ios/[AppName]/[AppName].entitlements` file must include:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.healthkit</key>
  <true/>
  <key>com.apple.developer.healthkit.background-delivery</key>
  <true/>
</dict>
</plist>
```

This entitlement must also be enabled in the Apple Developer Portal under the app's identifier capabilities.

#### 4.1.3 Permission Request Code (React Native)

```typescript
import AppleHealthKit, {
  HealthKitPermissions,
  HealthPermission,
} from 'react-native-health';

const HEALTHKIT_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.VO2Max,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.MindfulSession,
      AppleHealthKit.Constants.Permissions.WalkingSpeed,
      AppleHealthKit.Constants.Permissions.StairAscentSpeed,
      AppleHealthKit.Constants.Permissions.WalkingHeartRateAverage,
      AppleHealthKit.Constants.Permissions.AppleStandTime,
      AppleHealthKit.Constants.Permissions.EnvironmentalAudioExposure,
      AppleHealthKit.Constants.Permissions.Electrocardiogram,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.MindfulSession,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
    ],
  },
};

export async function requestHealthKitPermissions(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
      if (error) {
        console.error('HealthKit initialization error:', error);
        reject(new Error(error));
        return;
      }
      resolve(true);
    });
  });
}
```

**Important UX note:** Apple does not allow the app to know which specific permissions the user granted or denied. The permission sheet is shown once; subsequent calls to `initHealthKit` do not re-show the sheet. Always gracefully handle the case where data returns empty (user may have denied that specific type).

---

### 4.2 Google Health Connect (Android)

#### 4.2.1 AndroidManifest.xml Permissions

```xml
<!-- In android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- Health Connect permissions — each data type requires its own permission -->
  <uses-permission android:name="android.permission.health.READ_HEART_RATE"/>
  <uses-permission android:name="android.permission.health.READ_RESTING_HEART_RATE"/>
  <uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY"/>
  <uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION"/>
  <uses-permission android:name="android.permission.health.READ_RESPIRATORY_RATE"/>
  <uses-permission android:name="android.permission.health.READ_SLEEP"/>
  <uses-permission android:name="android.permission.health.READ_STEPS"/>
  <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED"/>
  <uses-permission android:name="android.permission.health.READ_BASAL_METABOLIC_RATE"/>
  <uses-permission android:name="android.permission.health.READ_WEIGHT"/>
  <uses-permission android:name="android.permission.health.READ_BODY_FAT"/>
  <uses-permission android:name="android.permission.health.READ_BLOOD_GLUCOSE"/>
  <uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE"/>
  <uses-permission android:name="android.permission.health.READ_NUTRITION"/>
  <uses-permission android:name="android.permission.health.READ_HYDRATION"/>
  <uses-permission android:name="android.permission.health.READ_VO2_MAX"/>
  <uses-permission android:name="android.permission.health.READ_DISTANCE"/>
  <uses-permission android:name="android.permission.health.READ_EXERCISE"/>

  <!-- Write permissions (if needed) -->
  <uses-permission android:name="android.permission.health.WRITE_WEIGHT"/>
  <uses-permission android:name="android.permission.health.WRITE_BLOOD_GLUCOSE"/>
  <uses-permission android:name="android.permission.health.WRITE_NUTRITION"/>

  <application ...>

    <!-- Required: Activity to handle Health Connect permission rationale -->
    <activity
      android:name=".HealthConnectPermissionRationaleActivity"
      android:exported="true">
      <intent-filter>
        <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE"/>
      </intent-filter>
    </activity>

    <!-- Required: Privacy Policy link shown in Health Connect UI -->
    <meta-data
      android:name="health_connect_privacy_policy_url"
      android:value="https://championshealth.app/privacy"/>

  </application>
</manifest>
```

#### 4.2.2 Health Connect Permission Request Code

```typescript
import {
  initialize,
  requestPermission,
  Permission,
} from 'react-native-health-connect';

const HEALTH_CONNECT_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'RespiratoryRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'BasalMetabolicRate' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'BodyFat' },
  { accessType: 'read', recordType: 'BloodGlucose' },
  { accessType: 'read', recordType: 'BloodPressure' },
  { accessType: 'read', recordType: 'Nutrition' },
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'read', recordType: 'Vo2Max' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'Weight' },
];

export async function requestHealthConnectPermissions(): Promise<boolean> {
  // Initialize Health Connect SDK
  const isInitialized = await initialize();
  if (!isInitialized) {
    // Health Connect not installed — prompt user to install from Play Store
    // On Android 14+, Health Connect is built-in; initialization always returns true
    console.warn('Health Connect is not available on this device/Android version');
    return false;
  }

  const grantedPermissions = await requestPermission(HEALTH_CONNECT_PERMISSIONS);
  
  // grantedPermissions is an array of Permission objects that were granted
  const readHeartRateGranted = grantedPermissions.some(
    (p) => p.recordType === 'HeartRate' && p.accessType === 'read'
  );

  return grantedPermissions.length > 0;
}
```

**Android version matrix:**

| Android Version | Health Connect Status | Sleep Stages | SpO2 | Notes |
|---|---|---|---|---|
| Android 9-12 (API 28-32) | Install from Play Store | N | N | Limited data type support |
| Android 13 (API 33) | Install from Play Store | Y | Y | Most types available |
| Android 14+ (API 34) | Built into OS | Y | Y | Full support, no install needed |

#### 4.2.3 Play Store Requirements

To publish an app using Health Connect on the Play Store, developers must:

1. Complete the Health Connect permission declaration form in Play Console.
2. Include a link to a privacy policy that explicitly mentions each permission used.
3. Implement the `ACTION_SHOW_PERMISSIONS_RATIONALE` activity (see manifest above).
4. Not use Health Connect data for advertising or selling to third parties.

---

### 4.3 Fitbit OAuth2 Scopes

Fitbit uses OAuth2 Authorization Code flow with PKCE. Scopes are requested during the authorization redirect. The following scopes are needed for Champions Longevity Dashboard:

| Scope | Data Accessible |
|---|---|
| `activity` | Steps, distance, floors, active minutes, exercise logs |
| `heartrate` | Resting heart rate, heart rate time series, heart rate zones |
| `sleep` | Sleep logs, sleep stages, sleep summary |
| `weight` | Body weight, BMI, body fat percentage logs |
| `nutrition` | Food logs, water logs, calories consumed |
| `oxygen_saturation` | SpO2 daily summary and intraday (Sense/Versa 3+ only) |
| `respiratory_rate` | Breathing rate during sleep (Sense/Versa 3+ only) |
| `temperature` | Skin temperature deviation during sleep (Sense/Versa 3+ only) |
| `heartrate_variability` | HRV during sleep (Sense/Versa 3+ only) |
| `cardio_fitness` | Cardio fitness score (VO2 Max estimate) |
| `profile` | User's display name, age, gender (for score normalization) |

**Authorization URL format:**

```
https://www.fitbit.com/oauth2/authorize
  ?response_type=code
  &client_id={CLIENT_ID}
  &redirect_uri={REDIRECT_URI}
  &scope=activity+heartrate+sleep+weight+nutrition+oxygen_saturation+respiratory_rate+temperature+heartrate_variability+cardio_fitness+profile
  &code_challenge={CODE_CHALLENGE}
  &code_challenge_method=S256
  &state={STATE}
```

---

## 5. Fitbit Web API — OAuth2 and Key Endpoints

### 5.1 OAuth2 Flow via Supabase Edge Function

The Fitbit OAuth2 Authorization Code + PKCE flow must be handled server-side. The React Native app initiates the flow using `expo-web-browser` to open the Fitbit authorization page, and the Supabase Edge Function handles the callback, token exchange, and storage.

```
Mobile App                    Supabase Edge Function              Fitbit API
    |                                    |                              |
    |-- 1. Generate PKCE code_verifier --|                              |
    |   and code_challenge               |                              |
    |                                    |                              |
    |-- 2. Open Fitbit auth URL -------->|                              |
    |   (via expo-web-browser)           |                              |
    |                                    |                              |
    |                                    |-- 3. User logs in, grants -->|
    |                                    |   permissions                |
    |                                    |                              |
    |<-- 4. Redirect to app scheme ------|                              |
    |   with auth code                   |                              |
    |                                    |                              |
    |-- 5. Send code + code_verifier --> |                              |
    |   to Edge Function                 |                              |
    |                                    |-- 6. POST token exchange --->|
    |                                    |   (code + client_secret)     |
    |                                    |                              |
    |                                    |<-- 7. access_token,          |
    |                                    |   refresh_token, expires_in  |
    |                                    |                              |
    |                                    |-- 8. Store tokens encrypted  |
    |                                    |   in Supabase DB             |
    |                                    |                              |
    |<-- 9. Return success to app -------|                              |
```

#### 5.1.1 Supabase Edge Function: Token Exchange

```typescript
// supabase/functions/fitbit-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FITBIT_CLIENT_ID = Deno.env.get('FITBIT_CLIENT_ID')!;
const FITBIT_CLIENT_SECRET = Deno.env.get('FITBIT_CLIENT_SECRET')!;
const FITBIT_REDIRECT_URI = Deno.env.get('FITBIT_REDIRECT_URI')!;

serve(async (req: Request) => {
  const { code, code_verifier, user_id } = await req.json();

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: FITBIT_REDIRECT_URI,
      code_verifier,
    }),
  });

  if (!tokenResponse.ok) {
    return new Response(
      JSON.stringify({ error: 'Token exchange failed' }),
      { status: 400 }
    );
  }

  const tokens = await tokenResponse.json();
  // tokens: { access_token, refresh_token, expires_in, token_type, scope, user_id }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Store tokens encrypted — never store in plain text in production
  await supabase.from('fitbit_credentials').upsert({
    user_id,
    fitbit_user_id: tokens.user_id,
    access_token: tokens.access_token, // encrypt with Supabase Vault in production
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scopes: tokens.scope,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

#### 5.1.2 Token Refresh Logic

Fitbit access tokens expire after 8 hours. Refresh tokens are valid for 8 hours or until used (rolling). The Edge Function must check expiry before each API call:

```typescript
async function getFreshFitbitToken(userId: string, supabase: SupabaseClient): Promise<string> {
  const { data: creds } = await supabase
    .from('fitbit_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (new Date(creds.expires_at) > new Date(Date.now() + 60_000)) {
    return creds.access_token; // Still valid for > 1 minute
  }

  // Refresh the token
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
    }),
  });

  const newTokens = await response.json();

  await supabase.from('fitbit_credentials').update({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
  }).eq('user_id', userId);

  return newTokens.access_token;
}
```

---

### 5.2 Key Fitbit API Endpoints

All requests use `Authorization: Bearer {access_token}`. Base URL: `https://api.fitbit.com`

| System | Endpoint | Response Key Fields |
|---|---|---|
| Heart Rate (daily summary) | `GET /1/user/-/activities/heart/date/{date}/1d.json` | `restingHeartRate`, `heartRateZones` |
| Heart Rate (intraday) [PA] | `GET /1/user/-/activities/heart/date/{date}/1d/1min.json` | `dataset[].value`, `dataset[].time` |
| HRV (daily) | `GET /1/user/-/hrv/date/{date}.json` | `hrv[].value.dailyRmssd`, `hrv[].value.deepRmssd` |
| Sleep (summary) | `GET /1.2/user/-/sleep/date/{date}.json` | `summary.stages`, `summary.totalMinutesAsleep` |
| Sleep (date range) | `GET /1.2/user/-/sleep/date/{startDate}/{endDate}.json` | Array of sleep logs |
| SpO2 (daily) | `GET /1/user/-/spo2/date/{date}.json` | `value.avg`, `value.min`, `value.max` |
| SpO2 (intraday) [PA] | `GET /1/user/-/spo2/date/{date}/all.json` | `minutes[].minute`, `minutes[].value` |
| Breathing Rate (sleep) | `GET /1/user/-/br/date/{date}.json` | `br[].value.breathingRate` |
| Skin Temperature | `GET /1/user/-/temp/skin/date/{date}.json` | `tempSkin[].value.nightlyRelative` |
| Steps (daily) | `GET /1/user/-/activities/steps/date/{date}/1d.json` | `activities-steps[].value` |
| Active Calories | `GET /1/user/-/activities/calories/date/{date}/1d.json` | `activities-calories[].value` |
| Body Weight | `GET /1/user/-/body/log/weight/date/{date}.json` | `weight[].weight`, `weight[].bmi`, `weight[].fat` |
| Cardio Fitness (VO2 Max) | `GET /1/user/-/cardioscore/date/{date}.json` | `cardioScore[].value.vo2Max` |
| Food Log | `GET /1/user/-/foods/log/date/{date}.json` | `foods[].nutritionalValues` |
| Water Log | `GET /1/user/-/foods/log/water/date/{date}.json` | `water[].amount` |
| Profile | `GET /1/user/-/profile.json` | `user.age`, `user.gender`, `user.height` |

**[PA]** = Requires Fitbit Partner API access (free to apply, but requires Fitbit/Google approval)

---

### 5.3 Rate Limits

| Limit Type | Limit | Notes |
|---|---|---|
| Per-user hourly limit | 150 requests/hour per user | Resets at the top of each hour UTC |
| App-level limit | 3,500 requests/hour total across all users | Rarely hit in early-stage apps |
| Intraday data limit [PA] | Same as standard; requires Partner access | Apply at dev.fitbit.com |
| Subscription limit | 1 subscription per user per collection type | Used for push notifications |

**Rate limit headers returned with every response:**

```
Fitbit-Rate-Limit-Limit: 150
Fitbit-Rate-Limit-Remaining: 143
Fitbit-Rate-Limit-Reset: 1234 (seconds until reset)
```

The Supabase Edge Function must check `Fitbit-Rate-Limit-Remaining` before each request and implement exponential backoff if approaching the limit.

---

### 5.4 Fitbit Subscriptions API (Webhooks)

For near-real-time data updates, register a subscription per user. Fitbit will POST to the Edge Function endpoint when new data is available (typically within 10-30 minutes of sync).

**Register a subscription:**

```
POST https://api.fitbit.com/1/user/-/activities.json
Authorization: Bearer {access_token}
```

**Subscription types:** `activities`, `body`, `foods`, `sleep`, `userRevokedAccess`

**Webhook payload verification:** Fitbit sends a `X-Fitbit-Signature` header using HMAC-SHA1 with the client secret. Always verify this signature in the Edge Function before processing.

---

## 6. Data Sync Architecture

### 6.1 Sync Strategy Overview

Three sync patterns are used depending on data source and user action:

| Pattern | Trigger | Latency | Battery Impact | Best For |
|---|---|---|---|---|
| On-Demand Pull | User opens app or taps refresh | Seconds | Low (single burst) | HealthKit, Health Connect, Fitbit |
| Background Fetch | OS-scheduled app wake (iOS) or WorkManager (Android) | 15 min - hours | Medium | HealthKit summary data |
| Server-Side Cron | Supabase scheduled function | Configurable (e.g., every 30 min) | None (server) | Fitbit API, historical backfill |

---

### 6.2 On-Demand Sync (Primary Pattern)

Used when the user opens the app or navigates to a dashboard. Pull the last 24-48 hours of data from HealthKit / Health Connect and the last sync date from Fitbit via the Edge Function.

```typescript
// hooks/useHealthSync.ts
import { useCallback } from 'react';
import { requestHealthKitPermissions, fetchHealthKitData } from '../services/healthkit';
import { fetchFitbitDataViaEdgeFunction } from '../services/fitbit';
import { supabase } from '../lib/supabase';

export function useHealthSync() {
  const syncAll = useCallback(async (userId: string) => {
    const lastSync = await getLastSyncTimestamp(userId);
    const now = new Date();

    // Run in parallel — HealthKit and Fitbit are independent
    const [healthKitData, fitbitData] = await Promise.allSettled([
      fetchHealthKitData({ startDate: lastSync, endDate: now }),
      fetchFitbitDataViaEdgeFunction({ userId, startDate: lastSync, endDate: now }),
    ]);

    // Upsert to Supabase, handling partial failures gracefully
    await upsertBiometricData(userId, healthKitData, fitbitData);
    await updateLastSyncTimestamp(userId, now);
  }, []);

  return { syncAll };
}
```

---

### 6.3 Background Fetch (iOS — HealthKit Observer Queries)

For continuous updates without user interaction, register `HKObserverQuery` for key metrics. iOS will wake the app in the background when new data arrives (typically when Apple Watch syncs).

```typescript
// This must be called during app initialization, not on-demand
import AppleHealthKit from 'react-native-health';

export function registerHealthKitBackgroundObservers() {
  // Background delivery must be enabled per data type
  AppleHealthKit.enableBackgroundDelivery(
    {
      type: AppleHealthKit.Constants.Permissions.HeartRateVariability,
      frequency: AppleHealthKit.Constants.Frequencies.Immediate,
    },
    (error, result) => {
      if (error) console.error('Background delivery registration error:', error);
      else console.log('HRV background delivery enabled:', result);
    }
  );

  AppleHealthKit.enableBackgroundDelivery(
    {
      type: AppleHealthKit.Constants.Permissions.SleepAnalysis,
      frequency: AppleHealthKit.Constants.Frequencies.Daily,
    },
    (error, result) => {
      if (error) console.error('Background delivery registration error:', error);
    }
  );
}
```

**Important:** Background delivery requires the `com.apple.developer.healthkit.background-delivery` entitlement. Apple limits how frequently the OS will wake the app based on the data type's update frequency. Frequency options: `Immediate`, `Hourly`, `Daily`, `Weekly`.

---

### 6.4 Server-Side Cron (Fitbit via Supabase)

Fitbit data is pulled on a schedule by a Supabase Edge Function invoked via Supabase's `pg_cron` extension or an external cron service (e.g., GitHub Actions, Supabase Dashboard scheduled functions).

```sql
-- In Supabase SQL Editor: schedule Fitbit sync every 30 minutes
select cron.schedule(
  'fitbit-sync-job',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/fitbit-sync',
    headers := '{"Authorization": "Bearer {SUPABASE_SERVICE_ROLE_KEY}", "Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  );
  $$
);
```

The `fitbit-sync` Edge Function queries all users with valid (non-expired, non-revoked) Fitbit credentials and fetches yesterday's and today's data for each. It respects the per-user rate limit by processing users sequentially with a delay between each.

---

### 6.5 Battery & Rate Limit Considerations

| Concern | Mitigation |
|---|---|
| HealthKit battery drain | Use `enableBackgroundDelivery` sparingly; only register for high-value types (HRV, sleep, resting HR). Query date ranges, not individual data points. |
| Health Connect battery drain | Use WorkManager with `NetworkType.CONNECTED` and periodic constraints (minimum 15 min interval). |
| Fitbit rate limit (150/user/hr) | Batch fetch: one call per data category covering a date range rather than per-day calls. Cache results in Supabase. Implement `Retry-After` handling. |
| Redundant syncs | Track `last_synced_at` per data source per user in Supabase. Skip sync if last sync was < 15 minutes ago. |
| App Store background refresh | iOS may restrict background fetch frequency for apps that users rarely open. Prefer foreground on-demand sync as the primary pattern. |
| Fitbit webhook deduplication | Fitbit may send duplicate subscription notifications. Use idempotent upserts in the database keyed on `(user_id, data_type, timestamp)`. |

---

## 7. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHAMPIONS LONGEVITY DASHBOARD                            │
│                    React Native (Expo + expo-dev-client)                    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐
          │  iOS Device     │ │ Android     │ │  Camera PPG   │
          │                 │ │ Device      │ │  (In-App)     │
          │  react-native-  │ │             │ │               │
          │  health         │ │ react-      │ │  Vision       │
          │  (HealthKit)    │ │ native-     │ │  Camera /     │
          │                 │ │ health-     │ │  expo-camera  │
          │  HKQuantityType │ │ connect     │ │               │
          │  HKCategoryType │ │ (Health     │ │  Resting HR   │
          │  HKWorkoutType  │ │  Connect)   │ │  HRV estimate │
          └────────┬────────┘ └─────┬──────┘ └───────┬───────┘
                   │                │                  │
          ┌────────▼────────────────▼──────────────────▼───────┐
          │              DATA AGGREGATION LAYER                  │
          │         (TypeScript service layer in app)            │
          │                                                      │
          │  • Normalize units (ml → oz, kg → lbs, etc.)        │
          │  • Merge duplicate readings from multiple sources    │
          │  • Apply source priority: HealthKit > Fitbit > Manual│
          │  • Handle missing data / interpolation               │
          └─────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │         SUPABASE               │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │  PostgreSQL Database      │  │
                    │  │  • biometric_readings     │  │
                    │  │  • sleep_sessions         │  │
                    │  │  • performance_scores     │  │
                    │  │  • fitbit_credentials     │  │
                    │  │  • sync_metadata          │  │
                    │  └──────────────────────────┘  │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │  Edge Functions           │  │
                    │  │  • fitbit-auth            │  │◄─── Fitbit OAuth2
                    │  │  • fitbit-sync            │  │     Callback
                    │  │  • fitbit-webhook         │  │
                    │  │  • score-calculator       │  │
                    │  └──────────────────────────┘  │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │  pg_cron                  │  │
                    │  │  • Fitbit sync every 30m  │  │
                    │  │  • Score recalc daily     │  │
                    │  │  • Data cleanup weekly    │  │
                    │  └──────────────────────────┘  │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │        FITBIT WEB API          │
                    │  api.fitbit.com                │
                    │                                │
                    │  • OAuth2 (server-side only)   │
                    │  • /heart, /sleep, /hrv        │
                    │  • /activities, /body          │
                    │  • /spo2, /br, /temp/skin      │
                    │  • Subscriptions (webhooks)    │
                    │                                │
                    │  Rate limit: 150 req/user/hr   │
                    └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW (Sync Paths)                              │
│                                                                             │
│  [A] ON-DEMAND (User opens app):                                            │
│      App → HealthKit/Health Connect → Normalize → Supabase DB               │
│      App → Supabase Edge Function → Fitbit API → Supabase DB                │
│                                                                             │
│  [B] BACKGROUND (iOS Observer Query):                                       │
│      HealthKit update → OS wakes app → Fetch delta → Supabase DB            │
│                                                                             │
│  [C] SERVER CRON (Every 30 min):                                            │
│      pg_cron → Edge Function → Fitbit API (all users) → Supabase DB        │
│                                                                             │
│  [D] WEBHOOK (Fitbit Subscription push):                                    │
│      Fitbit → fitbit-webhook Edge Function → Verify HMAC → Supabase DB     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCORE CALCULATION ENGINE                                 │
│                    (Supabase Edge Function / scheduled)                     │
│                                                                             │
│  Raw Biometric Data → Normalization → Percentile Scoring → Composite Score │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────┐ │
│  │ Cardiovascular   │  │ Metabolic    │  │ Sleep Arch.   │  │ Recovery  │ │
│  │ Score (0-100)    │  │ Score (0-100)│  │ Score (0-100) │  │ (0-100)   │ │
│  └────────┬─────────┘  └──────┬───────┘  └──────┬────────┘  └─────┬─────┘ │
│           │                   │                  │                  │       │
│  ┌────────▼─────────┐  ┌──────▼───────────────────▼───────────────▼─────┐ │
│  │ Cognitive        │  │              LONGEVITY INDEX                    │ │
│  │ Score (0-100)    ├─►│              Weighted composite of all scores   │ │
│  └──────────────────┘  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Library Recommendation

### 8.1 Primary Recommendation

| Platform | Library | Version | Rationale |
|---|---|---|---|
| iOS (HealthKit) | `react-native-health` | v1.x | Most mature, widest data type coverage, Expo dev client compatible, MIT license, 2,000+ stars, active maintenance |
| Android (Health Connect) | `react-native-health-connect` | v3.x | Only production-ready Health Connect library for React Native, New Architecture support, active maintenance |
| Fitbit | No React Native library | — | Server-side via Supabase Edge Function is the only secure approach; no client-side library is appropriate |
| Camera PPG | `expo-camera` + custom signal processing | — | Native camera access for rPPG; process RGB channel variance to estimate heart rate |

### 8.2 Justification Details

**Why `react-native-health` over alternatives:**

- `@kingstinct/react-native-healthkit` is excellent for TypeScript but has less community documentation and fewer examples for the complex data types needed (ECG, gait metrics, sleep stages with stage values).
- `react-native-healthkit` (different package) is outdated and unmaintained.
- `react-native-health` has the most comprehensive coverage of `HKQuantityTypeIdentifier*` constants, including all the longevity-specific metrics like `WalkingSpeed`, `StairAscentSpeed`, `WalkingDoubleSupportPercentage`.

**Why `react-native-health-connect` over alternatives:**

- It is the only actively maintained Health Connect library for React Native as of 2026.
- v3.x adds New Architecture (TurboModules) support, making it forward-compatible.
- The alternative of using `@capacitor/health` is not applicable to React Native.

**Why server-side for Fitbit:**

- Embedding OAuth2 `client_secret` in a mobile app binary violates both Apple App Store guidelines and Google Play policies.
- Supabase Edge Functions (Deno runtime) provide a secure, scalable, and cost-effective server layer with no separate backend infrastructure needed.
- Server-side polling also allows data sync even when the user has not opened the app recently.

### 8.3 Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| react-native-health not updated for New Architecture | Medium | Monitor repo; consider migrating to `@kingstinct/react-native-healthkit` if needed |
| Health Connect data gaps on Android < 14 | High | Clearly communicate data availability in onboarding UI; prompt users on Android 9-13 to install Health Connect from Play Store |
| Fitbit API deprecation (Google acquisition) | Low-Medium | Abstract Fitbit behind a data source interface; adding alternative (e.g., Garmin Connect) later should require only a new Edge Function |
| Fitbit rate limits exceeded during peak sync | Low | Implement request queue with rate limit header awareness; use webhooks instead of polling as primary mechanism |
| HealthKit permission UX confusion | Medium | Use a custom pre-permission screen explaining exactly what will be requested and why before invoking the HealthKit sheet |

---

## 9. Phase 1 vs Phase 2 Data Availability Summary

### 9.1 Phase 1 (MVP — Target: Launch)

**Scope:** iOS only, HealthKit + Manual Entry

| System | Phase 1 Data Points | Source | Score Completeness |
|---|---|---|---|
| Cardiovascular | Resting HR, HRV (SDNN), VO2 Max, Heart Rate Zones | HealthKit [AW required for HRV/VO2] | ~70% (iPhone-only users get ~40%) |
| Metabolic | Steps, Active Calories, Body Weight, BMI, Body Fat % | HealthKit | ~75% |
| Sleep Architecture | Total Sleep, Time in Bed, Sleep Stages (REM/Deep/Light) | HealthKit [AW required for stages] | ~60% (iPhone-only: ~30%) |
| Recovery Capacity | HRV, Resting HR, SpO2, Respiratory Rate | HealthKit [AW required for SpO2/RR] | ~55% |
| Cognitive | Mindful Sessions, Manual mood/stress entry | HealthKit + Manual | ~40% |
| Longevity Index | VO2 Max, Gait Speed, Walking Metrics, Standing Time | HealthKit [AW required for most] | ~65% |

**Phase 1 Data Types to Implement (HealthKit):**

```
HKQuantityTypeIdentifierRestingHeartRate
HKQuantityTypeIdentifierHeartRate
HKQuantityTypeIdentifierHeartRateVariabilitySDNN
HKQuantityTypeIdentifierVO2Max
HKQuantityTypeIdentifierOxygenSaturation
HKQuantityTypeIdentifierRespiratoryRate
HKCategoryTypeIdentifierSleepAnalysis
HKQuantityTypeIdentifierStepCount
HKQuantityTypeIdentifierActiveEnergyBurned
HKQuantityTypeIdentifierBasalEnergyBurned
HKQuantityTypeIdentifierBodyMass
HKQuantityTypeIdentifierBodyFatPercentage
HKQuantityTypeIdentifierBodyMassIndex
HKQuantityTypeIdentifierWalkingSpeed
HKQuantityTypeIdentifierAppleStandTime
HKQuantityTypeIdentifierWalkingHeartRateAverage
HKQuantityTypeIdentifierWalkingDoubleSupportPercentage
HKCategoryTypeIdentifierMindfulSession
```

---

### 9.2 Phase 2 (Post-Launch — Target: 3-6 months post-launch)

**Scope:** Android (Health Connect), Fitbit API, Camera PPG, expanded iOS data types

| Addition | New Data Enabled | Systems Improved |
|---|---|---|
| Health Connect (Android) | All Android users gain parity with iOS HealthKit users | All 6 systems |
| Fitbit API | Skin temperature, Fitbit-specific sleep details, HRV (Sense users), SpO2 time series | Sleep, Recovery, Cardiovascular |
| Camera PPG | Resting HR and crude HRV estimate for non-wearable users | Cardiovascular, Recovery |
| Blood Glucose (CGM sync) | Continuous glucose data via HealthKit or manual | Metabolic |
| Nutrition logging | Macronutrient and caloric data via HealthKit or manual | Metabolic, Longevity Index |
| ECG integration | AFib detection and rhythm analysis | Cardiovascular, Longevity Index |
| Garmin Connect API | Additional wearable data source for Garmin users | All 6 systems |

**Phase 2 Additional HealthKit Types:**

```
HKDataTypeIdentifierElectrocardiogram
HKQuantityTypeIdentifierBloodGlucose
HKQuantityTypeIdentifierDietaryCarbohydrates
HKQuantityTypeIdentifierDietaryProtein
HKQuantityTypeIdentifierDietaryFat
HKQuantityTypeIdentifierDietaryWater
HKQuantityTypeIdentifierDietaryCaffeine
HKQuantityTypeIdentifierBloodPressureSystolic
HKQuantityTypeIdentifierBloodPressureDiastolic
HKQuantityTypeIdentifierAppleSleepingWristTemperature
HKQuantityTypeIdentifierStairAscentSpeed
HKQuantityTypeIdentifierWalkingAsymmetryPercentage
HKQuantityTypeIdentifierLeanBodyMass
HKCategoryTypeIdentifierLowHeartRateEvent
HKCategoryTypeIdentifierHighHeartRateEvent
HKCategoryTypeIdentifierIrregularHeartRhythmEvent
HKQuantityTypeIdentifierEnvironmentalAudioExposure
HKQuantityTypeIdentifierNumberOfAlcoholicBeverages
```

---

### 9.3 User Experience Tier Summary

| User Profile | Device | Phase 1 Score Completeness | Phase 2 Score Completeness |
|---|---|---|---|
| iPhone + Apple Watch Series 8+ | iOS | ~85% | ~95% |
| iPhone + Apple Watch Series 4-7 | iOS | ~75% | ~85% |
| iPhone only (no Watch) | iOS | ~40% | ~55% |
| Android + Fitbit Sense/Versa 3+ | Android | — (Phase 2) | ~80% |
| Android + other Fitbit | Android | — (Phase 2) | ~65% |
| Android only (Health Connect) | Android | — (Phase 2) | ~60% |
| No wearable (manual + Camera PPG) | Any | ~25% | ~35% |

---

## Appendix A: Dependency Installation Summary

```bash
# Phase 1 dependencies
npx expo install react-native-health
npx expo install expo-web-browser     # For Fitbit OAuth2 redirect
npx expo install @supabase/supabase-js
npx expo install expo-secure-store    # Store tokens securely on device

# Phase 2 additions
npx expo install react-native-health-connect
npx expo install expo-camera          # For Camera PPG
```

**`package.json` peer dependency notes:**

- `react-native-health` requires `react-native >= 0.60`
- `react-native-health-connect` requires `react-native >= 0.71` for New Architecture support
- Both are incompatible with Expo Go — require `expo-dev-client` builds

---

## Appendix B: Supabase Database Schema (Core Tables)

```sql
-- Fitbit OAuth credentials (encrypt access_token and refresh_token in production)
CREATE TABLE fitbit_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fitbit_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Raw biometric readings (source-agnostic)
CREATE TABLE biometric_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,          -- e.g., 'resting_heart_rate', 'hrv_sdnn'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,               -- e.g., 'bpm', 'ms', 'ml/kg/min'
  source TEXT NOT NULL,             -- 'healthkit', 'health_connect', 'fitbit', 'manual', 'camera_ppg'
  recorded_at TIMESTAMPTZ NOT NULL, -- When the measurement was taken
  synced_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB,                   -- Source-specific extra fields
  UNIQUE(user_id, data_type, source, recorded_at)
);

-- Sleep sessions
CREATE TABLE sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_sleep_minutes INTEGER,
  rem_minutes INTEGER,
  deep_minutes INTEGER,
  light_minutes INTEGER,
  awake_minutes INTEGER,
  sleep_efficiency NUMERIC,
  metadata JSONB,
  UNIQUE(user_id, source, start_time)
);

-- Sync metadata
CREATE TABLE sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,             -- 'healthkit', 'health_connect', 'fitbit'
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT,            -- 'success', 'error', 'partial'
  error_message TEXT,
  UNIQUE(user_id, source)
);
```

---

*End of Document — Device Integration Research v1.0*
*Champions Longevity Dashboard / Longitivity Project*
*Generated: 2026-05-22*
