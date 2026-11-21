# S12-XDEVICE — Root verification (2026-11-21)

Anti handoff: `STATUS: DELIVERED`. Report: `tmp/slice12-xdevice/anti.log`. Anti evidence: `anti.md`.

## Independent gates (logs: `tmp/slice12-xdevice/root/`)

| Gate | Exit | Result |
|---|---|---|
| `npm run typecheck` | 0 | 3 packages |
| `npm run test:feature -w lingora-web` | 1 | 397/398. One known failure outside scope: `home-timezone-semantics.test.mjs:88` |
| `npm run test:components -w lingora-web` | 0 | 98/98 |
| `npm run test:integration:onboarding` | 0 | 62/62 |
| `npm run test:e2e:onboarding` | 0 | 4/4 scenarios, including cross-device, anti-prefetch, replay, resend, 360/390 |
| `npm run test:browser:confirmation -w lingora-web` | 0 | crossDeviceTokenVerify, antiPrefetchZeroVerify, tokenReplayFailed, externalProviderCalls 0 |
| `npm run build` | 0 | |

## Negative controls (cross-device + auth-registration tests)

| Mutation | Result |
|---|---|
| A — GET redirects to `/login` instead of `/auth/verify` | KILLED (5 fail) |
| B — drop `signOut` after verify | KILLED (1) |
| C — POST accepts any `type` | KILLED (3) |
| D — resend 429 mapped to 200 | KILLED (1) |
| E — POST skips same-origin check | KILLED (1) |

Source was restored byte-exact (sha256 compared).

## Root fix
Resend failure logging now allowlists the format of the provider `code` (`^[a-z0-9_]{1,64}$`). After the fix: focused suite 14/14 and typecheck PASS.

## Notes (non-blocking)
- `ResendConfirmationForm` sets an `Origin` header in `fetch`. Browsers ignore it as a forbidden header, so it is harmless.

## Verdict
**PASS — local acceptance.** Public acceptance needs the owner to change the template, then a deploy and one authorized real-email attempt.
