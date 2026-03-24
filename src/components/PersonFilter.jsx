import { useState } from 'react'

export default function PersonFilter({ people, selected, onChange }) {
  const [open, setOpen] = useState(false)

  function select(val) {
    onChange(val)
    setOpen(false)
  }

  const label = selected === 'all' ? 'All Travelers' : selected

  return (
    <div className="year-filter">
      <button
        className="year-btn active"
        onClick={() => setOpen(o => !o)}
      >
        {label} {open ? '▴' : '▾'}
      </button>
      {open && people.map(p => (
        <button
          key={p}
          className={`year-btn ${selected === p ? 'active' : ''}`}
          onClick={() => select(p)}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
