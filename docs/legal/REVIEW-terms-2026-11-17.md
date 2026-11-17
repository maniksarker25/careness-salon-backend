# Terms & Conditions: backend review (2026-11-17)

The app developer's draft was compared clause by clause against the backend code. This file lists what was wrong, what was changed in the code, and what still needs the business or a lawyer.

**Final texts to publish:**

- [terms-customer.html](terms-customer.html): paste into Dashboard → Terms & Conditions → **Customer app**
- [terms-salon.html](terms-salon.html): paste into Dashboard → Terms & Conditions → **Salon owner app**

The older drafts (`terms-and-conditions*.md`) are superseded and contain outdated facts.

> Not legal advice. A German lawyer must review both texts before they go live.

---

## 1. Draft vs. backend: what was wrong

| # | Draft said | Backend actually does | Source | Fixed how |
|---|---|---|---|---|
| 1 | Free cancellation up to 2 h before | Cancellation is a **request** (≥ 2 h before) that the other party must accept. Online payment refund when the salon accepts: **100 % if requested ≥ 24 h before, 50 % if 2–24 h** (other 50 % goes to the salon). When the customer accepts a salon's request: 100 %. | `booking.service.ts` `createCancelBookingRequest`, `acceptCancelBookingRequest` | Terms rewritten to match |
| 2 | Pay-at-salon commission **20 %** | Flat **€5.00 per booking** (`payonShopChargePerBooking = 5`) | `constant/index.ts` | Terms rewritten to match |
| 3 | Online commission `[X] %` | **5 %** of the charged amount (`PLATFORM_FEE_PERCENT`) | `booking.service.ts` | Filled in |
| 4 | No commission for cancelled / no-show bookings | €5 fee was added at booking and **never removed**, even after an agreed cancellation | `booking.service.ts` | **Code changed** (see 2.2). No-show fee stays (prevents fake no-show marking). |
| 5 | Payment via Stripe **or PayPal** | **Stripe only**: PayPal env vars exist but there is no PayPal code | whole backend | PayPal removed |
| 6 | Reviews only after a completed booking | **No check at all**: anyone could rate any salon, repeatedly, even with negative stars | `rating.service.ts` | **Code changed** (see 2.1) |
| 7 | Rescheduling up to 2 h before | No time limit; either side requests, the other must accept | `booking_reschedule.service.ts` | Terms rewritten |
| 8 | No-show refund rules unclear | Online no-show: **no refund**, the salon is paid (minus 5 %). The salon can only mark no-show after the scheduled end. | `markNoShow` | Terms describe this, with the § 309 Nr. 5 BGB counter-proof clause |
| 9 | Booking confirmed on tap | Online: confirmed **only after payment**; the slot is held ~30 min (`CHECKOUT_SESSION_MAX_AGE_SECONDS`) | `booking.service.ts` | Terms rewritten |
| 10 | Salon termination with 14 days' notice | The salon can delete instantly, but only with **no upcoming bookings** | `user.services.ts` `deleteAccount` | Terms rewritten; open fees added as a condition (see 2.3) |
| 11 | Ranking: distance + search (+ ratings?) | `$geoNear` within **20 km**; filters name / category / gender target group; optional **"top rated"** sort by average rating | `client.services.ts` `getNearbyShopWithTime` | Exact parameters stated (P2B Art. 5) |
| 12 | Max 4 shop photos | Not enforced (up to 5 per upload, no total cap) | `fileUploader.ts` | Number removed from the terms |
| 13 | Self-booking / walk-in feature (§ C3-2) | Feature does not exist | — | Clause removed |
| 14 | Payment deadline `[ZAHLUNGSZIEL]` | No deadline in code. Fees accumulate; payable in-app from **€10**; reminders are sent above €100 | `client.services.ts` | Terms: payable from €10, due 14 days after a payment request |
| 15 | Refund period `[ERSTATTUNGSFRIST]` | Automatic Stripe refund on acceptance | `bookingFinancialOperation.service.ts` | "usually 5–10 bank working days" |
| 16 | Salon approval | Confirmed: salons start `inactive`; an admin activates them. Deactivation also blocks the salon's login. | `client.model.ts`, `client.services.ts` | Kept; suspension clause mentions login block |
| 17 | Age 16+ / 18+ | Not enforced by the backend | — | Kept as a contractual rule; consider a server check |

## 2. Code changes made

### 2.1 Verified reviews (§ 5b Abs. 3 UWG)

`src/app/modules/rating/rating.service.ts`, `rating.validation.ts`

- A customer can only review after a **completed, non-no-show** booking at that salon.
- The rated staff member must have served the customer in one of those bookings.
- One review per completed visit (review count ≤ completed visits).
- Ratings must be 1–5 (negative or 0 values were accepted before). Review text is max 2000 characters.
- New errors: `403` (no completed visit / wrong staff member), `409` (already reviewed).

**App action:** show the "Rate" button only for completed bookings, and display the backend `message` on 403/409.

### 2.2 Pay-on-shop fee released on cancellation

`src/app/modules/booking/bookingFinancialOperation.service.ts`

When a pay-at-salon booking moves `booked → canceled`, the €5 is subtracted again. This runs right after the atomic status change, so it happens exactly once. It is skipped if the balance is already below €5 (the salon already paid it); no credit is created in that case.

### 2.3 Salon deletion blocked while fees are payable

`src/app/modules/user/user.services.ts`

A salon owing **≥ €10** can no longer delete its account (otherwise the debt record is deleted with it). Below €10 the amount cannot be paid in the app, so deletion is allowed and the balance is written off.

## 3. Still needed before publishing

**Fill in the placeholders** (search for `[` in both files):

| Placeholder | Meaning |
|---|---|
| `[FIRMA]` | Legal company name, e.g. "Carenes GmbH" |
| `[ANSCHRIFT]` | Street, postcode, city |
| `[VERTRETER]` | Managing director(s) |
| `[REGISTERGERICHT]`, `[HRB]` | Register court and number |
| `[USt-IdNr.]` | VAT ID |
| `[E-MAIL-SUPPORT]` | Support email (should match `SUPPORT_EMAIL` in the backend `.env`) |
| `[DATUM]` | Date the terms take effect |
| `[MEDIATOREN]` | Salon terms only: two mediators (P2B Art. 12; small businesses are exempt) |

**Business decisions to confirm:**

1. €5 flat fee per pay-at-salon booking: confirm the amount, and whether it is net plus VAT or gross. The backend has no VAT logic.
2. The 50 % late-cancellation and 100 % online no-show charges: confirm these are intended.
3. The 14-day payment deadline after a payment request (my default; the code has none).
4. The dashboard revenue report uses a **10 %** pay-on-shop profit rate (`meta.services.ts` `PAY_ON_SHOP_PROFIT_RATE`), but the real fee is €5 flat, so the dashboard profit figure is misleading. Ask the dev team to align it.

**Points for the lawyer:**

- Customer § 8 (2): the salon can reject a cancellation request. Customers keep their statutory termination rights (§ 648 BGB analogous), and the text says so. Check the wording.
- Customer § 8 (3) and § 11: the 50 % and 100 % flat charges must allow counter-proof (§ 309 Nr. 5 BGB). This is included in § 8 (5).
- Customer § 12: whether the § 312g Abs. 2 Nr. 9 BGB exception applies to salon appointments. The cautious version (full withdrawal notice) is used. If kept, the app needs the "start before the withdrawal period ends" checkbox for appointments within 14 days.
- Customer § 22: whether to keep "not willing to take part in consumer arbitration".
- Salon § 17 (2): liability cap at 12 months of fees.

**App checks (the terms describe this behaviour):**

- The final booking button must read **"Zahlungspflichtig buchen"** (§ 312j Abs. 3 BGB).
- A checkbox to accept the terms at registration and at booking.
- A link to terms, privacy and imprint within 2 taps, e.g. `https://admin.carenes.de/terms-conditions?type=customer`.

## 4. How to publish

1. Fill in the placeholders in the `.html` file.
2. Dashboard → **Terms & Conditions** → **Customer app** tab → editor toolbar **`</>` (Source)** → delete the content → paste the whole content of `terms-customer.html` → click `</>` again → **Save & publish**.
3. Repeat in the **Salon owner app** tab with `terms-salon.html`.
4. Check the result at `/terms-conditions?type=customer` and `?type=salon`.
