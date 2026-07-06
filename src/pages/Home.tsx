import React from 'react'
import type { View } from '../App'

export default function Home({
  onNavigate
}: {
  onNavigate: (view: View) => void
}) {
  return (
    <main className="home-scroll">
      <section className="hero-slide hero-todo">
        <div className="hero-art hero-art-one" />
        <div className="hero-art hero-art-two" />
        <div className="hero-content hero-content-high">
          <span className="hero-kicker">PLANLEGG • GJENNOMFØR</span>
          <h1>To Do</h1>
          <p>Ukens rutiner, mål og oppgaver — ryddig og motiverende.</p>
          <button className="hero-action" onClick={() => onNavigate('todo')}>
            Åpne To Do <span>→</span>
          </button>
        </div>
        <div className="swipe-label">Sveip ned</div>
      </section>

      <section className="hero-slide hero-budget">
        <div className="hero-art hero-art-three" />
        <div className="hero-content hero-content-high">
          <span className="hero-kicker">KONTROLL • OVERSIKT</span>
          <h1>Budsjett</h1>
          <p>Daglig ramme, tilgjengelig saldo og full historikk over kjøp.</p>
          <button className="hero-action" onClick={() => onNavigate('budget')}>
            Åpne budsjett <span>→</span>
          </button>
        </div>
      </section>

      <section className="hero-slide hero-tracking">
        <div className="hero-art hero-art-four" />
        <div className="hero-content hero-content-high">
          <span className="hero-kicker">FREMGANG • MOTIVASJON</span>
          <h1>Tracking</h1>
          <p>Se hva du har fullført, hvor stabil du er, og hvordan du utvikler deg.</p>
          <button className="hero-action" onClick={() => onNavigate('tracking')}>
            Se fremgangen <span>→</span>
          </button>
        </div>
      </section>
    </main>
  )
}
