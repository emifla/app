import React from 'react'

export default function Home({ onNavigate }: { onNavigate: (v: 'home'|'todo'|'budget') => void }) {
  return (
    <main className="home-scroll">
      <section className="hero-slide todo-hero">
        <div className="hero-content">
          <div className="eyebrow">MIN HVERDAG</div>
          <h1>To Do</h1>
          <p>Rutiner, ukesmål og oppgaver samlet på ett sted.</p>
          <button onClick={() => onNavigate('todo')}>Åpne To Do</button>
          <div className="scroll-hint">Sveip videre ↓</div>
        </div>
      </section>

      <section className="hero-slide budget-hero">
        <div className="hero-content">
          <div className="eyebrow">MIN ØKONOMI</div>
          <h1>Budsjett</h1>
          <p>Se hvor mye du har igjen og hold kontroll dag for dag.</p>
          <button onClick={() => onNavigate('budget')}>Åpne budsjett</button>
        </div>
      </section>
    </main>
  )
}
