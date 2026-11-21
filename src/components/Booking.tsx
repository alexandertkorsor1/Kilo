
import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, CalendarDays, Clock } from 'lucide-react';
import {
  ApiRequestError,
  submitBooking,
  getBookingAvailability,
} from '@/lib/api';

export default function Booking() {
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const inputClass =
    'w-full rounded-sm border border-stone-700 bg-stone-800 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none';

  // Load available times whenever the selected date changes.
  useEffect(() => {
    let active = true;

    setSelectedTime('');
    setAvailableSlots([]);
    setAvailabilityError('');

    if (!selectedDate) {
      setAvailabilityLoading(false);
      return;
    }

    async function loadAvailability() {
      setAvailabilityLoading(true);

      try {
        const response = await getBookingAvailability(selectedDate);

        if (active) {
          setAvailableSlots(response.slots);
        }
      } catch (err) {
        if (active) {
          setAvailabilityError(
            err instanceof ApiRequestError
              ? err.message
              : 'Unable to load available times. Please try again.'
          );
        }
      } finally {
        if (active) {
          setAvailabilityLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (availabilityLoading || availabilityError) {
      setError('Please wait until appointment availability has loaded.');
      return;
    }

    if (!selectedTime || !availableSlots.includes(selectedTime)) {
      setError('Please select an available appointment time.');
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);

    setLoading(true);
    setError('');
    setReference('');

    try {
      const response = await submitBooking({
        customer_name: String(data.get('customer_name') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        phone: String(data.get('phone') ?? '').trim(),
        service_type: String(data.get('service_type') ?? ''),
        session_date: selectedDate,
        session_time: selectedTime,
        location: String(data.get('location') ?? '').trim(),
        message: String(data.get('message') ?? '').trim() || undefined,
      });

      setReference(response.data.reference);

      form.reset();
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
      setAvailabilityError('');
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'Unable to submit your booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Use the business timezone configured by the backend.
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  return (
    <section id="booking" className="scroll-mt-20 bg-stone-900 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
            Book a session
          </p>

          <h2 className="mt-4 font-display text-4xl leading-tight text-stone-50">
            Let's create something memorable.
          </h2>

          <p className="mt-5 leading-relaxed text-stone-300">
            Tell me about the photography session you have in mind.
            Select your preferred date and an available time, and I'll review
            your request.
          </p>

          <div className="mt-8 space-y-5 text-sm text-stone-300">
            <div className="flex gap-3">
              <CalendarDays className="shrink-0 text-amber-400" />
              <span>Choose your preferred photography date.</span>
            </div>

            <div className="flex gap-3">
              <Clock className="shrink-0 text-amber-400" />
              <span>Your session remains pending until confirmed.</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-name" className="mb-2 block text-sm text-stone-400">
                Full name *
              </label>
              <input
                id="booking-name"
                name="customer_name"
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Your full name"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="booking-email" className="mb-2 block text-sm text-stone-400">
                Email *
              </label>
              <input
                id="booking-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-phone" className="mb-2 block text-sm text-stone-400">
                Phone number *
              </label>
              <input
                id="booking-phone"
                name="phone"
                type="tel"
                required
                maxLength={30}
                autoComplete="tel"
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="booking-service" className="mb-2 block text-sm text-stone-400">
                Photography service *
              </label>
              <select
                id="booking-service"
                name="service_type"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>Select a service</option>
                <option value="Portrait Photography">Portrait Photography</option>
                <option value="Wedding Photography">Wedding Photography</option>
                <option value="Event Photography">Event Photography</option>
                <option value="Family Photography">Family Photography</option>
                <option value="Commercial Photography">Commercial Photography</option>
                <option value="Other Photography">Other</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="booking-date" className="mb-2 block text-sm text-stone-400">
                Preferred date *
              </label>
              <input
                id="booking-date"
                name="session_date"
                type="date"
                min={today}
                required
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setError('');
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="booking-time" className="mb-2 block text-sm text-stone-400">
                Available time *
              </label>

              <select
                id="booking-time"
                name="session_time"
                required
                value={selectedTime}
                onChange={(event) => {
                  setSelectedTime(event.target.value);
                  setError('');
                }}
                disabled={
                  !selectedDate ||
                  availabilityLoading ||
                  !!availabilityError ||
                  availableSlots.length === 0
                }
                className={inputClass}
              >
                <option value="">
                  {!selectedDate
                    ? 'Select a date first'
                    : availabilityLoading
                      ? 'Loading available times...'
                      : availabilityError
                        ? 'Availability unavailable'
                        : availableSlots.length === 0
                          ? 'No available times'
                          : 'Select an available time'}
                </option>

                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>

              {availabilityLoading && (
                <p className="mt-2 text-xs text-stone-400">
                  Checking appointment availability...
                </p>
              )}

              {!availabilityLoading &&
                selectedDate &&
                availableSlots.length > 0 && (
                  <p className="mt-2 text-xs text-stone-400">
                    {availableSlots.length} available appointment times.
                  </p>
                )}

              {!availabilityLoading &&
                selectedDate &&
                availableSlots.length === 0 &&
                !availabilityError && (
                  <p className="mt-2 text-xs text-amber-400">
                    No appointments are available on this date. Please choose another date.
                  </p>
                )}

              {availabilityError && (
                <p role="alert" className="mt-2 text-xs text-red-400">
                  {availabilityError}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="booking-location" className="mb-2 block text-sm text-stone-400">
              Session location *
            </label>
            <input
              id="booking-location"
              name="location"
              required
              maxLength={255}
              placeholder="Where would you like the session?"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="booking-message" className="mb-2 block text-sm text-stone-400">
              Additional details
            </label>
            <textarea
              id="booking-message"
              name="message"
              rows={4}
              maxLength={3000}
              placeholder="Tell me more about your requirements..."
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="bg-red-950/60 p-4 text-sm text-red-300">
              {error}
            </p>
          )}

          {reference && (
            <div
              role="status"
              className="border border-emerald-800 bg-emerald-950/50 p-5 text-emerald-300"
            >
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 size={19} /> Booking request received!
              </p>

              <p className="mt-2 text-sm">
                Your reference: <strong>{reference}</strong>
              </p>

              <p className="mt-2 text-xs">
                Your booking is pending until the photographer confirms it.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              availabilityLoading ||
              !!availabilityError ||
              !selectedTime ||
              !availableSlots.includes(selectedTime)
            }
            className="rounded-sm bg-amber-400 px-8 py-4 text-sm font-medium uppercase tracking-widest text-stone-950 hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Request a booking'}
          </button>

          <p className="text-xs text-stone-500">
            Submitting a request does not guarantee availability or confirm your session.
          </p>
        </form>
      </div>
    </section>
  );
}

