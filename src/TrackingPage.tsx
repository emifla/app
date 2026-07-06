import React, { useMemo, useState } from 'react'
import { getBudgetCategories, getTodoCategories } from '../lib/storage'

export default function TrackingPage({ onBack }: { onBack: () => void }) {
  const [todos] = useState(getTodoCategories())
  const [budgets] = useState(getBudgetCategories())

  const stats = useMemo(() => {
    const totalTasks = todos.reduce((sum, category) => sum + category.items.length, 0)
    const completedTasks = todos.reduce(
      (sum, category) => sum + category.items.filter(item => item.isCompleted).length,
      0
    )
    const completedWeeks = todos.reduce(
      (sum, category) => sum + (category.completedPeriods ?? category.completedWeeks ?? 0),
      0
    )
    const favoriteCount = todos.filter(category => category.isFavorite).length
    const totalBalance = budgets.reduce((sum, category) => sum + category.balance, 0)
    const totalTransactions = budgets.reduce(
      (sum, category) => sum + category.transactions.length,
      0
    )
    const totalSpent = budgets.reduce(
      (sum, category) =>
        sum + category.transactions.reduce((inner, transaction) => inner + transaction.amount, 0),
      0
    )

    return {
      totalTasks,
      completedTasks,
      completedWeeks,
      favoriteCount,
      totalBalance,
      totalTransactions,
      totalSpent,
      percent: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
  }, [todos, budgets])

  const motivation =
    stats.percent >= 80
      ? 'Du er virkelig i flytsonen.'
      : stats.percent >= 50
        ? 'Sterk fremgang — fortsett slik.'
        : stats.totalTasks > 0
          ? 'Små steg teller. Velg én oppgave nå.'
          : 'Lag noen oppgaver for å begynne å tracke.'

  return (
    <main className="inner-page tracking-page">
      <header className="inner-header">
        <button className="round-button" onClick={onBack} aria-label="Tilbake">←</button>
        <div>
          <span className="section-kicker">MIN FREMGANG</span>
          <h2>Tracking</h2>
        </div>
      </header>

      <section className="tracking-hero-card">
        <div className="tracking-ring" style={{ '--progress': `${stats.percent * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>{stats.percent}%</strong>
            <span>fullført</span>
          </div>
        </div>
        <div className="tracking-copy">
          <span className="mini-label">STATUS AKKURAT NÅ</span>
          <h3>{motivation}</h3>
          <p>{stats.completedTasks} av {stats.totalTasks} aktive oppgaver er ferdige.</p>
        </div>
      </section>

      <section className="tracking-grid">
        <article className="tracking-stat-card">
          <span className="stat-icon">✓</span>
          <strong>{stats.completedTasks}</strong>
          <p>Oppgaver fullført</p>
        </article>
        <article className="tracking-stat-card">
          <span className="stat-icon">↻</span>
          <strong>{stats.completedWeeks}</strong>
          <p>Perioder fullført</p>
        </article>
        <article className="tracking-stat-card">
          <span className="stat-icon">★</span>
          <strong>{stats.favoriteCount}</strong>
          <p>Ukentlige rutiner</p>
        </article>
        <article className="tracking-stat-card">
          <span className="stat-icon">kr</span>
          <strong>{Math.round(stats.totalBalance)}</strong>
          <p>Kroner tilgjengelig</p>
        </article>
      </section>

      <section className="insight-card">
        <div>
          <span className="mini-label">BUDSJETTOVERSIKT</span>
          <h3>{stats.totalTransactions} registrerte kjøp</h3>
          <p>Totalt registrert forbruk: {Math.round(stats.totalSpent)} kr.</p>
        </div>
        <div className="mini-bars">
          {[38, 72, 48, 88, Math.max(15, stats.percent)].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </section>

      <section className="motivation-card">
        <span>DITT NESTE STEG</span>
        <h3>
          {stats.percent === 100
            ? 'Alt er ferdig — nyt følelsen!'
            : stats.totalTasks > 0
              ? 'Fullfør én liten oppgave til i dag.'
              : 'Lag den første oppgaven din.'}
        </h3>
      </section>
    </main>
  )
}
