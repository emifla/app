import type {
  TodoCategory,
  BudgetCategory,
  TransactionItem
} from './models'

const TODO_KEY = 'emifla_todos_v1'
const BUDGET_KEY = 'emifla_budgets_v1'

let todoCategories: TodoCategory[] = []
let budgetCategories: BudgetCategory[] = []

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

  saveAllData()
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

function iso(date: Date) {
  return date.toISOString()
}

function dateFromISO(value?: string | null) {
  return value ? new Date(value) : null
}

function monday(date = new Date()) {
  const result = new Date(date)
  const day = result.getDay()
  const difference = (day === 0 ? -6 : 1) - day

  result.setDate(result.getDate() + difference)
  result.setHours(0, 0, 0, 0)

  return result
}

export function performDailyAndWeeklyUpdatesIfNeeded() {
  performWeeklyResetIfNeeded()
  performDailyBudgetUpdatesIfNeeded()
  saveAllData()
}

export function performWeeklyResetIfNeeded() {
  const currentWeekStart = iso(monday())

  for (const category of todoCategories) {
    if (category.isFavorite) {
      if (category.lastWeekStartISO !== currentWeekStart) {
        if (category.allCompletedThisWeek) {
          category.completedWeeks =
            (category.completedWeeks || 0) + 1
        }

        category.items = category.items.map(item => ({
          ...item,
          isCompleted: false
        }))

        category.allCompletedThisWeek = false
        category.lastWeekStartISO = currentWeekStart
      }
    } else if (!category.lastWeekStartISO) {
      category.lastWeekStartISO = currentWeekStart
    }
  }

  saveAllData()
}

export function performDailyBudgetUpdatesIfNeeded() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const category of budgetCategories) {
    const lastUpdated = dateFromISO(category.lastUpdatedISO)

    if (!lastUpdated) {
      category.lastUpdatedISO = iso(today)
      continue
    }

    lastUpdated.setHours(0, 0, 0, 0)

    const daysPassed = Math.floor(
      (today.getTime() - lastUpdated.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    if (daysPassed > 0) {
      category.balance +=
        daysPassed * category.dailyBudget

      category.lastUpdatedISO = iso(today)
    }
  }

  saveAllData()
}

// MARK: Todo

export function getTodoCategories() {
  return todoCategories
}

export function addTodoCategory(name: string) {
  const category: TodoCategory = {
    id: createId(),
    name,
    items: [],
    isFavorite: false,
    lastWeekStartISO: iso(monday()),
    allCompletedThisWeek: false,
    completedWeeks: 0
  }

  todoCategories.push(category)
  saveAllData()
}

export function addTodoItem(
  categoryId: string,
  title: string
) {
  const category = todoCategories.find(
    category => category.id === categoryId
  )

  if (!category) return

  category.items.push({
    id: createId(),
    title,
    isCompleted: false
  })

  category.allCompletedThisWeek = false

  saveAllData()
}

export function toggleTodoItem(
  categoryId: string,
  itemId: string
) {
  const category = todoCategories.find(
    category => category.id === categoryId
  )

  if (!category) return

  const item = category.items.find(
    item => item.id === itemId
  )

  if (!item) return

  item.isCompleted = !item.isCompleted

  category.allCompletedThisWeek =
    category.items.length > 0 &&
    category.items.every(item => item.isCompleted)

  saveAllData()
}

export function toggleTodoFavorite(
  categoryId: string
) {
  const category = todoCategories.find(
    category => category.id === categoryId
  )

  if (!category) return

  category.isFavorite = !category.isFavorite
  category.lastWeekStartISO = iso(monday())

  saveAllData()
}

export function updateTodoCategory(
  updatedCategory: TodoCategory
) {
  const index = todoCategories.findIndex(
    category => category.id === updatedCategory.id
  )

  if (index === -1) return

  todoCategories[index] = updatedCategory
  saveAllData()
}

export function deleteTodoCategoryById(
  categoryId: string
) {
  todoCategories = todoCategories.filter(
    category => category.id !== categoryId
  )

  saveAllData()
}

// MARK: Budsjett

export function getBudgetCategories() {
  return budgetCategories
}

export function addBudgetCategory(
  name: string,
  dailyBudget: number
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const category: BudgetCategory = {
    id: createId(),
    name,
    dailyBudget,
    balance: dailyBudget,
    transactions: [],
    lastUpdatedISO: iso(today)
  }

  budgetCategories.push(category)
  saveAllData()
}

export function updateBudgetCategory(
  updatedCategory: BudgetCategory
) {
  const index = budgetCategories.findIndex(
    category => category.id === updatedCategory.id
  )

  if (index === -1) return

  budgetCategories[index] = updatedCategory
  saveAllData()
}

export function deleteBudgetCategoryById(
  categoryId: string
) {
  budgetCategories = budgetCategories.filter(
    category => category.id !== categoryId
  )

  saveAllData()
}

export function addTransaction(
  categoryId: string,
  amount: number,
  note?: string
) {
  const category = budgetCategories.find(
    category => category.id === categoryId
  )

  if (!category) return

  const transaction: TransactionItem = {
    id: createId(),
    date: iso(new Date()),
    note,
    amount
  }

  category.transactions.unshift(transaction)
  category.balance -= amount

  saveAllData()
}
