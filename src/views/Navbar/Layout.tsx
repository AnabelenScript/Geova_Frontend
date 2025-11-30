import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import '../Navbar/Navbar.css'

function Layout() {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  return (
    <div style={{ display: 'flex' }}>
      <Navbar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <Outlet />
      </main>
      <div id="modal-root"></div>
    </div>
  );
}

export default Layout;
