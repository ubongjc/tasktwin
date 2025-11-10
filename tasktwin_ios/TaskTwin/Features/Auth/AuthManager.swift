import Foundation
import Combine
import AuthenticationServices

class AuthManager: NSObject, ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var error: String?

    private let apiClient = APIClient.shared
    private var cancellables = Set<AnyCancellable>()

    override init() {
        super.init()
        checkAuthStatus()
    }

    // MARK: - Authentication Status

    func checkAuthStatus() {
        // Check if we have a stored token
        if let token = KeychainManager.shared.getToken() {
            apiClient.setAuthToken(token)
            isAuthenticated = true
            Task {
                await fetchCurrentUser()
            }
        }
    }

    // MARK: - Passkey Authentication

    func signInWithPasskey() async {
        do {
            // Initiate WebAuthn ceremony
            let challenge = try await requestPasskeyChallenge()

            // Create authorization request
            let request = createPasskeyRequest(challenge: challenge)

            // Present authorization controller
            try await performPasskeyAuth(request: request)

        } catch {
            DispatchQueue.main.async {
                self.error = error.localizedDescription
            }
        }
    }

    private func requestPasskeyChallenge() async throws -> String {
        // Request challenge from backend
        // This would integrate with your auth API
        return "challenge-from-server"
    }

    private func createPasskeyRequest(challenge: String) -> ASAuthorizationPlatformPublicKeyCredentialAssertionRequest {
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: "tasktwin.app")

        let challengeData = Data(challenge.utf8)
        let request = provider.createCredentialAssertionRequest(challenge: challengeData)

        return request
    }

    private func performPasskeyAuth(request: ASAuthorizationPlatformPublicKeyCredentialAssertionRequest) async throws {
        // This would handle the actual passkey authentication
        // For now, we'll simulate success
        DispatchQueue.main.async {
            self.isAuthenticated = true
        }
    }

    // MARK: - Magic Link

    func sendMagicLink(email: String) async throws {
        // Request magic link from backend
        try await Task.sleep(nanoseconds: 1_000_000_000) // Simulate API call
    }

    func verifyMagicLink(token: String) async throws {
        // Verify magic link token
        let response = try await apiClient.request("/api/auth/magic-link/verify?token=\(token)")
        let authResponse: AuthResponse = response

        // Store token
        KeychainManager.shared.saveToken(authResponse.token)
        apiClient.setAuthToken(authResponse.token)

        DispatchQueue.main.async {
            self.isAuthenticated = true
        }

        await fetchCurrentUser()
    }

    // MARK: - User Management

    private func fetchCurrentUser() async {
        do {
            let user: User = try await apiClient.request("/api/user/me")
            DispatchQueue.main.async {
                self.currentUser = user
            }
        } catch {
            print("Failed to fetch user: \(error)")
        }
    }

    // MARK: - Sign Out

    func signOut() {
        KeychainManager.shared.deleteToken()
        apiClient.clearAuthToken()

        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }
}

// MARK: - Supporting Types
struct AuthResponse: Codable {
    let token: String
    let user: User
}

// MARK: - Keychain Manager
class KeychainManager {
    static let shared = KeychainManager()

    private let service = "com.tasktwin.app"
    private let account = "authToken"

    func saveToken(_ token: String) {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
    }

    func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]

        SecItemDelete(query as CFDictionary)
    }
}
