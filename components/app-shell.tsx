"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Home,
  Languages,
  Package,
  Settings,
  Smartphone,
  Users,
  Wrench,
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

type Language = "en" | "ar"
type NavKey =
  | "categories"
  | "products"
  | "customers"
  | "technicians"
  | "devices"
  | "settings"

const languageStorageKey = "fixDesk-language"

const navItems: {
  url: string
  icon: typeof Home
  labelKey: NavKey
}[] = [
  { url: "/", icon: Home, labelKey: "categories" },
  { url: "/customers", icon: Users, labelKey: "customers" },
  { url: "/technicians", icon: Wrench, labelKey: "technicians" },
  { url: "/devices", icon: Smartphone, labelKey: "devices" },
  { url: "/settings", icon: Settings, labelKey: "settings" },
]

type ShellTranslations = {
  switchLanguage: string
  switchLanguageLabel: string
  workspace: string
  mainWorkspace: string
  profile: string
  role: string
  notifications: string
  productsCount: string
  nav: Record<NavKey, string>
}

const translations = {
  en: {
    switchLanguage: "العربية",
    switchLanguageLabel: "Switch language to Arabic",
    workspace: "Inventory workspace",
    mainWorkspace: "Main workspace",
    profile: "Jordan Davis",
    role: "Store administrator",
    notifications: "Notifications",
    productsCount: "248",
    nav: {
      categories: "Categories",
      products: "Products",
      customers: "Customers",
      technicians: "Technicians",
      devices: "Devices",
      settings: "Settings",
    },
  },
  ar: {
    switchLanguage: "English",
    switchLanguageLabel: "Switch language to English",
    workspace: "مساحة إدارة المخزون",
    mainWorkspace: "مساحة العمل الرئيسية",
    profile: "جوردان ديفيس",
    role: "مسؤول المتجر",
    notifications: "الإشعارات",
    productsCount: "٢٤٨",
    nav: {
      categories: "الفئات",
      products: "المنتجات",
      customers: "العملاء",
      technicians: "الفنيون",
      devices: "الأجهزة",
      settings: "الإعدادات",
    },
  },
} satisfies Record<Language, ShellTranslations>

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem(languageStorageKey) === "ar" ? "ar" : "en"
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener("fixDesk-language-change", onChange)

  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener("fixDesk-language-change", onChange)
  }
}

function getServerLanguage(): Language {
  return "en"
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const language = React.useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguage
  )
  const isArabic = language === "ar"
  const direction = isArabic ? "rtl" : "ltr"
  const copy = translations[language]
  const activeItem =
    navItems.find((item) => item.url === pathname) ?? navItems[0]

  React.useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
  }, [direction, language])

  function toggleLanguage() {
    const nextLanguage = isArabic ? "en" : "ar"
    window.localStorage.setItem(languageStorageKey, nextLanguage)
    window.dispatchEvent(new Event("fixDesk-language-change"))
  }

  const sidebar = (
    <Sidebar
      collapsible="icon"
      dir={direction}
      side={isArabic ? "right" : "left"}
    >
      <SidebarHeader className="gap-5 px-4 pt-6 pb-5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-4.5" strokeWidth={2} />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[15px] font-semibold tracking-tight">FixDesk</p>
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
            {navItems.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  className="h-10 rounded-lg px-2.5 text-[13px] text-sidebar-foreground/75 data-[active=true]:font-medium"
                  isActive={pathname === item.url}
                  render={<Link href={item.url} />}
                  tooltip={copy.nav[item.labelKey]}
                >
                  <item.icon className="size-4.25" strokeWidth={1.8} />
                  <span>{copy.nav[item.labelKey]}</span>
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

      <SidebarFooter className="gap-3 px-3 pt-2 pb-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
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
            {copy.nav[activeItem.labelKey]}
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
            <Bell className="size-4.25" strokeWidth={1.8} />
            <span className="absolute inset-e-2 top-2 size-1.5 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-360 flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
        {children}
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

export default AppShell
