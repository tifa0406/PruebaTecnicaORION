export default function Kpi({ label, value, hint, color = 'azul' }) {
  return (
    <div className={`kpi kpi-${color}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {hint && <span className="kpi-hint">{hint}</span>}
    </div>
  );
}

export function KpiGrid({ children }) {
  return <div className="kpi-grid">{children}</div>;
}
