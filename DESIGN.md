# Lingora Design System

## Document status

- Status: SKELETON — design direction not approved
- Product: Lingora
- Applies to: Web learner app and Web Admin where relevant
- Document role: this file is the durable visual authority once design decisions are approved

This document controls UI/UX decisions only. It does not define backend, database, API, or service architecture.

## Product identity

- Product promise: `[TO DEFINE]`
- Primary audiences: English learners and content administrators
- Brand attributes: `[TO DEFINE WITH USER]`
- Voice and tone: `[TO DEFINE]`
- Visual references / anti-references: `[TO DEFINE]`

No logo, palette, typeface, imagery style, or visual motif is approved yet.

## Design principles

1. Learning progress and the next useful action must be immediately clear.
2. Feedback must support learning without shaming or overwhelming the learner.
3. Repeated study interactions must remain efficient and predictable.
4. Admin workflows prioritize scanability, validation, and safe content editing.
5. Accessibility, internationalization, and resilient states are first-class requirements.
6. Visual expression must be intentional and documented, not inferred from framework defaults.

## Surface modes

- Web learner experience: `Operate`
- Web Admin: `Operate`
- Future marketing/landing surface: `Persuade` only if separately approved

Surface-specific briefs may be added later without changing technical architecture.

## Typography

- Primary typeface: `[UNDECIDED]`
- Secondary/display typeface: `[UNDECIDED / NOT REQUIRED]`
- Learner web fallback stack: `[TO DEFINE]`
- Web fallback stack: `[TO DEFINE]`
- Type scale: `[TO DEFINE]`
- Line height and readable measure: `[TO DEFINE]`
- Numeric/tabular treatment for scores and analytics: `[TO DEFINE]`

### M1.6W foundation baseline

- The learner foundation uses the system sans stack with Vietnamese/English glyph coverage.
- M1.6W is light-theme only, neutral, and functional; brand colors, custom fonts, dark theme, imagery, and
  marketing composition remain undecided.
- Focus indicators, semantic labels/live regions, keyboard reachability, and 44px minimum interactive targets
  are required for the foundation routes.

Do not select a font merely because it is a framework default. Font licensing and Vietnamese/English glyph support must be checked before approval.

## Color system

- Brand colors: `[UNDECIDED]`
- Neutral scale: `[UNDECIDED]`
- Semantic colors: success, warning, error, information `[UNDECIDED]`
- Learning/progress visualization colors: `[UNDECIDED]`
- Light/dark theme support: `[DECISION NEEDED]`
- Minimum contrast: WCAG AA for applicable text and controls

Do not assign concrete color values until a design direction is approved.

## Spacing

- Base unit: `[UNDECIDED]`
- Spacing scale: `[TO DEFINE]`
- Content widths, gutters, and safe areas: `[TO DEFINE PER PLATFORM]`
- Dense Admin tables and touch-friendly learner controls require separate approved guidance.

## Border radius

- Radius scale: `[UNDECIDED]`
- Component usage rules: `[TO DEFINE]`
- Avoid applying rounded cards to every grouping by default.

## Components

- Design token source: `[TO DEFINE]`
- Component ownership and naming: `[TO DEFINE]`
- Variants must represent real states, not decorative duplication.
- Learner and Admin web components may differ in implementation while sharing intent and tokens where practical.

## Buttons

- Hierarchy: primary / secondary / tertiary / destructive `[TO DEFINE]`
- States: default, pressed, focused, disabled, loading
- Touch target and keyboard behavior: `[TO DEFINE PER PLATFORM]`
- Labels use clear actions rather than vague confirmation text.

## Cards

- Approved purposes: `[TO DEFINE]`
- Content hierarchy: `[TO DEFINE]`
- Avoid nested-card layouts and unnecessary containers.
- Learning cards/flashcards may have domain-specific interaction rules documented separately.

## Forms

- Label, help, validation, error, disabled, and success patterns: `[TO DEFINE]`
- Validation must explain how to recover.
- Preserve user input after recoverable errors.
- Admin destructive actions require explicit safeguards.

## Navigation

- Learner information architecture: `[TO DEFINE]`
- Admin information architecture: `[TO DEFINE]`
- Back/up behavior: `[TO DEFINE PER PLATFORM]`
- Current location and primary next action must remain clear.

## Loading states

- Use progress indicators or skeletons according to expected wait and content shape.
- Prevent duplicate actions during submission.
- Long AI operations must communicate progress, timeout, and fallback behavior without exposing internal model details.

## Empty states

- Explain why the state is empty.
- Provide a useful next action where one exists.
- Distinguish first-use, filtered-empty, completed, and unavailable states.

## Error states

- Use plain language and recovery actions.
- Distinguish validation, authorization, connectivity, timeout, and server/model availability errors.
- Never expose secrets, raw stack traces, or internal prompts.

## Success states

- Confirm meaningful completion without interrupting repeated learning flows unnecessarily.
- Reward feedback must align with the approved gamification model.
- Avoid celebratory effects until motion and tone are approved.

## Accessibility

- WCAG AA contrast where applicable
- Keyboard and visible focus support for Web Admin
- Screen-reader labels and semantic structure
- Touch-target sizing and accessibility semantics at mobile breakpoints
- Do not rely on color alone
- Support text scaling and localization expansion
- Motion reduction behavior if motion is introduced

## Responsive behavior

- Web learner: define supported breakpoints and adaptive layout rules before UI implementation.
- Web Admin: define breakpoints from content needs, not framework defaults.
- Tables require an approved small-screen strategy.
- Loading, empty, error, and modal states must be verified at supported sizes.

For M1.6W, verify `/login`, `/register`, and `/foundation` at 360x800, 768x1024, and 1440x900 in `vi` and
`en`, with no horizontal overflow or overlapping content. Auth remains single-column and foundation controls
stack on small screens.

## Approval checklist

- [ ] Product identity approved
- [ ] Typography approved and licensed
- [ ] Color system approved and contrast-checked
- [ ] Spacing/radius tokens approved
- [ ] Learner navigation and core component rules approved
- [ ] Admin navigation/table/form rules approved
- [ ] Accessibility baseline approved
- [ ] Responsive targets approved
