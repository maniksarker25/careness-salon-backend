# Privacy Policy: backend review (2026-11-17)

The app developer's privacy draft was compared against the backend code.

**Final texts to publish:**

- [privacy-customer.html](privacy-customer.html): paste into Dashboard → Privacy Policy → **Customer app**
- [privacy-salon.html](privacy-salon.html): paste into Dashboard → Privacy Policy → **Salon owner app**

> Not legal advice. A lawyer or data protection officer must review both texts before publishing.

## 1. Draft vs. backend

| # | Draft said | Backend actually does | Fixed how |
|---|---|---|---|
| 1 | Payments via Stripe **or PayPal**; salons store a PayPal email | **Stripe only**: no PayPal code, no PayPal field | PayPal removed everywhere |
| 2 | Recipients list without an email provider | All emails (codes, password reset, account mails, support form) go through **Resend, Inc. (USA)** | Resend added, including the US transfer |
| 3 | Reviews shown **publicly** with name, photo and date | Only the **salon** sees the reviewer's name and city (`getSobRating`); other customers see averages only | Text corrected |
| 4 | Chat: messages and images | Chat also supports **videos and PDFs** (`fileUploader.ts`) | Added |
| 5 | Customer language setting stored | Not stored on the server; on the device only | Moved to "storage on your device" |
| 6 | Salon data: bank details incl. IBAN/BIC | Fields are bank name, account holder, account number, branch code, bank city. The salon also has optional **gender and date of birth**, which the draft missed. | Corrected |
| 7 | Location processing | Coordinates are only sent with the search request and **not stored** on the server | Stated explicitly |
| 8 | Walk-in / self-booking data (4.7) | Feature doesn't exist | Removed |
| 9 | Up to 4 salon photos | Not enforced | Number removed |
| 10 | Server logs `[7–30]` days | Application logs rotate after **14 days**; IPs are kept in memory for 15 min for rate limiting | 14 days stated (see code fix 2.2) |
| 11 | Uploads | Stored on your own server (`uploads/`), not a cloud service | Covered under hosting |
| 12 | Account deletion: "deleted or anonymised" | Only the login and profile were deleted. Push tokens, notifications, favourites, cart and (for salons) staff records stayed. | **Code fixed** (see 2.1) |
| 13 | Retention | Code never auto-deletes bookings or chats | Text describes the legal retention; see open point 3.4 |
| 14 | Twilio (SMS), Cloudinary | Packages installed but **never used** | Not mentioned (correct). If you enable them later, the policy must be updated. |
| 15 | Registration | Codes expire after 10 min; unverified accounts are deleted after 60 min | Added |

## 2. Code changes made

### 2.1 Account deletion now removes personal traces

`src/app/modules/user/user.services.ts`, in the same database transaction as the deletion:

- **Customers:** push device tokens, stored notifications, favourite shops, product bookmarks and cart.
- **Salons:** push device tokens, notifications and all staff records.

Bookings, payments and chats are kept (legal retention, and the other party also has a right to them).

### 2.2 No more ever-growing log file

`src/app/shared/logger.ts`: removed the non-rotating `um-success.log`. Only the 14-day rotated logs remain. The old `logs/successes/um-success.log` file on the server can be deleted manually.

## 3. Still needed before publishing

### 3.1 Placeholders

| Placeholder | Meaning |
|---|---|
| `[FIRMA]`, `[ANSCHRIFT]`, `[VERTRETER]` | Company, address, managing director |
| `[E-MAIL-DATENSCHUTZ]` | Privacy contact, e.g. datenschutz@carenes.de |
| `[DSB …]` | Data protection officer. Required with 20+ people regularly processing personal data (§ 38 BDSG); otherwise delete section 2. |
| `[HOSTER]`, `[Deutschland/EU]` | Hosting provider and server location of `api.carenes.de` |
| `[AUFSICHTSBEHÖRDE]` | Data protection authority of your federal state |
| `[DATUM]` | Effective date |

### 3.2 Contracts (Art. 28 GDPR)

Sign data processing agreements with the hosting provider, OneSignal, Resend, Stripe and Google. Check each US provider's current Data Privacy Framework certification.

### 3.3 App-side items from the developer's draft (still valid)

- Remove the unused Contacts, Microphone and "Always" location permissions from `Info.plist`.
- Start OneSignal only after consent (`OneSignal.consentRequired(true)`).
- Link the terms and privacy policy with a checkbox on the sign-up screen.
- The production API URL must be `api.carenes.de`, not a dev tunnel.
- Firebase: confirm that no analytics or crash reporting is enabled. If it is, the policy needs updating and consent.

### 3.4 Backend items still open

- **No automatic deletion after retention periods.** Bookings, payments and chats are kept forever. Add a yearly cleanup job (e.g. delete or anonymise bookings older than 10 years, chats older than X years).
- **Uploaded files are not deleted** when an account is deleted. Profile, salon and staff photos stay in `uploads/` and remain reachable by URL. Add file cleanup on deletion.
- **Chat attachments are public by URL:** `/uploads` is served without login (`app.ts`), so chat images, videos and PDFs can be opened by anyone who has the link. File names are random, so they can't be guessed easily, but private chat files should require login.
- **Data export (Art. 20):** there is no self-service export; handle requests manually via the privacy email.

## 4. How to publish

1. Fill in the placeholders.
2. Dashboard → **Privacy Policy** → **Customer app** tab → **`</>`** → paste `privacy-customer.html` → `</>` → **Save & publish**.
3. Repeat in the **Salon owner app** tab with `privacy-salon.html`.
4. Check `/privacy-policy?type=customer` and `?type=salon`.
