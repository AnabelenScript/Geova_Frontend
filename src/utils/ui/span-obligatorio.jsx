export default function Obligatorio({ show, message }) {
  if (!show) return null;

  return (
    <span className="field-error">{message}</span>
  );
}
