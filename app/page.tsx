"use client"

import * as React from "react"
import {
  ArrowDownToLine,
  Bell,
  Boxes,
  Home,
  Languages,
  Package,
  Plus,
  Settings,
  ShoppingBasket,
  TrendingUp,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useState } from "react"
import CategoriesPage from "./categories/page"

type Language = "en" | "ar"

const languageStorageKey = "stocka-language"

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem(languageStorageKey) === "ar" ? "ar" : "en"
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener("stocka-language-change", onChange)

  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener("stocka-language-change", onChange)
  }
}

function getServerLanguage(): Language {
  return "en"
}

const items = [
  { url: "/", icon: Home },
  { url: "/products", icon: Package },
  { url: "/settings", icon: Settings },
]

const inventory = [
  {
    sku: "AUD-2048",
    stock: 48,
    price: "$89.00",
  },
  {
    sku: "ACC-1182",
    stock: 7,
    price: "$124.50",
  },
  {
    sku: "STR-3301",
    stock: 32,
    price: "$109.00",
  },
  {
    sku: "ACC-0924",
    stock: 0,
    price: "$179.00",
  },
]

const metrics = [
  { icon: Boxes },
  { icon: TrendingUp },
  { icon: ArrowDownToLine },
  { icon: ShoppingBasket },
]

const translations = {
  en: {
    language: "English",
    switchLanguage: "العربية",
    switchLanguageLabel: "Switch language to Arabic",
    dashboard: "Dashboard",
    workspace: "Inventory workspace",
    mainWorkspace: "Main workspace",
    navigation: ["Customers", "Repair Tekit", "Settings"],
    productsCount: "248",
    profile: "Jordan Davis",
    role: "Store administrator",
    notifications: "Notifications",
    greeting: "Good morning, Jordan",
    date: "Friday, November 6",
    introduction: "Here's what's happening with your inventory today.",
    addProduct: "Add product",
    summaryLabel: "Inventory summary",
    metricLabels: [
      "Total products",
      "Stock value",
      "Low stock",
      "Orders this month",
    ],
    metricValues: ["248", "$38,420", "06", "124"],
    metricDetails: [
      "Across 8 categories",
      "Based on current inventory",
      "Items need a restock",
      "12% more than last month",
    ],
    inventoryTitle: "Inventory overview",
    inventoryDescription: "A quick look at your recently updated products",
    viewAll: "View all products",
    columns: ["Product", "SKU", "Stock", "Price", "Status"],
    products: [
      {
        name: "Wireless Headphones",
        category: "Audio",
        status: "In stock",
        units: "units",
      },
      {
        name: "Mechanical Keyboard",
        category: "Accessories",
        status: "Low stock",
        units: "units",
      },
      {
        name: "Portable SSD · 1 TB",
        category: "Storage",
        status: "In stock",
        units: "units",
      },
      {
        name: "USB-C Docking Station",
        category: "Accessories",
        status: "Out of stock",
        units: "units",
      },
    ],
  },
  ar: {
    language: "العربية",
    switchLanguage: "English",
    switchLanguageLabel: "Switch language to English",
    dashboard: "لوحة التحكم",
    workspace: "مساحة إدارة المخزون",
    mainWorkspace: "مساحة العمل الرئيسية",
    navigation: ["لوحة التحكم", "قطع الإصلاح", "الإعدادات"],
    productsCount: "٢٤٨",
    profile: "جوردان ديفيس",
    role: "مسؤول المتجر",
    notifications: "الإشعارات",
    greeting: "صباح الخير، جوردان",
    date: "الجمعة، ٦ نوفمبر",
    introduction: "إليك ملخص حركة المخزون اليوم.",
    addProduct: "إضافة منتج",
    summaryLabel: "ملخص المخزون",
    metricLabels: [
      "إجمالي المنتجات",
      "قيمة المخزون",
      "مخزون منخفض",
      "طلبات هذا الشهر",
    ],
    metricValues: ["٢٤٨", "$٣٨٬٤٢٠", "٠٦", "١٢٤"],
    metricDetails: [
      "ضمن ٨ فئات",
      "حسب المخزون الحالي",
      "منتجات تحتاج إلى إعادة طلب",
      "أكثر بنسبة ١٢٪ من الشهر الماضي",
    ],
    inventoryTitle: "نظرة عامة على المخزون",
    inventoryDescription: "المنتجات التي تم تحديثها مؤخرًا",
    viewAll: "عرض كل المنتجات",
    columns: ["المنتج", "رمز المنتج", "الكمية", "السعر", "الحالة"],
    products: [
      {
        name: "سماعات رأس لاسلكية",
        category: "الصوتيات",
        status: "متوفر",
        units: "وحدات",
      },
      {
        name: "لوحة مفاتيح ميكانيكية",
        category: "ملحقات",
        status: "كمية منخفضة",
        units: "وحدات",
      },
      {
        name: "قرص SSD محمول · ١ تيرابايت",
        category: "التخزين",
        status: "متوفر",
        units: "وحدات",
      },
      {
        name: "محطة إرساء USB-C",
        category: "ملحقات",
        status: "نفد المخزون",
        units: "وحدات",
      },
    ],
  },
} satisfies Record<
  Language,
  {
    language: string
    switchLanguage: string
    switchLanguageLabel: string
    dashboard: string
    workspace: string
    mainWorkspace: string
    navigation: string[]
    productsCount: string
    profile: string
    role: string
    notifications: string
    greeting: string
    date: string
    introduction: string
    addProduct: string
    summaryLabel: string
    metricLabels: string[]
    metricValues: string[]
    metricDetails: string[]
    inventoryTitle: string
    inventoryDescription: string
    viewAll: string
    columns: string[]
    products: { name: string; category: string; status: string; units: string }[]
  }
>

export default function Page() {
  const language = React.useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguage
  )
  const isArabic = language === "ar"
  const direction = isArabic ? "rtl" : "ltr"
  const copy = translations[language]
  const numberFormat = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US")
  const [Categories, setCategories] = useState<Category[]>([]);

  React.useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
  }, [direction, language])

  function toggleLanguage() {
    const nextLanguage = isArabic ? "en" : "ar"
    window.localStorage.setItem(languageStorageKey, nextLanguage)
    window.dispatchEvent(new Event("stocka-language-change"))
  }

  const sidebar = (
    <Sidebar
      collapsible="icon"
      dir={direction}
      side={isArabic ? "right" : "left"}
    >
      <SidebarHeader className="gap-5 px-4 pb-5 pt-6 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-[18px]" strokeWidth={2} />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[15px] font-semibold tracking-tight">Stocka</p>
            <p className="mt-0.5 text-xs text-sidebar-foreground/60">
              {copy.workspace}
            </p>
          </div>
        </div>

        <div className="group-data-[collapsible=icon]:hidden">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-sidebar-border px-3 text-xs text-sidebar-foreground/60">
            <span className="size-1.5 rounded-full bg-primary" />
            {copy.mainWorkspace}
            <span className="ms-auto text-sidebar-foreground/40">⌄</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0 w-full" />

      <SidebarContent className="px-2 pt-4">
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="mb-1 h-7 px-2.5 text-[11px] font-medium text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            {copy.workspace}
          </SidebarGroupLabel>

          <SidebarMenu className="gap-1">
            {items.map((item, index) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  className="h-10 rounded-lg px-2.5 text-[13px] text-sidebar-foreground/75 data-[active=true]:font-medium"
                  isActive={item.url === "/"}
                  render={<a href={item.url} />}
                  tooltip={copy.navigation[index]}
                >
                  <item.icon className="size-[17px]" strokeWidth={1.8} />
                  <span>{copy.navigation[index]}</span>
                  {item.url === "/products" && (
                    <span className="ms-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground group-data-[collapsible=icon]:hidden">
                      {copy.productsCount}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pb-4 pt-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <SidebarSeparator className="mx-0 w-full" />
        <div className="flex items-center gap-2.5 px-1 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            JD
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium">{copy.profile}</p>
            <p className="mt-0.5 truncate text-[11px] text-sidebar-foreground/55">
              {copy.role}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )

  const content = (
    <SidebarInset className="min-h-svh">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-7">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="size-8 text-muted-foreground" />
          <div aria-hidden="true" className="h-5 w-px bg-border" />
          <span className="text-sm text-muted-foreground">
            {copy.dashboard}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label={copy.switchLanguageLabel}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3"
            onClick={toggleLanguage}
            type="button"
          >
            <Languages className="size-4" />
            <span>{copy.switchLanguage}</span>
          </button>
          <button
            aria-label={copy.notifications}
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            type="button"
          >
            <Bell className="size-[17px]" strokeWidth={1.8} />
            <span className="absolute end-2 top-2 size-1.5 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
        <CategoriesPage />
      </main>
    </SidebarInset>
  )

  return (
    <div className="flex min-h-svh w-full" dir={direction}>
      {sidebar}
      {content}
    </div>
  )
}