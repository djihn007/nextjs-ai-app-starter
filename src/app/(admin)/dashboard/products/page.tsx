import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/auth-session"
import ProductsClient from "./products-client"

async function AuthGate() {
  const session = await getAdminSession()

  if (!session) {
    redirect("/")
  }

  return <ProductsClient />
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-muted-foreground">กำลังโหลด...</div>}>
      <AuthGate />
    </Suspense>
  )
}
