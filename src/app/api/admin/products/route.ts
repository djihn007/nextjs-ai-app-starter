import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth-session"
import prisma from "@/lib/prisma"
import { productSchema } from "@/lib/validations/product"

const PAGE_SIZE = 10

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where = search
    ? { name: { contains: search } }
    : undefined

  const [session, products, total] = await Promise.all([
    getAdminSession(),
    prisma.products.findMany({
      where,
      skip,
      take: PAGE_SIZE,
      orderBy: { id: "desc" },
      include: { categories: { select: { name: true } } },
    }),
    prisma.products.count({ where }),
  ])

  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const serialized = products.map((p) => ({
    id: String(p.id),
    name: p.name ?? "",
    description: p.description,
    price: Number(p.price ?? 0),
    categoryId: String(p.category_id ?? ""),
    categoryName: p.categories?.name ?? "",
  }))

  return NextResponse.json({
    success: true,
    data: { products: serialized, total },
  })
}

export async function POST(request: NextRequest) {
  const [session, body] = await Promise.all([
    getAdminSession(),
    request.json(),
  ])

  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = productSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: result.error },
      { status: 400 }
    )
  }

  const { name, description, price, categoryId } = result.data

  const product = await prisma.products.create({
    data: {
      name,
      description: description || null,
      price,
      category_id: parseInt(categoryId),
    },
    include: { categories: { select: { name: true } } },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: String(product.id),
      name: product.name ?? "",
      description: product.description,
      price: Number(product.price ?? 0),
      categoryId: String(product.category_id ?? ""),
      categoryName: product.categories?.name ?? "",
    },
  }, { status: 201 })
}
