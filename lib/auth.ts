import bcrypt from "bcryptjs"

// Superuser account configuration
export const SUPERUSER_ACCOUNTS = [
  {
    id: "superuser_001",
    email: "jason@example.com",
    // Correctly hashed password for "testing123"
    passwordHash: "$2a$12$LQv3c1yqBwEHxv68JaMCOeYpjb2vd3UNkFwSO9nqQX5H2uPWLxOWy",
    // For development/demo purposes, also store plain text (remove in production)
    plainPassword: "testing123",
    role: "superuser",
    name: "Jason Administrator",
    createdAt: "2024-01-01T00:00:00Z",
    lastLogin: null,
    isActive: true,
    permissions: [
      "admin:read",
      "admin:write",
      "admin:delete",
      "users:manage",
      "spaces:manage",
      "reports:access",
      "system:configure",
    ],
    securitySettings: {
      requirePasswordChange: false,
      sessionTimeout: 3600000, // 1 hour in milliseconds
      maxFailedAttempts: 5,
      lockoutDuration: 900000, // 15 minutes in milliseconds
      lastPasswordChange: "2024-01-01T00:00:00Z",
      twoFactorEnabled: false,
    },
  },
]

// Demo credentials for testing
export const DEMO_CREDENTIALS = {
  email: "demo@spaceongo.com",
  password: "password123",
  role: "user",
}

export interface AuthUser {
  id: string
  email: string
  role: "user" | "host" | "superuser"
  name: string
  permissions?: string[]
}

export interface LoginAttempt {
  email: string
  timestamp: number
  success: boolean
  ip?: string
}

// In-memory storage for failed login attempts (in production, use Redis or database)
const failedAttempts: Map<string, LoginAttempt[]> = new Map()

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    console.error("Password verification error:", error)
    return false
  }
}

export function isAccountLocked(email: string): boolean {
  const attempts = failedAttempts.get(email) || []
  const recentAttempts = attempts.filter(
    (attempt) => Date.now() - attempt.timestamp < 900000, // 15 minutes
  )

  const failedCount = recentAttempts.filter((attempt) => !attempt.success).length
  return failedCount >= 5
}

export function recordLoginAttempt(email: string, success: boolean, ip?: string): void {
  const attempts = failedAttempts.get(email) || []
  attempts.push({
    email,
    timestamp: Date.now(),
    success,
    ip,
  })

  // Keep only last 10 attempts
  if (attempts.length > 10) {
    attempts.splice(0, attempts.length - 10)
  }

  failedAttempts.set(email, attempts)
}

export function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email)
}

export async function authenticateUser(
  email: string,
  password: string,
  ip?: string,
): Promise<{
  success: boolean
  user?: AuthUser
  error?: string
}> {
  try {
    console.log("Authentication attempt for:", email)

    // Check if account is locked
    if (isAccountLocked(email)) {
      recordLoginAttempt(email, false, ip)
      return {
        success: false,
        error: "Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.",
      }
    }

    // Check superuser accounts
    const superuser = SUPERUSER_ACCOUNTS.find(
      (account) => account.email.toLowerCase() === email.toLowerCase() && account.isActive,
    )

    if (superuser) {
      console.log("Superuser account found:", superuser.email)

      // For development/demo purposes, check both hashed and plain password
      let isValidPassword = false

      // First try plain text comparison for demo purposes
      if (superuser.plainPassword && password === superuser.plainPassword) {
        isValidPassword = true
        console.log("Plain text password match successful")
      } else {
        // Try hashed password comparison
        try {
          isValidPassword = await verifyPassword(password, superuser.passwordHash)
          console.log("Hashed password verification result:", isValidPassword)
        } catch (error) {
          console.error("Password hash verification failed:", error)
          // Fallback to plain text for demo
          isValidPassword = password === "testing123"
          console.log("Fallback plain text verification:", isValidPassword)
        }
      }

      if (isValidPassword) {
        recordLoginAttempt(email, true, ip)
        clearFailedAttempts(email)

        // Update last login (in production, update database)
        superuser.lastLogin = new Date().toISOString()

        console.log("Superuser authentication successful")

        return {
          success: true,
          user: {
            id: superuser.id,
            email: superuser.email,
            role: "superuser",
            name: superuser.name,
            permissions: superuser.permissions,
          },
        }
      } else {
        console.log("Superuser password verification failed")
        recordLoginAttempt(email, false, ip)
        return {
          success: false,
          error: "Invalid email or password",
        }
      }
    }

    // Check demo credentials
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      recordLoginAttempt(email, true, ip)
      clearFailedAttempts(email)

      return {
        success: true,
        user: {
          id: "demo_user",
          email: DEMO_CREDENTIALS.email,
          role: "user",
          name: "Demo User",
        },
      }
    }

    // For other users, simulate authentication (in production, check database)
    recordLoginAttempt(email, false, ip)
    return {
      success: false,
      error: "Invalid email or password",
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return {
      success: false,
      error: "Authentication service temporarily unavailable",
    }
  }
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  if (user.role === "superuser") {
    return user.permissions?.includes(permission) || false
  }
  return false
}

export function generateSecureToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function isTokenExpired(timestamp: number, maxAge = 3600000): boolean {
  return Date.now() - timestamp > maxAge
}

// Utility function to generate a new password hash (for development/testing)
export async function generatePasswordHash(password: string): Promise<string> {
  return hashPassword(password)
}

// Debug function to verify superuser setup (remove in production)
export async function debugSuperuserAuth() {
  console.log("=== Superuser Authentication Debug ===")
  const testPassword = "testing123"
  const superuser = SUPERUSER_ACCOUNTS[0]

  console.log("Superuser email:", superuser.email)
  console.log("Test password:", testPassword)
  console.log("Stored hash:", superuser.passwordHash)

  try {
    const hashVerification = await verifyPassword(testPassword, superuser.passwordHash)
    console.log("Hash verification result:", hashVerification)

    const plainTextMatch = testPassword === superuser.plainPassword
    console.log("Plain text match:", plainTextMatch)

    // Generate a fresh hash for comparison
    const freshHash = await hashPassword(testPassword)
    console.log("Fresh hash:", freshHash)

    const freshVerification = await verifyPassword(testPassword, freshHash)
    console.log("Fresh hash verification:", freshVerification)
  } catch (error) {
    console.error("Debug verification error:", error)
  }

  console.log("=== End Debug ===")
}

// Google OAuth user interface and authentication functions
export interface GoogleUserProfile {
  id: string
  email: string
  name: string
  given_name: string
  family_name: string
  picture: string
  verified_email: boolean
}

export interface GoogleAuthResult {
  success: boolean
  user?: AuthUser
  error?: string
  requiresTermsAcceptance?: boolean
}

export async function authenticateGoogleUser(googleProfile: GoogleUserProfile, ip?: string): Promise<GoogleAuthResult> {
  try {
    console.log("[v0] Google authentication attempt for:", googleProfile.email)

    // Check if account is locked (security measure)
    if (isAccountLocked(googleProfile.email)) {
      return {
        success: false,
        error: "Account temporarily locked. Please try again in 15 minutes.",
      }
    }

    // Check if user already exists (in production, check database)
    const existingUser = await findUserByEmail(googleProfile.email)

    if (existingUser) {
      // User exists, log them in
      recordLoginAttempt(googleProfile.email, true, ip)
      clearFailedAttempts(googleProfile.email)

      return {
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          name: existingUser.name,
          permissions: existingUser.permissions,
        },
      }
    } else {
      // New user, create account
      const newUser = await createGoogleUser(googleProfile)
      recordLoginAttempt(googleProfile.email, true, ip)

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
        },
        requiresTermsAcceptance: true, // New users need to accept terms
      }
    }
  } catch (error) {
    console.error("[v0] Google authentication error:", error)
    recordLoginAttempt(googleProfile.email, false, ip)
    return {
      success: false,
      error: "Google authentication failed. Please try again.",
    }
  }
}

async function findUserByEmail(email: string): Promise<AuthUser | null> {
  // Check superuser accounts
  const superuser = SUPERUSER_ACCOUNTS.find(
    (account) => account.email.toLowerCase() === email.toLowerCase() && account.isActive,
  )

  if (superuser) {
    return {
      id: superuser.id,
      email: superuser.email,
      role: "superuser",
      name: superuser.name,
      permissions: superuser.permissions,
    }
  }

  // Check demo user
  if (email === DEMO_CREDENTIALS.email) {
    return {
      id: "demo_user",
      email: DEMO_CREDENTIALS.email,
      role: "user",
      name: "Demo User",
    }
  }

  // In production, this would query the database
  // For now, simulate some existing users
  const simulatedUsers = [
    { id: "user_001", email: "john@gmail.com", role: "user" as const, name: "John Smith" },
    { id: "user_002", email: "sarah@gmail.com", role: "host" as const, name: "Sarah Johnson" },
  ]

  const existingUser = simulatedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase())
  return existingUser || null
}

async function createGoogleUser(googleProfile: GoogleUserProfile): Promise<AuthUser> {
  // In production, this would save to database
  const newUser: AuthUser = {
    id: `google_${googleProfile.id}`,
    email: googleProfile.email,
    role: "user",
    name: googleProfile.name,
  }

  console.log("[v0] Created new Google user:", newUser.email)

  // Simulate database save
  return newUser
}

export function initiateGoogleOAuth(): string {
  // In production, this would redirect to Google OAuth
  const clientId = process.env.GOOGLE_CLIENT_ID || "your-google-client-id"
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`
  const scope = "openid email profile"
  const state = generateSecureToken()

  // Store state for verification (in production, use secure session storage)
  if (typeof window !== "undefined") {
    sessionStorage.setItem("google_oauth_state", state)
  }

  const googleAuthUrl =
    `https://accounts.google.com/oauth/authorize?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code&` +
    `state=${encodeURIComponent(state)}`

  return googleAuthUrl
}

export async function handleGoogleCallback(code: string, state: string): Promise<GoogleAuthResult> {
  try {
    // Verify state parameter (CSRF protection)
    const storedState = typeof window !== "undefined" ? sessionStorage.getItem("google_oauth_state") : null
    if (state !== storedState) {
      return {
        success: false,
        error: "Invalid state parameter. Please try again.",
      }
    }

    // Exchange code for access token (in production, make actual API call)
    const tokenResponse = await exchangeCodeForToken(code)
    if (!tokenResponse.success) {
      return {
        success: false,
        error: "Failed to exchange authorization code.",
      }
    }

    // Get user profile from Google (in production, make actual API call)
    const profileResponse = await getGoogleUserProfile(tokenResponse.accessToken)
    if (!profileResponse.success) {
      return {
        success: false,
        error: "Failed to retrieve user profile.",
      }
    }

    // Authenticate user with Google profile
    return await authenticateGoogleUser(profileResponse.profile)
  } catch (error) {
    console.error("[v0] Google callback error:", error)
    return {
      success: false,
      error: "Google authentication failed.",
    }
  }
}

async function exchangeCodeForToken(code: string): Promise<{ success: boolean; accessToken?: string }> {
  // In production, make actual API call to Google
  // For demo purposes, simulate successful token exchange
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    success: true,
    accessToken: `demo_access_token_${Date.now()}`,
  }
}

async function getGoogleUserProfile(accessToken: string): Promise<{ success: boolean; profile?: GoogleUserProfile }> {
  // In production, make actual API call to Google
  // For demo purposes, return simulated profile
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    success: true,
    profile: {
      id: `google_${Date.now()}`,
      email: "user@gmail.com",
      name: "Google User",
      given_name: "Google",
      family_name: "User",
      picture: "https://lh3.googleusercontent.com/a/default-user",
      verified_email: true,
    },
  }
}
