import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var apiClient: APIClient
    @State private var stats: UserStats?
    @State private var isLoading = true

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back!")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        Text("Ready for a focused work session?")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)

                    // Stats grid
                    if let stats = stats {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            StatCard(
                                title: "Current Streak",
                                value: "\(stats.currentStreak)",
                                subtitle: "days",
                                icon: "flame.fill",
                                color: .orange
                            )

                            StatCard(
                                title: "Total Sessions",
                                value: "\(stats.totalSessions)",
                                subtitle: "completed",
                                icon: "checkmark.circle.fill",
                                color: .green
                            )

                            StatCard(
                                title: "Focus Time",
                                value: "\(stats.totalMinutes)",
                                subtitle: "minutes",
                                icon: "clock.fill",
                                color: .blue
                            )

                            StatCard(
                                title: "This Week",
                                value: String(format: "%.1f", stats.averageSessionsPerWeek),
                                subtitle: "avg/week",
                                icon: "chart.line.uptrend.xyaxis",
                                color: .purple
                            )
                        }
                        .padding(.horizontal)
                    } else if isLoading {
                        ProgressView()
                            .padding()
                    }

                    // Start session card
                    VStack(spacing: 16) {
                        Text("Start a Focus Session")
                            .font(.headline)

                        Text("Get matched with a partner and work together for 25 minutes")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)

                        NavigationLink(destination: MatchView()) {
                            HStack {
                                Image(systemName: "person.2.fill")
                                Text("Find a Match")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.purple)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(16)
                    .padding(.horizontal)

                    Spacer()
                }
                .padding(.top)
            }
            .navigationTitle("Dashboard")
            .task {
                await loadStats()
            }
        }
    }

    private func loadStats() async {
        do {
            stats = try await apiClient.getStats()
            isLoading = false
        } catch {
            print("Failed to load stats: \(error)")
            isLoading = false
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.system(size: 32, weight: .bold))

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(subtitle)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}

// Placeholder views
struct MatchView: View {
    var body: some View {
        Text("Match View - Coming Soon")
            .navigationTitle("Find Match")
    }
}

struct HistoryView: View {
    var body: some View {
        NavigationView {
            Text("History View - Coming Soon")
                .navigationTitle("History")
        }
    }
}

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        NavigationView {
            List {
                Section("Account") {
                    if let user = authManager.currentUser {
                        HStack {
                            Text("Email")
                            Spacer()
                            Text(user.email ?? "Not set")
                                .foregroundColor(.secondary)
                        }
                    }

                    Button(action: {
                        authManager.signOut()
                    }) {
                        Text("Sign Out")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    DashboardView()
        .environmentObject(APIClient())
}
