import "./CreateProject.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectViewModel } from "../../viewmodels/ProjectViewModel";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

import Obligatorio from "../../utils/ui/span-obligatorio";

interface LocationMarkerProps {
  setLat: (lat: number) => void;
  setLng: (lng: number) => void;
}

function LocationMarker({ setLat, setLng }: LocationMarkerProps) {
  const [position, setPosition] = useState<LatLngExpression | null>(null);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const newPos: LatLngExpression = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function CreateProject() {
  const navigate = useNavigate();

  const [nombreProyecto, setNombreProyecto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string>("");

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const showError = (field: string) =>
    (touched[field] || submitted) && !!errors[field];
  const handleBlur = (field: string, value: string | File | null) => {
    setTouched((t) => ({ ...t, [field]: true }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[field] = "Campo obligatorio.";
      } else {
        newErrors[field] = "";
      }
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nombreProyecto.trim()) {
      newErrors.nombreProyecto = "Campo obligatorio.";
    } else if (/^[^A-Za-z0-9]/.test(nombreProyecto)) {
      newErrors.nombreProyecto = "No puede iniciar con símbolos o espacios.";
    } else if (nombreProyecto.length < 3) {
      newErrors.nombreProyecto = "Debe tener mínimo 3 caracteres.";
    }

    if (!categoria) newErrors.categoria = "Seleccione una categoría.";

    if (!descripcion.trim()) {
      newErrors.descripcion = "Campo obligatorio.";
    } else if (descripcion.length < 10) {
      newErrors.descripcion = "Debe tener al menos 10 caracteres.";
    }

    if (!imgFile) newErrors.img = "Campo obligatorio.";

    if (lat == null || lng == null) newErrors.ubicacion = "Campo obligatorio.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImgFile(file);
    setTouched((t) => ({ ...t, img: true }));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setImgPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setErrors((prev) => ({ ...prev, img: "" }));
  };

  const handleCreate = async () => {
    setSubmitted(true);

    if (!validate()) return;

    const { success } = await projectViewModel.handleCreateProject(
      nombreProyecto,
      categoria,
      descripcion,
      imgFile as File,
      lat as number,
      lng as number
    );

    if (success) {
      setNombreProyecto("");
      setCategoria("");
      setDescripcion("");
      setImgFile(null);
      setImgPreview("");
      setLat(null);
      setLng(null);
      setErrors({});
      setTouched({});
      setSubmitted(false);

      navigate("/dashboard");
    }
  };

  const center: LatLngExpression = [23.6345, -102.5528];

  return (
    <div className="CreateContainer">
      <div className="CreateTitleContainer">
        <div className="CreateTitle">
          <h1>Crear proyecto</h1>
          <i className="bx bxs-add-to-queue"></i>
        </div>
      </div>

      <div className="CreateInfoContainer">
        <div className="Info">
          <div className="CreateInfo2">
            <div className="CreateLabels">
              <div className="labels">
                <div className="input-elements">
                  <label>Nombre del proyecto</label>
                  <Obligatorio
                    show={showError("nombreProyecto")}
                    message={errors.nombreProyecto || ""}
                  />
                </div>

                <input
                  type="text"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                  onBlur={() => handleBlur("nombreProyecto", nombreProyecto)}
                />
              </div>
              <div className="labels">
                <div className="input-elements">
                  <label>Categoría</label>
                  <Obligatorio
                    show={showError("categoria")}
                    message={errors.categoria || ""}
                  />
                </div>

                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  onBlur={() => handleBlur("categoria", categoria)}
                >
                  <option value="">Seleccione</option>
                  <option value="Residencial">Residencial</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Remodelación">Remodelación</option>
                  <option value="Obra civil">Obra civil</option>
                  <option value="Obra pública">Obra pública</option>
                  <option value="Arquitectónico">Arquitectónico</option>
                </select>
              </div>
            </div>
            <div className="CreateArea">
              <div className="input-elements">
                <label>Descripción</label>
                <Obligatorio
                  show={showError("descripcion")}
                  message={errors.descripcion || ""}
                />
              </div>

              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onBlur={() => handleBlur("descripcion", descripcion)}
              />
            </div>
          </div>
          <div className="CreateMapContainer">
            <div className="input-elements">
              <label>Seleccione una ubicación</label>
              <Obligatorio
                show={showError("ubicacion")}
                message={errors.ubicacion || ""}
              />
            </div>

            <div className="Map">
              <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker
                  setLat={(v) => {
                    setLat(v);
                    setTouched((t) => ({ ...t, ubicacion: true }));
                    setErrors((prev) => ({ ...prev, ubicacion: "" }));
                  }}
                  setLng={(v) => {
                    setLng(v);
                    setTouched((t) => ({ ...t, ubicacion: true }));
                    setErrors((prev) => ({ ...prev, ubicacion: "" }));
                  }}
                />
              </MapContainer>
            </div>
          </div>
        </div>
        <div className="create-visual-elements">
          <div className="add-image-elements">
            <div className="input-elements">
              <label>Seleccione una imagen</label>
              <Obligatorio show={showError("img")} message={errors.img || ""} />
            </div>

            <div className="CreateInfo1">
              <input
                id="imgUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                onBlur={() => handleBlur("img", imgFile)}
              />
              {imgPreview && (
                <div className="PreviewRow">
                  <button
                    type="button"
                    className="ViewImageButton"
                    onClick={() => setIsImageModalOpen(true)}
                    title="Visualizar imagen"
                  >
                    <i className="bx bx-show" style={{ fontSize: "22px" }}></i>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="buttonsContainer">
            <button className="CreateButton" onClick={handleCreate}>
              Crear proyecto
            </button>
          </div>
        </div>
      </div>
      {isImageModalOpen && (
        <div
          className="ImageModalOverlay"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="ImageModal" onClick={(e) => e.stopPropagation()}>
            <img src={imgPreview} alt="imagen" className="ModalImage" />
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateProject;
