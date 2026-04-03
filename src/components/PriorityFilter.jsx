import { useState, useRef, useEffect } from 'react'

export default function PriorityFilter({ priorities, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(val) {
    if (selected.includes(val)) {
      onChange(selected.filter(p => p !== val))
    } else {
      onChange([...selected, val])
    }
  }

  let label = 'All Priorities'
  if (selected.length === 1) label = selected[0]
  else if (selected.length > 1) label = `${selected.length} selected`

  return (
    <div className="filter-field" ref={ref}>
      <label>Priority</label>
      <button className="filter-select" onClick={() => setOpen(o => !o)}>
        <span className="filter-select-label">{label}</span>
        <span className="filter-select-arrow">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="filter-dropdown">
          <label className="filter-option">
            <input
              type="checkbox"
              checked={selected.length === 0}
              onChange={() => onChange([])}
            />
            All
          </label>
          {priorities.map(p => (
            <label key={p} className="filter-option">
              <input
                type="checkbox"
                checked={selected.includes(p)}
                onChange={() => toggle(p)}
              />
              {p}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
