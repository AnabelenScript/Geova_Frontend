import './TomarFoto.css'

function TomarFoto (){
    return(
       <div className="CreateContainer">
        <div className="ProjectphotoContainer">
             <div className="corner-top-right"></div>
             <div className="corner-bottom-left"></div>
            <div className='MainphotoContainer'>
                <h1>Mueva la cámara hasta enfocar correctamente</h1>
                <div className='Takephotobutton'>
                    <button className='TakeButton'></button>
                </div>
        </div>
        </div>
       </div>
    )
}

export default TomarFoto