import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/auth-session"
import DashboardClient from "./dashboard-client"

async function AuthGate() {
  const session = await getAdminSession()

  if (!session) {
    redirect("/")
  }

  return <DashboardClient />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <AuthGate />
    </Suspense>
  )
}
