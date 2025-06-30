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
                <div className='CreateInfo1'>
                <button className='AddButton'>
                </button>
                <button className='CancelButton'>Cancelar
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
                <button>Crear proyecto</button>
            </div>
            </div>
        </div>
    )
}

export default CreateProject