import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth-session"
import prisma from "@/lib/prisma"

export async function GET() {
  const [session, categories] = await Promise.all([
    getAdminSession(),
    prisma.categories.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: categories.map((c) => ({ id: String(c.id), name: c.name ?? "" })),
  })
}
