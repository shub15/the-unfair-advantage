import { Client, Account, Databases, ID, Query } from 'appwrite'

// Configuration
const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  userCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USER_COLLECTION_ID!,
}

// Validate configuration
if (!config.endpoint || !config.projectId) {
  throw new Error('Missing Appwrite configuration. Please check your .env.local file.')
}

// Initialize Appwrite
export const client = new Client()
client.setEndpoint(config.endpoint).setProject(config.projectId)

export const account = new Account(client)
export const databases = new Databases(client)

export { ID, Query }
export const { databaseId: DATABASE_ID, userCollectionId: USER_COLLECTION_ID } = config

// Simple Auth Service
export class AuthService {
  async register(email: string, password: string, name: string) {
    try {
      // Create account
      const userAccount = await account.create(ID.unique(), email, password, name)
      
      // Auto-login
      await account.createEmailPasswordSession(email, password)
      
      // Create profile
      try {
        await databases.createDocument(DATABASE_ID, USER_COLLECTION_ID, userAccount.$id, {
          name,
          email,
          role: 'entrepreneur',
          preferredLanguage: 'en',
          avatar: ''
        })
      } catch (profileError) {
        console.warn('Profile creation failed:', profileError)
      }
      
      return userAccount
    } catch (error: any) {
      if (error.code === 409) {
        throw new Error('Account already exists')
      }
      throw new Error(error.message || 'Registration failed')
    }
  }

  async login(email: string, password: string) {
    try {
      return await account.createEmailPasswordSession(email, password)
    } catch (error: any) {
      if (error.code === 401) {
        throw new Error('Invalid credentials')
      }
      throw new Error(error.message || 'Login failed')
    }
  }

  async getCurrentUser() {
    try {
      return await account.get()
    } catch {
      return null
    }
  }

  async logout() {
    try {
      return await account.deleteSession('current')
    } catch (error) {
      throw error
    }
  }

  async getUserProfile(userId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, USER_COLLECTION_ID, userId)
    } catch {
      return null
    }
  }
}

export const authService = new AuthService()
