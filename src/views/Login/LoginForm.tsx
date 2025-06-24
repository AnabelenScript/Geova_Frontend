import './LoginForm.css'

function Login(){
    return(
        <>
        <div className="overlay"></div>
        <div className="Login">
            <div className="LoginContainer">
                <div className="Machine">
                    <img src="/src/assets/Maquina.png" alt="" />
                </div>
                <div className="FormContainer">
                    <div className="Formtitle">
                        <img src="/src/assets/Geova_logo.png" alt="" className='logo'/>
                        <h1>Sign in</h1>
                    </div>
                    <div className='Form'>
                        <div className='inputform'>
                            <label htmlFor="">Username</label>
                            <input type="text" name="" id="" placeholder='Username' />
                        </div>
                        <div className='inputform'>
                            <label htmlFor="">Email</label>
                            <input type="text" name="" id="" placeholder='Email'/>
                        </div>
                        <div className='inputform'>
                            <label htmlFor="">Password</label>
                            <input type="Password" name="" id="" placeholder='Password'/>
                        </div>
                        <div className='buttonform'>
                            <button className='loginbutton'>Continue</button>
                            <p>Do you already have an account? Login</p>
                        </div>
                    
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default Login