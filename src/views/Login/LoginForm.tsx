import { useState } from 'react';
import './LoginForm.css';

function Login() {
    const [isLogin, setIsLogin] = useState(false);

    const toggleMode = () => {
        setIsLogin(!isLogin);
    };
    return (
        <div className="Login">
            <div className="LoginContainer">
                <div className="Machine">
                    <img src="/src/assets/Maquina.png" alt="Máquina" />
                </div>
                <div className={`FormContainer ${isLogin ? 'login-mode' : 'register-mode'}`}>
                    <div className="Formtitle">
                        <img src="/src/assets/Geova_logo.png" alt="Logo" className='logo' />
                        <h1>{isLogin ? 'Login' : 'Sign up'}</h1>
                    </div>
                    <div className='Form'>
                        {!isLogin && (
                            <div className='inputform'>
                                <label>Username</label>
                                <input type="text" placeholder='Username' />
                            </div>
                        )}
                        <div className='inputform'>
                            <label>Email</label>
                            <input type="text" placeholder='Email' />
                        </div>
                        <div className='inputform'>
                            <label>Password</label>
                            <input type="password" placeholder='Password' />
                        </div>
                        <div className='buttonform'>
                            <button className='loginbutton'>{isLogin ? 'Login' : 'Register'}</button>
                            <p>
                                {isLogin ? "Don't have an account? " : "Do you already have an account? "}
                                <span 
                                    style={{ cursor: 'pointer', textDecoration:'underline' }} 
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
