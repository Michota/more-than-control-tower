import { Link } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Warehouse, Package, Boxes, ClipboardList, ArrowLeftRight, LayoutGrid, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as m from "@/lib/paraglide/messages";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
    label: () => string;
    href: string;
    icon: LucideIcon;
}

const warehouseItems: NavItem[] = [
    {
        label: () => m.sidebar_warehouse_warehouses(),
        href: "/warehouse/warehouses",
        icon: Warehouse,
    },
    {
        label: () => m.sidebar_warehouse_goods(),
        href: "/warehouse/goods",
        icon: Package,
    },
    {
        label: () => m.sidebar_warehouse_stock(),
        href: "/warehouse/stock",
        icon: Boxes,
    },
    {
        label: () => m.sidebar_warehouse_goods_receipts(),
        href: "/warehouse/goods-receipts",
        icon: ClipboardList,
    },
    {
        label: () => m.sidebar_warehouse_stock_transfers(),
        href: "/warehouse/stock-transfers",
        icon: ArrowLeftRight,
    },
    {
        label: () => m.sidebar_warehouse_sectors(),
        href: "/warehouse/sectors",
        icon: LayoutGrid,
    },
];

export function AppSidebar() {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <Link to="/" className="text-lg font-bold">
                    MTCT
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>{m.sidebar_warehouse()}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {warehouseItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.href)}>
                                        <Link to={item.href}>
                                            <item.icon />
                                            <span>{item.label()}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => void logout()}>
                            <LogOut />
                            <span>{m.common_logout()}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
