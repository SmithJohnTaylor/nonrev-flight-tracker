export default function YearFilter({ years, selected, onChange }) {
  return (
    <div className="year-filter">
      <button
        className={`year-btn ${selected === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        All Years
      </button>
      {years.map(y => (
        <button
          key={y}
          className={`year-btn ${selected === y ? 'active' : ''}`}
          onClick={() => onChange(y)}
        >
          {y}
        </button>
      ))}
    </div>
  )
}
