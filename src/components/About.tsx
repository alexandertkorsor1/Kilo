import { aboutImage } from '@/lib/images';

const facts = [
  { value: '8+', label: 'Years behind the lens' },
  { value: '120+', label: 'Commissioned shoots' },
  { value: '14', label: 'Exhibitions featured' },
];

export default function About() {
  return (
    <section id="about" className="bg-stone-900 py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-sm">
          <img
            src={aboutImage}
            alt="Arnav Mehta at work, framed in warm dramatic light"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-display text-4xl text-stone-50">About the photographer</h2>
          <p className="mt-6 leading-relaxed text-stone-300">
            I'm Kilo, a photographer based in Bengaluru, India. I work
            across portrait, landscape, street and wedding photography — always
            chasing honest light and unguarded moments.
          </p>
          <p className="mt-4 leading-relaxed text-stone-300">
            My prints and commissions have appeared in galleries across India.
            When I'm not shooting, I teach weekend workshops on natural-light
            portraiture.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-6">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="sr-only">{f.label}</dt>
                <dd className="font-display text-3xl text-amber-400">{f.value}</dd>
                <dd className="mt-1 text-xs text-stone-400">{f.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-stone-500">
            Note: biography details are placeholders awaiting final client copy.
          </p>
        </div>
      </div>
    </section>
  );
}
