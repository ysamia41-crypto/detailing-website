import { google } from 'googleapis';
import { DateTime, Interval } from 'luxon';

const TIME_ZONE = process.env.BUSINESS_TIMEZONE || 'America/Chicago';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'ysamia41@gmail.com';

// Change these whenever SoSlow's hours or service lengths change.
const BUSINESS_HOURS = {
  // 1 = Monday ... 7 = Sunday
  1: ['09:00', '18:00'],
  2: ['09:00', '18:00'],
  3: ['09:00', '18:00'],
  4: ['09:00', '18:00'],
  5: ['09:00', '18:00'],
  6: ['09:00', '18:00']
};

const SERVICES = {
  'shell-shine-basic': { duration: 60 },
  'exterior-detail': { duration: 90 },
  'interior-detail': { duration: 120 },
  'full-detail': { duration: 180 },
  'golden-shell-pack': { duration: 240 }
};

function getCalendarClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !CALENDAR_ID) {
    throw new Error('Calendar environment variables are not configured.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  return google.calendar({ version: 'v3', auth });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { date, service } = req.query;
    const serviceConfig = SERVICES[service];

    if (!serviceConfig) return res.status(400).json({ error: 'Please select a valid service.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'Please select a valid date.' });

    const day = DateTime.fromISO(date, { zone: TIME_ZONE });
    if (!day.isValid) return res.status(400).json({ error: 'Please select a valid date.' });

    const today = DateTime.now().setZone(TIME_ZONE).startOf('day');
    if (day < today) return res.status(400).json({ error: 'That date has already passed.' });
    if (day > today.plus({ days: 60 })) return res.status(400).json({ error: 'Bookings are available up to 60 days ahead.' });

    const hours = BUSINESS_HOURS[day.weekday];
    if (!hours) return res.status(200).json({ slots: [] });

    const open = DateTime.fromISO(`${date}T${hours[0]}`, { zone: TIME_ZONE });
    const close = DateTime.fromISO(`${date}T${hours[1]}`, { zone: TIME_ZONE });

    const calendar = getCalendarClient();
    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: open.toUTC().toISO(),
        timeMax: close.toUTC().toISO(),
        timeZone: TIME_ZONE,
        items: [{ id: CALENDAR_ID }]
      }
    });

    const busy = (freeBusy.data.calendars?.[CALENDAR_ID]?.busy || []).map(item =>
      Interval.fromDateTimes(
        DateTime.fromISO(item.start),
        DateTime.fromISO(item.end)
      )
    );

    const now = DateTime.now().setZone(TIME_ZONE);
    const slots = [];

    for (let cursor = open; cursor.plus({ minutes: serviceConfig.duration }) <= close; cursor = cursor.plus({ minutes: 30 })) {
      const end = cursor.plus({ minutes: serviceConfig.duration });
      const candidate = Interval.fromDateTimes(cursor, end);

      // Require at least 60 minutes notice for same-day bookings.
      if (cursor < now.plus({ minutes: 60 })) continue;
      if (busy.some(interval => interval.overlaps(candidate))) continue;

      slots.push({
        start: cursor.toISO(),
        end: end.toISO(),
        label: cursor.toFormat('h:mm a')
      });
    }

    return res.status(200).json({ slots, timeZone: TIME_ZONE });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not check the calendar right now.' });
  }
}
