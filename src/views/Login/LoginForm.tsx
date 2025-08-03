import { useState } from 'react';
import './LoginForm.css';
import { usersViewModel } from '../../viewmodels/UserViewModel';

import maquinaImg from '../../assets/Maquina.png';
import logoImg from '../../assets/Geova_logo.png';

interface FormState {
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState<FormState>({
    username: '',
    nombre: '',
    apellidos: '',
    email: '',
    password: ''
  });


  const toggleMode = () => setIsLogin(!isLogin);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (isLogin) {
      await usersViewModel.handleLogin(form.email, form.password);
    } else {
      await usersViewModel.handleRegister(
        form.username,
        form.nombre,
        form.apellidos,
        form.email,
        form.password,
      );
    }
  };

  return (
    <div className="Login">
      <div className={`LoginContainer ${!isLogin ? 'register-machine' : ''}`}>
        <div className={`Machine ${isLogin ? '' : 'register-machine'}`}>
          <img src={maquinaImg} alt="Máquina" />
        </div>
        <div className={`FormContainer ${isLogin ? 'login-mode' : 'register-mode'}`}>
          <div className="Formtitle">
            <img src={logoImg} alt="Logo" className='logo' />
            <h1>{isLogin ? 'Login' : 'Sign up'}</h1>
          </div>
          <div className='Form'>
            {!isLogin && (
              <>
                <div className='inputform'>
                  <label>Username</label>
                  <input type="text" name="username" value={form.username} onChange={handleChange} />
                </div>
                <div className='inputform'>
                  <label>Name</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} />
                </div>
                <div className='inputform'>
                  <label>Last Name</label>
                  <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} />
                </div>
              </>
            )}
            <div className='inputform'>
              <label>Email</label>
              <input type="text" name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className='inputform'>
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} />
            </div>
            <div className='buttonform'>
              <button className='loginbutton' onClick={handleSubmit}>
                {isLogin ? 'Login' : 'Register'}
              </button>
              <p>
                {isLogin ? "Don't have an account? " : "Do you already have an account? "}
                <span onClick={toggleMode} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
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
