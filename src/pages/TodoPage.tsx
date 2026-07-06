import React, { useMemo, useState } from 'react'
import {
  addTodoCategory,
  addTodoItem,
  deleteTodoCategoryById,
  deleteTodoItem,
  getTodoCategories,
  recurrenceLabels,
  setTodoRecurrence,
  toggleTodoFavorite,
  toggleTodoItem
} from '../lib/storage'
import type { TodoCategory, Recurrence } from '../lib/models'

const recurrenceOptions: Recurrence[] = [
  'daily',
  'weekly',
  'biweekly',
  'monthly'
]

export default function TodoPage({ onBack }: { onBack: () => void }) {
  const [categories, setCategories] = useState<TodoCategory[]>(getTodoCategories())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newFrequency, setNewFrequency] = useState<Recurrence>('weekly')
  const [newItems, setNewItems] = useState<Record<string, string>>({})

  const refresh = () => setCategories([...getTodoCategories()])

  const completed = useMemo(
    () => categories.reduce(
      (sum, category) => sum + category.items.filter(item => item.isCompleted).length,
      0
    ),
    [categories]
  )

  const total = useMemo(
    () => categories.reduce((sum, category) => sum + category.items.length, 0),
    [categories]
  )

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name) return
    addTodoCategory(name, newFrequency)
    setNewCategory('')
    refresh()
  }

  const addItem = (categoryId: string) => {
    const title = (newItems[categoryId] || '').trim()
    if (!title) return
    addTodoItem(categoryId, title)
    setNewItems(current => ({ ...current, [categoryId]: '' }))
    refresh()
  }

  return (
    <main className="inner-page todo-page">
      <header className="inner-header">
        <button className="round-button" onClick={onBack}>←</button>
        <div>
          <span className="section-kicker">MIN HVERDAG</span>
          <h2>To Do</h2>
        </div>
      </header>

      <section className="metric-card purple-card">
        <div>
          <span>Fullført</span>
          <strong>{completed} av {total}</strong>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      </section>

      <section className="input-card recurrence-input-card">
        <input
          value={newCategory}
          onChange={event => setNewCategory(event.target.value)}
          placeholder="Ny kategori"
          onKeyDown={event => event.key === 'Enter' && addCategory()}
        />
        <select
          value={newFrequency}
          onChange={event => setNewFrequency(event.target.value as Recurrence)}
        >
          {recurrenceOptions.map(option => (
            <option key={option} value={option}>
              {recurrenceLabels[option]}
            </option>
          ))}
        </select>
        <button onClick={addCategory}>Legg til</button>
      </section>

      <section className="accordion-list">
        {categories.length === 0 && (
          <div className="empty-state">
            <span>✓</span>
            <h3>Ingen kategorier ennå</h3>
            <p>Lag din første kategori over.</p>
          </div>
        )}

        {categories.map(category => {
          const isOpen = expanded === category.id
          const done = category.items.filter(item => item.isCompleted).length
          const percent = category.items.length
            ? Math.round((done / category.items.length) * 100)
            : 0
          const recurrence = category.recurrence || 'weekly'

          return (
            <article className={`accordion-card ${isOpen ? 'open' : ''}`} key={category.id}>
              <button
                className="accordion-header"
                onClick={() => setExpanded(isOpen ? null : category.id)}
              >
                <div className="category-title-block">
                  <div className="category-icon">{percent === 100 ? '✓' : '○'}</div>
                  <div>
                    <h3>{category.name}</h3>
                    <span>
                      {done}/{category.items.length} ferdig · {recurrenceLabels[recurrence]}
                    </span>
                  </div>
                </div>

                <div className="accordion-actions">
                  <button
                    className={`star-button ${category.isFavorite ? 'active' : ''}`}
                    onClick={event => {
                      event.stopPropagation()
                      toggleTodoFavorite(category.id)
                      refresh()
                    }}
                  >
                    {category.isFavorite ? '★' : '☆'}
                  </button>
                  <span className="chevron">{isOpen ? '⌃' : '⌄'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="accordion-body">
                  <div className="frequency-editor">
                    <label>Nullstill oppgaver</label>
                    <select
                      value={recurrence}
                      onChange={event => {
                        setTodoRecurrence(
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

                  {category.items.length === 0 && (
                    <p className="muted-text">Denne kategorien er tom.</p>
                  )}

                  {category.items.map(item => (
                    <div className="todo-row" key={item.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => {
                            toggleTodoItem(category.id, item.id)
                            refresh()
                          }}
                        />
                        <span className={item.isCompleted ? 'completed' : ''}>
                          {item.title}
                        </span>
                      </label>
                      <button
                        className="row-delete"
                        onClick={() => {
                          deleteTodoItem(category.id, item.id)
                          refresh()
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="inline-add">
                    <input
                      value={newItems[category.id] || ''}
                      onChange={event =>
                        setNewItems(current => ({
                          ...current,
                          [category.id]: event.target.value
                        }))
                      }
                      placeholder="Ny oppgave"
                      onKeyDown={event => event.key === 'Enter' && addItem(category.id)}
                    />
                    <button onClick={() => addItem(category.id)}>+</button>
                  </div>

                  <div className="category-footer">
                    <span>
                      {category.isFavorite
                        ? `Nullstilles ${recurrenceLabels[recurrence].toLowerCase()}`
                        : 'Trykk på stjernen for automatisk nullstilling'}
                    </span>
                    <button
                      className="text-danger"
                      onClick={() => {
                        if (confirm(`Slette kategorien "${category.name}"?`)) {
                          deleteTodoCategoryById(category.id)
                          setExpanded(null)
                          refresh()
                        }
                      }}
                    >
                      Slett kategori
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}
