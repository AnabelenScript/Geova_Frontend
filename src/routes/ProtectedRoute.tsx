import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  const user = Object.keys(localStorage).find(key => key.startsWith("loggeduser:"));

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
