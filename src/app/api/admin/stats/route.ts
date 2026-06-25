import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth-session"
import prisma from "@/lib/prisma"

export async function GET() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [session, todayOrdersResult, totalProducts, totalUsers] = await Promise.all([
    getAdminSession(),
    prisma.orders.findMany({
      where: { date: { gte: todayStart } },
      select: { total_amount: true, status: true },
    }),
    prisma.products.count(),
    prisma.user.count(),
  ])

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const todayOrders = todayOrdersResult.length
  const todaySales = todayOrdersResult.reduce(
    (sum, o) => sum + Number(o.total_amount ?? 0),
    0
  )
  const pendingOrders = todayOrdersResult.filter(
    (o) => o.status === "processing"
  ).length

  return NextResponse.json({
    todaySales,
    todayOrders,
    pendingOrders,
    totalProducts,
    totalUsers,
  })
}
