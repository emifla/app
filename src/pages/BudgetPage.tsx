import React, { useMemo, useState } from 'react'
import {
  addBudgetCategory,
  addTransaction,
  deleteBudgetCategoryById,
  deleteTransaction,
  getBudgetCategories,
  recurrenceLabels,
  setBudgetFrequency
} from '../lib/storage'
import type { BudgetCategory, Recurrence } from '../lib/models'

const recurrenceOptions: Recurrence[] = [
  'daily',
  'weekly',
  'biweekly',
  'monthly'
]

export default function BudgetPage({ onBack }: { onBack: () => void }) {
  const [categories, setCategories] = useState<BudgetCategory[]>(getBudgetCategories())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Recurrence>('daily')

  const refresh = () => setCategories([...getBudgetCategories()])

  const totalBalance = useMemo(
    () => categories.reduce((sum, category) => sum + category.balance, 0),
    [categories]
  )

  const totalAddedPerPeriod = useMemo(
    () => categories.reduce((sum, category) => sum + category.dailyBudget, 0),
    [categories]
  )

  const totalSpent = useMemo(
    () => categories.reduce(
      (sum, category) =>
        sum + category.transactions.reduce(
          (inner, transaction) => inner + transaction.amount,
          0
        ),
      0
    ),
    [categories]
  )

  const addCategory = () => {
    const parsed = Number(amount.replace(',', '.'))
    if (!name.trim() || !Number.isFinite(parsed) || parsed < 0) return

    addBudgetCategory(name.trim(), parsed, frequency)
    setName('')
    setAmount('')
    refresh()
  }

  const addSpending = (categoryId: string) => {
    const raw = prompt('Hvor mye brukte du?')
    if (!raw) return

    const parsed = Number(raw.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert('Skriv inn et gyldig beløp.')
      return
    }

    const note = prompt('Hva brukte du pengene på?')?.trim() || undefined
    addTransaction(categoryId, parsed, note)
    refresh()
  }

  return (
    <main className="inner-page budget-page">
      <header className="inner-header">
        <button className="round-button" onClick={onBack}>←</button>
        <div>
          <span className="section-kicker">MIN ØKONOMI</span>
          <h2>Budsjett</h2>
        </div>
      </header>

      <section className="budget-summary-grid">
        <div className="metric-card teal-card">
          <span>Tilgjengelig</span>
          <strong>{Math.round(totalBalance)} kr</strong>
        </div>
        <div className="metric-card dark-card">
          <span>Sum per valgte perioder</span>
          <strong>{Math.round(totalAddedPerPeriod)} kr</strong>
        </div>
        <div className="metric-card coral-card">
          <span>Registrert brukt</span>
          <strong>{Math.round(totalSpent)} kr</strong>
        </div>
      </section>

      <section className="input-card budget-input-card recurrence-budget-input">
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="Kategori"
        />
        <input
          value={amount}
          onChange={event => setAmount(event.target.value)}
          placeholder="Beløp"
          inputMode="decimal"
        />
        <select
          value={frequency}
          onChange={event => setFrequency(event.target.value as Recurrence)}
        >
          {recurrenceOptions.map(option => (
            <option key={option} value={option}>
              {recurrenceLabels[option]}
            </option>
          ))}
        </select>
        <button onClick={addCategory}>Legg til</button>
      </section>

      <section className="budget-category-list">
        {categories.length === 0 && (
          <div className="empty-state">
            <span>kr</span>
            <h3>Ingen budsjettkategorier</h3>
            <p>Lag en kategori, et beløp og velg hvor ofte det skal fylles på.</p>
          </div>
        )}

        {categories.map(category => {
          const isOpen = expanded === category.id
          const spent = category.transactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0
          )
          const categoryFrequency = category.frequency || 'daily'

          return (
            <article className={`budget-category-card ${isOpen ? 'open' : ''}`} key={category.id}>
              <button
                className="budget-category-header"
                onClick={() => setExpanded(isOpen ? null : category.id)}
              >
                <div>
                  <span className="mini-label">TILGJENGELIG</span>
                  <h3>{category.name}</h3>
                  <strong>{Math.round(category.balance)} kr</strong>
                </div>
                <div className="budget-side-meta">
                  <span>
                    {Math.round(category.dailyBudget)} kr · {recurrenceLabels[categoryFrequency]}
                  </span>
                  <span>{Math.round(spent)} kr brukt</span>
                  <b>{isOpen ? '⌃' : '⌄'}</b>
                </div>
              </button>

              {isOpen && (
                <div className="budget-category-body">
                  <div className="frequency-editor">
                    <label>Fyll på saldo</label>
                    <select
                      value={categoryFrequency}
                      onChange={event => {
                        setBudgetFrequency(
                          category.id,
                          event.target.value as Recurrence
                        )
                        refresh()
                      }}
                    >
                      {recurrenceOptions.map(option => (
                        <option key={option} value={option}>
                          {recurrenceLabels[option]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="primary-wide-button"
                    onClick={() => addSpending(category.id)}
                  >
                    + Registrer kjøp
                  </button>

                  <div className="transaction-heading">
                    <h4>Historikk</h4>
                    <span>{category.transactions.length} kjøp</span>
                  </div>

                  {category.transactions.length === 0 && (
                    <p className="muted-text">Ingen kjøp registrert.</p>
                  )}

                  <div className="transaction-list">
                    {category.transactions.map(transaction => (
                      <div className="transaction-row" key={transaction.id}>
                        <div className="transaction-icon">−</div>
                        <div className="transaction-copy">
                          <strong>{transaction.note || 'Kjøp'}</strong>
                          <span>
                            {new Date(transaction.date).toLocaleDateString('nb-NO')}
                          </span>
                        </div>
                        <div className="transaction-amount">
                          −{Math.round(transaction.amount)} kr
                        </div>
                        <button
                          className="row-delete"
                          onClick={() => {
                            deleteTransaction(category.id, transaction.id)
                            refresh()
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className="text-danger budget-delete"
                    onClick={() => {
                      if (confirm(`Slette budsjettkategorien "${category.name}"?`)) {
                        deleteBudgetCategoryById(category.id)
                        setExpanded(null)
                        refresh()
                      }
                    }}
                  >
                    Slett budsjettkategori
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}
