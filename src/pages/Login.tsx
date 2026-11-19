import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

import { useAuth } from '@/context/useAuth';
import { ApiRequestError } from '@/lib/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const authenticatedUser = await login(email.trim(), password);

      if (authenticatedUser.role !== 'admin') {
        throw new Error('This account is not authorized to access the admin panel.');
      }

      navigate('/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const validationMessage = err.errors
          ? Object.values(err.errors).flat()[0]
          : undefined;

        setError(
          validationMessage ??
            (err.status === 429
              ? 'Too many login attempts. Please try again later.'
              : err.message)
        );
      } else {
        setError('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-16 text-stone-100">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-10 block text-center font-display text-xl tracking-widest text-stone-50"
        >
          ARNAV<span className="text-amber-400">.</span>PHOTO
        </Link>

        <section className="rounded-sm border border-stone-800 bg-stone-900 p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400">
              <LockKeyhole size={22} />
            </div>

            <h1 className="font-display text-3xl text-stone-50">
              Staff Login
            </h1>

            <p className="mt-2 text-sm text-stone-400">
              Sign in to access your Kilo workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-stone-300"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-sm border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 outline-none transition focus:border-amber-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-stone-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-sm border border-stone-700 bg-stone-950 px-4 py-3 pr-12 text-stone-100 outline-none transition focus:border-amber-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-sm border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm bg-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-sm text-stone-500">
          Public photography portfolio?{' '}
          <Link to="/" className="text-amber-400 hover:text-amber-300">
            Return home
          </Link>
        </p>
      </div>
    </main>
  );
}
