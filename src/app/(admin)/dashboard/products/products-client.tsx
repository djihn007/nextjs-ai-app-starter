"use client"

import { useState, useRef, useCallback } from "react"
import useSWR, { useSWRConfig } from "swr"
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiSearchLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { fetcher } from "@/lib/fetcher"
import type { AdminProduct, CategoryOption, ApiResponse } from "@/types/admin"
import ProductFormModal from "./product-form-modal"
import DeleteConfirmDialog from "./delete-confirm-dialog"

const currencyFormat = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })
const PAGE_SIZE = 10

export default function ProductsClient() {
  const [page, setPage] = useState(1)
  const [inputVal, setInputVal] = useState("")
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const { mutate } = useSWRConfig()

  const { data: categoriesData } = useSWR<ApiResponse<CategoryOption[]>>(
    "/api/admin/categories",
    fetcher,
    { dedupingInterval: 60_000 }
  )
  const categories = categoriesData?.success ? categoriesData.data : []

  const params = new URLSearchParams({ page: String(page) })
  if (search) params.set("search", search)

  const productsKey = `/api/admin/products?${params}`

  const { data, isLoading: loading } = useSWR<ApiResponse<{ products: AdminProduct[]; total: number }>>(
    productsKey,
    fetcher,
    { dedupingInterval: 5_000, keepPreviousData: true }
  )

  const products = data?.success ? data.data.products : []
  const total = data?.success ? data.data.total : 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const refreshProducts = useCallback(() => {
    mutate(productsKey)
  }, [mutate, productsKey])

  const openCreate = useCallback(() => {
    setEditProduct(null)
    setFormOpen(true)
  }, [])

  const openEdit = useCallback((product: AdminProduct) => {
    setEditProduct(product)
    setFormOpen(true)
  }, [])

  const openDelete = useCallback((product: AdminProduct) => {
    setDeleteTarget(product)
  }, [])

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">สินค้า</h1>
          <p className="text-sm text-muted-foreground">จัดการรายการสินค้าทั้งหมด</p>
        </div>
        <Button onClick={openCreate}>
          <RiAddLine />
          เพิ่มสินค้า
        </Button>
      </div>

      <SearchInput value={inputVal} onChange={setInputVal} onSearch={setSearch} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">#</TableHead>
            <TableHead>ชื่อสินค้า</TableHead>
            <TableHead>หมวดหมู่</TableHead>
            <TableHead className="text-right">ราคา</TableHead>
            <TableHead className="w-[120px] text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10">
                <Spinner className="mx-auto" />
              </TableCell>
            </TableRow>
          )}
          {!loading && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                ไม่พบสินค้า
              </TableCell>
            </TableRow>
          )}
          {!loading && products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.id}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.categoryName || "-"}</TableCell>
              <TableCell className="text-right">{currencyFormat.format(p.price)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(p)}>
                    <RiPencilLine className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openDelete(p)}>
                    <RiDeleteBinLine className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            ทั้งหมด {total} รายการ — หน้า {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ก่อนหน้า
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      <ProductFormModal
        key={editProduct?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editProduct}
        categories={categories}
        onSaved={refreshProducts}
      />

      <DeleteConfirmDialog
        product={deleteTarget}
        onOpenChange={(_open: boolean) => { if (!_open) setDeleteTarget(null) }}
        onDeleted={refreshProducts}
      />
    </div>
  )
}

function SearchInput({ value, onChange, onSearch }: {
  value: string
  onChange: (v: string) => void
  onSearch: (v: string) => void
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(v)
    }, 300)
  }, [onChange, onSearch])

  return (
    <div className="relative w-full max-w-sm">
      <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="ค้นหาสินค้า..."
        value={value}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}
