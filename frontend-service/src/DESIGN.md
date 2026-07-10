---
name: Truth Uncovered
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e5beb5'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#ac8981'
  outline-variant: '#5c403a'
  surface-tint: '#ffb4a4'
  primary: '#ffb4a4'
  on-primary: '#640d00'
  primary-container: '#ff5634'
  on-primary-container: '#580a00'
  inverse-primary: '#b82000'
  secondary: '#55d8e1'
  on-secondary: '#003739'
  secondary-container: '#00acb4'
  on-secondary-container: '#00393c'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#909191'
  on-tertiary-container: '#282a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a4'
  on-primary-fixed: '#3e0500'
  on-primary-fixed-variant: '#8d1600'
  secondary-fixed: '#75f5fd'
  secondary-fixed-dim: '#55d8e1'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f53'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  section-gap: 80px
---

## Brand & Style

The design system is engineered for **Truth Uncovered**, a whistleblower and accountability platform. The brand personality is authoritative, secure, and unwavering. It balances the urgency of investigative journalism with the institutional trust of a high-end NGO. 

The visual direction employs a **Sleek Glassmorphic** style. It utilizes a deep, nocturnal foundation to provide a sense of anonymity and safety, while vibrant primary accents act as a "beacon" for truth. The UI avoids aggressive "hacker" tropes, opting instead for refined surfaces, precise typography, and subtle luminosity to convey sophisticated data protection and transparency.

**Key Principles:**
- **Absolute Clarity:** Information must be legible under any condition to ensure high-stakes data is communicated accurately.
- **Architectural Depth:** Layering conveys the "uncovering" of information—moving from surface-level signals to deep, verified data.
- **Protective Aesthetics:** Glassmorphism and thin borders create a metaphorical "shield" around sensitive content.

## Colors

The palette is anchored by a **Deep Charcoal (#080808)** background, providing a canvas for high-contrast signals. 

- **Primary (Signal Red):** Used for "alerts," critical "uncovered" findings, and urgent calls to action. It represents the courage required to speak out.
- **Secondary (Trust Teal):** Used for verification status, "Safe" indicators, and security-related UI elements. It provides a calming, professional counterpoint to the primary red.
- **Functional Neutrals:** Greys are carefully weighted to maintain readability on dark backgrounds without causing eye strain. 
- **Glass Effects:** Surfaces use a semi-transparent white tint with a heavy backdrop blur (20px-40px) to create the signature glassmorphic look.

## Typography

This design system uses a dual-font strategy to balance character and utility.

- **Sora (Headlines):** Its geometric construction and unique apertures provide a modern, technical feel that commands attention for report titles and major alerts.
- **Inter (Body/UI):** Chosen for its exceptional legibility in data-heavy environments. Its neutral tone ensures that the content remains the focus, not the typeface.

**Hierarchy Rules:**
- Large display text should use tighter letter spacing for a "compact" and professional appearance.
- Small labels and metadata should use increased letter spacing and uppercase styling to distinguish them from narrative text.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a strict 8px spatial rhythm.

- **Desktop:** 12-column grid with 24px gutters. Content is centered in a 1200px container to maintain focus.
- **Tablet:** 8-column grid with 24px gutters and 32px side margins.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins. 

**Spacing Philosophy:**
Use generous vertical whitespace (`section-gap`) to allow the glassmorphic elements "room to breathe," preventing the dark UI from feeling claustrophobic. Elements should be grouped using logical proximity; use 8px/16px for internal component spacing and 32px/48px for layout-level separation.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Backdrop Blurs** rather than traditional drop shadows.

- **Level 0 (Background):** Solid #080808.
- **Level 1 (Cards/Panels):** `surface_glass` with a 1px `border_glass`. Apply a `backdrop-filter: blur(24px)`.
- **Level 2 (Modals/Popovers):** Slightly lighter glass fill (`rgba(255, 255, 255, 0.06)`) with a more pronounced 1px border and a subtle white outer glow (glow-spread: 2px, opacity: 5%).
- **Interactive States:** On hover, card borders should transition to a higher opacity or a subtle hint of the Primary or Secondary color to indicate focus.

## Shapes

The shape language uses **Medium Roundedness** (0.5rem) to soften the "industrial" feel of a whistleblower platform, making it more approachable for the average citizen.

- **Small Components:** Checkboxes and small buttons use a 4px (Soft) radius.
- **Standard UI Elements:** Cards, input fields, and standard buttons use an 8px (Rounded) radius.
- **Featured Elements:** Hero sections or large imagery containers may use a 16px (Rounded-LG) radius for a more contemporary, editorial feel.

## Components

### Buttons
- **Primary:** Solid #FF4C29 with white text. High-contrast, no border.
- **Secondary:** Transparent background with a 1px `Trust Teal` (#00ADB5) border and teal text.
- **Ghost:** White text with no background; only visible on hover with a subtle glass background.

### Input Fields
- Dark backgrounds (#121212) with a 1px border.
- Focus state: Border changes to Trust Teal (#00ADB5) with a 2px outer blur in the same color.
- Labels sit above the field in `label-sm` style.

### Cards
- Always glassmorphic. 
- Use a 1px top-to-bottom linear gradient on the border (top: `white 20%`, bottom: `transparent`) to simulate light hitting a glass edge.

### Status Chips
- **Verified:** Background of #00ADB5 (20% opacity), text color #00ADB5, with a leading "shield" icon.
- **Urgent/New:** Background of #FF4C29 (20% opacity), text color #FF4C29, with a leading "alert" icon.

### Identity Protection Component
- A specific UI pattern for file uploads that visually "shreds" or masks metadata as the file is processed, using a secondary teal progress bar and blurred text previews.