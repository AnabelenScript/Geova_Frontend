import './MainMenu.css';


function MainMenu(){
    return (
        <div className='MainMenuContainer'>
            <div className="MenuTitleContainer">
                <div className="MenuTitle">
                    <h1>Hola de nuevo!</h1>
                    <i className="bx bx-home"></i>
                </div>
                <div className="MenuEndContainer"></div>
            </div>
            <div className="MenuSubtitle">
        <div className="MenuSub1">
          <h2 className="Msub1">Proyectos</h2>
          <p className="Msub2">Información principal</p>
        </div>
         <div className="MenuSub2">
          <button className='buttonantiguo'>Antiguos</button>
          <button className='buttonreciente'>Recientes</button>
        </div>
      </div>
        </div>
    )
}

export default MainMenu