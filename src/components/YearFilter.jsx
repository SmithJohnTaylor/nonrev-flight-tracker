export default function YearFilter({ years, selected, onChange }) {
  return (
    <div className="filter-field">
      <label htmlFor="year-filter">Year</label>
      <select
        id="year-filter"
        value={selected}
        onChange={e => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
      >
        <option value="all">All Years</option>
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
