import './Profile.css';
import { useEffect, useState } from 'react';
import { usersViewModel } from '../../viewmodels/UserViewModel';

function Profile() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        usersViewModel.handleGetLoggedUser().then((res) => {
            if (res.success) {
                setUser(res.data);
            } else {
                console.error('Error al obtener el usuario:', res.error);
            }
        });
    }, []);

    return (
        <div className='ProfileContainer'>
            <div className='ProfileTitleContainer'>
                <div className='ProfileTitle'>
                    <h1>Tu perfil</h1>
                    <i className="bx bxs-user"></i>
                </div>
                <div className='ProfileEndTitle'>
                </div>
            </div>

            <div className='ProfileData'>
                <div className='ProfilePhoto'>
                    <i className='bx bxs-user-circle'></i>
                    <div className="corner-top-right"></div>
                    <div className="corner-bottom-left"></div>
                </div>

                <div className='ProfileInfo'>
                    <h3>Datos de usuario</h3><br />
                    {user ? (
                        <div className='profdata'>
                            <p><strong>Nombre:</strong> {user.Nombre}</p>
                            <p><strong>Apellidos:</strong> {user.Apellidos}</p>
                            <p><strong>Email:</strong> {user.Email}</p>
                        </div>
                    ) : (
                        <p>Cargando datos...</p>
                    )}
                </div>

                <div className='ProfileOptions'>
                </div>
            </div>
        </div>
    );
}

export default Profile;
