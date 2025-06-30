import { Link } from 'react-router-dom';
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
        <div className='LogoContainer'>
            <img src="/src/assets/LogoCompleto.png" alt="" />
        </div>
        <div>
      <ul>
        <li><i className="bx bx-home"></i> <Link to="/">Inicio</Link></li>
        <li><i className='bx bxs-dashboard'></i><Link to="/perfil"> Dashboard</Link></li>
        <li><i className='bx bxs-add-to-queue' ></i><Link to="/login">Create</Link></li>
        <li><i className='bx bxs-user' ></i><Link to="/login">Profile</Link></li>
        <li><i className='bx bxs-cog' ></i><Link to="/login">Configuration</Link></li>
      </ul>
      <ul>
        <li><i className='bx bxs-log-out' ></i><Link to="/">Logout</Link></li>
      </ul>
      </div>
    </nav>
  );
}

export default Navbar;
