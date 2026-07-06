import Foundation
import Combine
import SwiftUI

final class DataController: ObservableObject {
    static let shared = DataController()
    private init() {
        loadAll()
        performDailyAndWeeklyUpdatesIfNeeded()
        setupAppLifecycleNotifications()
    }
    
    @Published var todoCategories: [TodoCategory] = []
    @Published var budgetCategories: [BudgetCategory] = []
    
    private let todoFile = "todos.json"
    private let budgetFile = "budgets.json"
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Load / Save
    
    private var docsURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    
    private func fileURL(_ filename: String) -> URL {
        docsURL.appendingPathComponent(filename)
    }
    
    func loadAll() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        // Todos
        let tURL = fileURL(todoFile)
        if let data = try? Data(contentsOf: tURL),
           let parsed = try? decoder.decode([TodoCategory].self, from: data) {
            self.todoCategories = parsed
        } else {
            // sample starter
            self.todoCategories = [
                TodoCategory(name: "Example Routine", items: [
                    TodoItem(title: "Make bed"),
                    TodoItem(title: "Brush teeth"),
                    TodoItem(title: "Plan day")
                ])
            ]
            saveTodos()
        }
        // Budgets
        let bURL = fileURL(budgetFile)
        if let data = try? Data(contentsOf: bURL),
           let parsed = try? decoder.decode([BudgetCategory].self, from: data) {
            self.budgetCategories = parsed
        } else {
            self.budgetCategories = []
            saveBudgets()
        }
    }
    
    func saveTodos() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let data = try? encoder.encode(todoCategories) {
            try? data.write(to: fileURL(todoFile), options: .atomic)
        }
    }
    
    func saveBudgets() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        if let data = try? encoder.encode(budgetCategories) {
            try? data.write(to: fileURL(budgetFile), options: .atomic)
        }
    }
    
    // MARK: - Date Utilities
    
    private var calendar: Calendar { Calendar.current }
    
    func startOfWeekMonday(for date: Date = Date()) -> Date {
        var cal = calendar
        cal.firstWeekday = 2 // Monday = 2
        let comps = cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return cal.date(from: comps)!
    }
    
    private func iso8601String(from date: Date) -> String {
        ISO8601DateFormatter().string(from: date)
    }
    
    private func dateFromISO8601(_ iso: String?) -> Date? {
        guard let iso = iso else { return nil }
        return ISO8601DateFormatter().date(from: iso)
    }
    
    // MARK: - Weekly reset logic
    
    func performWeeklyResetIfNeeded() {
        let currentWeekStart = startOfWeekMonday()
        let currentISO = iso8601String(from: currentWeekStart)
        var changed = false
        
        for i in todoCategories.indices {
            if todoCategories[i].isFavorite {
                let lastISO = todoCategories[i].lastWeekStartISO
                if lastISO != currentISO {
                    // week changed for this category -> evaluate previous week, reset tasks
                    if todoCategories[i].allCompletedThisWeek {
                        todoCategories[i].completedWeeks += 1
                    }
                    // reset tasks to unchecked
                    for j in todoCategories[i].items.indices {
                        todoCategories[i].items[j].isCompleted = false
                    }
                    todoCategories[i].allCompletedThisWeek = false
                    todoCategories[i].lastWeekStartISO = currentISO
                    changed = true
                }
            } else {
                // for non-favorites we don't auto reset, but update lastWeekStartISO so we don't repeatedly reset if they toggle favorite later
                if todoCategories[i].lastWeekStartISO == nil {
                    todoCategories[i].lastWeekStartISO = currentISO
                    changed = true
                }
            }
        }
        if changed { saveTodos() }
    }
    
    // Call this after any change to items to update the allCompletedThisWeek flag and persist
    func updateTodoCategoryAfterChange(_ id: UUID) {
        guard let idx = todoCategories.firstIndex(where: { $0.id == id }) else { return }
        todoCategories[idx].updateAllCompletedFlag()
        saveTodos()
    }
    
    // MARK: - Budget daily updates
    
    func performDailyBudgetUpdatesIfNeeded() {
        let today = calendar.startOfDay(for: Date())
        var changed = false
        
        for i in budgetCategories.indices {
            let lastDate = dateFromISO8601(budgetCategories[i].lastUpdatedISO) ?? calendar.startOfDay(for: Date(timeIntervalSince1970: 0))
            let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: lastDate), to: today).day ?? 0
            if days > 0 {
                // add dailyBudget * days
                budgetCategories[i].balance += Double(days) * budgetCategories[i].dailyBudget
                budgetCategories[i].lastUpdatedISO = iso8601String(from: today)
                changed = true
            } else if budgetCategories[i].lastUpdatedISO == nil {
                // first-time set
                budgetCategories[i].lastUpdatedISO = iso8601String(from: today)
                budgetCategories[i].balance += budgetCategories[i].dailyBudget
                changed = true
            }
        }
        if changed { saveBudgets() }
    }
    
    func addTransaction(to categoryId: UUID, amount: Double, note: String?) {
        guard let idx = budgetCategories.firstIndex(where: { $0.id == categoryId }) else { return }
        let t = TransactionItem(date: Date(), note: note, amount: amount)
        budgetCategories[idx].transactions.insert(t, at: 0)
        budgetCategories[idx].balance -= amount
        budgetCategories[idx].lastUpdatedISO = iso8601String(from: calendar.startOfDay(for: Date()))
        saveBudgets()
    }
    
    // MARK: - Combined update entrypoint
    
    func performDailyAndWeeklyUpdatesIfNeeded() {
        performDailyBudgetUpdatesIfNeeded()
        performWeeklyResetIfNeeded()
    }
    
    // MARK: - App lifecycle
    
    private func setupAppLifecycleNotifications() {
        NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
    }
    
    @objc private func appWillEnterForeground() {
        performDailyAndWeeklyUpdatesIfNeeded()
    }
    
    // MARK: - Basic CRUD helpers for views
    
    func addTodoCategory(name: String) {
        let c = TodoCategory(name: name)
        todoCategories.append(c)
        saveTodos()
    }
    func updateTodoCategory(_ cat: TodoCategory) {
        guard let idx = todoCategories.firstIndex(where: { $0.id == cat.id }) else { return }
        todoCategories[idx] = cat
        saveTodos()
    }
    func deleteTodoCategory(at offsets: IndexSet) {
        todoCategories.remove(atOffsets: offsets)
        saveTodos()
    }
    
    func addTodoItem(categoryId: UUID, title: String) {
        guard let idx = todoCategories.firstIndex(where: { $0.id == categoryId }) else { return }
        todoCategories[idx].items.append(TodoItem(title: title))
        todoCategories[idx].updateAllCompletedFlag()
        saveTodos()
    }
    
    // budgets CRUD
    func addBudgetCategory(name: String, dailyBudget: Double) {
        var b = BudgetCategory(name: name, dailyBudget: dailyBudget)
        // set initial lastUpdatedISO to today
        b.lastUpdatedISO = iso8601String(from: calendar.startOfDay(for: Date()))
        b.balance = dailyBudget
        budgetCategories.append(b)
        saveBudgets()
    }
    func updateBudgetCategory(_ cat: BudgetCategory) {
        guard let idx = budgetCategories.firstIndex(where: { $0.id == cat.id }) else { return }
        budgetCategories[idx] = cat
        saveBudgets()
    }
    func deleteBudgetCategory(at offsets: IndexSet) {
        budgetCategories.remove(atOffsets: offsets)
        saveBudgets()
    }
}
