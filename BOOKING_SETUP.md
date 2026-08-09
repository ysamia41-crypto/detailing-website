# SoSlow Detailing Booking Setup

This adds a Calendly-style booking page to the existing Vercel site and books directly to a Google Calendar.

## Files

- `booking.html` — customer-facing booking page
- `api/availability.js` — reads Google Calendar free/busy and returns open slots
- `api/book.js` — verifies the slot again and creates the calendar event
- `package.json` — required Node dependencies

## 1. Put the files in the existing GitHub/Vercel project

Copy `booking.html`, the `api` folder, and the dependency entries from `package.json` into the root of the SoSlow Detailing project.

If the project already has a `package.json`, do not replace it. Add these dependencies instead:

```json
"googleapis": "^144.0.0",
"luxon": "^3.5.0"
```

## 2. Create a Google Cloud service account

1. Create or select a Google Cloud project.
2. Enable the Google Calendar API.
3. Create a service account and a JSON key.
4. Copy the service account's email address.
5. **For your current test**, use the primary calendar for `ysamia41@gmail.com`.
6. Share that calendar with the service-account email and give it permission to **Make changes to events**.
7. Use `ysamia41@gmail.com` as `GOOGLE_CALENDAR_ID` in Vercel. Later, you can switch to a dedicated **SoSlow Bookings** calendar without changing the booking page.

A dedicated booking calendar is recommended instead of exposing a personal calendar.

## 3. Add Vercel environment variables

In Vercel > Project > Settings > Environment Variables, add:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = the service account email
- `GOOGLE_PRIVATE_KEY` = the `private_key` value from the JSON key
- `GOOGLE_CALENDAR_ID` = `ysamia41@gmail.com` for testing (the code also uses this as its current fallback)
- `BUSINESS_TIMEZONE` = `America/Chicago`

Never put the private key inside `booking.html` or commit it to GitHub.

After adding environment variables, redeploy the Vercel project.

## 4. Replace the old Calendly buttons

Change each package's `Book Now` link to one of these:

```html
<a href="/booking.html?service=shell-shine-basic" class="small-btn">Book Now</a>
<a href="/booking.html?service=exterior-detail" class="small-btn">Book Now</a>
<a href="/booking.html?service=interior-detail" class="small-btn">Book Now</a>
<a href="/booking.html?service=full-detail" class="small-btn">Book Now</a>
<a href="/booking.html?service=golden-shell-pack" class="small-btn">Book Now</a>
```

## 5. Current assumptions you can edit

The sample code currently uses:

- Monday–Saturday, 9:00 AM–6:00 PM
- 30-minute start intervals
- 60-minute minimum notice for same-day bookings
- bookings up to 60 days in advance
- Shell Shine Basic: 60 minutes
- Exterior Detail: 90 minutes
- Interior Detail: 120 minutes
- Full Detail: 180 minutes
- Golden Shell Pack: 240 minutes

Change the `BUSINESS_HOURS` and `SERVICES` constants in both API files if the real hours/durations are different.

## Important security note

The browser only talks to `/api/availability` and `/api/book`. Google credentials stay in Vercel environment variables and are used only by server-side Vercel Functions.


## Current testing calendar

The API currently falls back to `ysamia41@gmail.com` if `GOOGLE_CALENDAR_ID` is not set. For Vercel, you should still explicitly add `GOOGLE_CALENDAR_ID=ysamia41@gmail.com` so the configuration is clear.
