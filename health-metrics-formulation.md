# Health Metrics Formulation
## Longitivity / Champions Longevity Dashboard
### React Native + Supabase — Scoring Engine Specification

---

> **Document Status:** Draft — requires Chief Physician sign-off before production release  
> **Last Updated:** 2026-05-22  
> **Audience:** Engineering, Clinical Advisory, Product  

---

## Table of Contents

1. [Overview and Scoring Philosophy](#1-overview-and-scoring-philosophy)
2. [Cardiovascular Health (0–100)](#2-cardiovascular-health-0100)
3. [Metabolic Fitness (0–100)](#3-metabolic-fitness-0100)
4. [Sleep Architecture (0–100)](#4-sleep-architecture-0100)
5. [Recovery Capacity (0–100)](#5-recovery-capacity-0100)
6. [Cognitive Performance (0–100)](#6-cognitive-performance-0100)
7. [Longevity Index (0–100)](#7-longevity-index-0100)
8. [Master Data Source Mapping Table](#8-master-data-source-mapping-table)
9. [Age-Bracket Reference Table](#9-age-bracket-reference-table)
10. [Implementation Notes](#10-implementation-notes)
11. [Scoring Disclaimer](#11-scoring-disclaimer)
12. [References](#12-references)

---

## 1. Overview and Scoring Philosophy

The Longitivity scoring engine condenses a user's physiological and behavioral data into six domain scores, each normalized to a 0–100 integer scale. A composite **Longevity Index** is then derived as a weighted average of the six domains.

### Guiding Principles

| Principle | Detail |
|-----------|--------|
| Clinically anchored | Every threshold and weight maps to a peer-reviewed population norm or guideline |
| Transparent | All formulas are deterministic and auditable; no black-box ML in Phase 1 |
| Graceful degradation | Missing inputs lower confidence but do not zero a score; partial scores are computed from available sub-scores renormalized to 100 |
| Motivational framing | Scores trend toward improvement; a user who improves any sub-dimension sees movement within 24–48 h |
| Not diagnostic | All scores are wellness indicators; clinical decisions require physician interpretation |

### Phase Definitions

- **Phase 1 (MVP — Phone-Native):** Data sourced exclusively from Apple HealthKit, Google Health Connect, or manual user entry. No external hardware required.
- **Phase 2 (Wearable / CGM / Facility):** Adds continuous glucose monitors, chest-strap or wrist HRV monitors, Fitbit / Oura / Garmin integrations, and clinic-administered cognitive battery (COGBAT).

### General Piecewise Scaling Convention

Unless stated otherwise, each raw metric `x` is mapped to a sub-score `s ∈ [0, 100]` using a piecewise linear function of the form:

```
s(x) = clamp( 100 × (x − x_floor) / (x_optimal − x_floor), 0, 100 )   if x ≤ x_optimal
s(x) = clamp( 100 × (x_ceiling − x) / (x_ceiling − x_optimal), 0, 100 ) if x > x_optimal
```

Where:
- `x_floor` = value at which score = 0 (worst physiologically meaningful value)
- `x_optimal` = target value corresponding to score = 100
- `x_ceiling` = upper bound beyond which score = 0 again (for metrics with a U-shaped optimum)

All sub-scores are clamped to [0, 100] before weighting.

---

## 2. Cardiovascular Health (0–100)

### 2.1 Description and Clinical Rationale

Cardiovascular health is the single strongest predictor of all-cause mortality in longitudinal cohort studies. This domain captures four complementary dimensions: resting autonomic tone (RHR), heart rate variability as a proxy for parasympathetic nervous system function (HRV/SDNN), cardiorespiratory fitness (VO2 Max), and systemic arterial load (Blood Pressure). Together they represent both structural cardiac capacity and moment-to-moment autonomic regulation.

VO2 Max is age- and sex-adjusted because absolute milliliter values are not comparable across demographic groups; the Cooper Institute percentile table provides population-normed reference ranges. Blood Pressure thresholds follow the 2017 AHA/ACC Hypertension Guideline, which reclassified stage thresholds downward to reflect evidence of organ damage beginning below the prior 140/90 mmHg cutoff.

### 2.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| Resting Heart Rate | 25% | `HKQuantityTypeIdentifierHeartRate` (HealthKit resting sample) / `HeartRate` (Health Connect) / Manual |
| HRV — SDNN | 35% | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` / `HeartRateVariability` (Health Connect) / Chest strap |
| VO2 Max (age-sex adjusted) | 25% | `HKQuantityTypeIdentifierVO2Max` / Estimated (Health Connect) / Manual lab value |
| Blood Pressure | 15% | `HKCorrelationTypeIdentifierBloodPressure` (systolic + diastolic) / Manual / Fitbit Sense |

### 2.3 Raw Data Inputs

```
rhr_bpm          : float   — resting heart rate in beats per minute (overnight or 5-min supine)
sdnn_ms          : float   — SDNN in milliseconds (24-h or overnight window)
vo2max_ml_kg_min : float   — VO2 Max in mL/kg/min
sbp_mmhg         : integer — systolic blood pressure in mmHg
dbp_mmhg         : integer — diastolic blood pressure in mmHg
user_age         : integer — years
user_sex         : enum    — "male" | "female"
```

**Phase 1 availability:** RHR and HRV available from any modern iPhone (watchOS or HealthKit background samples). VO2 Max estimated by Apple Watch or manual entry. Blood Pressure manual entry only.

**Phase 2 additions:** SDNN from Polar H10 / Garmin HRV4Training; VO2 Max from VO2 Max lab test; ambulatory BP monitor integration.

### 2.4 Piecewise Scaling Formulas

#### 2.4.1 Resting Heart Rate Sub-Score (`s_rhr`)

Optimal resting heart rate for longevity is 50–60 bpm in non-athletes; below 40 signals bradycardia risk.

```
x = rhr_bpm

if x < 40:
    s_rhr = max(0, 100 × (x − 30) / (40 − 30))   # bradycardia penalty, linear from 30→40 bpm
elif 40 ≤ x ≤ 60:
    s_rhr = 100                                     # optimal zone
elif 60 < x ≤ 100:
    s_rhr = 100 × (100 − x) / (100 − 60)          # linear decline to 0 at 100 bpm
else:  # x > 100
    s_rhr = 0
```

#### 2.4.2 HRV / SDNN Sub-Score (`s_hrv`)

SDNN reference values are sex-agnostic but age-dependent. Use age-group lookup (Section 9) to obtain `sdnn_target` and `sdnn_floor`.

```
x        = sdnn_ms
x_opt    = sdnn_target[age_group]   # see Table 9.2
x_floor  = sdnn_floor[age_group]    # see Table 9.2

s_hrv = clamp(100 × (x − x_floor) / (x_opt − x_floor), 0, 100)
# HRV is monotonically beneficial within physiological range; no ceiling penalty applied
```

#### 2.4.3 VO2 Max Sub-Score (`s_vo2`) — Age/Sex Adjusted

Retrieve percentile from the Kaminsky/ACSM lookup table (reproduced in Section 9) for the user's age-sex group. Convert percentile to sub-score directly.

```
percentile = VO2MaxPercentile(vo2max_ml_kg_min, user_age, user_sex)  # Table 9.3
s_vo2 = percentile  # percentile is already 0–100
```

#### 2.4.4 Blood Pressure Sub-Score (`s_bp`)

Uses the 2017 AHA/ACC classification with a piecewise score mapped to the five categories.

```
# Determine AHA 2017 category from sbp and dbp (whichever drives the higher stage)
category = AHA2017Category(sbp_mmhg, dbp_mmhg)

AHA 2017 category thresholds (systolic / diastolic):
  Normal         : sbp < 120  AND dbp < 80
  Elevated       : sbp 120–129 AND dbp < 80
  Stage 1 HTN   : sbp 130–139 OR  dbp 80–89
  Stage 2 HTN   : sbp ≥ 140  OR  dbp ≥ 90
  Crisis         : sbp > 180  OR  dbp > 120

s_bp score mapping:
  Normal         → 100
  Elevated       →  75
  Stage 1 HTN   →  45
  Stage 2 HTN   →  15
  Crisis         →   0
```

### 2.5 Composite Cardiovascular Score

```
CV_score = round(
    0.25 × s_rhr  +
    0.35 × s_hrv  +
    0.25 × s_vo2  +
    0.15 × s_bp
)
```

**Partial score rule:** If any sub-score is unavailable, re-weight remaining sub-scores proportionally:

```
available_weight = sum of weights for available sub-scores
CV_score = round( sum(w_i × s_i for available i) / available_weight × 100 / 100 )
```

### 2.6 Age/Sex Adjustment Rules

- `s_vo2` is fully adjusted via the percentile table (Section 9.3); no additional adjustment needed.
- `s_hrv` uses age-group SDNN targets (Section 9.2); no sex adjustment (population norms are combined-sex for SDNN).
- `s_rhr` and `s_bp` are not age-adjusted; clinical thresholds are population-wide.

### 2.7 References

1. Kaminsky, L.A., Arena, R., Beckie, T.M., et al. (2013). The importance of cardiorespiratory fitness in the United States: the need for a national registry. *Circulation*, 127(5), 652–662. (Normative VO2 Max tables updated in Kaminsky et al., 2015, *Mayo Clinic Proceedings*.)
2. Shaffer, F., & Ginsberg, J.P. (2017). An overview of heart rate variability metrics and norms. *Frontiers in Public Health*, 5, 258.
3. Whelton, P.K., Carey, R.M., Aronow, W.S., et al. (2018). 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. *Journal of the American College of Cardiology*, 71(19), e127–e248.

---

## 3. Metabolic Fitness (0–100)

### 3.1 Description and Clinical Rationale

Metabolic fitness reflects how efficiently the body generates, stores, and utilizes energy. Poor metabolic fitness — characterized by excess adiposity, physical inactivity, and dysglycemia — is the root driver of type 2 diabetes, non-alcoholic fatty liver disease, and cardiovascular disease. This domain captures three complementary angles: habitual physical activity intensity (Activity Consistency), body composition as a surrogate for visceral adiposity (Body Composition), and glycemic regulation (Glucose Health).

Body fat thresholds use sex-specific cutoffs. BMI thresholds additionally apply the South Asian / East Asian correction (−2.5 kg/m² per WHO 2004 Expert Consultation) because standard WHO BMI thresholds underestimate cardiometabolic risk in these populations.

### 3.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| Activity Consistency | 40% | `HKQuantityTypeIdentifierActiveEnergyBurned` + `HKQuantityTypeIdentifierBasalEnergyBurned` / `ActiveCaloriesBurned` + `BasalMetabolicRate` (Health Connect) |
| Body Composition | 40% | `HKQuantityTypeIdentifierBodyFatPercentage` + `HKQuantityTypeIdentifierBodyMassIndex` / Manual / DEXA (Phase 2) |
| Glucose Health | 20% | `HKQuantityTypeIdentifierBloodGlucose` (manual HbA1c) / CGM Time-in-Range (Phase 2) |

### 3.3 Raw Data Inputs

```
active_kcal_day  : float   — active (exercise) calories burned in past 7-day average
bmr_kcal_day     : float   — basal metabolic rate (estimated via Mifflin-St Jeor if not measured)
body_fat_pct     : float   — body fat percentage (0–60)
bmi              : float   — body mass index (kg/m²)
user_ethnicity   : enum    — "south_asian" | "east_asian" | "other"  (for BMI correction)
hba1c_pct        : float   — HbA1c percentage (Phase 1; optional)
tir_pct          : float   — CGM Time-in-Range 70–180 mg/dL, % of day (Phase 2; optional)
user_sex         : enum    — "male" | "female"
```

**Phase 1 availability:** Active calories and BMR from HealthKit/Health Connect. Body fat from smart scales synced via HealthKit, or manual entry. BMI calculated from height/weight (manual). HbA1c manual entry (lab result).

**Phase 2 additions:** CGM TIR from Dexterity/Libre/Dexcom integration. DEXA body composition from clinic visit.

### 3.4 Piecewise Scaling Formulas

#### 3.4.1 Activity Consistency Sub-Score (`s_activity`)

The ratio of active calories to BMR captures relative exercise intensity independent of body size. A ratio of 0.3 or higher (active calories ≥ 30% of BMR) is associated with metabolic benefit. Target is 0.5 (moderate-high activity).

```
ratio = active_kcal_day / bmr_kcal_day

if ratio ≥ 0.5:
    s_activity = 100
elif 0 ≤ ratio < 0.5:
    s_activity = 100 × ratio / 0.5
else:
    s_activity = 0
```

Use 7-day rolling average of `active_kcal_day` to smooth single-day noise.

#### 3.4.2 Body Composition Sub-Score (`s_body`)

Compute two sub-components and average them:

**Component A — Body Fat Percentage (`s_bf`):**

```
# Sex-specific optimal and floor values
if user_sex == "male":
    bf_optimal = 15.0   # %
    bf_floor   = 30.0   # % (obese threshold)
    bf_low     = 5.0    # % (essential fat minimum)
else:  # female
    bf_optimal = 22.0
    bf_floor   = 38.0
    bf_low     = 12.0

x = body_fat_pct

if x < bf_low:
    s_bf = max(0, 100 × (x − bf_low + 5) / 5)   # penalty for dangerously low body fat
elif bf_low ≤ x ≤ bf_optimal:
    s_bf = 100
elif bf_optimal < x ≤ bf_floor:
    s_bf = 100 × (bf_floor − x) / (bf_floor − bf_optimal)
else:  # x > bf_floor
    s_bf = 0
```

**Component B — BMI (`s_bmi`) with South/East Asian correction:**

```
# Apply ethnicity correction
if user_ethnicity in ("south_asian", "east_asian"):
    bmi_adj = bmi - 2.5   # shift thresholds down by 2.5 kg/m²
    bmi_optimal_upper = 20.5   # equivalent to 23.0 standard
    bmi_optimal_lower = 16.0
    bmi_obese = 25.0           # equivalent to 27.5 standard
else:
    bmi_adj = bmi
    bmi_optimal_upper = 23.0
    bmi_optimal_lower = 18.5
    bmi_obese = 30.0

x = bmi_adj

if x < bmi_optimal_lower:
    s_bmi = max(0, 100 × (x − (bmi_optimal_lower − 5)) / 5)
elif bmi_optimal_lower ≤ x ≤ bmi_optimal_upper:
    s_bmi = 100
elif bmi_optimal_upper < x ≤ bmi_obese:
    s_bmi = 100 × (bmi_obese − x) / (bmi_obese − bmi_optimal_upper)
else:
    s_bmi = 0
```

**Body Composition composite:**

```
# If both available:
s_body = 0.6 × s_bf + 0.4 × s_bmi

# If only BMI available (no body fat device):
s_body = s_bmi

# If only body fat available:
s_body = s_bf
```

#### 3.4.3 Glucose Health Sub-Score (`s_glucose`)

**Phase 1 — HbA1c:**

```
x = hba1c_pct

if x ≤ 5.0:    s_glucose = 100
elif x ≤ 5.7:  s_glucose = 100 × (5.7 − x) / (5.7 − 5.0) + 70 × (x − 5.0) / 0.7
    # simplify: linear from 100 at 5.0 to 70 at 5.7
elif x ≤ 6.5:  s_glucose = 70 × (6.5 − x) / (6.5 − 5.7)    # linear 70→0 in pre-diabetic range
else:           s_glucose = 0
```

Cleaner piecewise form:
```
x = hba1c_pct
if   x ≤ 5.0:  s_glucose = 100
elif x ≤ 5.7:  s_glucose = round(100 − 42.86 × (x − 5.0))   # slope: (100-70)/0.7 ≈ 42.86
elif x ≤ 6.5:  s_glucose = round(70 − 87.50 × (x − 5.7))    # slope: 70/0.8 = 87.5
else:           s_glucose = 0
```

**Phase 2 — CGM Time-in-Range (TIR, 70–180 mg/dL):**

Per the International Consensus on CGM (Danne et al. 2019), TIR > 70% is the clinical target for people without diabetes.

```
x = tir_pct  # 0–100

if x ≥ 85:   s_glucose = 100
elif x ≥ 70: s_glucose = round(100 × (x − 70) / (85 − 70) × 0.5 + 50)
              # linear from 50 at 70% TIR to 100 at 85% TIR
else:         s_glucose = round(50 × x / 70)
              # linear from 0 to 50 below the target
```

**Phase selection:** Use TIR if CGM data covers ≥ 70% of the past 14 days; otherwise fall back to HbA1c.

### 3.5 Composite Metabolic Score

```
Metabolic_score = round(
    0.40 × s_activity  +
    0.40 × s_body      +
    0.20 × s_glucose
)
```

Apply proportional re-weighting if any sub-score is unavailable.

### 3.6 Age/Sex Adjustment Rules

- Body fat percentage thresholds are sex-specific (Section 3.4.2).
- BMI thresholds apply South/East Asian ethnicity correction.
- No age adjustment applied to activity or glucose; clinical targets are age-invariant for adults.

### 3.7 References

1. World Health Organization. (2000). *Obesity: Preventing and Managing the Global Epidemic.* WHO Technical Report Series 894. Geneva: WHO.
2. Danne, T., Nimri, R., Battelino, T., et al. (2017). International Consensus on Use of Continuous Glucose Monitoring. *Diabetes Care*, 40(12), 1631–1640. (TIR consensus targets from Battelino et al., 2019.)
3. Desprès, J.P., & Lemieux, I. (2006). Abdominal obesity and metabolic syndrome. *Nature*, 444(7121), 881–887. (Desprès 2008 review on visceral adiposity and cardiometabolic risk also cited.)

---

## 4. Sleep Architecture (0–100)

### 4.1 Description and Clinical Rationale

Sleep is the primary biological process for memory consolidation, immune function, hormonal regulation (growth hormone, cortisol), and metabolic restoration. Insufficient or fragmented sleep is a causal risk factor for cardiovascular disease, type 2 diabetes, and cognitive decline. This domain captures four dimensions: total sleep duration (quantity), stage distribution (quality), chronobiological consistency (timing regularity), and ease of sleep initiation (latency).

The National Sleep Foundation's 2015 consensus (Hirshkowitz et al.) provides the definitive adult duration targets. Stage distribution targets are drawn from polysomnographic normative data; adults should obtain ≥ 20% REM and ≥ 20% deep (slow-wave) sleep. Chronotype regularity is quantified via the standard deviation of the sleep midpoint across 7 nights, following Roenneberg's social jetlag methodology.

### 4.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| Sleep Duration | 35% | `HKCategoryTypeIdentifierSleepAnalysis` / `SleepSession` (Health Connect) / Fitbit Sleep |
| Stage Distribution | 30% | `HKCategoryTypeIdentifierSleepAnalysis` (sleep stages) / Fitbit Premium / Oura Ring |
| Sleep Timing Consistency | 20% | Derived from sleep midpoint across 7 nights |
| Sleep Latency | 15% | `HKCategoryTypeIdentifierSleepAnalysis` (in-bed minus asleep time) / Manual |

### 4.3 Raw Data Inputs

```
sleep_duration_h       : float   — total sleep time last night in hours
rem_pct                : float   — % of total sleep spent in REM (0–60)
deep_pct               : float   — % of total sleep spent in deep/SWS (0–60)
sleep_midpoint_times   : list    — array of 7 sleep midpoint timestamps (datetime)
sleep_latency_min      : float   — minutes from lights-out to sleep onset
user_age               : integer — years
```

**Phase 1 availability:** Duration and basic sleep/wake from HealthKit on iPhone (using phone motion/sensors). Sleep stages require Apple Watch Series 4+ (watchOS 9+) or a Fitbit device synced to HealthKit. Sleep midpoint computed from start/end timestamps. Latency: manual entry or wearable.

**Phase 2 additions:** Oura Ring provides stage-level polysomnographic-validated data; actigraphy-calibrated latency.

### 4.4 Piecewise Scaling Formulas

#### 4.4.1 Sleep Duration Sub-Score (`s_duration`)

Based on NSF 2015 age-appropriate targets. For adults 18–64: recommended 7–9 h; for 65+: 7–8 h.

```
# Select targets by age
if user_age >= 65:
    dur_optimal_low  = 7.0
    dur_optimal_high = 8.0
    dur_floor_low    = 5.0    # score = 0 below this
    dur_floor_high   = 10.0   # score = 0 above this
else:  # 18–64
    dur_optimal_low  = 7.0
    dur_optimal_high = 9.0
    dur_floor_low    = 5.0
    dur_floor_high   = 11.0

x = sleep_duration_h

if dur_optimal_low ≤ x ≤ dur_optimal_high:
    s_duration = 100
elif x < dur_optimal_low:
    s_duration = clamp(100 × (x − dur_floor_low) / (dur_optimal_low − dur_floor_low), 0, 100)
else:  # x > dur_optimal_high (oversleeping)
    s_duration = clamp(100 × (dur_floor_high − x) / (dur_floor_high − dur_optimal_high), 0, 100)
```

#### 4.4.2 Stage Distribution Sub-Score (`s_stages`)

Both REM and deep sleep must meet thresholds independently; the sub-score is the average of two components:

```
# REM component
if rem_pct ≥ 20:
    s_rem = 100
elif rem_pct ≥ 10:
    s_rem = 100 × (rem_pct − 10) / (20 − 10)
else:
    s_rem = 0

# Deep sleep component
if deep_pct ≥ 20:
    s_deep = 100
elif deep_pct ≥ 8:
    s_deep = 100 × (deep_pct − 8) / (20 − 8)
else:
    s_deep = 0

s_stages = 0.5 × s_rem + 0.5 × s_deep
```

**Phase 1 fallback:** If stage data unavailable, `s_stages` is excluded and remaining weights are renormalized.

#### 4.4.3 Sleep Timing Consistency Sub-Score (`s_timing`)

Standard deviation of sleep midpoint (in decimal hours) across the past 7 nights. Lower SD = more consistent circadian rhythm.

```
midpoints_h = [timestamp_to_decimal_hour(t) for t in sleep_midpoint_times]
# Handle midnight wraparound: adjust values crossing midnight by ±24
sd_midpoint = standard_deviation(midpoints_h)   # in hours

# Scoring: SD < 0.5 h = excellent; SD > 2.5 h = poor
if sd_midpoint ≤ 0.5:
    s_timing = 100
elif sd_midpoint ≤ 2.5:
    s_timing = 100 × (2.5 − sd_midpoint) / (2.5 − 0.5)
else:
    s_timing = 0
```

Requires at least 4 of 7 nights of data; if fewer available, exclude this sub-score.

#### 4.4.4 Sleep Latency Sub-Score (`s_latency`)

```
x = sleep_latency_min

if x ≤ 20:
    s_latency = 100
elif x ≤ 60:
    s_latency = 100 × (60 − x) / (60 − 20)
else:
    s_latency = 0

# Very short latency (<5 min) may indicate sleep debt — apply mild penalty
if x < 5:
    s_latency = 80
```

### 4.5 Composite Sleep Score

```
Sleep_score = round(
    0.35 × s_duration  +
    0.30 × s_stages    +
    0.20 × s_timing    +
    0.15 × s_latency
)
```

Apply proportional re-weighting for unavailable sub-scores (most commonly `s_stages`).

### 4.6 Age/Sex Adjustment Rules

- Duration optimal range is narrowed by 1 hour for users aged 65+ (Section 4.4.1).
- Deep sleep percentage naturally decreases with age; in Phase 2, an age-adjusted deep sleep floor may replace the static 8% floor using data from Hirshkowitz et al. normative tables.
- No sex adjustment for duration; mild sex differences in deep sleep are not large enough to warrant separate cutoffs at this stage.

### 4.7 References

1. Hirshkowitz, M., Whiton, K., Albert, S.M., et al. (2015). National Sleep Foundation's sleep time duration recommendations: methodology and results summary. *Sleep Health*, 1(1), 40–43.
2. Walker, M.P. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams.* Scribner. (Clinical references therein for stage-function relationships.)
3. Roenneberg, T., Allebrandt, K.V., Merrow, M., & Vetter, C. (2012). Social jetlag and obesity. *Current Biology*, 22(10), 939–943.

---

## 5. Recovery Capacity (0–100)

### 5.1 Description and Clinical Rationale

Recovery capacity quantifies the body's readiness to adapt to future physiological stress. Insufficient recovery is a key mechanism linking overtraining, chronic stress, and sleep deprivation to immune suppression, injury risk, and accelerated biological aging. This domain uses trending HRV and resting HR (relative to the individual's own baseline, not population norms) to capture day-to-day autonomic recovery, combined with sleep quality and exercise-load balance.

The critical methodological choice here is individual-relative trending: a day's HRV is evaluated against that user's own 7-day rolling baseline rather than against population means. This makes the score robust across fitness levels and age groups, and is consistent with elite-sport HRV monitoring best practices (Plews et al. 2013).

### 5.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| HRV Trend (vs 7-day baseline) | 35% | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` / Health Connect / Wearable |
| Resting HR Trend (vs 7-day baseline) | 35% | `HKQuantityTypeIdentifierHeartRate` (resting) / Health Connect |
| Sleep Quality (from §4) | 15% | Sleep Architecture score (Section 4) |
| Activity Load vs Rest Ratio | 15% | `HKQuantityTypeIdentifierActiveEnergyBurned` / Health Connect |

### 5.3 Raw Data Inputs

```
hrv_today_ms        : float   — today's morning SDNN in ms
hrv_baseline_7d_ms  : float   — rolling 7-day mean SDNN in ms
rhr_today_bpm       : float   — today's resting HR in bpm
rhr_baseline_7d_bpm : float   — rolling 7-day mean resting HR in bpm
sleep_score         : float   — Section 4 Sleep Architecture score (0–100)
active_kcal_today   : float   — active calories burned today
active_kcal_7d_avg  : float   — 7-day rolling average active calories
```

**Phase 1 availability:** HRV and RHR from Apple Watch via HealthKit morning samples. Sleep score from Section 4. Active calories from HealthKit.

**Phase 2 additions:** HRV from overnight Polar H10 or Oura chest measurement (more reliable SDNN); real-time strain score from Garmin/WHOOP-equivalent calculation.

### 5.4 Piecewise Scaling Formulas

#### 5.4.1 HRV Trend Sub-Score (`s_hrv_trend`)

```
delta_hrv = (hrv_today_ms − hrv_baseline_7d_ms) / hrv_baseline_7d_ms × 100  # % change

# Scoring: +10% above baseline = full score; −20% below = zero
if delta_hrv ≥ 10:
    s_hrv_trend = 100
elif delta_hrv ≥ −20:
    s_hrv_trend = 100 × (delta_hrv + 20) / (10 + 20)   # linear from 0 at -20% to 100 at +10%
else:
    s_hrv_trend = 0
```

#### 5.4.2 Resting HR Trend Sub-Score (`s_rhr_trend`)

Note: for RHR, a decrease is favorable (inverted delta).

```
delta_rhr = (rhr_today_bpm − rhr_baseline_7d_bpm) / rhr_baseline_7d_bpm × 100  # % change

# Favorable: RHR drops (negative delta). Elevated RHR = poor recovery.
# +5% rise = onset of concern; +15% rise = poor recovery
if delta_rhr ≤ 0:
    s_rhr_trend = 100   # RHR at or below baseline — full recovery
elif delta_rhr ≤ 15:
    s_rhr_trend = 100 × (15 − delta_rhr) / 15
else:
    s_rhr_trend = 0
```

#### 5.4.3 Sleep Quality Component (`s_sleep_recovery`)

```
s_sleep_recovery = sleep_score   # directly from Section 4 composite
```

#### 5.4.4 Activity Load vs Rest Ratio (`s_load_balance`)

```
load_ratio = active_kcal_today / max(active_kcal_7d_avg, 1)

# Optimal: load_ratio 0.7–1.3 (moderate variation from baseline = healthy periodization)
# High ratio (>2.0) = potential overtraining on recovery day
if 0.7 ≤ load_ratio ≤ 1.3:
    s_load_balance = 100
elif load_ratio < 0.7:
    # Active rest / deload day: still positive, just lower
    s_load_balance = 100 × load_ratio / 0.7
elif 1.3 < load_ratio ≤ 2.0:
    s_load_balance = 100 × (2.0 − load_ratio) / (2.0 − 1.3)
else:  # load_ratio > 2.0
    s_load_balance = 0
```

### 5.5 Composite Recovery Score

```
Recovery_score = round(
    0.35 × s_hrv_trend      +
    0.35 × s_rhr_trend      +
    0.15 × s_sleep_recovery +
    0.15 × s_load_balance
)
```

**Baseline bootstrapping:** For new users with fewer than 7 days of data, use available days (minimum 3) to compute baseline. Below 3 days, exclude the trend sub-scores and use only sleep and load components, renormalized.

### 5.6 Age/Sex Adjustment Rules

- No age or sex adjustment: trend scores are individual-relative and therefore self-normalizing.
- In Phase 2, if a physician-established HRV baseline is provided (e.g., from a clinical assessment), that value overrides the app-computed 7-day rolling baseline.

### 5.7 References

1. Plews, D.J., Laursen, P.B., Stanley, J., Kilding, A.E., & Buchheit, M. (2013). Training adaptation and heart rate variability in elite endurance athletes: Opening the door to effective monitoring. *Sports Medicine*, 43(9), 773–781.
2. Buchheit, M. (2014). Monitoring training status with HR measures: Do all roads lead to Rome? *Frontiers in Physiology*, 5, 73.
3. Kellmann, M., Bertollo, M., Bosquet, L., et al. (2018). Recovery and performance in sport: Consensus statement. *International Journal of Sports Physiology and Performance*, 13(2), 240–245.

---

## 6. Cognitive Performance (0–100)

### 6.1 Description and Clinical Rationale

Cognitive function is both an output of overall health (sleep, cardiovascular fitness, and metabolic health all drive cognition) and an independent dimension of longevity quality. Cognitive decline precedes Alzheimer's and vascular dementia diagnoses by 10–20 years. Tracking subjective cognitive function longitudinally provides an early-warning signal and a motivational feedback loop.

Phase 1 relies on validated self-report constructs (analogous to the Perceived Stress Scale and WHO-5 Wellbeing Index question structure) because objective neuropsychological tests require controlled administration conditions. Phase 2 integrates the COGBAT (Cognitive Battery) facility scores, which include validated measures of processing speed, working memory, and executive function.

The sleep and HRV bonus scores operationalize the well-documented mediating effect of sleep quality and autonomic balance on next-day cognitive performance (Harrison & Horne 2000; Lambourne & Tomporowski 2010).

### 6.2 Phase 1 — Morning Self-Report Score

#### 6.2.1 5-Question Self-Report

Each question is answered on a 1–5 Likert scale (1 = very poor, 5 = excellent) and normalized to 0–20 points.

| Question | Domain | Scoring Direction |
|----------|--------|-------------------|
| Q1: How well can you focus right now? | Focus | Direct (5 → 20 pts) |
| Q2: How would you rate your mental energy? | Mental Energy | Direct |
| Q3: How is your mood overall? | Mood | Direct |
| Q4: How sharp does your memory feel? | Memory Clarity | Direct |
| Q5: How stressed do you feel? | Stress | Inverted (1 → 20 pts, 5 → 0 pts) |

```
# Normalize each response to 0–20
normalize_direct(r)   = (r − 1) / 4 × 20     # r ∈ {1,2,3,4,5}
normalize_inverted(r) = (5 − r) / 4 × 20     # r ∈ {1,2,3,4,5}

q1_pts = normalize_direct(Q1_response)
q2_pts = normalize_direct(Q2_response)
q3_pts = normalize_direct(Q3_response)
q4_pts = normalize_direct(Q4_response)
q5_pts = normalize_inverted(Q5_response)

self_report_raw = q1_pts + q2_pts + q3_pts + q4_pts + q5_pts  # 0–100
```

#### 6.2.2 Bonus Adjustments

```
sleep_bonus = 10 if sleep_score > 80 else 0
hrv_bonus   = 5  if hrv_today_ms > hrv_baseline_7d_ms else 0

Cognitive_score_p1 = clamp(self_report_raw + sleep_bonus + hrv_bonus, 0, 100)
```

### 6.3 Phase 2 — COGBAT Integration

When a facility COGBAT assessment has been completed within the past 90 days, blend the objective and subjective scores:

```
cogbat_normalized = COGBAT_percentile_score   # 0–100, provided by COGBAT facility API

Cognitive_score_p2 = clamp(
    0.70 × cogbat_normalized  +
    0.30 × self_report_raw,
    0, 100
)
```

**Phase selection logic:**
- If COGBAT assessment age ≤ 90 days: use Phase 2 formula.
- If COGBAT assessment age > 90 days or not available: use Phase 1 formula.
- COGBAT score decays linearly: at 90 days its weight drops to 40%; beyond 90 days it is excluded.

```
# COGBAT weight decay
days_since_cogbat = (today − cogbat_date).days
if days_since_cogbat ≤ 30:
    w_cogbat = 0.70
elif days_since_cogbat ≤ 90:
    w_cogbat = 0.70 − 0.30 × (days_since_cogbat − 30) / 60   # decays from 0.70 to 0.40
else:
    w_cogbat = 0.0   # exclude COGBAT, use Phase 1 only

w_self = 1.0 − w_cogbat
Cognitive_score = clamp(w_cogbat × cogbat_normalized + w_self × self_report_raw + sleep_bonus + hrv_bonus, 0, 100)
```

### 6.4 Age/Sex Adjustment Rules

- COGBAT percentile scores are already age- and sex-normed by the COGBAT facility; no further adjustment needed.
- Self-report scores are not age-adjusted; subjective cognitive perception is not systematically biased by age in a way that warrants algorithmic correction.

### 6.5 References

1. Harrison, Y., & Horne, J.A. (2000). The impact of sleep deprivation on decision making: A review. *Journal of Experimental Psychology: Applied*, 6(3), 236–249.
2. Lambourne, K., & Tomporowski, P. (2010). The effect of exercise-induced arousal on cognitive task performance: A meta-regression analysis. *Brain Research*, 1341, 12–24.
3. Hillman, C.H., Erickson, K.I., & Kramer, A.F. (2008). Be smart, exercise your heart: Exercise effects on brain and cognition. *Nature Reviews Neuroscience*, 9(1), 58–65.

---

## 7. Longevity Index (0–100)

### 7.1 Description and Clinical Rationale

The Longevity Index is a single composite metric designed to communicate overall healthspan trajectory in a format that is immediately intuitive to users and clinicians alike. It weights the six domain scores according to their relative contributions to all-cause mortality and functional independence in older age, drawing on epidemiological evidence from the MacArthur Study of Successful Aging and the Hallmarks of Aging framework (López-Otín et al. 2013).

Cardiovascular health receives the highest single weight because cardiorespiratory fitness and autonomic function are the most robust predictors of all-cause mortality across all adult age groups (Crimmins 2015). Sleep and Cognitive weights reflect emerging evidence that these domains mediate amyloid clearance and neurodegeneration risk (Ferrucci & Fabbri 2018).

> **IMPORTANT:** The weights below have been proposed by the engineering and clinical advisory team. They require **formal sign-off from the Chief Physician** before being used in any production release or user-facing display.

### 7.2 Domain Weights

| Domain | Weight | Clinical Rationale |
|--------|--------|-------------------|
| Cardiovascular Health | 25% | Strongest single predictor of all-cause mortality |
| Metabolic Fitness | 22% | Visceral adiposity and dysglycemia drive cardiometabolic disease cascade |
| Sleep Architecture | 18% | Mediates amyloid clearance, hormonal regulation, immune function |
| Recovery Capacity | 17% | Proxy for allostatic load and physiological resilience |
| Cognitive Performance | 18% | Early marker of neurodegeneration; quality-of-life dimension |
| **Total** | **100%** | |

### 7.3 Composite Formula

```
Longevity_Index = round(
    0.25 × CV_score         +
    0.22 × Metabolic_score  +
    0.18 × Sleep_score      +
    0.17 × Recovery_score   +
    0.18 × Cognitive_score
)
```

**Partial score rule:** If any domain score is unavailable (e.g., no glucose data in Metabolic), that domain's sub-score is excluded and remaining weights are renormalized:

```
available_domains = [d for d in domains if d.score is not None]
total_weight = sum(d.weight for d in available_domains)
Longevity_Index = round(
    sum(d.weight × d.score for d in available_domains) / total_weight
)
```

### 7.4 Trajectory Scoring

In addition to the point-in-time score, a **trajectory delta** is computed and displayed:

```
delta_30d  = Longevity_Index_today − Longevity_Index_30_days_ago
delta_60d  = Longevity_Index_today − Longevity_Index_60_days_ago
delta_90d  = Longevity_Index_today − Longevity_Index_90_days_ago
```

**Display rules:**

| Delta | Trend Label | Color |
|-------|-------------|-------|
| ≥ +5 | Improving | Green |
| −4 to +4 | Stable | Amber |
| ≤ −5 | Declining | Red |

Historical scores are stored daily in Supabase (`longevity_scores` table) and retrieved via indexed queries on `(user_id, score_date)`.

### 7.5 Age/Sex Adjustment Rules

The Longevity Index itself is not age-adjusted — age effects are handled within individual domain scores (e.g., VO2 Max percentile, sleep duration thresholds). This means a 70-year-old and a 30-year-old can both achieve a score of 100 if each is optimally performing relative to their own age-appropriate norms.

### 7.6 References

1. Crimmins, E.M. (2015). Lifespan and healthspan: Past, present, and promise. *The Gerontologist*, 55(6), 901–911.
2. López-Otín, C., Blasco, M.A., Partridge, L., Serrano, M., & Kroemer, G. (2013). The hallmarks of aging. *Cell*, 153(6), 1194–1217.
3. Ferrucci, L., & Fabbri, E. (2018). Inflammageing: Chronic inflammation in ageing, cardiovascular disease, and frailty. *Nature Reviews Cardiology*, 15(9), 505–522.

---

## 8. Master Data Source Mapping Table

The table below maps every data input used across all six scoring domains to its source identifier for each supported platform.

| Metric | Apple HealthKit Identifier | Google Health Connect Type | Fitbit API Field | Manual Entry | Phase |
|--------|---------------------------|---------------------------|-----------------|--------------|-------|
| Resting Heart Rate | `HKQuantityTypeIdentifierHeartRate` (resting context) | `HeartRate` | `heart-rate/activities-heart` | Yes | 1 |
| HRV — SDNN | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | `HeartRateVariability` | Premium: HRV | Chest strap | 1/2 |
| VO2 Max | `HKQuantityTypeIdentifierVO2Max` | `ExerciseSessionRecord` (estimated) | N/A | Yes (lab) | 1/2 |
| Systolic BP | `HKCorrelationTypeIdentifierBloodPressure` → systolic | `BloodPressure` → systolic | N/A (Fitbit Sense BP log) | Yes | 1/2 |
| Diastolic BP | `HKCorrelationTypeIdentifierBloodPressure` → diastolic | `BloodPressure` → diastolic | N/A | Yes | 1/2 |
| Active Calories | `HKQuantityTypeIdentifierActiveEnergyBurned` | `ActiveCaloriesBurned` | `activities/calories` | Yes | 1 |
| Basal Metabolic Rate | `HKQuantityTypeIdentifierBasalEnergyBurned` | `BasalMetabolicRate` | `activities/bmr` | Estimated (Mifflin-St Jeor) | 1 |
| Body Fat % | `HKQuantityTypeIdentifierBodyFatPercentage` | `BodyFat` | `body/fat` | Smart scale / DEXA | 1/2 |
| BMI | `HKQuantityTypeIdentifierBodyMassIndex` | `BodyFat` (derived) | `body/bmi` | Yes | 1 |
| Blood Glucose (HbA1c) | `HKQuantityTypeIdentifierBloodGlucose` | `BloodGlucose` | N/A | Yes (lab) | 1 |
| CGM Time-in-Range | N/A (LibreView / Dexcom SDK) | N/A | N/A | CGM device | 2 |
| Sleep Duration | `HKCategoryTypeIdentifierSleepAnalysis` | `SleepSession` | `sleep/list` | Yes | 1 |
| Sleep Stages (REM/Deep) | `HKCategoryTypeIdentifierSleepAnalysis` (stage values) | `SleepSession` (stages) | `sleep/list` (stages) | Wearable | 1/2 |
| Sleep Latency | `HKCategoryTypeIdentifierSleepAnalysis` (inBed − asleep delta) | `SleepSession` | `sleep/list` → minutesAwake | Manual / Wearable | 1/2 |
| Sleep Midpoint | Derived from sleep start/end timestamps | Derived | Derived | — | 1 |
| Morning Self-Report | N/A | N/A | N/A | In-app 5Q survey | 1 |
| COGBAT Score | N/A | N/A | N/A | Facility API | 2 |
| Ethnicity | N/A | N/A | N/A | User profile | 1 |
| Age | `HKCharacteristicTypeIdentifierDateOfBirth` | `Profile` | `profile` | User profile | 1 |
| Biological Sex | `HKCharacteristicTypeIdentifierBiologicalSex` | `Profile` | `profile` | User profile | 1 |

**Camera PPG (Phase 2):** Resting HR and a proxy HRV signal can be estimated via photoplethysmography using the device camera (index finger or face). Camera PPG feeds the same `rhr_bpm` and `sdnn_ms` fields. Accuracy is lower than wrist PPG; confidence flag is set to `low` when camera PPG is the source, and the sub-score is down-weighted by 15% in the composite.

---

## 9. Age-Bracket Reference Table

### 9.1 Age Group Definitions

Used throughout the scoring engine to select appropriate reference values.

| Group Code | Age Range | Label |
|------------|-----------|-------|
| `AG1` | 20–35 | Young Adult |
| `AG2` | 36–50 | Middle Adult |
| `AG3` | 51–65 | Mature Adult |
| `AG4` | 65+ | Older Adult |

### 9.2 HRV / SDNN Reference Values by Age Group

Source: Shaffer & Ginsberg (2017), Table 2; Nunan et al. (2010) meta-analysis.

| Age Group | SDNN Target (ms) — `sdnn_target` | SDNN Floor (ms) — `sdnn_floor` |
|-----------|----------------------------------|--------------------------------|
| AG1 (20–35) | 65 | 20 |
| AG2 (36–50) | 55 | 18 |
| AG3 (51–65) | 45 | 15 |
| AG4 (65+) | 35 | 12 |

*SDNN naturally declines with age due to reduced parasympathetic tone. Using age-specific targets prevents older adults from being penalized for physiologically normal lower HRV.*

### 9.3 VO2 Max Percentile Reference Table

Source: Kaminsky et al. (2015), ACSM Guidelines for Exercise Testing and Prescription (10th Ed.).

**Males (mL/kg/min → approximate percentile)**

| Percentile | AG1 (20–35) | AG2 (36–50) | AG3 (51–65) | AG4 (65+) |
|------------|------------|------------|------------|----------|
| 95 | ≥ 55 | ≥ 51 | ≥ 45 | ≥ 40 |
| 75 | 46–54 | 42–50 | 36–44 | 32–39 |
| 50 | 40–45 | 36–41 | 30–35 | 26–31 |
| 25 | 34–39 | 30–35 | 24–29 | 20–25 |
| 5 | ≤ 33 | ≤ 29 | ≤ 23 | ≤ 19 |

**Females (mL/kg/min → approximate percentile)**

| Percentile | AG1 (20–35) | AG2 (36–50) | AG3 (51–65) | AG4 (65+) |
|------------|------------|------------|------------|----------|
| 95 | ≥ 48 | ≥ 44 | ≥ 39 | ≥ 34 |
| 75 | 39–47 | 35–43 | 30–38 | 26–33 |
| 50 | 33–38 | 29–34 | 24–29 | 20–25 |
| 25 | 27–32 | 23–28 | 18–23 | 15–19 |
| 5 | ≤ 26 | ≤ 22 | ≤ 17 | ≤ 14 |

**Percentile interpolation:**

```python
def vo2_percentile(vo2, age, sex):
    """
    Linearly interpolate within the table above.
    Returns integer percentile 0–100.
    """
    age_group = classify_age_group(age)
    brackets  = VO2_TABLE[sex][age_group]   # list of (vo2_threshold, percentile) tuples
    # brackets sorted ascending by vo2_threshold
    for i in range(len(brackets) - 1):
        lo_vo2, lo_pct = brackets[i]
        hi_vo2, hi_pct = brackets[i + 1]
        if lo_vo2 <= vo2 <= hi_vo2:
            return round(lo_pct + (hi_pct - lo_pct) * (vo2 - lo_vo2) / (hi_vo2 - lo_vo2))
    if vo2 < brackets[0][0]:
        return 0
    return 100
```

### 9.4 Body Fat Percentage Reference by Sex

Source: American College of Sports Medicine (ACSM) GETP 10th Edition; Gallagher et al. (2000).

| Classification | Males | Females |
|---------------|-------|---------|
| Essential Fat (floor) | < 5% | < 12% |
| Athletic | 5–13% | 12–20% |
| Fitness (optimal) | 14–17% | 21–24% |
| Acceptable | 18–24% | 25–31% |
| Obese (floor for s=0) | ≥ 25% | ≥ 32% |

*The scoring formula maps `bf_optimal` to the midpoint of the "Fitness" category and `bf_floor` to the obese threshold.*

---

## 10. Implementation Notes

### 10.1 Repository Structure

```
packages/
  scoring/
    src/
      cardiovascular.ts     # Section 2 formulas
      metabolic.ts          # Section 3 formulas
      sleep.ts              # Section 4 formulas
      recovery.ts           # Section 5 formulas
      cognitive.ts          # Section 6 formulas
      longevityIndex.ts     # Section 7 composite
      tables/
        vo2MaxTable.ts      # Section 9.3 lookup table
        sdnnTable.ts        # Section 9.2 lookup table
        bodyFatTable.ts     # Section 9.4 lookup table
      utils/
        piecewiseLinear.ts  # clamp + piecewise helpers
        partialScore.ts     # proportional re-weighting logic
        phaseSelector.ts    # Phase 1 vs Phase 2 data selection
      index.ts              # exports all score functions
    tests/
      cardiovascular.test.ts
      metabolic.test.ts
      sleep.test.ts
      recovery.test.ts
      cognitive.test.ts
      longevityIndex.test.ts
```

### 10.2 TypeScript Interfaces

```typescript
// Core input types
interface UserProfile {
  age: number;
  sex: 'male' | 'female';
  ethnicity: 'south_asian' | 'east_asian' | 'other';
}

interface CardiovascularInputs {
  rhrBpm?: number;
  sdnnMs?: number;
  vo2MaxMlKgMin?: number;
  sbpMmhg?: number;
  dbpMmhg?: number;
}

interface MetabolicInputs {
  activeKcalDayAvg7d?: number;
  bmrKcalDay?: number;
  bodyFatPct?: number;
  bmi?: number;
  hba1cPct?: number;          // Phase 1
  tirPct?: number;            // Phase 2
  cgmCoveragePct?: number;    // to determine phase selection
}

interface SleepInputs {
  durationH?: number;
  remPct?: number;
  deepPct?: number;
  midpointTimestamps?: Date[];  // 7-element array
  latencyMin?: number;
}

interface RecoveryInputs {
  hrvTodayMs?: number;
  hrvBaseline7dMs?: number;
  rhrTodayBpm?: number;
  rhrBaseline7dBpm?: number;
  sleepScore?: number;          // from SleepArchitecture output
  activeKcalToday?: number;
  activeKcal7dAvg?: number;
}

interface CognitiveInputs {
  selfReport: {
    focus: 1|2|3|4|5;
    mentalEnergy: 1|2|3|4|5;
    mood: 1|2|3|4|5;
    memoryClarity: 1|2|3|4|5;
    stress: 1|2|3|4|5;         // inverted
  };
  sleepScore?: number;
  hrvTodayMs?: number;
  hrvBaseline7dMs?: number;
  cogbatScore?: number;         // Phase 2
  cogbatDate?: Date;            // Phase 2
}

// Output type
interface DomainScore {
  score: number;                // 0–100 integer
  confidence: 'high' | 'medium' | 'low';  // based on data completeness
  missingInputs: string[];      // list of excluded sub-scores
  subScores: Record<string, number>;
}
```

### 10.3 Supabase Schema (Key Tables)

```sql
-- Daily domain scores (one row per user per day per domain)
CREATE TABLE domain_scores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  score_date      DATE NOT NULL,
  domain          TEXT NOT NULL CHECK (domain IN (
                    'cardiovascular', 'metabolic', 'sleep',
                    'recovery', 'cognitive', 'longevity_index'
                  )),
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence      TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  sub_scores      JSONB,
  inputs_snapshot JSONB,        -- raw inputs for auditability
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, score_date, domain)
);

CREATE INDEX idx_domain_scores_user_date ON domain_scores (user_id, score_date DESC);

-- Morning cognitive self-report responses
CREATE TABLE cognitive_self_report (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  report_date  DATE NOT NULL,
  focus        SMALLINT CHECK (focus BETWEEN 1 AND 5),
  mental_energy SMALLINT CHECK (mental_energy BETWEEN 1 AND 5),
  mood         SMALLINT CHECK (mood BETWEEN 1 AND 5),
  memory_clarity SMALLINT CHECK (memory_clarity BETWEEN 1 AND 5),
  stress       SMALLINT CHECK (stress BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, report_date)
);

-- COGBAT facility assessments (Phase 2)
CREATE TABLE cogbat_assessments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  assessment_date DATE NOT NULL,
  percentile_score SMALLINT CHECK (percentile_score BETWEEN 0 AND 100),
  raw_data        JSONB,
  facility_id     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 10.4 Scoring Engine Invocation Pattern

The scoring engine runs in two modes:

1. **On-device (React Native):** Called after a HealthKit/Health Connect sync. Produces a provisional score stored locally; synced to Supabase in the background. Suitable for Phase 1 where all inputs are available on-device.

2. **Server-side (Supabase Edge Function):** Called when Phase 2 data arrives (CGM sync, COGBAT upload). Recomputes affected domain scores and the Longevity Index for the affected date. Triggers a push notification if the score changes by ≥ 5 points.

```typescript
// Example invocation
import { computeAllScores } from '@longitivity/scoring';

const scores = computeAllScores({
  userProfile: { age: 42, sex: 'male', ethnicity: 'south_asian' },
  cardiovascular: { rhrBpm: 58, sdnnMs: 52, vo2MaxMlKgMin: 44, sbpMmhg: 122, dbpMmhg: 78 },
  metabolic: { activeKcalDayAvg7d: 420, bmrKcalDay: 1800, bmi: 24.1, hba1cPct: 5.4 },
  sleep: { durationH: 7.2, remPct: 22, deepPct: 19, latencyMin: 14 },
  recovery: { hrvTodayMs: 55, hrvBaseline7dMs: 50, rhrTodayBpm: 57, rhrBaseline7dBpm: 58,
               activeKcalToday: 380, activeKcal7dAvg: 420 },
  cognitive: { selfReport: { focus: 4, mentalEnergy: 4, mood: 4, memoryClarity: 3, stress: 2 } }
});
// Returns: { cardiovascular: DomainScore, metabolic: DomainScore, ..., longevityIndex: DomainScore }
```

### 10.5 Confidence Levels

| Confidence | Criteria |
|------------|----------|
| `high` | All sub-scores for the domain computed from device/lab data; no manual entry |
| `medium` | 1–2 sub-scores missing or sourced from manual entry |
| `low` | More than 2 sub-scores missing; or camera PPG used as primary HRV/HR source |

Confidence is surfaced to the user as an information icon on each domain card. A `low` confidence score is never featured in marketing materials or coach summaries without explicit physician review.

### 10.6 Data Freshness Rules

| Domain | Score Expires After | Recalculation Trigger |
|--------|--------------------|-----------------------|
| Cardiovascular | 48 hours | New HealthKit sync |
| Metabolic | 7 days (body comp), 24 h (activity) | New sync or manual entry |
| Sleep | 24 hours | Morning sync |
| Recovery | 24 hours | Morning sync |
| Cognitive | 24 hours | Morning self-report |
| Longevity Index | 24 hours | Any domain score update |

---

## 11. Scoring Disclaimer

> **READ BEFORE SHIPPING — PHYSICIAN SIGN-OFF REQUIRED**

### 11.1 Patient Motivation Tool — Not a Diagnostic Instrument

The scores generated by the Longitivity / Champions Longevity Dashboard are **wellness motivation indicators only**. They are designed to:

- Help users understand trends in their own health behaviors over time.
- Encourage positive lifestyle changes through gamified, data-driven feedback.
- Facilitate conversations between users and their healthcare providers.

They are **not** intended to:

- Diagnose any medical condition.
- Replace clinical assessment, laboratory testing, or physician evaluation.
- Guide medical treatment decisions.
- Serve as a substitute for emergency medical care.

### 11.2 Physician Sign-Off Requirements

The following elements of this specification require formal written sign-off from the Chief Physician before any production release:

| Element | Status | Required Reviewer |
|---------|--------|------------------|
| Domain weights in Longevity Index (Section 7.2) | **PENDING** | Chief Physician |
| Glucose health thresholds (Section 3.4.3) | **PENDING** | Chief Physician + Endocrinology Advisor |
| Blood pressure category mapping (Section 2.4.4) | **PENDING** | Chief Physician |
| COGBAT integration protocol (Section 6.3) | **PENDING** | Chief Physician + Neuropsychology Advisor |
| Camera PPG confidence downgrade factor (Section 8) | **PENDING** | Chief Physician |

No user-facing score may be displayed until the above sign-offs are obtained and documented in the project management system.

### 11.3 Regulatory Considerations

- This application is classified as a **general wellness product** under FDA Digital Health Center of Excellence guidance (2019 Policy for Device Software Functions).
- If any future feature makes a disease-specific claim or guides clinical treatment, the product must be reclassified and cleared as a Software as a Medical Device (SaMD) under 21 CFR Part 882.
- All data handling must comply with HIPAA (for U.S. users) and applicable local privacy regulations (GDPR, DPDP Act) as detailed in the Privacy Architecture document.

### 11.4 Data Accuracy Limitations

- Consumer wearable HRV measurements have been shown to vary ±15–25% from clinical reference standards (Plews et al. 2013).
- VO2 Max estimates from Apple Watch are validated within ±10% of lab values in healthy, non-obese adults but may be less accurate in clinical populations (Bhatt et al. 2021).
- Camera PPG is an emerging technology; scores derived from it carry a `low` confidence flag and should be treated as directional only.
- Self-reported cognitive data (Section 6) reflects subjective perception and may not correlate with objective neuropsychological performance in all users.

---

## 12. References

All references are cited in context within their respective sections. Consolidated list below for completeness.

### Cardiovascular Health

1. Kaminsky, L.A., Arena, R., & Myers, J. (2015). Reference standards for cardiorespiratory fitness measured with cardiopulmonary exercise testing: Data from the Fitness Registry and the Importance of Exercise National Database (FRIEND Registry). *Mayo Clinic Proceedings*, 90(11), 1515–1523.
2. Shaffer, F., & Ginsberg, J.P. (2017). An overview of heart rate variability metrics and norms. *Frontiers in Public Health*, 5, 258.
3. Whelton, P.K., Carey, R.M., Aronow, W.S., et al. (2018). 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. *Journal of the American College of Cardiology*, 71(19), e127–e248.

### Metabolic Fitness

4. World Health Organization. (2000). *Obesity: Preventing and Managing the Global Epidemic.* WHO Technical Report Series 894. Geneva: WHO.
5. Battelino, T., Danne, T., Bergenstal, R.M., et al. (2019). Clinical targets for continuous glucose monitoring data interpretation: Recommendations from the International Consensus on Time in Range. *Diabetes Care*, 42(8), 1593–1603.
6. Desprès, J.P., & Lemieux, I. (2006). Abdominal obesity and metabolic syndrome. *Nature*, 444(7121), 881–887.

### Sleep Architecture

7. Hirshkowitz, M., Whiton, K., Albert, S.M., et al. (2015). National Sleep Foundation's sleep time duration recommendations: Methodology and results summary. *Sleep Health*, 1(1), 40–43.
8. Walker, M.P. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams.* New York: Scribner.
9. Roenneberg, T., Allebrandt, K.V., Merrow, M., & Vetter, C. (2012). Social jetlag and obesity. *Current Biology*, 22(10), 939–943.

### Recovery Capacity

10. Plews, D.J., Laursen, P.B., Stanley, J., Kilding, A.E., & Buchheit, M. (2013). Training adaptation and heart rate variability in elite endurance athletes: Opening the door to effective monitoring. *Sports Medicine*, 43(9), 773–781.
11. Buchheit, M. (2014). Monitoring training status with HR measures: Do all roads lead to Rome? *Frontiers in Physiology*, 5, 73.
12. Kellmann, M., Bertollo, M., Bosquet, L., et al. (2018). Recovery and performance in sport: Consensus statement. *International Journal of Sports Physiology and Performance*, 13(2), 240–245.

### Cognitive Performance

13. Harrison, Y., & Horne, J.A. (2000). The impact of sleep deprivation on decision making: A review. *Journal of Experimental Psychology: Applied*, 6(3), 236–249.
14. Lambourne, K., & Tomporowski, P. (2010). The effect of exercise-induced arousal on cognitive task performance: A meta-regression analysis. *Brain Research*, 1341, 12–24.
15. Hillman, C.H., Erickson, K.I., & Kramer, A.F. (2008). Be smart, exercise your heart: Exercise effects on brain and cognition. *Nature Reviews Neuroscience*, 9(1), 58–65.

### Longevity Index

16. Crimmins, E.M. (2015). Lifespan and healthspan: Past, present, and promise. *The Gerontologist*, 55(6), 901–911.
17. López-Otín, C., Blasco, M.A., Partridge, L., Serrano, M., & Kroemer, G. (2013). The hallmarks of aging. *Cell*, 153(6), 1194–1217.
18. Ferrucci, L., & Fabbri, E. (2018). Inflammageing: Chronic inflammation in ageing, cardiovascular disease, and frailty. *Nature Reviews Cardiology*, 15(9), 505–522.

### Supplementary / Methodology

19. Nunan, D., Sandercock, G.R.H., & Brodie, D.A. (2010). A quantitative systematic review of normal values for short-term heart rate variability in healthy adults. *Pacing and Clinical Electrophysiology*, 33(11), 1407–1417.
20. Gallagher, D., Heymsfield, S.B., Heo, M., Jebb, S.A., Murgatroyd, P.R., & Sakamoto, Y. (2000). Healthy percentage body fat ranges: An approach for developing guidelines based on body mass index. *American Journal of Clinical Nutrition*, 72(3), 694–701.
21. WHO Expert Consultation. (2004). Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. *The Lancet*, 363(9403), 157–163.

---

*End of Document*

---

> **Version History**
>
> | Version | Date | Author | Changes |
> |---------|------|--------|---------|
> | 0.1 | 2026-05-22 | Engineering + Clinical Advisory | Initial draft |
> | — | TBD | Chief Physician | Review and sign-off |
> | 1.0 | TBD | Engineering | Production-ready release |
