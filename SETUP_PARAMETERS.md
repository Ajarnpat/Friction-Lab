# Coefficients of Friction Simulation — Setup / Program Parameters

Copyright: Pat Roby, 2026

## Purpose

This file documents the non-student-facing parameters used by `index.html`. The simulation itself intentionally does not reveal coefficients, equations, graph choices, or theoretical explanations.

## Fixed apparatus parameters

- Base block mass: **200 g**
- Added mass disks: **100 g each**
- Maximum added disks: **7**
- Total available masses: **200, 300, 400, 500, 600, 700, 800, 900 g**
- Gravitational field strength used internally: **9.81 N kg⁻¹**
- Surface orientation: horizontal
- Contact-area choices: **Large** and **Small**
- Contact area does **not** alter the calculated friction force.

## Representative friction coefficients used

These are realistic representative values for a teaching simulation, not universal material constants. Real measured values depend strongly on material composition, roughness, cleanliness, temperature, contamination, and preparation.

| Surface pair | Static coefficient, μs | Kinetic coefficient, μk |
|---|---:|---:|
| Rubber on dry tarmac | 0.95 | 0.72 |
| Rubber on glass | 0.87 | 0.63 |
| Iron on glass | 0.22 | 0.16 |

### Basis for values

Published friction tables give typical dry rubber on concrete/asphalt values around μs ≈ 0.7–1.1 and μk ≈ 0.6–0.9. A commonly reproduced introductory-physics table gives rubber on dry concrete as μs = 1.0 and μk = 0.8. Experimental educational data for rubber on glass report a static coefficient near 0.87. Values for metal-on-glass vary widely; the iron-on-glass values here are deliberately conservative and chosen to remain physically plausible while giving a clearly different student dataset.

Suggested source references used when choosing values:
- University of Hawai‘i Physics 170, coefficient-of-friction table: rubber on dry concrete kinetic ≈ 0.80, static around 1 or above.
- Cutnell & Johnson / WebAssign friction table: rubber on dry concrete μs = 1.0, μk = 0.8; glass on glass μs = 0.94, μk = 0.40.
- The Physics Factbook educational glass-friction compilation: measured rubber-on-glass static coefficient ≈ 0.87 in the cited student experiment.

## Measurement uncertainty / repeat behavior

The simulation includes realistic repeat-to-repeat variation. **Every measurement is generated independently** using a fresh random multiplier between **0.925 and 1.075** (±7.5%). No measured value is reused or linked to a previous repeat, mass, material pair, or contact-area setting.

Changing the contact area does not change the underlying friction coefficient or ideal friction force, but the measured value can differ from a previous run because each run receives its own independent ±7.5% experimental variation. In Lab 2, the unseen breakaway threshold and the displayed kinetic-friction average each receive their own fresh random variation.

## Lab 1: Static friction behavior

1. Student presses Start.
2. Pulling force rises smoothly from zero.
3. The internal maximum static-friction threshold is calculated from the selected coefficient, normal force and repeat multiplier.
4. The electronic force probe shows the live force.
5. The student can toggle the probe to **MAX FORCE** during the run.
6. At the maximum static-friction threshold, the block begins to move.
7. The force drops toward the corresponding kinetic-friction value.
8. The simulation stops shortly after motion begins.

## Lab 2: Kinetic friction behavior

1. Student presses Start.
2. Pulling force rises to the same maximum static-friction threshold used in Lab 1.
3. The block begins to move and the force drops to the kinetic-friction value.
4. The simulated pull then matches kinetic friction, so the block travels at constant velocity.
5. The force probe shows the live force throughout the pull and subsequent motion.
6. Once constant velocity is reached, **SHOW AVERAGE** becomes available.
7. The displayed average is calculated from the actual fluctuating force readings collected during the steady-motion portion of that run.

## Student-facing design decisions

- No coefficient values are shown.
- No friction equations are shown.
- Students are not told which variables to graph.
- Students are instructed to take three repeats per data point, record measurements, choose an appropriate graph, and describe the relationship found.
- A short statement identifies the activity as a realistic simulation containing random experimental uncertainty.
- Copyright displayed: **© Pat Roby, 2026**.


## Interface notes
- The force probe is shown pulling the block, not pushing it.
- A Reset button returns the apparatus to its initial rest state.
- In Lab 2, the probe shows a live force reading throughout the pull. During constant-velocity motion, the displayed force fluctuates slightly around the kinetic-friction value; the SHOW AVERAGE control reveals the underlying average value.

## Calculation audit

- Total mass is converted from grams to kilograms before force calculations.
- Normal force on the horizontal surface is calculated as `N = m g`, using `g = 9.81 N kg⁻¹`.
- Maximum static friction is calculated as `F_s,max = μ_s N` and then given one independent ±7.5% measurement factor for that run.
- Kinetic friction is calculated as `F_k = μ_k N` and given its own independent ±7.5% measurement factor.
- For all three material pairs, even the highest possible varied kinetic value remains below the lowest possible varied static value, so the force always drops when sliding begins.
- Contact-area selection changes only the drawing, never the force calculation.
- In Lab 2, constant velocity is represented by matching the mean pulling force to the kinetic-friction force. The displayed force has small fluctuations around that value, and SHOW AVERAGE reports the arithmetic mean of the displayed steady-motion samples.
