import SwiftUI

struct AuthView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var showingEmailField = false
    @State private var emailSent = false

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [.purple.opacity(0.3), .blue.opacity(0.2)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                // Logo and branding
                VStack(spacing: 16) {
                    Image(systemName: "person.2.circle.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 100, height: 100)
                        .foregroundStyle(.purple)

                    Text("TaskTwin")
                        .font(.system(size: 42, weight: .bold))

                    Text("Focus Together, Achieve More")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Authentication options
                VStack(spacing: 16) {
                    if !showingEmailField {
                        // Passkey button
                        Button(action: {
                            Task {
                                await authManager.signInWithPasskey()
                            }
                        }) {
                            HStack {
                                Image(systemName: "person.badge.key.fill")
                                Text("Sign in with Passkey")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.purple)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }

                        Button(action: {
                            withAnimation {
                                showingEmailField = true
                            }
                        }) {
                            HStack {
                                Image(systemName: "envelope.fill")
                                Text("Sign in with Email")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(.systemGray6))
                            .foregroundColor(.primary)
                            .cornerRadius(12)
                        }
                    } else if !emailSent {
                        // Email input
                        VStack(spacing: 12) {
                            TextField("Email address", text: $email)
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(12)

                            Button(action: {
                                Task {
                                    try? await authManager.sendMagicLink(email: email)
                                    withAnimation {
                                        emailSent = true
                                    }
                                }
                            }) {
                                Text("Send Magic Link")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(email.isEmpty ? Color.gray : Color.purple)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                            }
                            .disabled(email.isEmpty)

                            Button(action: {
                                withAnimation {
                                    showingEmailField = false
                                }
                            }) {
                                Text("Back")
                                    .foregroundColor(.secondary)
                            }
                        }
                    } else {
                        // Email sent confirmation
                        VStack(spacing: 16) {
                            Image(systemName: "envelope.circle.fill")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 60, height: 60)
                                .foregroundColor(.purple)

                            Text("Check your email!")
                                .font(.title2)
                                .fontWeight(.semibold)

                            Text("We sent a magic link to\n\(email)")
                                .multilineTextAlignment(.center)
                                .foregroundColor(.secondary)

                            Button(action: {
                                withAnimation {
                                    showingEmailField = false
                                    emailSent = false
                                    email = ""
                                }
                            }) {
                                Text("Back to Sign In")
                                    .foregroundColor(.purple)
                            }
                            .padding(.top)
                        }
                    }
                }
                .padding(.horizontal, 32)

                Spacer()

                // Terms and privacy
                Text("By continuing, you agree to our Terms and Privacy Policy")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.bottom)
            }
            .padding()
        }
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthManager())
}
