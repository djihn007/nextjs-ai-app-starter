import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth-session"
import prisma from "@/lib/prisma"
import { productSchema } from "@/lib/validations/product"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const [session, { id }, body] = await Promise.all([
    getAdminSession(),
    params,
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

  const product = await prisma.products.update({
    where: { id: parseInt(id) },
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
  })
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const [session, { id }] = await Promise.all([
    getAdminSession(),
    params,
  ])

  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const pid = parseInt(id)

  const count = await prisma.order_items.count({ where: { product_id: pid } })
  if (count > 0) {
    return NextResponse.json(
      { success: false, error: `ไม่สามารถลบได้ มี ${count} รายการในคำสั่งซื้อ` },
      { status: 409 }
    )
  }

  await prisma.products.delete({ where: { id: pid } })

  return NextResponse.json({ success: true, data: null })
}
