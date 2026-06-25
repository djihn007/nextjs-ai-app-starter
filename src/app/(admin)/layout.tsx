import type { Metadata } from "next"
import "../globals.css"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/toaster"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="font-sans">
      <body className="bg-[#F3F4F6]">
        <Navbar />
        <main className="p-6">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
