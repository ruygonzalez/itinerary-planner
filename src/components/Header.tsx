import { ArrowUpRight, Compass, Download, Info } from 'lucide-react'

interface HeaderProps {
  stopCount: number
  onHow: () => void
  onSources: () => void
  onExport: () => void
}

export function Header({ stopCount, onHow, onSources, onExport }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="brand" href="#top" aria-label="Atlas three-city planner, back to top">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>atlas<span className="brand-dot">.</span><small>THREE CITIES</small></span>
        </a>
        <nav className="header-links" aria-label="Main navigation">
          <a className="active-link" href="#planner">The planner</a>
          <button type="button" onClick={onHow}>How it works</button>
          <button type="button" onClick={onSources}>Our sources</button>
        </nav>
        <div className="header-actions">
          <span className="save-status"><span className="save-dot" /> Saved in this browser</span>
          <button
            className="header-export"
            type="button"
            onClick={onExport}
            disabled={!stopCount}
            title={stopCount ? 'Download calendar file' : 'Add a stop to export'}
          >
            <Download size={16} aria-hidden="true" />
            <span>Export plan</span>
          </button>
        </div>
        <div className="mobile-header-actions">
          <button type="button" onClick={onHow} aria-label="How it works"><Compass size={20} /></button>
          <button type="button" onClick={onSources} aria-label="Data sources"><Info size={20} /></button>
          <button type="button" onClick={onExport} disabled={!stopCount} aria-label="Export plan"><ArrowUpRight size={20} /></button>
        </div>
      </div>
    </header>
  )
}
