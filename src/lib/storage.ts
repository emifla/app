import { TodoCategory, BudgetCategory, TodoItem, TransactionItem } from './models'

const TODO_KEY = 'emifla_todos_v1'
const BUDGET_KEY = 'emifla_budgets_v1'

// in-memory caches for quick reads
let todoCategories: TodoCategory[] = []
let budgetCategories: BudgetCategory[] = []

export function loadAllData(){
  try{
    const t = localStorage.getItem(TODO_KEY)
    todoCategories = t ? JSON.parse(t) : sampleTodos()
  }catch(e){ todoCategories = sampleTodos() }

  try{
    const b = localStorage.getItem(BUDGET_KEY)
    budgetCategories = b ? JSON.parse(b) : []
  }catch(e){ budgetCategories = [] }

  saveAllData()
}

export function saveAllData(){
  localStorage.setItem(TODO_KEY, JSON.stringify(todoCategories))
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetCategories))
}

function sampleTodos(): TodoCategory[] {
  return [{ id: cryptoId(), name: 'Example Routine', items: [{id: cryptoId(), title:'Make bed', isCompleted:false},{id: cryptoId(), title:'Brush teeth', isCompleted:false}], isFavorite:false, completedWeeks:0, allCompletedThisWeek:false }]
}

function iso(date: Date){ return date.toISOString() }
function dateFromISO(s?:string|null){ return s ? new Date(s) : null }

function startOfWeekMonday(d = new Date()){
  const date = new Date(d)
  const day = date.getDay()
  const diff = (day === 0 ? -6 : 1) - day // shift so Monday is start
  date.setDate(date.getDate() + diff)
  date.setHours(0,0,0,0)
  return date
}

export function performDailyAndWeeklyUpdatesIfNeeded(){
  performDailyBudgetUpdatesIfNeeded()
  performWeeklyResetIfNeeded()
  saveAllData()
}

export function performWeeklyResetIfNeeded(){
  const currentWeekStart = startOfWeekMonday()
  const currentISO = iso(currentWeekStart)
  let changed = false
  for (let i=0;i<todoCategories.length;i++){
    const cat = todoCategories[i]
    if (cat.isFavorite){
      const lastISO = cat.lastWeekStartISO
      if (lastISO !== currentISO){
        if (cat.allCompletedThisWeek) cat.completedWeeks = (cat.completedWeeks||0)+1
        // reset
        cat.items = cat.items.map(it=>({ ...it, isCompleted:false }))
        cat.allCompletedThisWeek = false
        cat.lastWeekStartISO = currentISO
        changed = true
      }
    } else {
      if (!cat.lastWeekStartISO){ cat.lastWeekStartISO = currentISO; changed = true }
    }
  }
  if (changed) saveAllData()
}

export function performDailyBudgetUpdatesIfNeeded(){
  const today = new Date(); today.setHours(0,0,0,0)
  let changed = false
  for (let i=0;i<budgetCategories.length;i++){
    const b = budgetCategories[i]
    const last = dateFromISO(b.lastUpdatedISO) || new Date(0)
    last.setHours(0,0,0,0)
    const days = Math.floor((today.getTime() - last.getTime()) / (1000*60*60*24))
    if (days > 0){
      b.balance = (b.balance || 0) + days * (b.dailyBudget || 0)
      b.lastUpdatedISO = iso(today)
      changed = true
    } else if (!b.lastUpdatedISO){
      b.lastUpdatedISO = iso(today)
      b.balance = (b.balance||0) + (b.dailyBudget||0)
      changed = true
    }
  }
  if (changed) saveAllData()
}

// CRUD for todos
export function getTodoCategories(){ return todoCategories }
export function addTodoCategory(name: string){ todoCategories.push({ id: cryptoId(), name, items: [], isFavorite:false, completedWeeks:0, allCompletedThisWeek:false }); saveAllData() }
export function updateTodoCategory(cat: TodoCategory){ const idx = todoCategories.findIndex(c=>c.id===cat.id); if(idx!==-1) todoCategories[idx] = cat; saveAllData() }
export function deleteTodoCategoryById(id:string){ todoCategories = todoCategories.filter(c=>c.id!==id); saveAllData() }
export function addTodoItem(categoryId:string, title:string){ const cat = todoCategories.find(c=>c.id===categoryId); if(!cat) return; cat.items.push({ id: cryptoId(), title, isCompleted:false }); saveAllData() }

// budgets
export function getBudgetCategories(){ return budgetCategories }
export function addBudgetCategory(name:string, dailyBudget:number){ budgetCategories.push({ id: cryptoId(), name, dailyBudget, balance: dailyBudget, transactions: [], lastUpdatedISO: iso(new Date()) }); saveAllData() }
export function updateBudgetCategory(cat: BudgetCategory){ const idx = budgetCategories.findIndex(c=>c.id===cat.id); if(idx!==-1) budgetCategories[idx]=cat; saveAllData() }
export function addTransaction(categoryId:string, amount:number, note?:string){ const cat = budgetCategories.find(c=>c.id===categoryId); if(!cat) return; const t: TransactionItem = { id: cryptoId(), date: iso(new Date()), note, amount }; cat.transactions.unshift(t); cat.balance = (cat.balance||0) - amount; cat.lastUpdatedISO = iso(new Date()); saveAllData() }

function cryptoId(){ // simple id
  return Math.random().toString(36).slice(2,9)
}
