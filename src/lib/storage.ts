import type {
  TodoCategory,
  BudgetCategory,
  TransactionItem,
  Recurrence
} from './models'

const TODO_KEY = 'emifla_todos_v1'
const BUDGET_KEY = 'emifla_budgets_v1'

let todoCategories: TodoCategory[] = []
let budgetCategories: BudgetCategory[] = []

export const recurrenceLabels: Record<Recurrence, string> = {
  daily: 'Daglig',
  weekly: 'Ukentlig',
  biweekly: 'Annenhver uke',
  monthly: 'Månedlig'
}

export function loadAllData() {
  try {
    const savedTodos = localStorage.getItem(TODO_KEY)
    todoCategories = savedTodos ? JSON.parse(savedTodos) : []
  } catch {
    todoCategories = []
  }

  try {
    const savedBudgets = localStorage.getItem(BUDGET_KEY)
    budgetCategories = savedBudgets ? JSON.parse(savedBudgets) : []
  } catch {
    budgetCategories = []
  }

  migrateOldData()
  saveAllData()
}

function migrateOldData() {
  todoCategories = todoCategories.map(category => ({
    ...category,
    recurrence: category.recurrence || 'weekly',
    lastResetISO:
      category.lastResetISO ||
      category.lastWeekStartISO ||
      startForFrequency(new Date(), category.recurrence || 'weekly').toISOString(),
    completedPeriods:
      category.completedPeriods ?? category.completedWeeks ?? 0
  }))

  budgetCategories = budgetCategories.map(category => ({
    ...category,
    frequency: category.frequency || 'daily'
  }))
}

export function saveAllData() {
  localStorage.setItem(TODO_KEY, JSON.stringify(todoCategories))
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetCategories))
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function monday(date = new Date()) {
  const result = startOfDay(date)
  const day = result.getDay()
  const difference = (day === 0 ? -6 : 1) - day
  result.setDate(result.getDate() + difference)
  return result
}

function startOfMonth(date = new Date()) {
  const result = startOfDay(date)
  result.setDate(1)
  return result
}

function startForFrequency(date: Date, frequency: Recurrence) {
  if (frequency === 'weekly' || frequency === 'biweekly') return monday(date)
  if (frequency === 'monthly') return startOfMonth(date)
  return startOfDay(date)
}

function addPeriod(date: Date, frequency: Recurrence) {
  const result = new Date(date)

  if (frequency === 'daily') result.setDate(result.getDate() + 1)
  if (frequency === 'weekly') result.setDate(result.getDate() + 7)
  if (frequency === 'biweekly') result.setDate(result.getDate() + 14)
  if (frequency === 'monthly') result.setMonth(result.getMonth() + 1)

  return result
}

function periodsElapsed(lastISO: string | null | undefined, frequency: Recurrence) {
  if (!lastISO) return 0

  const now = startOfDay(new Date())
  let cursor = startForFrequency(new Date(lastISO), frequency)
  let count = 0
  let next = addPeriod(cursor, frequency)

  while (next <= now && count < 5000) {
    count += 1
    cursor = next
    next = addPeriod(cursor, frequency)
  }

  return count
}

function latestPeriodStart(lastISO: string, frequency: Recurrence, elapsed: number) {
  let result = startForFrequency(new Date(lastISO), frequency)
  for (let index = 0; index < elapsed; index += 1) {
    result = addPeriod(result, frequency)
  }
  return result.toISOString()
}

export function performDailyAndWeeklyUpdatesIfNeeded() {
  performTodoResetsIfNeeded()
  performBudgetUpdatesIfNeeded()
  saveAllData()
}

export function performTodoResetsIfNeeded() {
  for (const category of todoCategories) {
    if (!category.isFavorite) continue

    const frequency = category.recurrence || 'weekly'
    const lastReset =
      category.lastResetISO ||
      category.lastWeekStartISO ||
      startForFrequency(new Date(), frequency).toISOString()

    const elapsed = periodsElapsed(lastReset, frequency)

    if (elapsed > 0) {
      if (category.allCompletedThisWeek) {
        category.completedPeriods = (category.completedPeriods || 0) + 1
        category.completedWeeks = category.completedPeriods
      }

      category.items = category.items.map(item => ({
        ...item,
        isCompleted: false
      }))

      category.allCompletedThisWeek = false
      category.lastResetISO = latestPeriodStart(lastReset, frequency, elapsed)
      category.lastWeekStartISO = category.lastResetISO
    }
  }
}

export function performBudgetUpdatesIfNeeded() {
  for (const category of budgetCategories) {
    const frequency = category.frequency || 'daily'
    const lastUpdated =
      category.lastUpdatedISO ||
      startForFrequency(new Date(), frequency).toISOString()

    const elapsed = periodsElapsed(lastUpdated, frequency)

    if (elapsed > 0) {
      category.balance += elapsed * category.dailyBudget
      category.lastUpdatedISO = latestPeriodStart(lastUpdated, frequency, elapsed)
    }
  }
}

export function getTodoCategories() {
  return todoCategories
}

export function addTodoCategory(
  name: string,
  recurrence: Recurrence = 'weekly'
) {
  todoCategories.push({
    id: createId(),
    name,
    items: [],
    isFavorite: false,
    recurrence,
    lastResetISO: startForFrequency(new Date(), recurrence).toISOString(),
    lastWeekStartISO: startForFrequency(new Date(), recurrence).toISOString(),
    allCompletedThisWeek: false,
    completedWeeks: 0,
    completedPeriods: 0
  })

  saveAllData()
}

export function setTodoRecurrence(
  categoryId: string,
  recurrence: Recurrence
) {
  const category = todoCategories.find(item => item.id === categoryId)
  if (!category) return

  category.recurrence = recurrence
  category.lastResetISO = startForFrequency(new Date(), recurrence).toISOString()
  category.lastWeekStartISO = category.lastResetISO
  saveAllData()
}

export function addTodoItem(categoryId: string, title: string) {
  const category = todoCategories.find(item => item.id === categoryId)
  if (!category) return

  category.items.push({
    id: createId(),
    title,
    isCompleted: false
  })

  category.allCompletedThisWeek = false
  saveAllData()
}

export function toggleTodoItem(categoryId: string, itemId: string) {
  const category = todoCategories.find(item => item.id === categoryId)
  if (!category) return

  const item = category.items.find(item => item.id === itemId)
  if (!item) return

  item.isCompleted = !item.isCompleted
  category.allCompletedThisWeek =
    category.items.length > 0 &&
    category.items.every(item => item.isCompleted)

  saveAllData()
}

export function deleteTodoItem(categoryId: string, itemId: string) {
  const category = todoCategories.find(item => item.id === categoryId)
  if (!category) return

  category.items = category.items.filter(item => item.id !== itemId)
  category.allCompletedThisWeek =
    category.items.length > 0 &&
    category.items.every(item => item.isCompleted)

  saveAllData()
}

export function toggleTodoFavorite(categoryId: string) {
  const category = todoCategories.find(item => item.id === categoryId)
  if (!category) return

  category.isFavorite = !category.isFavorite

  if (category.isFavorite) {
    const frequency = category.recurrence || 'weekly'
    category.lastResetISO = startForFrequency(new Date(), frequency).toISOString()
    category.lastWeekStartISO = category.lastResetISO
  }

  saveAllData()
}

export function deleteTodoCategoryById(categoryId: string) {
  todoCategories = todoCategories.filter(item => item.id !== categoryId)
  saveAllData()
}

export function getBudgetCategories() {
  return budgetCategories
}

export function addBudgetCategory(
  name: string,
  amountPerPeriod: number,
  frequency: Recurrence = 'daily'
) {
  const periodStart = startForFrequency(new Date(), frequency)

  budgetCategories.push({
    id: createId(),
    name,
    dailyBudget: amountPerPeriod,
    frequency,
    balance: amountPerPeriod,
    transactions: [],
    lastUpdatedISO: periodStart.toISOString()
  })

  saveAllData()
}

export function setBudgetFrequency(
  categoryId: string,
  frequency: Recurrence
) {
  const category = budgetCategories.find(item => item.id === categoryId)
  if (!category) return

  category.frequency = frequency
  category.lastUpdatedISO = startForFrequency(new Date(), frequency).toISOString()
  saveAllData()
}

export function addTransaction(
  categoryId: string,
  amount: number,
  note?: string
) {
  const category = budgetCategories.find(item => item.id === categoryId)
  if (!category) return

  const transaction: TransactionItem = {
    id: createId(),
    date: new Date().toISOString(),
    note,
    amount
  }

  category.transactions.unshift(transaction)
  category.balance -= amount
  saveAllData()
}

export function deleteTransaction(categoryId: string, transactionId: string) {
  const category = budgetCategories.find(item => item.id === categoryId)
  if (!category) return

  const transaction = category.transactions.find(item => item.id === transactionId)
  if (!transaction) return

  category.balance += transaction.amount
  category.transactions = category.transactions.filter(
    item => item.id !== transactionId
  )

  saveAllData()
}

export function deleteBudgetCategoryById(categoryId: string) {
  budgetCategories = budgetCategories.filter(item => item.id !== categoryId)
  saveAllData()
}
