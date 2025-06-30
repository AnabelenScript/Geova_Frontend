import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav className={`navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="LogoContainer">
        <img src="/src/assets/LogoCompleto.png" alt="Logo"  className={`logo-full ${collapsed ? 'hidden' : ''}`}/>
        <img src="/src/assets/LogoMini.png" alt="Logo mini" className={`logo-mini ${collapsed ? '' : 'hidden'}`}/>

      </div>
      <div className="links">
        <ul className="Mainlinks">
          <Link to="/" className="linkform"><li><i className="bx bx-home"></i> Inicio</li></Link>
          <Link to="/perfil" className="linkform"><li><i className="bx bxs-dashboard"></i> Dashboard</li></Link>
          <Link to="/login" className="linkform"><li><i className="bx bxs-add-to-queue"></i> Create</li></Link>
          <Link to="/login" className="linkform"><li><i className="bx bxs-user"></i> Profile</li></Link>
        </ul>
        <ul className="Mainlinks">
          <Link to="/" className="linkform"><li><i className="bx bxs-log-out"></i> Logout</li></Link>
        </ul>
      </div>
      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        <i className="bx bx-chevron-left"></i>
      </button>
    </nav>
  );
}

export default Navbar;