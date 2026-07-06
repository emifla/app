import React, { useState } from 'react'
import { getBudgetCategories, addBudgetCategory, addTransaction } from '../lib/storage'
import { BudgetCategory } from '../lib/models'

export default function BudgetPage({ onBack }:{ onBack:()=>void }){
  const [categories, setCategories] = useState<BudgetCategory[]>(getBudgetCategories())
  const [name, setName] = useState('')
  const [daily, setDaily] = useState('')

  const refresh = ()=> setCategories(getBudgetCategories())

  const handleAdd = ()=>{
    const d = parseFloat(daily)
    if (!name.trim() || Number.isNaN(d)) return
    addBudgetCategory(name.trim(), d)
    setName(''); setDaily(''); refresh()
  }

  const handleSpend = (id:string)=>{
    const s = prompt('Amount spent (positive number)')
    if (!s) return
    const a = parseFloat(s)
    if (Number.isNaN(a)) return alert('Invalid amount')
    const note = prompt('Optional note') || undefined
    addTransaction(id, a, note)
    refresh()
  }

  return (
    <div>
      <button onClick={onBack} className="small" style={{marginBottom:10}}>← Home</button>
      <h2>Budget Categories</h2>
      <div className="form-row">
        <input placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} />
        <input placeholder="Daily" value={daily} onChange={e=>setDaily(e.target.value)} style={{width:100}} />
        <button className="button" onClick={handleAdd}>Add</button>
      </div>

      <div className="list" style={{marginTop:12}}>
        {categories.map(cat=> (
          <div key={cat.id} className="item">
            <div>
              <div style={{fontWeight:600}}>{cat.name}</div>
              <div className="small">Daily: {Math.round(cat.dailyBudget)} kr • Balance: {Math.round(cat.balance)} kr</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <button onClick={()=>handleSpend(cat.id)} className="small">Add transaction</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
