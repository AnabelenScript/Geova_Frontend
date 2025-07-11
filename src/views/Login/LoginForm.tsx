import { useState } from 'react';
import './LoginForm.css';
import { usersViewModel } from '../../viewmodels/UserViewModel';
import { useNavigate } from 'react-router-dom';

interface FormState {
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}

function Login() {
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    username: '',
    nombre: '',
    apellidos: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const toggleMode = () => setIsLogin(!isLogin);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (isLogin) {
      const res = await usersViewModel.handleLogin(form.email, form.password);
      if (res.success) {
        alert("Login successful");
        navigate('/Create')
      } else {
      }
    } else {
      const res = await usersViewModel.handleRegister(form.username,form.nombre,form.apellidos,form.email,form.password);
      if (res.success) {
        alert("User registered");
      } else {
        alert("Registration failed: " + res.error);
      }
    }
  };

  return (
    <div className="Login">
      <div className={`LoginContainer ${!isLogin ? 'register-machine' : ''}`}>
        <div className={`Machine ${isLogin ? '' : 'register-machine'}`}>
          <img src="/src/assets/Maquina.png" alt="Máquina" />
        </div>
        <div className={`FormContainer ${isLogin ? 'login-mode' : 'register-mode'}`}>
          <div className="Formtitle">
            <img src="/src/assets/Geova_logo.png" alt="Logo" className='logo' />
            <h1>{isLogin ? 'Login' : 'Sign up'}</h1>
          </div>
          <div className='Form'>
            {!isLogin && (
              <>
                <div className='inputform'>
                  <label>Username</label>
                  <input type="text" name="username" value={form.username} onChange={handleChange} placeholder='Username'/>
                </div>
                <div className='inputform'>
                  <label>Name</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder='Name'/>
                </div>
                <div className='inputform'>
                  <label>Last Name</label>
                  <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder='Last Name'/>
                </div>
              </>)}
            <div className='inputform'>
              <label>Email</label>
              <input type="text" name="email" value={form.email} onChange={handleChange} placeholder='Email'/>
            </div>
            <div className='inputform'>
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder='Password' required/>
            </div>
            <div className='buttonform'>
              <button className='loginbutton' onClick={handleSubmit}>
                {isLogin ? 'Login' : 'Register'}
              </button>
              <p>
                {isLogin ? "Don't have an account? " : "Do you already have an account? "}
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={toggleMode}
                >
                  {isLogin ? 'Sign up' : 'Login'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
