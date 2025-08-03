import './Profile.css';
import { useEffect, useState } from 'react';
import { usersViewModel } from '../../viewmodels/UserViewModel';

function Profile() {
    const [user, setUser] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({ Nombre: '', Apellidos: '', Email: '' });

    useEffect(() => {
        usersViewModel.handleGetLoggedUser().then((res) => {
            if (res.success) {
                setUser(res.data);
                setFormData(res.data);
            } else {
                console.error('Error al obtener el usuario:', res.error);
            }
        });
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        usersViewModel.handleUpdateUserWithAlert(user.Id, formData, setUser, setEditMode);
    };

    const handleDelete = () => {
        usersViewModel.handleDeleteUserWithAlert(user.Id);
    };

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
                    <h3>Datos de usuario</h3>
                    {user ? (
                        <div className='profdata'>
                            {editMode ? (
                                <div className='profdataedit'>
                                    <input name="Nombre" value={formData.Nombre} onChange={handleInputChange} />
                                    <input name="Apellidos" value={formData.Apellidos} onChange={handleInputChange} />
                                    <input name="Email" value={formData.Email} onChange={handleInputChange} />
                                    <div className='editoptions'>
                                        <button onClick={() => setEditMode(false)} className='CancelEditButton'>Cancelar</button>
                                        <button onClick={handleSave} className='GuardarEditButton'>Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className='profdataview'>
                                    <p><strong>Nombre:</strong> {user.Nombre}</p>
                                    <p><strong>Apellidos:</strong> {user.Apellidos}</p>
                                    <p><strong>Email:</strong> {user.Email}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>Cargando datos...</p>
                    )}
                </div>

                <div className='ProfileOptions'>
                    <div className='editiconcontainer' onClick={() => setEditMode(true)}>
                        <i className='bx bxs-edit-alt'></i>
                    </div>
                    <div className='deleteiconcontainer' onClick={handleDelete}>
                        <i className='bx bxs-trash-alt'></i>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Profile;
