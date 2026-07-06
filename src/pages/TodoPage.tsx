import React, { useMemo, useState } from 'react'
import {
  addTodoCategory, addTodoItem, getTodoCategories,
  toggleTodoFavorite, toggleTodoItem, deleteTodoCategoryById
} from '../lib/storage'
import type { TodoCategory } from '../lib/models'

export default function TodoPage({ onBack }: { onBack: () => void }) {
  const [categories, setCategories] = useState<TodoCategory[]>(getTodoCategories())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newItems, setNewItems] = useState<Record<string,string>>({})

  const refresh = () => setCategories([...getTodoCategories()])
  const completed = useMemo(() => categories.reduce((s,c) => s + c.items.filter(i => i.isCompleted).length, 0), [categories])
  const total = useMemo(() => categories.reduce((s,c) => s + c.items.length, 0), [categories])

  const addCategory = () => {
    if (!newCategory.trim()) return
    addTodoCategory(newCategory.trim())
    setNewCategory('')
    refresh()
  }

  const addItem = (categoryId: string) => {
    const title = (newItems[categoryId] || '').trim()
    if (!title) return
    addTodoItem(categoryId, title)
    setNewItems(v => ({ ...v, [categoryId]: '' }))
    refresh()
  }

  return (
    <main className="page page-todo">
      <header className="page-topbar">
        <button className="back-button" onClick={onBack}>←</button>
        <div><div className="eyebrow dark">MIN HVERDAG</div><h2>To Do</h2></div>
      </header>

      <section className="glass-card">
        <span className="small-label">Ferdig</span>
        <strong className="big-number">{completed} av {total}</strong>
        <div className="progress-track"><div className="progress-fill" style={{width: `${total ? completed/total*100 : 0}%`}} /></div>
      </section>

      <section className="glass-card add-card">
        <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ny kategori" />
        <button onClick={addCategory}>Legg til</button>
      </section>

      <section className="accordion-list">
        {categories.map(category => {
          const open = expanded === category.id
          const done = category.items.filter(i => i.isCompleted).length
          return (
            <article className="accordion-card" key={category.id}>
              <div className="accordion-header" onClick={() => setExpanded(open ? null : category.id)}>
                <div><h3>{category.name}</h3><span>{done}/{category.items.length} ferdig</span></div>
                <div className="accordion-actions">
                  <button onClick={e => { e.stopPropagation(); toggleTodoFavorite(category.id); refresh() }}>
                    {category.isFavorite ? '★' : '☆'}
                  </button>
                  <span>{open ? '⌃' : '⌄'}</span>
                </div>
              </div>

              {open && (
                <div className="accordion-body">
                  {category.items.map(item => (
                    <label className="todo-row" key={item.id}>
                      <input type="checkbox" checked={item.isCompleted}
                        onChange={() => { toggleTodoItem(category.id, item.id); refresh() }} />
                      <span className={item.isCompleted ? 'completed' : ''}>{item.title}</span>
                    </label>
                  ))}

                  <div className="inline-add">
                    <input value={newItems[category.id] || ''}
                      onChange={e => setNewItems(v => ({...v, [category.id]: e.target.value}))}
                      placeholder="Ny oppgave" />
                    <button onClick={() => addItem(category.id)}>+</button>
                  </div>

                  <button className="danger-link" onClick={() => {
                    if (confirm(`Slette kategorien "${category.name}"?`)) {
                      deleteTodoCategoryById(category.id); setExpanded(null); refresh()
                    }
                  }}>Slett kategori</button>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}

