import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../views/Login/LoginForm'
import CreateProject from '../views/CreateProject/CreateProjectPage';
import Layout from '../views/Navbar/Layout';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/" element= {<Layout/>}>
            <Route path="create" element={<CreateProject/>}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
