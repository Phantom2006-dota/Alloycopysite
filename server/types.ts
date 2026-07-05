export type UserPayload = {
  id: number
  username: string
  email: string
  role: string
}

export type AppEnv = {
  Variables: {
    user: UserPayload
  }
}
