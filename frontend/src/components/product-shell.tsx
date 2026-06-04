import type { ReactNode } from "react";
import { ArrowUpRight, Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

export function BrandMark({ label = "JUSTFACTOR", tone = "light" }: { label?: string; tone?: "light" | "dark" }) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "grid h-10 w-10 place-items-center rounded-xl border text-sm font-black tracking-tight shadow-sm",
                tone === "dark"
                    ? "border-white/10 bg-teal-300 text-slate-950"
                    : "border-teal-900/10 bg-teal-700 text-white"
            )}>
                JF
            </div>
            <div>
                <div className={cn("text-sm font-black tracking-[0.18em]", tone === "dark" ? "text-white" : "text-slate-950")}>
                    {label}
                </div>
                <div className={cn("text-[11px] font-semibold", tone === "dark" ? "text-slate-400" : "text-slate-500")}>
                    Trung tâm bao thanh toán
                </div>
            </div>
        </div>
    );
}

export function ProductShell({
    navItems,
    currentPage,
    onNavigate,
    onLogout,
    children,
    roleLabel,
    balance,
}: {
    navItems: NavItem[];
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    children: ReactNode;
    roleLabel: string;
    balance?: string;
}) {
    return (
        <div className="min-h-[100dvh] bg-slate-100 text-slate-950">
            <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 jf-ledger-bg text-white md:flex md:flex-col">
                <div className="border-b border-white/10 p-6">
                    <BrandMark tone="dark" />
                </div>
                <div className="px-4 py-5">
                    <div className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {roleLabel}
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition",
                                    currentPage === item.id
                                        ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    <div className="mb-3 rounded-2xl border border-white/10 bg-white/10 p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Dòng vốn</div>
                        <div className="mt-2 text-lg font-black text-white">{balance || "Không gian làm việc"}</div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:bg-red-500/10 hover:text-red-200" onClick={onLogout}>
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                    </Button>
                </div>
            </aside>
            <main className="min-h-[100dvh] md:pl-72">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <BrandMark />
                        <Button variant="outline" size="icon" onClick={onLogout} aria-label="Đăng xuất">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition",
                                    currentPage === item.id
                                        ? "border-teal-700 bg-teal-700 text-white"
                                        : "border-slate-200 bg-white text-slate-600"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <header className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
                {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</div>}
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
                {description && <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">{description}</p>}
            </div>
            {action}
        </header>
    );
}

export function Surface({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 jf-surface-shadow", className)}>
            {children}
        </section>
    );
}

export function MetricCard({
    label,
    value,
    detail,
    icon: Icon = Building2,
    tone = "blue",
}: {
    label: string;
    value: ReactNode;
    detail?: string;
    icon?: React.ComponentType<{ className?: string }>;
    tone?: "blue" | "emerald" | "slate" | "amber";
}) {
    const tones = {
        blue: "bg-teal-50 text-teal-700 border-teal-100",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        slate: "bg-slate-100 text-slate-700 border-slate-200",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 jf-surface-shadow">
            <div className="mb-5 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", tones[tone])}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-slate-950">{value}</div>
            {detail && <div className="mt-2 text-sm font-medium text-slate-500">{detail}</div>}
        </div>
    );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-500 shadow-sm">
                <ArrowUpRight className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black text-slate-950">{title}</h3>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">{description}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
