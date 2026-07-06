import Foundation

// MARK: - Todo Models

public struct TodoItem: Identifiable, Codable {
    public var id: UUID = UUID()
    public var title: String
    public var isCompleted: Bool = false
}

public struct TodoCategory: Identifiable, Codable {
    public var id: UUID = UUID()
    public var name: String
    public var items: [TodoItem] = []
    public var isFavorite: Bool = false
    
    // Weekly tracking
    public var lastWeekStartISO: String? = nil // ISO string of Monday when last reset happened
    public var allCompletedThisWeek: Bool = false
    public var completedWeeks: Int = 0
    
    public mutating func updateAllCompletedFlag() {
        allCompletedThisWeek = !items.isEmpty && items.allSatisfy { $0.isCompleted }
    }
}

// MARK: - Budget Models

public struct TransactionItem: Identifiable, Codable {
    public var id: UUID = UUID()
    public var date: Date = Date()
    public var note: String?
    public var amount: Double // positive number interpreted as spent
}

public struct BudgetCategory: Identifiable, Codable {
    public var id: UUID = UUID()
    public var name: String
    public var dailyBudget: Double = 0.0
    public var balance: Double = 0.0
    public var transactions: [TransactionItem] = []
    
    // last date we updated balance by adding dailyBudget
    public var lastUpdatedISO: String? = nil
}
