import { createContext, useContext } from "react";

export type RoleThemeType = "sme" | "fi" | "admin";

export interface RoleThemeConfig {
    id: RoleThemeType;
    roleName: string;
    roleLabel: string;
    sidebarBgClass: string;
    eyebrowClass: string;
    activeMobileNavClass: string;
    activeDesktopNavClass: string;
    accentColor: string;
    brandMarkBgClass: string;
    buttonClass: string;
    badgeTextColorClass: string;
    iconActiveColorClass: string;
}

export const roleThemes: Record<RoleThemeType, RoleThemeConfig> = {
    sme: {
        id: "sme",
        roleName: "JustFactor Cashflow",
        roleLabel: "JustFactor Cashflow",
        sidebarBgClass: "jf-sidebar-sme",
        eyebrowClass: "text-teal-700",
        activeMobileNavClass: "border-teal-700 bg-teal-700 text-white",
        activeDesktopNavClass: "bg-white text-teal-950 shadow-lg shadow-black/20",
        accentColor: "teal",
        brandMarkBgClass: "border-white/10 bg-teal-300 text-slate-950",
        buttonClass: "bg-teal-700 hover:bg-teal-800 text-white",
        badgeTextColorClass: "text-teal-200",
        iconActiveColorClass: "text-teal-600",
    },
    fi: {
        id: "fi",
        roleName: "JustFactor Capital",
        roleLabel: "JustFactor Capital",
        sidebarBgClass: "jf-sidebar-fi",
        eyebrowClass: "text-amber-700",
        activeMobileNavClass: "border-amber-600 bg-amber-600 text-white",
        activeDesktopNavClass: "bg-white text-amber-950 shadow-lg shadow-black/20",
        accentColor: "amber",
        brandMarkBgClass: "border-white/10 bg-amber-400 text-slate-950",
        buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
        badgeTextColorClass: "text-amber-200",
        iconActiveColorClass: "text-amber-500",
    },
    admin: {
        id: "admin",
        roleName: "JustFactor Ops",
        roleLabel: "JustFactor Ops",
        sidebarBgClass: "jf-sidebar-admin",
        eyebrowClass: "text-slate-700",
        activeMobileNavClass: "border-slate-700 bg-slate-700 text-white",
        activeDesktopNavClass: "bg-white text-slate-950 shadow-lg shadow-black/20",
        accentColor: "slate",
        brandMarkBgClass: "border-white/10 bg-slate-400 text-slate-950",
        buttonClass: "bg-slate-800 hover:bg-slate-900 text-white",
        badgeTextColorClass: "text-slate-300",
        iconActiveColorClass: "text-slate-500",
    },
};

export const RoleThemeContext = createContext<RoleThemeConfig>(roleThemes.sme);

export function useRoleTheme() {
    return useContext(RoleThemeContext);
}
