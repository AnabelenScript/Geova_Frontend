import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../views/Login/LoginForm'
import CreateProject from '../views/CreateProject/CreateProjectPage';
import Layout from '../views/Navbar/Layout';
import TomarFoto from '../views/VerCamara/TomarFoto';
import Dashboard from '../views/Dashboard/Dashboard';
import DetallesProyecto from '../views/DetallesProyecto/DetallesyGraficas';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/" element= {<Layout/>}>
            <Route path="create" element={<CreateProject/>}/>
            <Route path="takephoto" element={<TomarFoto/>}/>
            <Route path="dashboard" element={<Dashboard/>}/>
            <Route path="detalles/:id" element={<DetallesProyecto/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
