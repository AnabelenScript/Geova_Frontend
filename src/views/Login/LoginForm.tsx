import { useState } from "react";
import "./LoginForm.css";
import { usersViewModel } from "../../viewmodels/UserViewModel";
import maquinaImg from "../../assets/Maquina.png";
import logoImg from "../../assets/Geova_logo.png";
import Obligatorio from "../../utils/ui/span-obligatorio";

interface FormState {
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}

interface ErrorState {
  username?: boolean;
  nombre?: boolean;
  apellidos?: boolean;
  email?: boolean;
  password?: boolean;
}

function Login() {
  const [isLogin, setIsLogin] = useState(true);

  const [form, setForm] = useState<FormState>({
    username: "",
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});

  const toggleMode = () => {
    setErrors({});
    setIsLogin(!isLogin);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    // marca error solo si el campo está vacío
    setErrors((prev) => ({
      ...prev,
      [name]: value.trim() === "",
    }));
  };

  const handleSubmit = async () => {
    const result = await usersViewModel.validateLoginOrRegister(form, isLogin);

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

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
      <div className={`LoginContainer ${!isLogin ? "register-machine" : ""}`}>
        <div className={`Machine ${isLogin ? "" : "register-machine"}`}>
          <img src={maquinaImg} alt="Máquina" />
        </div>

        <div className={`FormContainer ${isLogin ? "login-mode" : "register-mode"}`}>
          <div className="Formtitle">
            <img src={logoImg} alt="Logo" className="logo" />
            <h1>{isLogin ? "Login" : "Sign Up"}</h1>
          </div>

          <div className="Form">
            {!isLogin && (
              <>
                {/* USERNAME */}
                <div className="inputform">
                  <div className="input-elements">
                    <label>Username</label>
                    <Obligatorio show={!!errors.username} />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>

                {/* NAME */}
                <div className="inputform">
                  <div className="input-elements">
                    <label>Name</label>
                    <Obligatorio show={!!errors.nombre} />
                  </div>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                  />
                </div>

                {/* LAST NAME */}
                <div className="inputform">
                  <div className="input-elements">
                    <label>Last Name</label>
                    <Obligatorio show={!!errors.apellidos} />
                  </div>
                  <input
                    type="text"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* EMAIL */}
            <div className="inputform">
              <div className="input-elements">
                <label>Email</label>
                <Obligatorio show={!!errors.email} />
              </div>
              <input type="text" name="email" value={form.email} onChange={handleChange} />
            </div>

            {/* PASSWORD */}
            <div className="inputform">
              <div className="input-elements">
                <label>Password</label>
                <Obligatorio show={!!errors.password} />
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="buttonform">
              <button className="loginbutton" onClick={handleSubmit}>
                {isLogin ? "Login" : "Register"}
              </button>

              <p>
                {isLogin ? "Don't have an account? " : "Do you already have an account? "}
                <span
                  onClick={toggleMode}
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                >
                  {isLogin ? "Sign up" : "Login"}
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
