import { heroImage } from '@/lib/images';

export default function Hero() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center">
      <img
        src={heroImage}
        alt="Dramatic mountain landscape at sunset"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/40 to-stone-950" />
      <div className="relative z-10 px-6 text-center">
        <p className="mb-4 text-sm uppercase tracking-[0.35em] text-amber-400">
          Photography Portfolio
        </p>
        <h1 className="font-display text-5xl leading-tight text-stone-50 sm:text-6xl md:text-7xl">
          Light, caught<br />at the perfect moment.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-stone-300">
          Portrait, landscape, street and wedding photography by Kilo.
        </p>
        <a
          href="#portfolio"
          className="mt-10 inline-block rounded-sm bg-amber-400 px-8 py-3 text-sm font-medium uppercase tracking-widest text-stone-950 transition hover:bg-amber-300"
        >
          View the work
        </a>
      </div>
    </section>
  );
}
