import './Navbar.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoFull from '../../assets/LogoCompleto.svg';
import logoMini from '../../assets/LogoMini.svg';

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

function Navbar({ collapsed, setCollapsed }: NavbarProps) {
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

  return (
    <nav className={`navbar ${collapsed ? 'collapsed' : ''}`}>
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
          <Link to="menu" className={`linkform ${isActive('menu') ? 'active' : ''}`}>
            <li><i className='bx bxs-home'></i> Inicio</li>
          </Link>
          <Link to="dashboard" className={`linkform ${isActive('dashboard') ? 'active' : ''}`}>
            <li><i className="bx bxs-dashboard"></i> Dashboard</li>
          </Link>
          <Link to="create" className={`linkform ${isActive('create') ? 'active' : ''}`}>
            <li><i className="bx bxs-add-to-queue"></i> Create</li>
          </Link>
          <Link to="profile" className={`linkform ${isActive('profile') ? 'active' : ''}`}>
            <li><i className="bx bxs-user"></i> Profile</li>
          </Link>
        </ul>
        <ul className="Mainlinks">
          <li className="linkform" style={{ cursor: 'pointer' }} onClick={handleLogout}>
            <i className="bx bxs-log-out"></i> Logout
          </li>
        </ul>
      </div>

      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        <i className="bx bx-chevron-left" />
      </button>
    </nav>
  );
}

export default Navbar;