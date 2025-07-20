export class ProjectModel {
  constructor(nombreProyecto, categoria, descripcion, img, lat, lng) {
    this.nombreProyecto = nombreProyecto;
    this.categoria = categoria;
    this.descripcion = descripcion;
    this.fecha = new Date().toISOString();
    this.img = img;
    this.lat = lat;
    this.lng = lng;
  }
}
