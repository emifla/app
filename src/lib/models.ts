// simple models
export interface TodoItem { id: string; title: string; isCompleted: boolean }
export interface TodoCategory { id: string; name: string; items: TodoItem[]; isFavorite: boolean; lastWeekStartISO?: string | null; allCompletedThisWeek?: boolean; completedWeeks?: number }

export interface TransactionItem { id: string; date: string; note?: string; amount: number }
export interface BudgetCategory { id: string; name: string; dailyBudget: number; balance: number; transactions: TransactionItem[]; lastUpdatedISO?: string | null }
