"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import dynamic from "next/dynamic"
import { RiMoneyDollarCircleLine, RiShoppingBag3Line, RiTimerLine, RiDatabase2Line, RiUserLine } from "@remixicon/react"
import { KpiCard } from "@/components/admin/kpi-card"
import { PeriodSelector } from "@/components/admin/period-selector"
import { RecentOrdersTable } from "@/components/admin/recent-orders-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetcher } from "@/lib/fetcher"
import type { AdminStats, RevenuePoint, AdminOrderItem } from "@/types/admin"

const RevenueChart = dynamic(
  () => import("@/components/admin/revenue-chart").then((m) => ({ default: m.RevenueChart })),
  { ssr: false, loading: () => <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">กำลังโหลดแผนภูมิ...</div> }
)

type Period = "7d" | "30d" | "90d"

const currencyFormat = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" })

export default function DashboardClient() {
  const [period, setPeriod] = useState<Period>("30d")
  const { mutate } = useSWRConfig()

  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR<AdminStats>("/api/admin/stats", fetcher, {
    refreshInterval: 30_000,
    dedupingInterval: 10_000,
  })

  const { data: revenue = [], isLoading: revenueLoading } = useSWR<RevenuePoint[]>(
    `/api/admin/revenue?period=${period}`,
    fetcher,
    { dedupingInterval: 10_000 }
  )

  const { data: ordersData } = useSWR<{ orders: AdminOrderItem[]; total: number }>(
    "/api/admin/orders?limit=5",
    fetcher,
    { refreshInterval: 30_000, dedupingInterval: 10_000 }
  )

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมของระบบ</p>
      </div>

      {statsError && (
        <div className="flex items-center gap-3 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-4 text-sm text-[#BE123C]">
          <span>ไม่สามารถโหลดข้อมูลสถิติได้</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => mutate("/api/admin/stats")}
          >
            ลองใหม่
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="ยอดขายวันนี้"
          value={stats ? currencyFormat.format(stats.todaySales) : "-"}
          loading={statsLoading}
          icon={<RiMoneyDollarCircleLine className="size-6" />}
        />
        <KpiCard
          title="คำสั่งซื้อวันนี้"
          value={stats ? stats.todayOrders : "-"}
          sub={stats ? `${stats.pendingOrders} รายการรอดำเนินการ` : undefined}
          loading={statsLoading}
          icon={<RiShoppingBag3Line className="size-6" />}
        />
        <KpiCard
          title="รอดำเนินการ"
          value={stats ? stats.pendingOrders : "-"}
          loading={statsLoading}
          icon={<RiTimerLine className="size-6" />}
        />
        <KpiCard
          title="สินค้า"
          value={stats ? stats.totalProducts : "-"}
          loading={statsLoading}
          icon={<RiDatabase2Line className="size-6" />}
        />
        <KpiCard
          title="ผู้ใช้งาน"
          value={stats ? stats.totalUsers : "-"}
          loading={statsLoading}
          icon={<RiUserLine className="size-6" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>รายได้</CardTitle>
          <PeriodSelector value={period} onChange={setPeriod} />
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenue} loading={revenueLoading} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>คำสั่งซื้อล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable orders={ordersData?.orders ?? []} loading={!ordersData} />
        </CardContent>
      </Card>
    </div>
  )
}
