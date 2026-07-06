import React, { useEffect, useState } from 'react'
import Home from './pages/Home'
import TodoPage from './pages/TodoPage'
import BudgetPage from './pages/BudgetPage'
import { performDailyAndWeeklyUpdatesIfNeeded, loadAllData, saveAllData } from './lib/storage'

export type View = 'home' | 'todo' | 'budget'

export default function App(){
  const [view, setView] = useState<View>('home')

  useEffect(()=>{
    loadAllData()
    performDailyAndWeeklyUpdatesIfNeeded()
    const onFocus = () => performDailyAndWeeklyUpdatesIfNeeded()
    window.addEventListener('focus', onFocus)
    return ()=> window.removeEventListener('focus', onFocus)
  }, [])

  return (
    <div className="app">
      <div className="header">
        <h1>Emifla</h1>
        <div className="small">PWA</div>
      </div>

      {view === 'home' && <Home onNavigate={setView} />}
      {view === 'todo' && <TodoPage onBack={() => setView('home')} />}
      {view === 'budget' && <BudgetPage onBack={() => setView('home')} />}

    </div>
  )
}
