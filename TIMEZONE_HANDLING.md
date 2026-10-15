# Timezone Handling (Carenes Salon Backend)

> Read this before touching anything that deals with dates, times, "today",
> "this month", business hours, bookings, stats, or notification/log text.

## 1. The rule in one line

**All salons are in Germany. Every "calendar" decision (what day is it, what is
the weekday, when does the month start, what time do we show the user) is made in
`Europe/Berlin`, never in the server's own timezone.**

The server may run anywhere (UTC cloud host, a developer laptop in Bangladesh,
Docker). The result must be identical everywhere.

## 2. How times are stored vs. interpreted

| Thing | Representation |
|---|---|
| Anything saved in MongoDB (`startTime`, `endTime`, `createdAt`, discount dates...) | A real moment in time (JS `Date`, stored as UTC by MongoDB). Timezone-independent. |
| What the customer/shop *means* ("10:00 on 2026-03-29") | A salon-local **date string `YYYY-MM-DD`** + **time string `HH:mm`**, interpreted as Berlin time. |
| Business hours / block hours | Stored as `"HH:mm"` strings. They mean Berlin local time. |

Converting between the two is done **only** with the helpers in
[src/app/utilities/salonTime.ts](src/app/utilities/salonTime.ts). Berlin switches
between CET (UTC+1) and CEST (UTC+2); the helpers handle that automatically,
including the 23-hour (March) and 25-hour (October) days.

## 3. Two layers of protection

1. **Code layer (the real fix).** Business logic uses the `salonTime` helpers, so
   it does not depend on the server timezone at all.
2. **Safety net.** [src/app/config/timezone.ts](src/app/config/timezone.ts) sets
   `process.env.TZ = 'Europe/Berlin'`. It is the **first import in
   [src/server.ts](src/server.ts)** - do not move or remove it. It makes anything
   that still uses "local time" (third-party code, a forgotten `new Date()`
   getter) behave the same on every host.

If you remove (2), the app must still be correct - (1) must never rely on it.
If you add code that relies on (2) only, it is a bug.

## 4. The helper API (`utilities/salonTime.ts`)

Constant: `SALON_TIMEZONE = 'Europe/Berlin'` - the only place the zone is named.
To support another country later, this is where you start (see section 8).

| Helper | Use it for | Example |
|---|---|---|
| `toSalonDateTime(date, 'HH:mm')` | Salon date + time -> real instant (`Date`) | `toSalonDateTime('2026-03-29','10:00')` |
| `formatSalonTime(date)` | Instant -> `"HH:mm"` in Berlin | slot labels |
| `formatSalonDate(date?)` | Instant -> `"YYYY-MM-DD"` in Berlin (default: now = "today") | today's date |
| `isValidDateOnly(v)` / `DATE_ONLY_REGEX` | Validate `YYYY-MM-DD` input | request validation |
| `getSalonWeekday(date)` | `"Monday"`... for a date | business-hour lookup |
| `getUpcomingSalonDates(n)` | Next `n` dates starting today (Berlin) | slot calendar |
| `startOfSalon('day'\|'month'\|'year', date?)` | First ms of the Berlin day/month/year | range filters |
| `endOfSalon('day'\|'month'\|'year', date?)` | Last ms of the Berlin day/month/year | range filters |
| `startOfSalonMonthOffset(-1, date?)` | Start of previous/next month in Berlin | month-over-month stats |
| `startOfSalonYear(2026)` / `endOfSalonYear(2026)` | Whole calendar year in Berlin | yearly charts |
| `formatSalonDisplayDate(date)` | `"DD/MM/YY"` text for messages | notifications |
| `formatSalonDisplayTime(date)` | `"5:00 pm"` text for messages | notifications |
| `formatSalonCompactTimestamp(date?)` | `"YYYYMMDDHHmmss"` | file names / ids |

[src/app/helper/getCurrentDay.ts](src/app/helper/getCurrentDay.ts) returns the
current weekday **in Berlin** (built on the helpers above).

## 5. Do / Don't

**Don't** (these silently use the server timezone):

```ts
date.setHours(0, 0, 0, 0)            // "start of day" in SERVER time
date.getHours() / getDate() / getMonth() / getFullYear() / getDay()
new Date(year, month, 1)             // local-time constructor
date.toLocaleDateString() / toLocaleTimeString() / toString()
new Date('2026-03-29T10:00')         // no offset -> parsed as SERVER local time
dayjs().startOf('day')               // without .tz(...)
{ $month: '$startTime' }             // Mongo aggregation defaults to UTC
```

**Do**:

```ts
startOfSalon('day') / endOfSalon('month')
toSalonDateTime(dateStr, 'HH:mm')
formatSalonTime(d) / formatSalonDate(d) / formatSalonDisplayDate(d)
{ $month: { date: '$startTime', timezone: SALON_TIMEZONE } }   // in aggregations
```

Plain *instant comparisons* are fine and need no helper:
`new Date()`, `Date.now()`, `startTime: { $lte: now }`, "cancel at least 2 hours
before", OTP expiry, "5 minutes ago" cleanup jobs, discount `start <= now <= end`.
Only code that asks **"which day / month / year / hour is it?"** needs the helpers.

### Mongo aggregation date operators
`$month`, `$year`, `$dayOfMonth`, `$dayOfWeek`, `$hour`, `$dateToString`,
`$dateTrunc` all default to **UTC**. Always pass
`timezone: SALON_TIMEZONE`, e.g.

```ts
{ $dateToString: { format: '%Y-%m-%d', date: '$startTime', timezone: SALON_TIMEZONE } }
```

## 6. What was changed in this project (and why)

| File | Before | Now |
|---|---|---|
| `utilities/salonTime.ts` | Had date/time conversion only | Added day/month/year range helpers and display formatters |
| `config/timezone.ts` + `server.ts` | No TZ set anywhere | `process.env.TZ = 'Europe/Berlin'` as first import |
| `booking/booking.service.ts` `getShopBookings` | `setHours(0..)` day filter in server time | Whole Berlin day via `startOfSalon/endOfSalon`; `YYYY-MM-DD` input read as a Berlin date |
| `booking/booking.service.ts` `getSalesAndServiceData` | today/month/year ranges in server time; month end was `day 0 00:00` (last day excluded); year end was Dec 31 00:00 (last day excluded) | Berlin ranges, **inclusive of the full last day** |
| `meta/meta.services.ts` | Month/year boundaries in server time; `$month` grouped in UTC | Berlin month/year boundaries; `$month` uses `timezone: SALON_TIMEZONE` |
| `booking_reschedule/booking_reschedule.service.ts` | Notification text used `getHours()` / `toLocaleDateString` (server time; also showed `0:30 am` wrongly at midnight) | `formatSalonDisplayDate/Time` -> always Berlin, `12:30 am` correct |
| `shared/logger.ts` | Log time from server-local getters | Log time formatted in Berlin |
| `utilities/timestamp.ts` | Server-local getters | Delegates to `formatSalonCompactTimestamp` |

Already correct before (kept): booking slot generation, business hours, block
hours, booking create/reschedule start/end time (`toSalonDateTime`,
`formatSalonTime`, `getSalonWeekday`, `getUpcomingSalonDates`).

## 7. Known behaviour / things to be aware of

- **Discount dates** (`discount.validation.ts`, `discount.model.ts`) are parsed
  with `new Date(string)` and treated as instants (compared with `now`). If the
  client sends a full ISO string with offset/`Z` this is exact. If it sends a bare
  `YYYY-MM-DD`, JS reads it as UTC midnight (= 01:00/02:00 Berlin). Decide with the
  frontend whether discount ends at "end of the Berlin day" and, if so, convert
  with `toSalonDateTime(date, '23:59')` / `endOfSalon('day', ...)`.
  The `validator` block inside `discountEndDate` in `discount.model.ts` is
  misplaced (Mongoose needs `validate: { validator }`), so it never runs; the zod
  schema is what actually validates. Do not "fix" its `setHours` without testing.
- **Stats naming:** in `getSalesAndServiceData`, `timeRange=last-month` and
  `last-year` actually mean the **current** month / **current** year. Behaviour
  was kept to avoid breaking clients; only the boundaries were corrected.
- **Output format to clients:** APIs return ISO instants (`...Z`). The mobile/web
  client must convert them to Berlin time for display (or use the formatted
  strings the backend provides). Never send/accept an ISO string without an
  offset for a booking moment; send date + time separately (`date: "YYYY-MM-DD"`,
  `startTime: "HH:mm"`) as the booking APIs already do.

## 8. Checklist for new code

1. Does it only compare moments (`now`, `Date.now()`, "2 hours before")? ->
   plain `Date` is fine.
2. Does it need "today", "this month", a weekday, or text shown to a user? ->
   use `salonTime` helpers.
3. Is it a Mongo aggregation grouping by date parts? -> pass
   `timezone: SALON_TIMEZONE`.
4. Is the input a date + time from a user? -> `isValidDateOnly` +
   `toSalonDateTime`.
5. Never add `moment`, raw `Intl`/`toLocale*`, or a second dayjs setup - extend
   `salonTime.ts` instead so there is one source of truth.

### Supporting another country/timezone in future
Today the zone is a single constant. If salons in other countries are added:
store an IANA timezone on each shop (e.g. `Client.timezone`), pass it into the
helpers (add an optional `tz = SALON_TIMEZONE` parameter), and use the shop's zone
for slot/business-hour logic. Platform-wide dashboards can stay on Berlin.
Remember `process.env.TZ` is then only a default, not a rule.

## 9. How to verify quickly

Run the app (or a small script) under different host timezones; results must be
identical:

```bash
TZ=UTC            npx ts-node --transpile-only script.ts
TZ=Asia/Dhaka     npx ts-node --transpile-only script.ts
TZ=America/New_York npx ts-node --transpile-only script.ts
```

Useful expectations (Berlin):

- `startOfSalon('day', 2026-10-11T22:30Z)` -> `2026-10-11T22:00:00Z`
  (that instant is already Oct 12 in Berlin).
- 2026-10-25 (clocks go back) is a 25-hour day:
  `2026-10-24T22:00Z` -> `2026-10-25T22:59:59.999Z`.
- `formatSalonDisplayTime(2026-02-11T23:30Z)` -> `12:30 am`.
- `endOfSalonYear(2026)` -> `2026-12-31T22:59:59.999Z`.
