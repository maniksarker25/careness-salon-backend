# Backend Changes — Flutter App Action Items

**Date:** 2026-10-01
**Scope:** এই session-এ backend-এ যা যা fix/change হয়েছে, এবং প্রতিটার জন্য Flutter app-এ কী করা লাগবে (বা লাগবে না)।

Legend: 🔴 App-এ change দরকার | 🟡 App-এ change দরকার না, কিন্তু জেনে রাখা দরকার | ⚪ Backend-only, app-এ কিছু করার নেই

---

## ⚪ 1. Email Service: SMTP → Resend

Email পাঠানোর backend implementation (nodemailer/SMTP থেকে Resend API-তে) পাল্টানো হয়েছে। এটা সম্পূর্ণ internal — কোনো API endpoint, request/response shape পাল্টায়নি। **App-এ কোনো change লাগবে না।**

---

## 🟡 2. Global Error Response Fix (Validation Errors)

**সমস্যা ছিল:** কোনো request-এ validation fail করলে (Zod validation — যেমন ভুল discount percentage, ভুল date ইত্যাদি) backend সঠিক error message পাঠাতো, কিন্তু HTTP status code ভুলভাবে `500` যেতো (`400` যাওয়ার কথা ছিল)।

**ফিক্সের পর:** এখন সব validation error সঠিকভাবে **`400 Bad Request`** status code সহ যায়, সাথে `message` field-এ নির্দিষ্ট কারণ থাকে। যেমন:
```json
{ "success": false, "message": "Discount percentage cannot exceed 50.", "errorDetails": { ... } }
```

**App Action:** কোনো endpoint পাল্টায়নি। শুধু নিশ্চিত করো app-এর error handling `response.statusCode == 400` আর `response.body.message` থেকে user-কে specific error দেখায় (generic "Something went wrong" না দেখিয়ে), কারণ আগে এগুলো ভুলভাবে 500 হিসেবে আসতো।

---

## 🔴 3. Discount: সর্বোচ্চ সীমা 100% → 50%

**Endpoints:** `POST /discount/create-discount`, `PATCH /discount/update-discount`

- `discountPercentage` এখন সর্বোচ্চ **50** (আগে 100 পর্যন্ত allow করতো)
- এখনো 5-এর গুণিতক হতে হবে (0, 5, 10, ... 50) — এই নিয়ম আগের মতোই আছে
- 50-এর বেশি দিলে backend `400` সহ এই message দেয়: `"Discount percentage cannot exceed 50."`

**App Action:**
- Discount create/edit screen-এ slider/input-এর max value **100 থেকে 50** করে দাও
- UI-তেই 50-এর বেশি select করা যেন না যায়, এবং backend থেকে 400 আসলে সেই message দেখাও

---

## 🔴 4. Customer Complete-Profile: সব field এখন Optional

**Endpoint:** `POST /customer/complete-profile`

আগে এই endpoint-এ `phoneNumber`, `gender`, `country` বাধ্যতামূলক ছিল (শুধু `city` optional ছিল)। GDPR data-minimization অনুযায়ী এখন **৪টাই optional**:
- `phoneNumber` — optional
- `gender` — optional
- `city` — optional
- `country` — optional

**App Action:**
- Complete-profile screen-এ এই ৩টা field (`phoneNumber`, `gender`, `country`) থেকে required (`*`) mark তুলে দাও
- User এই field গুলো খালি রেখেও profile complete করতে পারবে — "Skip" বা "পরে দেব" ধরনের flow রাখতে পারো
- শুধু registration-এর মূল field গুলো (`firstName`, `lastName`, `email`, password) আগের মতোই required থাকবে — ওগুলোতে কিছু পাল্টায়নি

---

## 🟡 5. ফোন নম্বর স্বয়ংক্রিয়ভাবে Normalize হবে (Germany +49)

**কোথায় প্রযোজ্য:** Customer, Client (shop), Staff, User, Admin — যেখানেই `phoneNumber` সেভ হয়

Backend এখন সেভ করার আগে স্বয়ংক্রিয়ভাবে spaces/dashes সরায়, এবং `+49` country code-এর পরের leading `0` strip করে দেয়:

| User যা টাইপ করলো | Database-এ যা সেভ হবে |
|---|---|
| `+49 0152 59754290` | `+4915259754290` |
| `+49-0152-59754290` | `+4915259754290` |
| `+8801712345678` (অন্য country code) | অপরিবর্তিত |

**App Action:** বাধ্যতামূলক কিছু না, কিন্তু মাথায় রাখা ভালো —
- কোনো phone number field save করার পর `GET` করলে, user যা টাইপ করেছিল হুবহু সেটা নাও আসতে পারে (normalize হয়ে আসবে)
- চাইলে app-এও একই regex দিয়ে instant UI feedback দেখাতে পারো, কিন্তু backend-ই final normalization guarantee করে, তাই এটা must-have না

---

## 🟡 6. Pay-on-Shop বুকিং এখন Transaction Log-এ সঠিকভাবে আসবে

**Endpoints:** `GET /transaction/get-shop-transaction`, `GET /transaction/get-all-transaction`

**সমস্যা ছিল:** Pay-on-shop (in-shop) payment-এর বুকিং কখনোই Transaction collection-এ লগ হতো না — শুধু online (Stripe) payment-ই লগ হতো। ফলে যেসব শপ মূলত in-shop payment নিতো, তাদের Transaction Log-এ কিছুই দেখাতো না ("Keine Daten gefunden")।

**ফিক্সের পর:** Pay-on-shop বুকিং যখন **Completed** status-এ যায় (staff manually "Mark as Complete" চাপলে, বা নিচে #8-এ বর্ণিত auto-complete cron চললে), তখন স্বয়ংক্রিয়ভাবে একটা Transaction entry তৈরি হয়। **No-show** বুকিং-এ কোনো Transaction তৈরি হয় না (কারণ টাকা পাওয়া যায়নি — এটাই সঠিক)।

**App Action:** API response shape পাল্টায়নি, কোনো change লাগবে না। শুধু জেনে রাখো — Transaction Log / "Verkäufe" screen-এ এখন থেকে pay-on-shop booking-ও দেখা যাবে (completed হওয়ার পর)।

---

## 🔴 7. Sales Report: Recognized vs Pending Revenue আলাদা হয়েছে

**Endpoints:** `GET /meta/get-meta-data`, `GET /meta/sales-profit-chart-data`

**সমস্যা ছিল:** Pay-on-shop বুকিং booking তৈরি হওয়ার সাথে সাথেই (payment পাওয়ার আগেই) sales/revenue-এ যোগ হয়ে যেতো।

**ফিক্সের পর:** Online payment আগের মতোই সাথে সাথে recognized হয় (Stripe-এ টাকা capture হয়ে যায় বলে)। কিন্তু Pay-on-shop বুকিং শুধু **Completed** হলেই revenue-তে যোগ হয়; তার আগে পর্যন্ত সেটা আলাদা `pendingSales` field-এ থাকে।

**নতুন response field:**

`GET /meta/get-meta-data` →
```json
{
  "totalSales": 1200,
  "pendingSales": 300,   // 🆕 নতুন field — এখনো uncompleted pay-on-shop বুকিং-এর টাকা
  "totalProfit": 85,
  ...
}
```

`GET /meta/sales-profit-chart-data` →
```json
{
  "data": [
    { "month": "Jan", "totalSales": 500, "pendingSales": 50, "totalProfit": 30 },
    ...
  ],
  "totalSales": 6000,
  "totalPendingSales": 400   // 🆕 নতুন field
}
```

**App Action:**
- Dashboard/Sales (Verkäufe) screen-এ `totalSales` কে **"Recognized Revenue"** হিসেবে দেখাও
- নতুন `pendingSales` field ব্যবহার করে **"Pending (Pay-in-Shop, সম্পন্ন হয়নি)"** হিসেবে আলাদা দেখাও
- পুরনো field গুলো (`totalSales`, `totalProfit`) একই নামে আছে, তাই এই field না দেখালেও app ভাঙবে না — কিন্তু accurate reporting-এর জন্য দেখানো recommended

---

## 🔴 8. বুকিং এখন নির্ধারিত সময়ের ৩ ঘণ্টা পর স্বয়ংক্রিয়ভাবে Completed হবে

**সমস্যা ছিল:** Booking-এর status `Upcoming (Booked)` থেকে `Completed`-এ যেতো শুধু staff ম্যানুয়ালি "Mark as Complete" চাপলে। স্টাফ না চাপলে appointment সময় পার হয়ে গেলেও booking চিরকাল "Upcoming"-এ থেকে যেতো, আর কাস্টমার review দিতে পারতো না।

**ফিক্সের পর:** প্রতি ১৫ মিনিটে একটা ব্যাকগ্রাউন্ড job চেক করে — appointment-এর `endTime` পার হয়ে **৩ ঘণ্টার বেশি** হয়ে গেলে, এবং status এখনো `Booked` থাকলে, backend স্বয়ংক্রিয়ভাবে সেটাকে `Completed` করে দেয় (online হলে Stripe payout + pay-on-shop হলে Transaction log — ঠিক manual "Mark as Complete"-এর মতোই সব কাজ হয়)।

**App Action — কোনো নতুন endpoint/payload নেই, কিন্তু UI behavior-এর উপর প্রভাব আছে:**
- **Customer app:** "Upcoming" ট্যাবের booking এখন appointment শেষ হওয়ার ~৩ ঘণ্টা ১৫ মিনিটের মধ্যে নিজে থেকেই "Past/Completed" ট্যাবে চলে আসবে, staff কিছু না করলেও। নিশ্চিত করো "Leave a Review" বাটন `booking.status === 'completed'` চেক করেই দেখানো হয় (এটা হওয়ার কথা, তবু double-check করে নিও)।
- **Shop/Staff app:** যদি কোনো কাস্টমার সত্যিই no-show করে, staff-কে **৩ ঘণ্টার মধ্যেই** "Mark as No-Show" করতে হবে — এরপর backend ধরে নেবে appointment সম্পন্ন হয়েছে এবং auto-complete করে দেবে (ভুলভাবে payment/transaction log তৈরি হয়ে যাবে)। Shop app-এ এই deadline নিয়ে staff-কে reminder/notification দেখানো ভালো হবে (optional, কিন্তু recommended)।

---

## 🔴 9. Legal Content: Customer আর Salon App-এর জন্য আলাদা Terms ও Privacy Policy, আর Imprint

Admin dashboard থেকে এখন তিনটা legal document upload/edit করা যায়: **Terms & Conditions**, **Privacy Policy** (দুটোই customer app আর salon owner app-এর জন্য আলাদা), আর **Imprint (Impressum)**, যেটা দুই app-এই একই।

**নতুন: `?app=customer` বা `?app=client` query param** (public, token লাগবে না)। দিলে response শুধু সেই app-এর text দেয়, একই shape-এ:

```
GET /manage/get-terms-conditions?app=customer   → customer app
GET /manage/get-terms-conditions?app=client     → salon owner app
GET /manage/get-privacy-policy?app=customer
GET /manage/get-privacy-policy?app=client
GET /manage/get-imprint                          → দুই app-ই (আগের মতো)
```

```json
{ "success": true, "data": { "_id": "...", "app": "customer", "description": "<p>HTML…</p>", "updatedAt": "2026-11-17T10:00:00.000Z" } }
```

- `description` HTML; app-এ HTML widget/WebView দিয়ে render করো।
- ভুল `app` value দিলে `400`।
- `app` না দিলে আগের মতো পুরো document আসে (backward compatible)। Privacy document-এ এখন `descriptionForCustomerApp` আর `descriptionForClientApp` আছে; পুরোনো `description` field-ও থাকছে।
- পুরোনো app build যেগুলো privacy-র `description` পড়ে, সেগুলো customer privacy policy পাবে। Salon-এর আলাদা policy publish না করা পর্যন্ত `?app=client` পুরোনো shared text দেয়।

**App Action:**
- Customer app: terms ও privacy screen-এ `?app=customer` ব্যবহার করো।
- Salon owner app: `?app=client` ব্যবহার করো (আগে সব user একই privacy policy দেখতো)।
- দুই app-এ Settings থেকে সর্বোচ্চ ২ tap-এর মধ্যে একটা **Imprint** screen রাখো (`GET /manage/get-imprint`)। জার্মানিতে এটা আইনত বাধ্যতামূলক (§ 5 DDG)।

---

## 🟡 10. Public Web Pages আর Support Form

Login ছাড়া খোলা যায় এমন public page (admin dashboard domain-এ), app-এর WebView বা App Store / Play Store listing-এ link হিসেবে দেওয়া যাবে:

```
https://admin.carenes.de/terms-conditions?type=customer   (বা ?type=salon)
https://admin.carenes.de/privacy-policy?type=customer     (বা ?type=salon)
https://admin.carenes.de/imprint
https://admin.carenes.de/support
```

Terms আর Privacy page-এ Customer / Salon owner toggle আছে; `?type=` দিয়ে কোনটা আগে খুলবে ঠিক করা যায়।

**নতুন public endpoint:** `POST /support/contact` (token লাগবে না, প্রতি IP ১৫ মিনিটে ৫টা request)

```json
{ "name": "Anna Müller", "email": "anna@example.de", "phone": "+49 151 1234567", "userType": "customer", "message": "At least 10 characters…" }
```

- `phone` আর `userType` (`customer` | `salon` | `other`) optional।
- Message system email-এ যায় (`SUPPORT_EMAIL`, না থাকলে `SUPER_ADMIN_EMAIL`)। Reply-To user-এর email, তাই সরাসরি reply করা যায়।
- Validation fail হলে `400`, limit পার হলে `429`, email পাঠাতে না পারলে `502`; তিনটাতেই `message` field থাকে।

**App Action:** চাইলে app-এর ভেতরে native support form বানাতে এই endpoint ব্যবহার করো, অথবা `/support` page WebView-এ খোলো।

---

## 🔴 11. Review শুধু Completed Booking-এর পরে, আর Cancel হলে Pay-on-Shop Fee ফেরত

**Endpoint:** `POST /rating/create`

- Customer এখন review দিতে পারবে শুধু সেই salon-এ **completed** (no-show না) booking থাকলে, আর যে staff সেবা দিয়েছে শুধু তাকেই rate করা যাবে।
- প্রতিটা completed visit-এ একটা review।
- `shopRating` আর `staffRating` এখন 1–5 হতে হবে; review text সর্বোচ্চ 2000 character।
- Error: `403` (completed visit নেই বা ভুল staff), `409` (এই visit-এর review আগেই দেওয়া হয়েছে)। দুটোতেই `message` field থাকে।

**Salon app:** pay-on-shop booking দুই পক্ষের সম্মতিতে cancel হলে €5 fee এখন due amount থেকে কেটে যায়। Salon account delete করা যাবে না যতক্ষণ €10 বা তার বেশি fee বাকি।

**App Action:**
- "Rate" button শুধু completed booking-এ দেখাও।
- 403/409 এলে backend-এর `message` দেখাও।
- Salon-এর delete-account error message দেখাও।

---

## Quick Summary Table

| # | Feature | Endpoint(s) | App Action Needed |
|---|---|---|---|
| 1 | Email (SMTP→Resend) | — | ⚪ None |
| 2 | Error status code fix | সব endpoint | 🟡 Error handling verify |
| 3 | Discount max 50% | `/discount/create-discount`, `/discount/update-discount` | 🔴 UI max value update |
| 4 | Customer profile optional fields | `/customer/complete-profile` | 🔴 Remove required validation |
| 5 | Phone normalization (+49) | সব phone-save করা endpoint | 🟡 FYI only |
| 6 | Pay-on-shop transaction log | `/transaction/*` | 🟡 FYI only (data will just appear) |
| 7 | Sales: recognized vs pending | `/meta/get-meta-data`, `/meta/sales-profit-chart-data` | 🔴 Show new `pendingSales` field |
| 8 | Auto-complete bookings (3hr grace) | `/booking/get-customer-bookings`, `/booking/get-shop-bookings` | 🔴 Verify review-eligibility & no-show deadline UX |
| 9 | Separate legal texts per app + Imprint | `/manage/get-terms-conditions`, `/manage/get-privacy-policy`, `/manage/get-imprint` | 🔴 Use `?app=customer` / `?app=client`, add Imprint screen |
| 10 | Public legal pages + support form | `POST /support/contact` | 🟡 Optional: link pages / use endpoint |
| 11 | Verified reviews + fee release on cancel | `/rating/create`, `/user/delete-account` | 🔴 Show Rate only for completed bookings; show error messages |
