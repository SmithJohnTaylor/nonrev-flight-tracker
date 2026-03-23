export default function PersonFilter({ people, selected, onChange }) {
  return (
    <div className="year-filter">
      <button
        className={`year-btn ${selected === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        All Travelers
      </button>
      {people.map(p => (
        <button
          key={p}
          className={`year-btn ${selected === p ? 'active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
