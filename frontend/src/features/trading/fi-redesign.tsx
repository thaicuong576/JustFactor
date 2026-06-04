import { useState } from "react";
import { useRoleTheme } from "@/lib/role-theme";
import { cn } from "@/lib/utils";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Briefcase, DollarSign, LayoutDashboard, Save, Settings, ShieldCheck, Store, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/services/api";
import type { Invoice } from "@/types";
import { DealDetailDrawerRedesign } from "./deal-detail-drawer-redesign";
import { useTradingInvoices } from "./hooks/useTrading";
import { EmptyState, MetricCard, PageHeader, ProductShell, Surface } from "@/components/product-shell";
import { formatVND } from "@/lib/format";

export function FILayoutRedesign({
    currentPage,
    onNavigate,
    onLogout,
    children,
}: {
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    children: React.ReactNode;
}) {
    return (
        <ProductShell
            roleTheme="fi"
            currentPage={currentPage}
            onNavigate={onNavigate}
            onLogout={onLogout}
            balance="20.5B VND"
            navItems={[
                { id: "dashboard", label: "Tổng quan vốn", icon: LayoutDashboard },
                { id: "marketplace", label: "Sàn hóa đơn", icon: Store },
                { id: "portfolio", label: "Đề nghị & Danh mục", icon: Briefcase },
                { id: "settings", label: "Khẩu vị đầu tư", icon: Settings },
            ]}
        >
            {children}
        </ProductShell>
    );
}

export function FIDashboardRedesign() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["fi-summary"],
        queryFn: async () => {
            const res = await apiService.getFISummary();
            return res.data;
        },
    });

    return (
        <>
            <PageHeader
                eyebrow="JustFactor Capital"
                title="Chào mừng đối tác vốn FI"
                description="Theo dõi vốn đã cam kết, lợi nhuận dự kiến và các nghĩa vụ giao dịch đang hoạt động."
            />
            {isLoading ? (
                <Surface>Đang tải tổng quan FI...</Surface>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <MetricCard label="Đã giải ngân" value={formatVND(stats?.total_invested)} icon={DollarSign} tone="blue" />
                    <MetricCard label="Lợi nhuận dự kiến" value={formatVND(stats?.projected_profit)} icon={TrendingUp} tone="emerald" />
                    <MetricCard label="Đề nghị hoạt động" value={stats?.active_offers_count || 0} icon={Briefcase} tone="slate" />
                </div>
            )}
        </>
    );
}

export function FIMarketplaceRedesign() {
    const theme = useRoleTheme();
    const { data: invoices, isLoading } = useTradingInvoices();
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    return (
        <>
            <PageHeader
                eyebrow="Thị trường trực tiếp"
                title="Sàn hóa đơn"
                description="Duyệt các khoản phải thu đã xác thực và mở phòng giao dịch để gửi đề nghị mua."
            />
            {isLoading && <Surface>Đang tải sàn giao dịch...</Surface>}
            {!isLoading && invoices?.length === 0 && (
                <EmptyState title="Chưa có hóa đơn đang giao dịch" description="Các khoản phải thu đã xác thực sẽ xuất hiện tại đây khi SME đưa hóa đơn lên sàn." />
            )}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {invoices?.map((invoice) => (
                    <Card key={invoice.id} className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/60">
                        <div className="h-1.5 bg-gradient-to-r from-amber-600 to-amber-400" />
                        <CardContent className="p-5">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Hóa đơn #{invoice.invoice_number}</div>
                                    <h3 className="mt-2 text-2xl font-black text-slate-950">{formatVND(invoice.total_amount)}</h3>
                                </div>
                                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200/50">
                                    {invoice.grade ? `Hạng ${invoice.grade}` : invoice.credit_score ? `Score ${invoice.credit_score}` : "Chưa chấm"}
                                </Badge>
                            </div>
                            <div className="mb-5 rounded-2xl bg-slate-50 p-4">
                                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Bên mua</div>
                                <div className="mt-1 truncate font-black text-slate-950">{invoice.buyer_name}</div>
                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-slate-500">Lợi suất gợi ý</div>
                                        <div className="font-black text-emerald-700">12 to 15%</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500">Kỳ hạn</div>
                                        <div className="font-black text-slate-950">30 ngày</div>
                                    </div>
                                </div>
                            </div>
                            <Button className={cn("w-full", theme.buttonClass)} size="lg" onClick={() => setSelectedInvoice(invoice)}>
                                Mở phòng giao dịch
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <DealDetailDrawerRedesign invoiceId={selectedInvoice?.id || null} onClose={() => setSelectedInvoice(null)} onOfferSuccess={() => { }} />
        </>
    );
}

export function FIPortfolioRedesign() {
    const { data: offers, isLoading } = useQuery({
        queryKey: ["my-offers"],
        queryFn: async () => {
            const res = await apiService.getMyOffers();
            return res.data;
        },
    });
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

    const groups = {
        action: offers?.filter((o: any) => o.status === "ACCEPTED" && o.invoice.status === "FINANCED") || [],
        assets: offers?.filter((o: any) => ["FUNDING_RECEIVED", "DISBURSED"].includes(o.invoice.status) && o.status === "ACCEPTED") || [],
        settlement: offers?.filter((o: any) => o.invoice.status === "REPAYMENT_RECEIVED" && o.status === "ACCEPTED") || [],
        pending: offers?.filter((o: any) => o.status === "PENDING") || [],
    };

    const renderOffer = (offer: any, tone: "amber" | "emerald" | "blue" | "slate") => (
        <button
            key={offer.id}
            className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-300 hover:shadow-md"
            onClick={() => setSelectedInvoiceId(offer.invoice.id)}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant={tone === "emerald" ? "success" : tone === "amber" ? "warning" : "secondary"}>{offer.invoice.status}</Badge>
                        <span className="text-sm font-black text-slate-950">Hóa đơn #{offer.invoice.invoice_number}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500">{offer.invoice.sme?.company_name || "SME counterparty"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm lg:min-w-[360px]">
                    <div>
                        <div className="text-slate-500">Giá mua</div>
                        <div className="font-black text-slate-950">{formatVND(offer.funding_amount)}</div>
                    </div>
                    <div>
                        <div className="text-slate-500">Mệnh giá</div>
                        <div className="font-black text-slate-950">{formatVND(offer.invoice.total_amount)}</div>
                    </div>
                </div>
            </div>
        </button>
    );

    return (
        <>
            <PageHeader eyebrow="Danh mục" title="Danh mục giao dịch" description="Theo dõi việc cần xử lý, tài sản sinh lời, tất toán và đề nghị đang chờ SME phản hồi." />
            {isLoading ? <Surface>Đang tải danh mục...</Surface> : (
                <Tabs defaultValue="action">
                    <TabsList className="mb-6 flex h-auto flex-wrap rounded-2xl bg-slate-200/70 p-1">
                        <TabsTrigger value="action">Cần xử lý <Badge className="ml-2">{groups.action.length}</Badge></TabsTrigger>
                        <TabsTrigger value="assets">Tài sản <Badge className="ml-2">{groups.assets.length}</Badge></TabsTrigger>
                        <TabsTrigger value="settlement">Tất toán <Badge className="ml-2">{groups.settlement.length}</Badge></TabsTrigger>
                        <TabsTrigger value="pending">Đang chờ <Badge className="ml-2">{groups.pending.length}</Badge></TabsTrigger>
                    </TabsList>
                    <TabsContent value="action" className="space-y-3">{groups.action.length ? groups.action.map((o: any) => renderOffer(o, "amber")) : <EmptyState title="Không có việc cần xử lý" description="Các giao dịch đã được SME chấp nhận và cần giải ngân sẽ xuất hiện tại đây." />}</TabsContent>
                    <TabsContent value="assets" className="space-y-3">{groups.assets.length ? groups.assets.map((o: any) => renderOffer(o, "emerald")) : <EmptyState title="Chưa có tài sản sinh lời" description="Các giao dịch đã giải ngân sẽ chuyển vào khu vực này." />}</TabsContent>
                    <TabsContent value="settlement" className="space-y-3">{groups.settlement.length ? groups.settlement.map((o: any) => renderOffer(o, "blue")) : <EmptyState title="Chưa có khoản tất toán" description="Các hóa đơn đã nhận tiền hoàn trả sẽ được xếp hàng tại đây." />}</TabsContent>
                    <TabsContent value="pending" className="space-y-3">{groups.pending.length ? groups.pending.map((o: any) => renderOffer(o, "slate")) : <EmptyState title="Không có đề nghị đang chờ" description="Đề nghị đang chờ SME ký sẽ xuất hiện tại đây." />}</TabsContent>
                </Tabs>
            )}
            <DealDetailDrawerRedesign invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} onOfferSuccess={() => { }} />
        </>
    );
}

export function FISettingsRedesign() {
    const theme = useRoleTheme();
    const [config, setConfig] = useState({
        minCreditScore: 600,
        maxLTV: 80,
        maxTenor: 90,
        autoInvest: false,
        industryBlacklist: "Real Estate, Crypto",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiService.client.put("/fi/me/risk-config", { risk_config: config });
            toast.success("Đã cập nhật khẩu vị rủi ro");
        } catch {
            toast.error("Không thể cập nhật cài đặt");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHeader eyebrow="Chính sách rủi ro" title="Tiêu chí đầu tư" description="Thiết lập giới hạn cho xét duyệt thủ công và tự động khớp lệnh trong tương lai." />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                <Surface className="space-y-6 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Điểm tín dụng tối thiểu</Label>
                            <Input type="number" value={config.minCreditScore} onChange={(e) => setConfig({ ...config, minCreditScore: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>LTV tối đa</Label>
                            <Input type="number" value={config.maxLTV} onChange={(e) => setConfig({ ...config, maxLTV: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Kỳ hạn tối đa</Label>
                            <Input type="number" value={config.maxTenor} onChange={(e) => setConfig({ ...config, maxTenor: Number(e.target.value) })} />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Label>Ngành hạn chế</Label>
                        <Input value={config.industryBlacklist} onChange={(e) => setConfig({ ...config, industryBlacklist: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <div className="font-black text-slate-950">Tự động khớp đầu tư</div>
                            <div className="text-sm font-medium text-slate-500">Chuẩn bị tự động ra giá cho hóa đơn phù hợp tiêu chí.</div>
                        </div>
                        <Switch checked={config.autoInvest} onCheckedChange={(checked) => setConfig({ ...config, autoInvest: checked })} />
                    </div>
                    <div className="flex justify-end">
                        <Button className={theme.buttonClass} onClick={handleSave} disabled={saving} size="lg">
                            <Save className="h-4 w-4" />
                            Lưu tiêu chí
                        </Button>
                    </div>
                </Surface>
                <Surface className="p-6">
                    <ShieldCheck className="h-8 w-8 text-emerald-700" />
                    <h3 className="mt-4 text-xl font-black text-slate-950">Logic bao thanh toán</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Lợi nhuận là chênh lệch giữa mệnh giá và giá mua, sau khi trừ phí nền tảng.</p>
                </Surface>
            </div>
        </>
    );
}
