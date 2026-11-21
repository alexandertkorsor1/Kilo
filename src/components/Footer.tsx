export default function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-stone-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} Kilo Photographer. All rights reserved.
        </p>
        <p>Capturing moments. Creating lasting memories.</p>
      </div>
    </footer>
  );
}