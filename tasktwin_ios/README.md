# TaskTwin iOS

Native iOS application for TaskTwin - focus sessions with accountability partners.

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Features

- ✅ Passkey authentication with WebAuthn
- ✅ Magic link email authentication
- ✅ Client-side encryption with CryptoKit
- ✅ SwiftUI interface with modern design
- ✅ Async/await networking
- ✅ Keychain integration for secure token storage
- 🚧 Real-time WebSocket support
- 🚧 StoreKit integration for subscriptions
- 🚧 Push notifications

## Architecture

### Modules

- **App**: Main app entry point and navigation
- **Features**: Feature-specific logic (Auth, Matching, Rooms)
- **Networking**: API client and network layer
- **Crypto**: Client-side encryption using CryptoKit
- **Models**: Data models matching backend schema
- **Views**: SwiftUI views and components
- **ViewModels**: State management and business logic
- **Utils**: Shared utilities and helpers

### Key Components

#### AuthManager
Handles authentication state and operations:
- Passkey authentication
- Magic link authentication
- Token management via Keychain
- User session management

#### APIClient
Manages all network requests:
- Type-safe API endpoints
- Automatic token injection
- Error handling
- Async/await support

#### CryptoManager
Provides client-side encryption:
- AES-256-GCM encryption/decryption
- PBKDF2 key derivation
- SHA-256 hashing
- Secure random data generation

## Project Structure

```
TaskTwin/
├── App/
│   ├── TaskTwinApp.swift          # App entry point
│   └── ContentView.swift          # Root view
├── Features/
│   └── Auth/
│       └── AuthManager.swift      # Authentication logic
├── Networking/
│   └── APIClient.swift            # Network client
├── Crypto/
│   └── CryptoManager.swift        # Encryption utilities
├── Models/
│   └── Models.swift               # Data models
├── Views/
│   ├── AuthView.swift             # Authentication screen
│   ├── DashboardView.swift        # Main dashboard
│   ├── MatchView.swift            # Matching screen
│   ├── HistoryView.swift          # Session history
│   └── SettingsView.swift         # App settings
├── ViewModels/
│   └── (Coming soon)
└── Utils/
    └── (Coming soon)
```

## Setup

1. Open `TaskTwin.xcodeproj` in Xcode
2. Select your development team in Signing & Capabilities
3. Update `APIClient` baseURL to point to your backend
4. Build and run on simulator or device

## Configuration

### API Endpoints

Update the base URL in `APIClient.swift`:

```swift
init(baseURL: String = "https://api.tasktwin.com") {
    // ...
}
```

### App Configuration

Create a `Config.xcconfig` file:

```
API_BASE_URL = https://api.tasktwin.com
SENTRY_DSN = https://...
```

## Security

### Client-Side Encryption

Sensitive data is encrypted before being sent to the server:

```swift
let cryptoManager = CryptoManager.shared
let key = cryptoManager.generateKey()
let encryptedData = try cryptoManager.encrypt(data: sensitiveData, key: key)
```

### Keychain Storage

Authentication tokens are securely stored in the iOS Keychain:

```swift
KeychainManager.shared.saveToken(token)
let token = KeychainManager.shared.getToken()
```

### Passkey Support

WebAuthn passkey authentication for passwordless login:

```swift
await authManager.signInWithPasskey()
```

## API Integration

The app communicates with the TaskTwin backend API:

### Authentication
- Passkey registration and authentication
- Magic link generation and verification
- Token-based session management

### Core Features
- Match queue management
- Room creation and control
- Session recaps
- Streak tracking
- User statistics

## Building for Production

1. Update app configuration in Xcode
2. Configure signing with your distribution certificate
3. Set production API endpoint
4. Build archive: Product → Archive
5. Submit to App Store Connect

## Testing

### Unit Tests
```bash
# Run tests
xcodebuild test -scheme TaskTwin -destination 'platform=iOS Simulator,name=iPhone 15'
```

### Manual Testing
1. Test authentication flows
2. Verify encryption/decryption
3. Test API integration
4. Verify error handling
5. Test offline behavior

## Contributing

1. Follow SwiftUI best practices
2. Use async/await for asynchronous operations
3. Implement proper error handling
4. Add comments for complex logic
5. Test on multiple iOS versions

## License

[To be determined]

## Contact

For questions or issues, please contact the development team.
