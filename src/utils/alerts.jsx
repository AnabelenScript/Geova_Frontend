import Swal from 'sweetalert2';
import succesfulicon from '../assets/sucessfulicon.svg';
import alerticon from '../assets/alerticon.svg';
import erroricon from '../assets/erroricon.svg'

export const showSuccessAlert = async (text) => {
  return Swal.fire({
    title: '¡Éxito!',
    text,
    imageUrl: succesfulicon,
    imageWidth: 200,
    imageHeight: 200,
    showConfirmButton: false,
    timer: 2000,
    background: '#fff',
    color: '#333',
    customClass: {
      popup: 'succesful-popup',
      title: 'succesful-titulo',
      confirmButton: 'succesful-confirmar',
      htmlContainer: 'succesful-contenido'
    }
  });
};

export const showErrorAlert = async (text) => {
  return Swal.fire({
    title: 'Error',
    text,
    background: '#fff',
    imageUrl: erroricon,
    showConfirmButton: false,
    timer: 2000,
    imageWidth: 200,
    imageHeight: 200,
    color: '#333',
    customClass: {
      popup: 'succesful-popup',
      title: 'succesful-title'
    }
  });
};

export const showConfirmAlert = async (title, text) => {
  return Swal.fire({
    title,
    text,
    imageUrl: alerticon,
    imageWidth: 200,
    imageHeight: 200,
    showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        background: '#ffffffff',
        color: '#333',
        customClass: {
            popup: 'custom-swal-popup',
            confirmButton: 'custom-swal-confirm',
            cancelButton: 'custom-swal-cancel',
            actions: 'custom-swal-actions',
            title: 'custom-swal-title'
        },
        buttonsStyling: false,
  });
};
