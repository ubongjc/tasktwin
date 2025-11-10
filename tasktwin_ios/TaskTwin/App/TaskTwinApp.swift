import SwiftUI

@main
struct TaskTwinApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var apiClient = APIClient()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(apiClient)
                .onAppear {
                    // Configure app on startup
                    configure()
                }
        }
    }

    private func configure() {
        // Configure analytics, error tracking, etc.
        #if DEBUG
        print("🚀 TaskTwin iOS App Started (Debug)")
        #endif
    }
}
