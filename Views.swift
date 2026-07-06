import SwiftUI

@main
struct MyApp: App {
    @StateObject private var dc = DataController.shared
    var body: some Scene {
        WindowGroup {
            NavigationView {
                HomeView()
            }
            .environmentObject(dc)
        }
    }
}

struct HomeView: View {
    var body: some View {
        List {
            NavigationLink(destination: TodoListView()) {
                HStack {
                    Image(systemName: "checklist")
                    VStack(alignment: .leading) {
                        Text("To‑Do")
                            .font(.headline)
                        Text("Multiple categories, favorites reset every Monday")
                            .font(.caption)
                    }
                }
            }
            NavigationLink(destination: BudgetListView()) {
                HStack {
                    Image(systemName: "chart.pie")
                    VStack(alignment: .leading) {
                        Text("Budgeting")
                            .font(.headline)
                        Text("Daily budgets, cumulative balance, add transactions")
                            .font(.caption)
                    }
                }
            }
        }
        .listStyle(InsetGroupedListStyle())
        .navigationTitle("Home")
    }
}

// MARK: - ToDo Views

struct TodoListView: View {
    @EnvironmentObject var dc: DataController
    @State private var newName = ""
    var body: some View {
        VStack {
            List {
                ForEach(dc.todoCategories) { cat in
                    NavigationLink(destination: TodoCategoryDetailView(category: bindingForCategory(cat))) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(cat.name).font(.headline)
                                Text("\(cat.items.filter{!$0.isCompleted}.count) remaining")
                                    .font(.caption)
                            }
                            Spacer()
                            if cat.isFavorite { Image(systemName: "star.fill").foregroundColor(.yellow) }
                            Text("\(cat.completedWeeks)w").font(.caption).foregroundColor(.secondary)
                        }
                    }
                }
                .onDelete(perform: dc.deleteTodoCategory)
            }
            HStack {
                TextField("New category", text: $newName)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                Button("Add") {
                    guard !newName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                    dc.addTodoCategory(name: newName.trimmingCharacters(in: .whitespaces))
                    newName = ""
                }
            }.padding()
        }
        .navigationTitle("To‑Do Categories")
    }
    
    private func bindingForCategory(_ cat: TodoCategory) -> Binding<TodoCategory> {
        guard let idx = dc.todoCategories.firstIndex(where: { $0.id == cat.id }) else {
            fatalError("Category not found")
        }
        return $dc.todoCategories[idx]
    }
}

struct TodoCategoryDetailView: View {
    @Binding var category: TodoCategory
    @EnvironmentObject var dc: DataController
    @State private var newItemTitle = ""
    
    var body: some View {
        VStack {
            HStack {
                Toggle(isOn: $category.isFavorite.onChange { _ in dc.updateTodoCategory(category) }) {
                    Text("Favorite (auto reset Mondays)")
                }.padding()
                Spacer()
            }
            List {
                ForEach(category.items.indices, id: \.self) { i in
                    HStack {
                        Button(action: {
                            category.items[i].isCompleted.toggle()
                            category.updateAllCompletedFlag()
                            dc.updateTodoCategory(category)
                        }) {
                            Image(systemName: category.items[i].isCompleted ? "checkmark.circle.fill" : "circle")
                                .foregroundColor(category.items[i].isCompleted ? .green : .gray)
                        }
                        TextField("Item", text: Binding(
                            get: { category.items[i].title },
                            set: { category.items[i].title = $0; dc.updateTodoCategory(category) }
                        ))
                    }
                }
                .onDelete { idx in
                    category.items.remove(atOffsets: idx)
                    category.updateAllCompletedFlag()
                    dc.updateTodoCategory(category)
                }
            }
            HStack {
                TextField("New item", text: $newItemTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                Button("Add") {
                    guard !newItemTitle.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                    category.items.append(TodoItem(title: newItemTitle.trimmingCharacters(in: .whitespaces)))
                    newItemTitle = ""
                    category.updateAllCompletedFlag()
                    dc.updateTodoCategory(category)
                }
            }.padding()
        }
        .navigationTitle(category.name)
        .onDisappear {
            dc.updateTodoCategory(category)
        }
    }
}

// MARK: - Budget Views

struct BudgetListView: View {
    @EnvironmentObject var dc: DataController
    @State private var newName = ""
    @State private var newDaily = ""
    var body: some View {
        VStack {
            List {
                ForEach(dc.budgetCategories) { cat in
                    NavigationLink(destination: BudgetDetailView(category: bindingForCategory(cat))) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(cat.name).font(.headline)
                                Text("Daily: \(format(cat.dailyBudget))  Balance: \(format(cat.balance))")
                                    .font(.caption)
                            }
                            Spacer()
                        }
                    }
                }
                .onDelete(perform: dc.deleteBudgetCategory)
            }
            HStack {
                TextField("Category", text: $newName).textFieldStyle(RoundedBorderTextFieldStyle())
                TextField("Daily", text: $newDaily).frame(width: 80).textFieldStyle(RoundedBorderTextFieldStyle()).keyboardType(.decimalPad)
                Button("Add") {
                    guard !newName.trimmingCharacters(in: .whitespaces).isEmpty, let daily = Double(newDaily) else { return }
                    dc.addBudgetCategory(name: newName.trimmingCharacters(in: .whitespaces), dailyBudget: daily)
                    newName = ""
                    newDaily = ""
                }
            }.padding()
        }
        .navigationTitle("Budgets")
    }
    
    private func bindingForCategory(_ cat: BudgetCategory) -> Binding<BudgetCategory> {
        guard let idx = dc.budgetCategories.firstIndex(where: { $0.id == cat.id }) else {
            fatalError("Category not found")
        }
        return $dc.budgetCategories[idx]
    }
    
    private func format(_ v: Double) -> String {
        String(format: "%.0f kr", v)
    }
}

struct BudgetDetailView: View {
    @Binding var category: BudgetCategory
    @EnvironmentObject var dc: DataController
    @State private var amountStr = ""
    @State private var note = ""
    
    var body: some View {
        VStack {
            Form {
                Section(header: Text("Info")) {
                    HStack { Text("Daily budget"); Spacer(); Text("\(format(category.dailyBudget))") }
                    HStack { Text("Current balance"); Spacer(); Text("\(format(category.balance))").foregroundColor(category.balance >= 0 ? .primary : .red) }
                }
                Section(header: Text("Add transaction (spending)")) {
                    TextField("Amount", text: $amountStr).keyboardType(.decimalPad)
                    TextField("Note", text: $note)
                    Button("Add") {
                        guard let amount = Double(amountStr) else { return }
                        dc.addTransaction(to: category.id, amount: amount, note: note.isEmpty ? nil : note)
                        // update local binding
                        if let idx = dc.budgetCategories.firstIndex(where: { $0.id == category.id }) {
                            category = dc.budgetCategories[idx]
                        }
                        amountStr = ""
                        note = ""
                    }
                }
                Section(header: Text("Transactions")) {
                    ForEach(category.transactions) { t in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(t.note ?? "")
                                Text(t.date, style: .date).font(.caption)
                            }
                            Spacer()
                            Text("\(format(t.amount))").foregroundColor(.red)
                        }
                    }
                }
            }
        }
        .navigationTitle(category.name)
        .onDisappear {
            dc.updateBudgetCategory(category)
        }
    }
    
    private func format(_ v: Double) -> String {
        String(format: "%.0f kr", v)
    }
}
