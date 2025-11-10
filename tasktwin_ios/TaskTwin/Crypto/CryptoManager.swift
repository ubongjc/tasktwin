import Foundation
import CryptoKit

/// Manager for client-side encryption using AES-GCM
class CryptoManager {
    static let shared = CryptoManager()

    private init() {}

    // MARK: - Encryption

    /// Encrypts data using AES-GCM with a provided symmetric key
    /// - Parameters:
    ///   - data: The data to encrypt
    ///   - key: The symmetric key (32 bytes for AES-256)
    /// - Returns: Encrypted data with nonce prepended
    func encrypt(data: Data, key: SymmetricKey) throws -> Data {
        let sealedBox = try AES.GCM.seal(data, using: key)

        guard let combined = sealedBox.combined else {
            throw CryptoError.encryptionFailed
        }

        return combined
    }

    /// Decrypts data using AES-GCM with a provided symmetric key
    /// - Parameters:
    ///   - encryptedData: The encrypted data with nonce prepended
    ///   - key: The symmetric key used for encryption
    /// - Returns: Decrypted data
    func decrypt(encryptedData: Data, key: SymmetricKey) throws -> Data {
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
        return try AES.GCM.open(sealedBox, using: key)
    }

    // MARK: - Key Generation

    /// Generates a new random symmetric key for AES-256
    /// - Returns: A new 256-bit symmetric key
    func generateKey() -> SymmetricKey {
        return SymmetricKey(size: .bits256)
    }

    /// Derives a symmetric key from a password using PBKDF2
    /// - Parameters:
    ///   - password: The password to derive from
    ///   - salt: Salt for key derivation (should be random and unique per user)
    ///   - iterations: Number of iterations (higher = more secure but slower)
    /// - Returns: Derived symmetric key
    func deriveKey(from password: String, salt: Data, iterations: Int = 100_000) throws -> SymmetricKey {
        guard let passwordData = password.data(using: .utf8) else {
            throw CryptoError.invalidPassword
        }

        let derivedKey = try PBKDF2.deriveKey(
            password: passwordData,
            salt: salt,
            iterations: iterations,
            keyLength: 32 // 256 bits
        )

        return SymmetricKey(data: derivedKey)
    }

    // MARK: - Hashing

    /// Creates a SHA-256 hash of the provided data
    /// - Parameter data: Data to hash
    /// - Returns: Hash as Data
    func hash(data: Data) -> Data {
        let hashed = SHA256.hash(data: data)
        return Data(hashed)
    }

    /// Creates a SHA-256 hash of a string
    /// - Parameter string: String to hash
    /// - Returns: Hash as hex string
    func hash(string: String) -> String? {
        guard let data = string.data(using: .utf8) else { return nil }
        let hashed = SHA256.hash(data: data)
        return hashed.map { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Random Data

    /// Generates cryptographically secure random data
    /// - Parameter count: Number of bytes to generate
    /// - Returns: Random data
    func generateRandomData(count: Int) -> Data {
        var bytes = [UInt8](repeating: 0, count: count)
        _ = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
        return Data(bytes)
    }
}

// MARK: - Custom Errors
enum CryptoError: LocalizedError {
    case encryptionFailed
    case decryptionFailed
    case invalidPassword
    case keyDerivationFailed

    var errorDescription: String? {
        switch self {
        case .encryptionFailed:
            return "Failed to encrypt data"
        case .decryptionFailed:
            return "Failed to decrypt data"
        case .invalidPassword:
            return "Invalid password format"
        case .keyDerivationFailed:
            return "Failed to derive encryption key"
        }
    }
}

// MARK: - PBKDF2 Helper
struct PBKDF2 {
    static func deriveKey(password: Data, salt: Data, iterations: Int, keyLength: Int) throws -> Data {
        var derivedKeyData = Data(repeating: 0, count: keyLength)

        let result = derivedKeyData.withUnsafeMutableBytes { derivedKeyBytes in
            salt.withUnsafeBytes { saltBytes in
                password.withUnsafeBytes { passwordBytes in
                    CCKeyDerivationPBKDF(
                        CCPBKDFAlgorithm(kCCPBKDF2),
                        passwordBytes.baseAddress?.assumingMemoryBound(to: Int8.self),
                        password.count,
                        saltBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                        salt.count,
                        CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256),
                        UInt32(iterations),
                        derivedKeyBytes.baseAddress?.assumingMemoryBound(to: UInt8.self),
                        keyLength
                    )
                }
            }
        }

        guard result == kCCSuccess else {
            throw CryptoError.keyDerivationFailed
        }

        return derivedKeyData
    }
}

// Import CommonCrypto for PBKDF2
import CommonCrypto
