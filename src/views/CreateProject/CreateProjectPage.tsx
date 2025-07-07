import './CreateProject.css'

function CreateProject (){
    return(
        <div className='CreateContainer'>
            <div className='CreateTitleContainer'>
                <div className='CreateTitle'>
                    <h1>Crear proyecto</h1>
                    <i className="bx bxs-add-to-queue"></i></div>
                <div className='CreateEndContainer'></div>
            </div>
            <div className='CreateInfoContainer'>
                <div className='Info'>
                <div className='CreateInfo1'>
                <button className='AddButton'>
                </button>
            
            </div>
            <div className='CreateInfo2'>
                <div className='CreateLabels'>
                    <div className='labels'>
                        <label htmlFor="">Nombre del poroyecto</label>
                        <input type="text" />
                    </div>
                    <div className='labels'>
                        <label htmlFor="">Categoría</label>
                        <select></select>
                    </div>
                </div>
                <div className='CreateArea'>
                    <label>Descripción</label>
                    <textarea></textarea>
                </div>
            </div></div>
            <div className='CreateMapContainer'>
                <label htmlFor="">Seleccione la ubicación en el terreno</label>
                <div className='Map'><img src="/src/assets/map.png" alt="" /></div>
                <div className='buttonsContainer'>
                    <button className='CancelButton'>Cancelar
                </button>
                <button className='CreateButton'>Crear proyecto</button>
                </div>
            </div>
            </div>
        </div>
    )
}

export default CreateProject