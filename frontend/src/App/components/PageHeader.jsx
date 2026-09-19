export default function PageHeader({ title, subtitle, filters, onClearFilters, filtersActive }) {
  return (
    <header className="page-head">
      <div className="page-head-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-head-right">
        {filters && (
          <div className="filters-bar">
            <span className="filters-label">Filtros</span>
            {filters}
            {filtersActive && (
              <button className="filter-clear" onClick={onClearFilters} title="Limpiar filtros">×</button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}