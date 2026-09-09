---
name: Kinetic Obsidian
colors:
  surface: '#0c1322'
  surface-dim: '#0c1322'
  surface-bright: '#323949'
  surface-container-lowest: '#070e1d'
  surface-container-low: '#141b2b'
  surface-container: '#191f2f'
  surface-container-high: '#232a3a'
  surface-container-highest: '#2e3545'
  on-surface: '#dce2f7'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dce2f7'
  inverse-on-surface: '#293040'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0c1322'
  on-background: '#dce2f7'
  surface-variant: '#2e3545'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  spacing-3xs: 0.125rem
  spacing-2xs: 0.25rem
  spacing-xs: 0.5rem
  spacing-sm: 0.75rem
  spacing-md: 1rem
  spacing-lg: 1.25rem
  spacing-xl: 1.5rem
  spacing-2xl: 2rem
  spacing-3xl: 3rem
  touch-target-min: 3rem
---

## Brand & Style

This design system establishes an ultra-efficient, mission-critical operations environment tailored for fleet controllers, logistics managers, and drivers on the move. The visual narrative combines the utilitarian precision of aviation cockpits with modern, high-contrast digital ergonomics. It balances immediate operational clarity with low ocular fatigue during extended shifts, day or night.

The design movement is **Technical Modernism** intersecting with refined dark-surface functionalism. It prioritizes information density without visual crowding, utilizing deep obsidian layers, crisp luminescence for time-sensitive events, and razor-sharp structural delineation. The interface evokes feelings of command, precision, resilience, and swiftness.

## Colors

The palette relies on deep slate and charcoal tones to establish physical depth, punctuated by high-chroma luminous accents that signify route progress, vehicle status, and critical dispatches.

### Surface System
- **Base Canvas (`#0B0F17`):** The ground level for the application viewport, navigation bars, and structural scaffolding.
- **Surface Level 1 (`#111827`):** Structural panels, bottom sheets, pinned headers, and master schedule rails.
- **Surface Level 2 (`#1F2937`):** Interactive card modules, modal sheets, driver dispatch tiles, and timeline tracks.
- **Surface Level 3 / Highlight (`#374151`):** Sub-elements within cards, active row highlights, hovered states, and segmented control backgrounds.

### Accents & Indicators
- **Primary Electric Blue (`#3B82F6`):** Primary command triggers, active transit tracks, departure beacons, and interactive links.
- **Emerald Green (`#10B981`):** Confirmed dispatches, on-time milestones, healthy vehicle telemetry, and terminal success feedback.
- **Amber Warning (`#F59E0B`):** Schedule delays, detour warnings, layover holds, and urgent transit notifications.
- **Violet Accent (`#8B5CF6`):** Passenger charter classifications, multi-leg grouping tags, and specialized cargo flags.
- **Rose Destructive (`#EF4444`):** Incident cancellations, breakdown alerts, and critical route disruptions.

### Borders & Dividers
- **Subtle Surface Border (`rgba(255, 255, 255, 0.08)`):** Default perimeter definition for cards and structural boundaries.
- **Active Structural Border (`rgba(59, 130, 246, 0.4)`):** Highlight state for selected trips and active inputs.

## Typography

The type scale combines **Inter** for conversational, instructional, and structural hierarchy with **JetBrains Mono** for all operational parameters (timestamps, passenger counts, vehicle license IDs, flight-connect numbers, and platform gates).

- **Tabular Figures:** All tabular and scheduling values must strictly employ `font-variant-numeric: tabular-nums` to ensure exact column alignment during dynamic time and passenger updates.
- **Labels:** Mono labels are uppercase or capitalized with slight letter spacing to allow instantaneous legibility against dark slate surfaces during high-glare daytime checks or night driving.

## Layout & Spacing

The layout is built around a mobile-first progressive web application grid designed for rapid thumb-reach interactions and high data scanability.

### Grid Architecture
- **Mobile (< 640px):** Single-column fluid layout with `1rem` (16px) lateral margins and an internal `0.75rem` (12px) gutter between card items. Pinned bottom actions utilize safe-area padding (`env(safe-area-inset-bottom)` + `12px`).
- **Tablet / Desktop (≥ 640px):** 12-column adaptive fluid layout with a maximum container width of `1200px`, `1.5rem` (24px) gutters, and `2rem` (32px) margins. Route timelines and vehicle telemetry reflow into a primary master-detail split (7 cols dispatch queue, 5 cols trip detail/map).

### Touch Targets & Hit Areas
All interactive controls (switches, route expanders, navigation pills, time pickers) enforce an absolute minimum touch zone of `48px` (`3rem`), while visual representations can remain compact through extended hit-box padding.

## Elevation & Depth

Rather than relying on heavy, muddy drop shadows that wash out dark interfaces, this design system creates depth through **tonal layering** paired with **micro-luminescence** and **subtle edge boundaries**.

1. **Flat / Background (`#0B0F17`):** Primary viewport backdrop.
2. **Elevated Cards & Rows (`#111827`):** Encased with a `1px` crisp outline of `rgba(255, 255, 255, 0.07)`. No drop shadow.
3. **Floating Overlays & Drawers (`#1F2937`):** Modals, drop-down filters, and sliding route details. These use a delicate shadow for separation: `0 8px 32px rgba(0, 0, 0, 0.55)` complemented by a top edge rim light: `1px solid rgba(255, 255, 255, 0.12)`.
4. **Active Focus & Critical Alerts:** Glowing perimeter wash utilizing high-chroma colors at low alpha (e.g., `box-shadow: 0 0 16px rgba(59, 130, 246, 0.25)` for active navigation nodes; `0 0 16px rgba(239, 68, 68, 0.3)` for emergency stoppage).

## Shapes

The design system utilizes a **Soft (Level 1)** structural curvature, engineered for an industrial, robust aesthetic that feels precise rather than whimsical.

- Standard cards, sheet containers, and alert blocks utilize `0.5rem` (`rounded-lg`).
- Buttons, input containers, and status chips utilize `0.25rem` (`rounded`).
- Micro indicators, progress track caps, and notification count bubbles retain pure circular geometry (`rounded-full`).

## Components

### Buttons
- **Primary Action:** Solid electric blue background (`#3B82F6`), high-contrast pure white text (`#FFFFFF`), `0.25rem` corner radius, `48px` height. Hover/active states darken to `#2563EB` with a subtle inner edge gleam.
- **Secondary / Operational:** Background of `#1F2937` with an explicit subtle border (`rgba(255, 255, 255, 0.1)`), text in `#F3F4F6`.
- **Success / Confirmation:** Emerald green fill (`#10B981`) dedicated to "Confirm Leg", "Complete Drop-off", or "Accept Schedule".

### Chips & Badges
- Composed of an alpha-tinted background (12% opacity) paired with the corresponding solid accent color for text and border.
  - *On-Time / Active:* Green alpha background (`rgba(16, 185, 129, 0.12)`), text `#10B981`.
  - *Delayed / Review:* Amber alpha background (`rgba(245, 158, 11, 0.12)`), text `#F59E0B`.
  - *Charter / Passenger Segment:* Violet alpha background (`rgba(139, 92, 246, 0.12)`), text `#8B5CF6`.
- Typography is strictly `label-sm` using JetBrains Mono with tabular alignment.

### Cards & Dispatch Tiles
- Background `#111827`, wrapped in a crisp `1px` border of `rgba(255, 255, 255, 0.08)`.
- Internal padding: `1rem` (16px).
- Internal layout features a dual-column metadata hierarchy: destination/route identity on the left (Inter body bold), timing departure/arrival and platform tag on the right (JetBrains Mono tabular).

### Lists & Timelines
- Flush container layout with hairline separators (`1px solid rgba(255, 255, 255, 0.06)`).
- Route milestones utilize vertical connecting lines (`2px` solid `#1F2937`) linked by solid status nodes (6px circular dots: green for passed, glowing electric blue for active current location, muted gray for pending).

### Input Fields & Selectors
- Height: `48px`. Surface fill: `#0B0F17`.
- Default border: `1px solid rgba(255, 255, 255, 0.12)`.
- Focus state: Border transitions to `#3B82F6` with an immediate outer stroke halo `rgba(59, 130, 246, 0.2)`. Placeholder text colored `#6B7280`.

### Checkboxes & Radios
- Size: `20px` square (`0.25rem` radius) or circle. Border: `1.5px solid #4B5563`.
- Checked state: `#3B82F6` solid fill with sharp white indicator icon.
- Hit area expands to `48px x 48px` using transparent offset padding to enable rapid error-free touch selection on mobile devices.

### Specialized Logistics Components
- **Telemetry Gauge:** Mini horizontal progress bar with background `#1F2937` and fill tied to passenger capacity or fuel percentage (gradient green to amber at capacity limits).
- **Time Delta Indicator:** Compact Mono badge displaying live difference against schedule (e.g., `+00:14m` in amber, `-00:02m` in emerald).