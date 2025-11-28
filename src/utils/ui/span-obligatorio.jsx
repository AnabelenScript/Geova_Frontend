export default function Obligatorio({ show }) {
  if (!show) return null;

  return (
    <span className="field-error">Obligatorio*</span>
  );
}
