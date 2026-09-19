export default function FiltersBar({ filters, onClear, children }) {
  const hayFiltros = Object.values(filters || {}).some((v) => v);
  return (
    <div className="filters-bar">
      <span className="filters-label">Filtros: </span>
      {children}
      {hayFiltros && (
        <button className="filter-clear" onClick={onClear} title="Limpiar filtros">×</button>
      )}
    </div>
  );
}