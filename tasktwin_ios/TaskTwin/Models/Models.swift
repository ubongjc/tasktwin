import Foundation

// MARK: - User
struct User: Codable, Identifiable {
    let id: String
    let clerkId: String
    let email: String?
    let displayName: String?
    let avatarUrl: String?
    let role: UserRole
    let streakCount: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, email, role, createdAt
        case clerkId = "clerk_id"
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
        case streakCount = "streak_count"
    }
}

enum UserRole: String, Codable {
    case user = "USER"
    case admin = "ADMIN"
    case moderator = "MODERATOR"
}

// MARK: - Room
struct Room: Codable, Identifiable {
    let id: String
    let topic: String
    let description: String?
    let status: RoomStatus
    let startAt: Date?
    let endAt: Date?
    let durationMinutes: Int
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, topic, description, status, createdAt
        case startAt = "start_at"
        case endAt = "end_at"
        case durationMinutes = "duration_minutes"
    }
}

enum RoomStatus: String, Codable {
    case waiting = "WAITING"
    case active = "ACTIVE"
    case paused = "PAUSED"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
}

// MARK: - Match
struct Match: Codable, Identifiable {
    let id: String
    let userId: String
    let roomId: String
    let status: MatchStatus
    let joinedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, status
        case userId = "user_id"
        case roomId = "room_id"
        case joinedAt = "joined_at"
    }
}

enum MatchStatus: String, Codable {
    case pending = "PENDING"
    case matched = "MATCHED"
    case inSession = "IN_SESSION"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
}

// MARK: - Recap
struct Recap: Codable, Identifiable {
    let id: String
    let roomId: String
    let text: String
    let user1Id: String
    let user2Id: String?
    let user1Approved: Bool
    let user2Approved: Bool
    let finalizedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, text, createdAt
        case roomId = "room_id"
        case user1Id = "user1_id"
        case user2Id = "user2_id"
        case user1Approved = "user1_approved"
        case user2Approved = "user2_approved"
        case finalizedAt = "finalized_at"
    }
}

// MARK: - Streak
struct Streak: Codable {
    let date: Date
    let sessions: Int

    enum CodingKeys: String, CodingKey {
        case date
        case sessions = "sessions_completed"
    }
}

// MARK: - API Request/Response Types
struct CreateMatchRequest: Codable {
    let topic: String
    let intent: [String]
    let preferences: [String: String]?
}

struct CreateMatchResponse: Codable {
    let queueId: String
    let estimatedWaitTime: Int

    enum CodingKeys: String, CodingKey {
        case queueId = "queue_id"
        case estimatedWaitTime = "estimated_wait_time"
    }
}

struct MatchStatusResponse: Codable {
    let status: String
    let roomId: String?
    let partnerId: String?
    let position: Int?

    enum CodingKeys: String, CodingKey {
        case status, position
        case roomId = "room_id"
        case partnerId = "partner_id"
    }
}

struct UserStats: Codable {
    let totalSessions: Int
    let totalMinutes: Int
    let currentStreak: Int
    let bestStreak: Int
    let averageSessionsPerWeek: Double

    enum CodingKeys: String, CodingKey {
        case currentStreak = "current_streak"
        case bestStreak = "best_streak"
        case totalSessions = "total_sessions"
        case totalMinutes = "total_minutes"
        case averageSessionsPerWeek = "average_sessions_per_week"
    }
}

struct StreaksResponse: Codable {
    let current: Int
    let best: Int
    let history: [StreakHistory]
}

struct StreakHistory: Codable {
    let date: String
    let sessions: Int
}

// MARK: - Error
struct APIError: Codable {
    let error: String
    let details: [String: String]?
}
