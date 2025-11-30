import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoFull from '../../assets/LogoCompleto.svg';
import logoMini from '../../assets/LogoMini.svg';

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

function Navbar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("loggeduser:")) {
        localStorage.removeItem(key);
      }
    });

    navigate("/", { replace: true });
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  const handleLinkClick = () => {
    // Cerrar menú en móvil al hacer click en un link
    setMobileOpen(false);
  };

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      <button 
        className={`hamburger-btn ${mobileOpen ? 'open' : ''}`} 
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay para cerrar menú en móvil */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <nav className={`navbar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="LogoContainer">
          <img
            src={logoFull}
            alt="Logo"
            className={`logo-full ${collapsed ? 'hidden' : ''}`}
          />
          <img
            src={logoMini}
            alt="Logo mini"
            className={`logo-mini ${collapsed ? '' : 'hidden'}`}
          />
        </div>

        <div className="links">
          <ul className="Mainlinks">
            <Link to="menu" className={`linkform ${isActive('menu') ? 'active' : ''}`} onClick={handleLinkClick}>
              <li><i className='bx bxs-home'></i> <span>Inicio</span></li>
            </Link>
            <Link to="dashboard" className={`linkform ${isActive('dashboard') ? 'active' : ''}`} onClick={handleLinkClick}>
              <li><i className="bx bxs-dashboard"></i> <span>Dashboard</span></li>
            </Link>
            <Link to="create" className={`linkform ${isActive('create') ? 'active' : ''}`} onClick={handleLinkClick}>
              <li><i className="bx bxs-add-to-queue"></i> <span>Create</span></li>
            </Link>
            <Link to="profile" className={`linkform ${isActive('profile') ? 'active' : ''}`} onClick={handleLinkClick}>
              <li><i className="bx bxs-user"></i> <span>Profile</span></li>
            </Link>
          </ul>
          <ul className="Mainlinks">
            <li className="linkform" style={{ cursor: 'pointer' }} onClick={handleLogout}>
              <i className="bx bxs-log-out"></i> <span>Logout</span>
            </li>
          </ul>
        </div>

        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <i className="bx bx-chevron-left" />
        </button>
      </nav>
    </>
  );
}

export default Navbar;