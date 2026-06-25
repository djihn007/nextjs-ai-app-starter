import { cache } from "react"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() })
})

export const getAdminSession = cache(async () => {
  const session = await getSession()
  if (!session || session.user.role !== "admin") return null
  return session
})
