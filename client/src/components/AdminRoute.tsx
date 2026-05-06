// Route guard that only allows admin users to access admin pages.
import { Redirect } from "wouter";
import { useAuth } from "../context/AuthContext";

// Redirects non-admin users away from admin-only content.
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/" />;
  return <>{children}</>;
}
