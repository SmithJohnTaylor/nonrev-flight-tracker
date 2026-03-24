import { useState, useMemo, useEffect } from 'react'
import UploadZone from './components/UploadZone.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import YearFilter from './components/YearFilter.jsx'
import PersonFilter from './components/PersonFilter.jsx'
import FlightTable from './components/FlightTable.jsx'
import RouteMap from './components/RouteMap.jsx'
import { parseFile } from './utils/parseFlights.js'
import { encodeFlights, decodeFlights } from './utils/shareData.js'

export default function App() {
  const [flights, setFlights] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedPerson, setSelectedPerson] = useState('all')
  const [isShared, setIsShared] = useState(false)
  const [shareLabel, setShareLabel] = useState('Share')

  // On mount, check for shared data in the URL hash
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#share=')) return
    const encoded = hash.slice(7)
    setLoading(true)
    decodeFlights(encoded)
      .then(parsed => {
        setFlights(parsed)
        setIsShared(true)
      })
      .catch(() => setError('Could not load shared data — the link may be invalid or corrupted.'))
      .finally(() => setLoading(false))
  }, [])

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
      setSelectedPerson('all')
      setIsShared(false)
      window.location.hash = ''
    } catch (e) {
      setError(e.message || 'Failed to parse file')
    } finally {
      setLoading(false)
    }
  }

  function clearData() {
    setFlights(null)
    setError('')
    setSelectedYear('all')
    setSelectedPerson('all')
    setIsShared(false)
    window.location.hash = ''
  }

  async function handleShare() {
    try {
      const encoded = await encodeFlights(flights)
      window.location.hash = `share=${encoded}`
      await navigator.clipboard.writeText(window.location.href)
      setShareLabel('Copied!')
      setTimeout(() => setShareLabel('Share'), 2000)
    } catch {
      setShareLabel('Error')
      setTimeout(() => setShareLabel('Share'), 2000)
    }
  }

  const years = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.year).filter(Boolean))].sort((a, b) => b - a)
  }, [flights])

  const people = useMemo(() => {
    if (!flights) return []
    return [...new Set(flights.map(f => f.person).filter(Boolean))].sort()
  }, [flights])

  const filtered = useMemo(() => {
    if (!flights) return []
    let result = flights
    if (selectedPerson !== 'all') result = result.filter(f => f.person === selectedPerson)
    if (selectedYear !== 'all') result = result.filter(f => f.year === selectedYear)
    return result
  }, [flights, selectedYear, selectedPerson])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>{isShared ? 'Loading shared data…' : 'Parsing flights…'}</p>
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
          <h1>NonRev Flight Tracker</h1>
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

      {isShared && (
        <div className="shared-banner">
          Viewing shared data &mdash; <button className="shared-banner-btn" onClick={clearData}>upload your own file</button> to start fresh
        </div>
      )}

      <main className="dash-main">
        {people.length > 1 && (
          <PersonFilter people={people} selected={selectedPerson} onChange={setSelectedPerson} />
        )}

        {years.length > 1 && (
          <YearFilter years={years} selected={selectedYear} onChange={setSelectedYear} />
        )}

        <StatsPanel flights={filtered} allFlights={flights} selectedYear={selectedYear} />

        <RouteMap flights={filtered} />

        <section className="table-section-wrap">
          <h2 className="section-title">Flight Log</h2>
          <FlightTable flights={filtered} multiPerson={people.length > 1} />
        </section>
      </main>

      <footer className="dash-footer">
        🔒 No data is stored or transmitted — everything runs in your browser.
      </footer>
    </div>
  )
}
