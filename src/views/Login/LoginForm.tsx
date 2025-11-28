import { useState } from 'react';
import './LoginForm.css';
import { usersViewModel } from '../../viewmodels/UserViewModel';
import Swal from 'sweetalert2';

import maquinaImg from '../../assets/Maquina.png';
import logoImg from '../../assets/Geova_logo.svg';

interface FormState {
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}

interface ErrorState {
  username?: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  password?: string;
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

  const [errors, setErrors] = useState<ErrorState>({});

  const toggleMode = () => {
    setErrors({});
    setIsLogin(!isLogin);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' })); // limpiar error al escribir
  };

  // -------------------------
  // VALIDACIONES
  // -------------------------
  const validate = () => {
    let newErrors: ErrorState = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;

    if (!form.email.trim()) newErrors.email = "Email requerido";
    else if (!emailRegex.test(form.email)) newErrors.email = "Formato de email inválido";

    if (!form.password.trim()) newErrors.password = "Contraseña requerida";
    else if (form.password.length < 6) newErrors.password = "La contraseña debe tener mínimo 6 caracteres";

    if (!isLogin) {
      if (!form.username.trim()) newErrors.username = "Username requerido";
      else if (!usernameRegex.test(form.username)) newErrors.username = "El username debe tener mínimo 3 caracteres (letras o numeros)";

      if (!form.nombre.trim()) newErrors.nombre = "Nombre requerido";
      else if (!nameRegex.test(form.nombre)) newErrors.nombre = "El nombre solo puede contener letras";

      if (!form.apellidos.trim()) newErrors.apellidos = "Apellidos requeridos";
      else if (!nameRegex.test(form.apellidos)) newErrors.apellidos = "El apellido solo puede contener letras";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    const validation = validate();

    // SI HAY CAMPOS VACÍOS → ALERTA
    if (Object.keys(validation).length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, llena todos los campos correctamente.",
      });
      return;
    }

    // SI TODO ESTÁ OK → LLAMADA API
    if (isLogin) {
      await usersViewModel.handleLogin(form.email, form.password);
    } else {
      await usersViewModel.handleRegister(
        form.username,
        form.nombre,
        form.apellidos,
        form.email,
        form.password
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
            <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
          </div>

          <div className='Form'>
            
            {!isLogin && (
              <>
                <div className='inputform'>
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="username" 
                    value={form.username}
                    onChange={handleChange}
                    className={errors.username ? "input-error" : ""}
                  />
                  {errors.username && <p className="error-text">{errors.username}</p>}
                </div>

                <div className='inputform'>
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={form.nombre}
                    onChange={handleChange}
                    className={errors.nombre ? "input-error" : ""}
                  />
                  {errors.nombre && <p className="error-text">{errors.nombre}</p>}
                </div>

                <div className='inputform'>
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="apellidos" 
                    value={form.apellidos}
                    onChange={handleChange}
                    className={errors.apellidos ? "input-error" : ""}
                  />
                  {errors.apellidos && <p className="error-text">{errors.apellidos}</p>}
                </div>
              </>
            )}

            <div className='inputform'>
              <label>Email</label>
              <input 
                type="text" 
                name="email" 
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className='inputform'>
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                value={form.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <div className='buttonform'>
              <button className='loginbutton' onClick={handleSubmit}>
                {isLogin ? 'Login' : 'Register'}
              </button>

              <p>
                {isLogin ? "Don't have an account? " : "Do you already have an account? "}
                <span
                  onClick={toggleMode}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
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
