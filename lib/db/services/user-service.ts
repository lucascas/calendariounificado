import { connectToDatabase } from "../mongodb"
import { User, type IUser } from "../models/user"
import type { CalendarAccount } from "../models/calendar-account"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"
import { verify } from "jsonwebtoken"

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || "calendario_unificado_secret_key"

// Obtener el ID de usuario del token
async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string }
    return decoded.id
  } catch (error) {
    console.error("Error al verificar token:", error)
    return null
  }
}

// Interfaz para crear usuario con OAuth
interface OAuthUserData {
  email: string
  name: string
  provider: "google" | "microsoft"
  providerId: string
  picture?: string
}

// Servicio para manejar operaciones de usuario
export const UserService = {
  // Crear un nuevo usuario con credenciales tradicionales
  async createUser(username: string, password: string, email?: string, name?: string): Promise<IUser> {
    await connectToDatabase()

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ username }, ...(email ? [{ email }] : [])],
    })

    if (existingUser) {
      throw new Error("El usuario o email ya existe")
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el nuevo usuario
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      name,
      calendarAccounts: [],
      authProvider: "local",
    })

    await newUser.save()
    return newUser
  },

  // Crear un nuevo usuario con OAuth
  async createUserWithOAuth(oauthData: OAuthUserData): Promise<IUser> {
    await connectToDatabase()

    // Verificar si el usuario ya existe por EMAIL (más importante que providerId)
    const existingUser = await User.findOne({ email: oauthData.email })

    if (existingUser) {
      // Si existe, actualizar información pero MANTENER cuentas existentes
      console.log(
        "🔍 [DEBUG] Usuario existente encontrado, manteniendo cuentas:",
        existingUser.calendarAccounts?.length || 0,
      )

      existingUser.name = oauthData.name
      existingUser.picture = oauthData.picture
      existingUser.lastLogin = new Date()

      // Solo actualizar provider si no tiene uno
      if (!existingUser.authProvider) {
        existingUser.authProvider = oauthData.provider
        existingUser.providerId = oauthData.providerId
      }

      await existingUser.save()
      return existingUser
    }

    // Solo crear nuevo usuario si realmente no existe
    const newUser = new User({
      username: oauthData.email,
      email: oauthData.email,
      name: oauthData.name,
      authProvider: oauthData.provider,
      providerId: oauthData.providerId,
      picture: oauthData.picture,
      calendarAccounts: [],
    })

    await newUser.save()
    return newUser
  },

  // Autenticar un usuario con credenciales tradicionales
  async authenticateUser(username: string, password: string): Promise<IUser | null> {
    await connectToDatabase()

    // Buscar el usuario
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    })

    if (!user || !user.password) {
      return null
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    // Actualizar la fecha de último inicio de sesión
    user.lastLogin = new Date()
    await user.save()

    return user
  },

  // Obtener un usuario por ID
  async getUserById(userId: string): Promise<IUser | null> {
    await connectToDatabase()
    return User.findById(userId)
  },

  // Obtener un usuario por nombre de usuario
  async getUserByUsername(username: string): Promise<IUser | null> {
    await connectToDatabase()
    return User.findOne({ username })
  },

  // Obtener un usuario por email
  async getUserByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase()
    return User.findOne({ email })
  },

  // Obtener usuarios invitados por un usuario específico
  async getUsersInvitedBy(userId: string): Promise<IUser[]> {
    await connectToDatabase()
    return User.find({ invitedBy: userId })
  },

  // Añadir o actualizar una cuenta de calendario
  async addOrUpdateCalendarAccount(userId: string, account: CalendarAccount): Promise<IUser | null> {
    await connectToDatabase()

    let user = null

    // Si userId es un token JWT, obtener el ID del usuario
    if (userId.length > 24) {
      const id = await getUserIdFromToken(userId)
      if (id) {
        user = await User.findById(id)
      }
    } else {
      // Si userId es un ID de MongoDB, buscar directamente
      user = await User.findById(userId)
    }

    if (!user) {
      return null
    }

    // Verificar si la cuenta ya existe
    const existingIndex = user.calendarAccounts.findIndex(
      (a) => a.provider === account.provider && a.email === account.email,
    )

    if (existingIndex >= 0) {
      // Actualizar la cuenta existente
      user.calendarAccounts[existingIndex] = account
    } else {
      // Añadir nueva cuenta
      if (!account.id) {
        account.id = uuidv4()
      }
      user.calendarAccounts.push(account)
    }

    await user.save()
    return user
  },

  // Eliminar una cuenta de calendario
  async removeCalendarAccount(userId: string, accountId: string): Promise<IUser | null> {
    await connectToDatabase()

    const user = await User.findById(userId)
    if (!user) {
      return null
    }

    // Filtrar la cuenta a eliminar
    user.calendarAccounts = user.calendarAccounts.filter((account) => account.id !== accountId)

    await user.save()
    return user
  },

  // Obtener todas las cuentas de calendario de un usuario
  async getCalendarAccounts(userId: string): Promise<CalendarAccount[]> {
    await connectToDatabase()

    const user = await User.findById(userId)
    if (!user) {
      return []
    }

    return user.calendarAccounts
  },

  // Actualizar el token de acceso de una cuenta
  async updateAccessToken(userId: string, accountId: string, accessToken: string, expiresAt: number): Promise<boolean> {
    await connectToDatabase()

    const user = await User.findById(userId)
    if (!user) {
      return false
    }

    // Buscar la cuenta de calendario
    const accountIndex = user.calendarAccounts.findIndex((account: any) => account.id === accountId)

    if (accountIndex === -1) {
      return false
    }

    // Actualizar el token de acceso y la fecha de expiración
    user.calendarAccounts[accountIndex].accessToken = accessToken
    user.calendarAccounts[accountIndex].expiresAt = expiresAt
    user.calendarAccounts[accountIndex].lastRefreshed = Date.now()

    // Guardar los cambios
    await user.save()
    return true
  },
}
