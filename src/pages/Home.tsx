import React from 'react'

export default function Home({onNavigate}:{onNavigate:(v:'home'|'todo'|'budget')=>void}){
  return (
    <div>
      <div className="card big-cta">
        <button className="button" onClick={()=>onNavigate('todo')}>To‑Do</button>
        <button className="button" onClick={()=>onNavigate('budget')}>Budgeting</button>
      </div>

      <div style={{marginTop:18}} className="card">
        <div className="small">To‑Do: create categories, mark favorites. Favorites auto-reset every Monday and track weeks fully completed.</div>
        <div className="small" style={{marginTop:8}}>Budgeting: add categories with a daily budget, add spending transactions; balance auto-increments every day by the daily budget.</div>
      </div>
    </div>
  )
}
