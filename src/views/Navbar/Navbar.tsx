
import './Navbar.css';
import { Link } from 'react-router-dom';
import logoFull from '../../assets/LogoCompleto.svg';
import logoMini from '../../assets/LogoMini.svg';

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

function Navbar({ collapsed, setCollapsed }: NavbarProps) {
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
          <Link to="menu" className="linkform"><li><i className="bx bx-home"></i> Inicio</li></Link>
          <Link to="dashboard" className="linkform"><li><i className="bx bxs-dashboard"></i> Dashboard</li></Link>
          <Link to="create" className="linkform"><li><i className="bx bxs-add-to-queue"></i> Create</li></Link>
          <Link to="login" className="linkform"><li><i className="bx bxs-user"></i> Profile</li></Link>
        </ul>
        <ul className="Mainlinks">
          <Link to="/" className="linkform"><li><i className="bx bxs-log-out"></i> Logout</li></Link>
        </ul>
      </div>

      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        <i className="bx bx-chevron-left" />
      </button>
    </nav>
  );
}

export default Navbar;
