// src/views/Layout.tsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout() {
  return (
    <>
    <div style={{ display: 'flex', height: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet /> {}</main>
    </div>
    </>
  );
}

export default Layout;
