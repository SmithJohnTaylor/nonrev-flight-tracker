import { useState } from 'react'

export default function YearFilter({ years, selected, onChange }) {
  const [open, setOpen] = useState(false)

  function select(val) {
    onChange(val)
    setOpen(false)
  }

  const label = selected === 'all' ? 'All Years' : selected

  return (
    <div className="year-filter">
      <button
        className="year-btn active"
        onClick={() => setOpen(o => !o)}
      >
        {label} {open ? '▴' : '▾'}
      </button>
      {open && years.map(y => (
        <button
          key={y}
          className={`year-btn ${selected === y ? 'active' : ''}`}
          onClick={() => select(y)}
        >
          {y}
        </button>
      ))}
    </div>
  )
}
