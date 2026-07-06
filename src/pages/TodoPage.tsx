import React, { useState } from 'react'
import { getTodoCategories, addTodoCategory, updateTodoCategory, deleteTodoCategory, addTodoItem } from '../lib/storage'
import { TodoCategory } from '../lib/models'

export default function TodoPage({ onBack }:{ onBack:()=>void }){
  const [categories, setCategories] = useState<TodoCategory[]>(getTodoCategories())
  const [name, setName] = useState('')

  const refresh = ()=> setCategories(getTodoCategories())

  const handleAdd = ()=>{
    if (!name.trim()) return
    addTodoCategory(name.trim())
    setName('')
    refresh()
  }

  const toggleFavorite = (id:string)=>{
    const cats = getTodoCategories()
    const idx = cats.findIndex(c=>c.id===id)
    if (idx===-1) return
    cats[idx].isFavorite = !cats[idx].isFavorite
    updateTodoCategory(cats[idx])
    refresh()
  }

  const addItem = (id:string, title:string)=>{
    if (!title.trim()) return
    addTodoItem(id, title.trim())
    refresh()
  }

  return (
    <div>
      <button onClick={onBack} className="small" style={{marginBottom:10}}>← Home</button>
      <h2>To‑Do Categories</h2>
      <div className="form-row">
        <input placeholder="New category" value={name} onChange={e=>setName(e.target.value)} />
        <button className="button" onClick={handleAdd}>Add</button>
      </div>

      <div className="list">
        {categories.map(cat=> (
          <div key={cat.id} className="item">
            <div>
              <div style={{fontWeight:600}}>{cat.name} {cat.isFavorite ? '⭐' : ''}</div>
              <div className="small">{cat.items.filter(i=>!i.isCompleted).length} remaining • {cat.completedWeeks}w</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <button onClick={()=>toggleFavorite(cat.id)} className="small">Favorite</button>
            </div>
          </div>
        ))}
      </div>

      <hr style={{margin:'18px 0'}} />
      <h3>Add item to category</h3>
      <AddItemForm onAdd={addItem} categories={categories} />

    </div>
  )
}

function AddItemForm({categories, onAdd}:{categories:TodoCategory[], onAdd:(id:string,title:string)=>void}){
  const [catId, setCatId] = useState(categories[0]?.id || '')
  const [title, setTitle] = useState('')
  React.useEffect(()=>{ if(!catId && categories[0]) setCatId(categories[0].id) },[categories])
  return (
    <div>
      <div className="form-row">
        <select value={catId} onChange={e=>setCatId(e.target.value)}>
          {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="Item title" value={title} onChange={e=>setTitle(e.target.value)} />
        <button className="button" onClick={()=>{ if(catId) onAdd(catId,title); setTitle('') }}>Add</button>
      </div>
    </div>
  )
}
