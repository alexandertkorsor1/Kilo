import { Navigate, Route, Routes } from 'react-router-dom';

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Gallery from '@/components/Gallery';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Booking from '@/components/Booking';
import Footer from '@/components/Footer';

import Login from '@/pages/Login';
import RequireAdmin from '@/components/RequireAdmin';
import AdminLayout from '@/components/admin/AdminLayout';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminGallery from '@/pages/admin/AdminGallery';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminInquiries from '@/pages/admin/AdminInquiries';
import AdminSettings from '@/pages/admin/AdminSettings';

function PublicWebsite() {
  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Gallery />
        <About />
        <Booking />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicWebsite />} />

      <Route path="/kilo-control" element={<Login />} />

      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}