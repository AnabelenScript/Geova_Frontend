import { useState } from "react";
import { usersViewModel } from "../../viewmodels/UserViewModel";
import {
  useDarkMode,
  getLoginBackgroundClasses,
  getLoginContainerClasses,
} from "../../utils/ui/DarkMode";

import maquinaImg from "../../assets/Maquina1.svg";
import logoImg from "../../assets/Geova_logo.svg";

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
    username: "",
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
  });

  const { darkMode, DarkModeButton } = useDarkMode();
  const toggleMode = () => setIsLogin(!isLogin);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        form.password
      );
    }
  };

  const backgroundProps = getLoginBackgroundClasses(
    darkMode,
    "/src/assets/fondo_login.png"
  );
  const containerProps = getLoginContainerClasses(darkMode, !isLogin);

  return (
    <>
      <DarkModeButton />
      <div {...backgroundProps}>
        <div
          className="relative z-20 transition-all duration-300"
          style={{ filter: darkMode ? "none" : "invert(1)" }}
        >
          <div
            className={containerProps.className}
            style={containerProps.style}
          >
            <div
              className={`
              flex items-center justify-center transition-all duration-300
              ${isLogin ? "w-1/2" : "w-0 opacity-0"}
            `}
            >
              {isLogin && (
                <img
                  src={maquinaImg}
                  alt="Máquina"
                  className="w-full h-auto object-contain"
                />
              )}
            </div>
            <div
              className={`
              flex flex-col gap-6 transition-all duration-300
              ${isLogin ? "w-1/2" : "w-full"}
            `}
            >
              <div className="py-4 flex flex-col items-center gap-4 bg-[hsl(var(--header))]">
                <img src={logoImg} alt="Logo" className="w-32 h-auto" />
                <h1 className="text-3xl font-bold text-[hsl(var(--header-text))]">
                  {isLogin ? "Login" : "Sign up"}
                </h1>
              </div>
              <div className="flex flex-col gap-4">
                {!isLogin && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">
                        Username
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">
                        Name
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-foreground">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="apellidos"
                        value={form.apellidos}
                        onChange={handleChange}
                        className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={handleSubmit}
                    className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors"
                  >
                    {isLogin ? "Login" : "Register"}
                  </button>

                  <p className="text-sm text-center text-muted-foreground">
                    {isLogin
                      ? "Don't have an account? "
                      : "Do you already have an account? "}
                    <span
                      onClick={toggleMode}
                      className="text-primary hover:underline cursor-pointer font-medium"
                    >
                      {isLogin ? "Sign up" : "Login"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
