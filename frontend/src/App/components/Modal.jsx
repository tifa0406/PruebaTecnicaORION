export default function Modal({ titulo, children, onClose, footer }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{titulo}</h3>
          <button className="modal-close" onClick={onClose} type="button">×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}