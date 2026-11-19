# NeuroDispersion v1.8.1 — 77-NC current norm + 522 full-battery + 687 common-test reanalysis

# 77-NC current norm reanalysis — retrospective 522 sample

## Sample
SCD n=199, aMCI n=233, DAT n=90 (total n=522). All available raw scores were re-converted using the 77-NC age/education/sex regression-adjusted current norm; PR <= 8 was treated as approximately -1.5 SD.

## Main profile result
Memory ISD: SCD 27.56, aMCI 24.17, DAT 15.66. This differs from the earlier conventional-norm result: under the 77-NC current norm, SCD has the highest memory dispersion and DAT the lowest.

Mean memory PR: SCD 54.16, aMCI 26.80, DAT 15.98.

## ROC
- SCD vs aMCI, memory mean PR: AUC .866; cutoff <=41.14; sensitivity .826; specificity .770.
- SCD vs aMCI, proportion of available memory tests at PR<=8: AUC .825; cutoff >=20%; sensitivity .808; specificity .776.
- aMCI vs DAT, total impairment proportion (PR<=8): AUC .731; cutoff >=40.9%; sensitivity .614; specificity .789.

These are cross-sectional classification cutoffs, not longitudinal conversion-risk estimates.

## Glioma / 687-person note
The SAV contains all 687 case labels (199/233/90/165), but the 165 glioma rows do not contain the same participant-level raw-score fields. The older glioma data are stored in separate modules/files. Therefore the 522 memory-clinic sample is fully reprocessed; the 165 glioma cohort was recovered from the separate SAV and reprocessed on the tests shared across all four groups; see `analysis/retrospective687_common_test_currentnorm_summary.csv`.

# NeuroDispersion v1.7 — 77-NC current norm

This build replaces the earlier provisional norm engine with the values in `ISD_Report2025_latest.pdf`.

- Normative sample: NC n=77.
- All 25 tests: demographic regression adjustment for age, education, and sex.
- Percentile conversion: Table 5 adjusted-score thresholds (PR 1–99).
- Lower-is-better measures (CTT-1, CTT-2, mCST-PE) are direction-reversed after percentile lookup.
- Low performance: PR <= 8 (~ -1.5 SD), matching the report.
- Within-domain ISD reference: Table 7; high dispersion = NC P92 and low dispersion = NC P8.
- The old ROC estimates are disabled. The 687-person retrospective sample must be reprocessed from participant-level raw scores using this same norm before new ROC cutoffs are reported.

# NeuroDispersion Clinical Research Dashboard v1.6

## Current-norm scoring
v1.6 replaces the previous DEMO raw-to-percentile mapping with the current preliminary norm.

- 15 non-scaled tests: demographic adjustment (age, education, gender) using the current NC regression coefficients, followed by empirical percentile ranking against the current NC adjusted-score distribution.
- 10 scaled-score tests: LM-IM, LM-DEL, FP-IM, FP-DEL, ARI, DSS, SIM, MR, DS, SS. These are entered as scaled scores and converted using M = 10, SD = 3.
- Individual test impairment cutoff: percentile <= 6.6807, corresponding to z <= -1.5 SD.
- Domain high-dispersion cutoff: NC mean ISD + 1.5 SD.

The current-norm dashboard battery contains 25 tests. REC, REM, TMT-B, and TMT-A are not included because they are not part of the current-norm battery supplied for v1.6.

## ROC re-analysis
The current-norm validation dataset contains NC and AD (plus glioma), not an MCI group. Therefore v1.6 does not claim a newly estimated SCD-vs-aMCI ROC.

Using complete current-norm cases:
- 25-test impairment burden (count of tests <= P6.68), NC vs AD: AUC = 0.881; Youden cutoff >= 3 impaired tests; sensitivity = 0.75; specificity = 0.87.
- 7-test memory impairment burden, NC vs AD: AUC = 0.788; cutoff >= 1 impaired memory test; sensitivity = 0.74; specificity = 0.80.
- Domain ISD alone showed weak discrimination (AUC approximately 0.51-0.59), so v1.6 does not use domain dispersion alone as an AD classifier.

These are cross-sectional cognitive-profile discrimination results, not longitudinal dementia probabilities.

## Dispersion > 1.5 SD cutoffs
- Memory: 37.61
- Executive function: 38.95
- Language: 39.71
- Visuospatial function: 42.13
- Attention/speed: 37.61

A domain is flagged as high dispersion only when all tests in that domain are available.

## GitHub Pages deployment
Upload the contents of this folder directly to the repository root so `index.html` is at the top level.

Settings -> Pages -> Deploy from a branch -> `main` -> `/ (root)`.

After updating, use Ctrl+F5 if the browser is showing an older cached version.

## Supabase
Keep your existing `config/supabase-config.js`. Do not place a service-role key in GitHub. The existing RLS schema remains compatible.

## Research-use warning
This dashboard is a research prototype. The AD-like impairment-burden flag is not a diagnosis. aMCI/DAT classification still requires clinical context, including functional status, CDR/ADL, history, and clinician judgment.
