# Project memory

## Product intent & audience

- Photography portfolio website showcasing a photographer's work to potential clients
- Pages: Home (hero), Portfolio (filterable gallery), About (bio + stats), Contact (working form)
- Contact form submissions stored in database; publicly insertable, not readable via site
- Stock photos from Pexels used as clearly-credited placeholders for real photography

## Brand personality & voice

- Artistic, elegant, dramatic — evoking fine-art photography
- Placeholder persona: "Arnav Mehta" (name, bio, stats, contact details all to be replaced)

## Visual design & UX direction

- Dark charcoal theme with cream text and amber accent color
- Playfair Display serif for headings (photography/editorial feel)
- Full-screen hero with landscape image and CTA on home
- Masonry grid layout for portfolio (12 photos) with category filters: Portrait, Landscape, Street, Wedding
- Click-to-enlarge gallery viewer with next/previous navigation
- Hover reveals on gallery photos
- Sticky navigation menu that solidifies on scroll
- Working mobile menu; fully responsive phone → desktop
- Smooth scrolling enabled

## Decisions, constraints & rationale

- Contact form uses database table with insert-only row-level security; no public read/update/delete
- Default platform table privileges tightened to match the single insert-only policy
- Placeholder content intentionally marked so user can swap in real text/photos later
- Production build and type checks confirmed passing
- Live page click-through not verified; user advised to test contact form submission

## Open questions & assumptions

- Real photographer name, bio, stats, and contact details (email, city, Instagram) pending from user
- All photos are Pexels stock placeholders awaiting real work
- Live runtime behavior of contact form not yet confirmed by user