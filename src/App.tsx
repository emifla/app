import React, { useEffect, useState } from 'react'
import Home from './pages/Home'
import TodoPage from './pages/TodoPage'
import BudgetPage from './pages/BudgetPage'
import TrackingPage from './pages/TrackingPage'
import { loadAllData, performDailyAndWeeklyUpdatesIfNeeded } from './lib/storage'

export type View = 'home' | 'todo' | 'budget' | 'tracking'

export default function App() {
  const [view, setView] = useState<View>('home')

  useEffect(() => {
    loadAllData()
    performDailyAndWeeklyUpdatesIfNeeded()

    const refresh = () => performDailyAndWeeklyUpdatesIfNeeded()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return (
    <div className="app-shell">
      {view === 'home' && <Home onNavigate={setView} />}
      {view === 'todo' && <TodoPage onBack={() => setView('home')} />}
      {view === 'budget' && <BudgetPage onBack={() => setView('home')} />}
      {view === 'tracking' && <TrackingPage onBack={() => setView('home')} />}
    </div>
  )
}
