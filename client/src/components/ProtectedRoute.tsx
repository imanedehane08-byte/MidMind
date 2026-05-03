import { Redirect } from "wouter";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}
