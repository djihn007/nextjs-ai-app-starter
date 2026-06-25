import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth-session"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get("limit")) || 5, 50)

  const [session, orders, total] = await Promise.all([
    getAdminSession(),
    prisma.orders.findMany({
      take: limit,
      orderBy: { date: "desc" },
      include: { customers: { select: { name: true } } },
    }),
    prisma.orders.count(),
  ])

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const serialized = orders.map((o) => ({
    id: o.id,
    date: o.date?.toISOString() ?? "",
    customerName: o.customers?.name ?? "-",
    status: o.status ?? "processing",
    totalAmount: Number(o.total_amount ?? 0),
  }))

  return NextResponse.json({ orders: serialized, total })
}
