import Foundation
import Combine

class APIClient: ObservableObject {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession
    private var cancellables = Set<AnyCancellable>()

    @Published var authToken: String?

    init(baseURL: String = "http://localhost:3000") {
        self.baseURL = URL(string: baseURL)!

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }

    // MARK: - Generic Request Method
    func request<T: Decodable>(
        _ endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil
    ) async throws -> T {
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let apiError = try? JSONDecoder().decode(APIError.self, from: data) {
                throw NetworkError.serverError(apiError.error)
            }
            throw NetworkError.statusCode(httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        return try decoder.decode(T.self, from: data)
    }

    // MARK: - Authentication
    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    func clearAuthToken() {
        self.authToken = nil
    }

    // MARK: - Health Check
    func healthCheck() async throws -> HealthResponse {
        return try await request("/api/health")
    }

    // MARK: - Match
    func enterMatchQueue(topic: String, intent: [String], preferences: [String: String]? = nil) async throws -> CreateMatchResponse {
        let body = CreateMatchRequest(topic: topic, intent: intent, preferences: preferences)
        return try await request("/api/match", method: .post, body: body)
    }

    func getMatchStatus() async throws -> MatchStatusResponse {
        return try await request("/api/match/status")
    }

    func leaveMatchQueue() async throws {
        let _: EmptyResponse = try await request("/api/match", method: .delete)
    }

    // MARK: - Room
    func getActiveRooms() async throws -> RoomsResponse {
        return try await request("/api/room")
    }

    func getRoom(_ roomId: String) async throws -> RoomResponse {
        return try await request("/api/room/\(roomId)")
    }

    func updateRoom(_ roomId: String, action: RoomAction) async throws -> RoomResponse {
        let body = ["action": action.rawValue]
        return try await request("/api/room/\(roomId)", method: .patch, body: body)
    }

    // MARK: - Recap
    func createRecap(roomId: String, text: String) async throws -> RecapResponse {
        let body = ["roomId": roomId, "text": text]
        return try await request("/api/recap", method: .post, body: body)
    }

    func approveRecap(_ recapId: String) async throws -> RecapResponse {
        return try await request("/api/recap/\(recapId)/approve", method: .post)
    }

    // MARK: - Streaks & Stats
    func getStreaks(days: Int = 30) async throws -> StreaksResponse {
        return try await request("/api/streaks?days=\(days)")
    }

    func getStats() async throws -> UserStats {
        return try await request("/api/stats")
    }
}

// MARK: - Supporting Types
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case patch = "PATCH"
    case put = "PUT"
    case delete = "DELETE"
}

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case statusCode(Int)
    case serverError(String)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .statusCode(let code):
            return "Server returned status code \(code)"
        case .serverError(let message):
            return message
        case .decodingError:
            return "Failed to decode response"
        }
    }
}

enum RoomAction: String, Codable {
    case start, pause, resume, end
}

// Response wrappers
struct HealthResponse: Codable {
    let status: String
    let timestamp: String
}

struct RoomsResponse: Codable {
    let rooms: [Room]
}

struct RoomResponse: Codable {
    let room: Room
}

struct RecapResponse: Codable {
    let recap: Recap
}

struct EmptyResponse: Codable {}
