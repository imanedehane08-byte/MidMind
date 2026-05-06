// Route guard that redirects logged-out users to the login page.
import { Redirect } from "wouter";
import { useAuth } from "../context/AuthContext";

// Shows protected content only after authentication is confirmed.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}
