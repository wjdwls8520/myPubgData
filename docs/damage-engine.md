# Damage engine

## Modules and contract

All calculation functions are pure and return numbers or null. They never read JSON, browser state, React state, time, or a network. Rules and weapon records are parameters. UI only formats results.

- `calculateDistanceDamage`: exact sample or piecewise linear interpolation; null outside either measured endpoint or for invalid input.
- `calculateDamage`: distance damage × body hit-area × class/weapon override × armor. Helmet and vest masks are explicit. Returns components, per-pellet damage, full pellet range, HTK, TTK and unknown reason.
- `calculateShotgunDamage`: validates integer hits within pellet count; multiplies same-body hits. One O12 slug is never multiplied by pellet selection.
- `calculateHTK`: ceil(health / damage), no display rounding. Unknown/nonpositive/nonfinite damage returns null.
- `calculateTTK`: dispatches by firing model, preserving shot zero. Automatic weapons use selected RPM, single/pump use chosen interval, burst uses internal/boundary timing, bolt uses scope-specific observations.
- `calculateBurstTTK`: for H hits and B burst size, boundary count = floor((H − 1) / B). TTK = (H − 1 − boundaries) × intra + boundaries × boundary.
- `calculateBoltTTK`: (H − 1) × observed scope cycle. The same interval primitive is also used for regular cadence; its input is already resolved by firing model.

## Timing modes

Perfect uses 60 / displayed RPM. This is an explicit approximation; the displayed RPM itself is rounded. Normal single/pump intervals are derived from 17 direct UI observations (recorded TTK / (HTK − 1)). Normal burst boundary intervals are derived from the observed multi-burst TTK, the burst size and RPM-based intra interval. They are marked derived; they are not claims about the reference's private implementation.

Custom single firing uses max(weapon minimum interval, input click interval). For burst, the input is burst-start to burst-start. The boundary is max(perfect boundary, click interval − (burstSize − 1) × intra). Thus 300 clicks/min gives Mk47 H=5 TTK=0.4 seconds.

Bolt values were read from 2-hit TTK rows under each scope option. They have only 0.01s displayed precision. Win94 uses the same integrated-scope observation for all ADS labels. No ADS has its own value.

## Explicit limits

- Results assume 100 HP, a single selected body part, all configured pellets hitting that part, intact armor, no flight/network delay.
- General timing is sustained cadence without reloads. Exact magazine capacities/reload timing are not modeled. For S686/Sawed-off/DBS, even the short two-shot cycle requires unknown reload/pump timing afterwards, so H > 2 yields null.
- No recoil, accuracy probability, damage-through-objects, vest durability, mixed body hits or vehicle damage model.
- Distance values are rounded one-decimal public base samples. Interpolation is a local engineering assumption; no evidence of reference's internal interpolation was inspected. Unknown ranges remain unknown even if another table or card rounds them to a convenient value.
- No epsilon is applied at health thresholds. UI rounding never feeds back into HTK. Raw game rounding is unknown.
- `reason` distinguishes missing distance, invalid pellet count and unresolved timing. Sorting places null metrics last.

## Known checks

M416 at 0m, helmet/vest 2: chest 40 × 1.1 × 1 × .6 = 26.4, HTK 4, TTK 3×60/700 = .257142857…s. Head 56.4. Hands 10.8 regardless of armor.

Dragunov uses 2.80 for head/neck. LMG pelvis uses class 1.00 while chest uses 1.05. AWM at two hits and 4x = 2.57s, not the inverse of its displayed 20 RPM.
