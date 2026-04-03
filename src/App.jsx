import { useState, useMemo, useEffect } from 'react'
import UploadZone from './components/UploadZone.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import YearFilter from './components/YearFilter.jsx'
import PersonFilter from './components/PersonFilter.jsx'
import PriorityFilter from './components/PriorityFilter.jsx'
import FlightTable from './components/FlightTable.jsx'
import RouteMap from './components/RouteMap.jsx'
import { parseFile } from './utils/parseFlights.js'
import FeedbackModal from './components/FeedbackModal.jsx'

export default function App() {
  const [flights, setFlights] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedPeople, setSelectedPeople] = useState([])
  const [selectedPriorities, setSelectedPriorities] = useState([])
  const [shareLabel, setShareLabel] = useState('Share')
  const [showFeedback, setShowFeedback] = useState(false)

  // Clear all data from memory when the user leaves or refreshes the page
  useEffect(() => {
    const handleUnload = () => setFlights(null)
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [])

  async function handleFile(file) {
    setLoading(true)
    setError('')
    try {
      const parsed = await parseFile(file)
      setFlights(parsed)
      setSelectedYear('all')
      setSelectedPeople([])
      setSelectedPriorities([])
    } catch (e) {
      setError(e.message || 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    const withDist = filtered.filter(f => f.distanceMiles)
    const totalMiles = withDist.reduce((s, f) => s + f.distanceMiles, 0)
    const timesAround = (totalMiles / 24901).toFixed(1)
    const longest = withDist.length
      ? withDist.reduce((a, b) => a.distanceMiles > b.distanceMiles ? a : b)
      : null
    const uniqueAirports = new Set(filtered.flatMap(f => [f.origin, f.dest])).size
    const countries = new Set(filtered.flatMap(f => [f.originAirport?.country, f.destAirport?.country]).filter(Boolean)).size

    const activePeople = selectedPeople.length > 0 ? selectedPeople : people
    const travelerLine = activePeople.length === 1 ? `👤 ${activePeople[0]}` : null

    const lines = [
      '✈️ NonRev Flight Explorer',
      travelerLine,
      '',
      `🛫 ${filtered.length.toLocaleString()} flights`,
      `🌍 ${timesAround}× around the world`,
      longest ? `📏 Longest: ${longest.route} · ${longest.distanceMiles.toLocaleString()} mi` : null,
      `🏙️ ${uniqueAirports} airports · ${countries} countries`,
      '',
      window.location.origin + window.location.pathname,
    ].filter(l => l !== null)

    await navigator.clipboard.writeText(lines.join('\n'))
    setShareLabel('Copied!')
    setTimeout(() => setShareLabel('Share'), 2000)
  }

  function clearData() {
    setFlights(null)
    setError('')
    setSelectedYear('all')
    setSelectedPeople([])
    setSelectedPriorities([])
  }

  const years = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.year).filter(Boolean))].sort((a, b) => b - a)
  }, [flights])

  const people = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.person).filter(Boolean))].sort()
  }, [flights])

  const priorities = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.priority).filter(Boolean))].sort()
  }, [flights])

  const filtered = useMemo(() => {
    if (!flights) return []
    let result = flights
    if (selectedPeople.length > 0) result = result.filter(f => selectedPeople.includes(f.person))
    if (selectedPriorities.length > 0) result = result.filter(f => selectedPriorities.includes(f.priority))
    if (selectedYear !== 'all') result = result.filter(f => f.year === selectedYear)
    return result
  }, [flights, selectedYear, selectedPeople, selectedPriorities])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Parsing flights…</p>
      </div>
    )
  }

  if (!flights) {
    return (
      <>
        <UploadZone onFile={handleFile} />
        {error && <p className="global-error">{error}</p>}
      </>
    )
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-title">
          <span className="logo-sm">✈</span>
          <h1>NonRev Flight Explorer</h1>
        </div>
        <a
          className="bmc-btn"
          href="https://www.buymeacoffee.com/jtsmith"
          target="_blank"
          rel="noopener noreferrer"
        >
          ☕ Buy me an espresso
        </a>
        <div className="dash-actions">
          <span className="file-stats">
            {flights.length.toLocaleString()} flights loaded
          </span>
          <button className="share-btn" onClick={handleShare}>
            {shareLabel}
          </button>
          <button className="clear-btn" onClick={clearData}>
            Clear Data
          </button>
        </div>
      </header>

      <main className="dash-main">
        <div className="stats-filters-row">
          <aside className="filters-sidebar">
            <h2 className="section-title">Filters</h2>
            {people.length > 1 && (
              <PersonFilter people={people} selected={selectedPeople} onChange={setSelectedPeople} />
            )}

            {years.length > 1 && (
              <YearFilter years={years} selected={selectedYear} onChange={setSelectedYear} />
            )}

            {priorities.length > 1 && (
              <PriorityFilter priorities={priorities} selected={selectedPriorities} onChange={setSelectedPriorities} />
            )}
          </aside>

          <StatsPanel flights={filtered} allFlights={flights} selectedYear={selectedYear} />
        </div>

        <RouteMap flights={filtered} />

        <section className="table-section-wrap">
          <h2 className="section-title">Flight Log</h2>
          <FlightTable flights={filtered} multiPerson={people.length > 1 && selectedPeople.length !== 1} />
        </section>
      </main>

      <footer className="dash-footer">
        🔒 No data is stored or transmitted — everything runs in your browser.
        <span className="footer-sep">·</span>
        <button className="feedback-trigger" onClick={() => setShowFeedback(true)}>
          Feedback & Feature Requests
        </button>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
