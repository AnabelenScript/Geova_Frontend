import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  const user = Object.keys(localStorage).find(key => key.startsWith("loggeduser:"));

  if (token && user) {
    return <Navigate to="/menu" replace />;
  }

  return children;
}
