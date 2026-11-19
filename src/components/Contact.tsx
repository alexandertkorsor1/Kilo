
import { useState, type FormEvent } from 'react';
import { Mail, MapPin, Instagram } from 'lucide-react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const subject = String(data.get('subject') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!name || !email || !subject || !message) {
      setErrorMsg('Please fill in every field.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/inquiries`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ name, email, subject, message }),
});

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          const validationErrors = result.errors
            ? Object.values(result.errors).flat()
            : [];

          throw new Error(
            validationErrors.length
              ? String(validationErrors[0])
              : 'Please check your submitted information.'
          );
        }

        throw new Error(
          result.message || 'Something went wrong. Please try again.'
        );
      }

      form.reset();
      setStatus('sent');
    } catch (error) {
      console.error('Inquiry submission failed:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server. Please try again.'
      );

      setStatus('error');
    }
  }

  const inputClass =
    'w-full rounded-sm border border-stone-700 bg-stone-800 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none transition-colors';

  return (
    <section id="contact" className="bg-stone-950 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="font-display text-4xl text-stone-50">
            Get in touch
          </h2>

          <p className="mt-4 leading-relaxed text-stone-300">
            Booking a shoot, licensing a print, or just want to talk
            photography? Send a message and I'll reply within two working days.
          </p>

          <ul className="mt-8 space-y-4 text-stone-300">
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-amber-400" aria-hidden />
              <a
                href="mailto:hello@arnav.photo"
                className="transition-colors hover:text-amber-400"
              >
                hello@arnav.photo
              </a>
            </li>

            <li className="flex items-center gap-3">
              <MapPin size={18} className="text-amber-400" aria-hidden />
              Bengaluru, India
            </li>

            <li className="flex items-center gap-3">
              <Instagram size={18} className="text-amber-400" aria-hidden />
              <span>@arnav.photo</span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm text-stone-400"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={120}
                autoComplete="name"
                placeholder="Your name"
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm text-stone-400"
              >
                Email
              </label>
              <input
                id="email"
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

          <div>
            <label
              htmlFor="subject"
              className="mb-1.5 block text-sm text-stone-400"
            >
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              maxLength={200}
              placeholder="What is this about?"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm text-stone-400"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={5000}
              rows={5}
              placeholder="Tell me about your project, dates, and location…"
              className={inputClass}
            />
          </div>

          {status === 'error' && (
            <p
              role="alert"
              className="rounded-sm bg-red-950/60 px-4 py-3 text-sm text-red-300"
            >
              {errorMsg}
            </p>
          )}

          {status === 'sent' && (
            <p
              role="status"
              className="rounded-sm bg-emerald-950/60 px-4 py-3 text-sm text-emerald-300"
            >
              Thank you — your message has been received. I'll reply within two
              working days.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-sm bg-amber-400 px-8 py-3 text-sm font-medium uppercase tracking-widest text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </section>
  );
}
