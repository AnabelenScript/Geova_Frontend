import { HashRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const Login = lazy(() => import("../views/Login/LoginForm"));
const CreateProject = lazy(() => import("../views/CreateProject/CreateProjectPage"));
const Layout = lazy(() => import("../views/Navbar/Layout"));
const TomarFoto = lazy(() => import("../views/VerCamara/TomarFoto"));
const Dashboard = lazy(() => import("../views/Dashboard/Dashboard"));
const DetallesProyecto = lazy(() => import("../views/DetallesProyecto/DetallesyGraficas"));
const MainMenu = lazy(() => import("../views/MainMenu/MainMenu"));
const MedirIrregularidades = lazy(() => import("../views/MedirIrregularidades/MedirIrregluaridades"));
const Profile = lazy(() => import("../views/Profile/Profile"));
const MedirTerrenoDual = lazy(() => import("../views/MedirTerrenoDual/MedirTerrenoDual"));

function AppRoutes() {
  return (
    <HashRouter>
      <Suspense fallback={<div>Cargando...</div>}>

        <Routes>

          {/* LOGIN BLOQUEADO SI YA ESTÁS LOGGEADO */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* RUTAS PROTEGIDAS */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="create" element={<CreateProject />} />
            <Route path="dashboard/detalles/:id/takephoto" element={<TomarFoto />} />
            <Route path="dashboard/takephotodual/:id" element={<MedirTerrenoDual />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dashboard/detalles/:id" element={<DetallesProyecto />} />
            <Route path="dashboard/detalles/:id/irregularidades" element={<MedirIrregularidades />} />
            <Route path="menu" element={<MainMenu />} />
            <Route path="profile" element={<Profile />} />
          </Route>

        </Routes>

      </Suspense>
    </HashRouter>
  );
}

export default AppRoutes;
