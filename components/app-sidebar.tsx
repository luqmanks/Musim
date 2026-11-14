"use client"

import { Activity, CloudSun, Leaf, Pencil, Share2, Sprout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import type { ResultTab } from "@/app/components/field-shift/config"

type AppSidebarProps = {
  active: ResultTab
  fieldName: string
  onNavigate: (tab: ResultTab) => void
  onEdit: () => void
  onShare: () => void
}

export function AppSidebar({ active, fieldName, onNavigate, onEdit, onShare }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar()
  function act(action: () => void) { setOpenMobile(false); action() }
  return <Sidebar variant="inset" collapsible="offcanvas">
    <SidebarHeader className="gap-3 p-4">
      <div className="flex items-center gap-2 text-base font-semibold"><Sprout className="size-5 text-primary" />Musim</div>
      <p className="text-sm text-muted-foreground break-words">{fieldName}</p>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup><SidebarGroupContent><SidebarMenu>
        {([
          { id: "rotations", title: "Rotations", icon: Leaf },
          { id: "conditions", title: "Climate", icon: CloudSun },
          { id: "crops", title: "Recent conditions", icon: Activity },
        ] as const).map(({ id, title, icon: Glyph }) => <SidebarMenuItem key={id}>
          <SidebarMenuButton size="sm" isActive={active === id} onClick={() => act(() => onNavigate(id))} aria-current={active === id ? "page" : undefined}>
            <Glyph /><span>{title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>)}
      </SidebarMenu></SidebarGroupContent></SidebarGroup>
    </SidebarContent>
    <SidebarFooter className="gap-2 p-4">
      <Button size="sm" className="text-xs" type="button" onClick={() => act(onShare)}><Share2 className="size-3.5" /><span>Share plan</span></Button>
      <Button size="sm" className="text-xs" variant="outline" type="button" onClick={() => act(onEdit)}><Pencil className="size-3.5" /><span>Edit farm details</span></Button>
    </SidebarFooter>
  </Sidebar>
}
