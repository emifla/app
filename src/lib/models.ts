export type Recurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface TodoItem {
  id: string
  title: string
  isCompleted: boolean
}

export interface TodoCategory {
  id: string
  name: string
  items: TodoItem[]
  isFavorite: boolean
  recurrence?: Recurrence
  lastResetISO?: string | null
  lastWeekStartISO?: string | null
  allCompletedThisWeek?: boolean
  completedWeeks?: number
  completedPeriods?: number
}

export interface TransactionItem {
  id: string
  date: string
  note?: string
  amount: number
}

export interface BudgetCategory {
  id: string
  name: string
  dailyBudget: number
  frequency?: Recurrence
  balance: number
  transactions: TransactionItem[]
  lastUpdatedISO?: string | null
}
