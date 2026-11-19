import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';

export default function RequireAdmin() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-300">
        Verifying administrator access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/kilo-control" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
