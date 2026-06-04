import { useState } from "react";
import { CheckCircle2, Clock, ExternalLink, FileText, LayoutDashboard, Plus, Settings, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChatWidgetRedesign } from "@/features/chatbot/ChatWidgetRedesign";
import { InvoiceListRedesign } from "@/features/invoices/invoice-list-redesign";
import { InvoiceUploadRedesign } from "@/features/invoices/invoice-upload-redesign";
import { OfferListDialogRedesign } from "@/features/trading/offer-list-dialog-redesign";
import { apiService, API_URL } from "@/services/api";
import type { Invoice, User } from "@/types";
import { EmptyState, MetricCard, PageHeader, ProductShell, Surface } from "@/components/product-shell";
import { formatVND } from "@/lib/format";
import { AlternativeDataScorecard } from "@/components/AlternativeDataScorecard";

interface SMEDashboardProps {
    onLogout: () => void;
}

export default function SMEDashboardRedesign({ onLogout }: SMEDashboardProps) {
    const [activeView, setActiveView] = useState<"dashboard" | "invoices" | "settings">("dashboard");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [offerDialogOpen, setOfferDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const getFileUrl = (path: string) => {
        if (path.startsWith("http")) return path;
        const cleanPath = path.replace(/^\/+/, "");
        const token = localStorage.getItem("access_token");
        return `${API_URL}/auth/files/${cleanPath}?token=${token}`;
    };

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["sme-summary"],
        queryFn: async () => {
            const res = await apiService.getSMESummary();
            return res.data;
        },
    });

    const { data: me } = useQuery({
        queryKey: ["auth-me"],
        queryFn: async () => {
            const response = await apiService.getMe();
            return response.data as User;
        },
    });

    const smeId = me?.sme_profile?.id;
    const { data: alternativeData } = useQuery({
        queryKey: ["sme-alternative-data", smeId],
        queryFn: async () => {
            const response = await apiService.getAlternativeData(smeId as number);
            return response.data;
        },
        enabled: !!smeId,
    });

    const handleViewOffers = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setOfferDialogOpen(true);
    };

    return (
        <ProductShell
            roleTheme="sme"
            currentPage={activeView}
            onNavigate={(page) => setActiveView(page as "dashboard" | "invoices" | "settings")}
            onLogout={onLogout}
            navItems={[
                { id: "dashboard", label: "Dòng tiền", icon: LayoutDashboard },
                { id: "invoices", label: "Hóa đơn & Tiến độ", icon: FileText },
                { id: "settings", label: "Hồ sơ công ty", icon: Settings },
            ]}
            balance={formatVND(stats?.credit_limit || 0)}
        >
            <PageHeader
                eyebrow="JustFactor Cashflow"
                title={
                    activeView === "dashboard"
                        ? `Chào mừng quay lại, ${me?.sme_profile?.company_name || "doanh nghiệp SME"}!`
                        : activeView === "invoices"
                        ? "Bàn xử lý hóa đơn"
                        : "Cài đặt tài khoản"
                }
                description="Theo dõi hạn mức, trạng thái hóa đơn, đề nghị tài trợ và tiến độ thanh toán trong một không gian làm việc rõ ràng."
                action={activeView === "invoices" && (
                    <Button size="lg" onClick={() => setUploadOpen(true)}>
                        <Plus className="h-5 w-5" />
                        Tải lên hóa đơn
                    </Button>
                )}
            />

            {activeView === "dashboard" && (
                <>
                    {statsLoading ? (
                        <Surface>Đang tải chỉ số tài chính...</Surface>
                    ) : (
                        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <MetricCard label="Hạn mức" value={formatVND(stats?.credit_limit)} detail="Trần tài trợ đã được phê duyệt" icon={Wallet} tone="blue" />
                            <MetricCard label="Đang giao dịch" value={formatVND(stats?.pending_amount)} detail="Hóa đơn đang chờ vốn" icon={Clock} tone="amber" />
                            <MetricCard label="Đã giải ngân" value={formatVND(stats?.total_financed_amount)} detail="Dòng tiền đã về doanh nghiệp" icon={CheckCircle2} tone="emerald" />
                        </div>
                    )}

                    <div className="mb-8">
                        <AlternativeDataScorecard data={alternativeData} />
                    </div>

                    <Surface className="p-6">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-950">Hóa đơn gần đây</h2>
                                <p className="mt-1 text-sm font-medium text-slate-500">Hồ sơ mới nhất và hoạt động đề nghị tài trợ.</p>
                            </div>
                            <Button variant="outline" onClick={() => setActiveView("invoices")}>Xem tất cả</Button>
                        </div>
                        <InvoiceListRedesign onViewOffers={handleViewOffers} />
                    </Surface>
                </>
            )}

            {activeView === "invoices" && (
                <Surface className="p-6">
                    <InvoiceListRedesign onViewOffers={handleViewOffers} />
                </Surface>
            )}

            {activeView === "settings" && me?.sme_profile && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column: Profile Card & Documents */}
                    <div className="space-y-6 lg:col-span-1">
                        <Surface className="p-6 text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-3xl font-black text-teal-700 shadow-md">
                                {me.sme_profile.company_name.substring(0, 2).toUpperCase()}
                            </div>
                            <h3 className="mt-4 text-xl font-black text-slate-950">{me.sme_profile.company_name}</h3>
                            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Mã số thuế: {me.sme_profile.tax_code}</p>
                            
                            <div className="mt-6 space-y-2 border-t border-slate-100 pt-6 text-left text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tài khoản:</span>
                                    <span className="font-bold text-slate-900">{me.full_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="font-bold text-slate-900">{me.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Trạng thái:</span>
                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">Đã xác minh</span>
                                </div>
                            </div>
                        </Surface>

                        {/* Digital Presence */}
                        <Surface className="p-6">
                            <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-500">Hiện diện số</h3>
                            <div className="space-y-3">
                                {me.sme_profile.company_website ? (
                                    <a
                                        href={me.sme_profile.company_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition text-sm text-left"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="block font-bold text-slate-900">Website công ty</span>
                                            <span className="text-xs text-slate-500 truncate max-w-[180px] block">{me.sme_profile.company_website}</span>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
                                    </a>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400 text-center">
                                        Chưa cung cấp Website
                                    </div>
                                )}

                                {me.sme_profile.linkedin_url ? (
                                    <a
                                        href={me.sme_profile.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition text-sm text-left"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="block font-bold text-slate-900">LinkedIn doanh nghiệp</span>
                                            <span className="text-xs text-slate-500 truncate max-w-[180px] block">{me.sme_profile.linkedin_url}</span>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" />
                                    </a>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400 text-center">
                                        Chưa cung cấp LinkedIn URL
                                    </div>
                                )}
                            </div>
                        </Surface>
                    </div>

                    {/* Right Column: Detailed Profile Info & Uploaded Files */}
                    <div className="space-y-6 lg:col-span-2">
                        <Surface className="p-6">
                            <h3 className="mb-4 text-lg font-black text-slate-950">Thông tin chi tiết</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tên doanh nghiệp</label>
                                    <p className="text-base font-bold text-slate-900">{me.sme_profile.company_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã số thuế</label>
                                    <p className="text-base font-mono font-bold text-slate-900">{me.sme_profile.tax_code}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Người đại diện pháp luật</label>
                                    <p className="text-base font-bold text-slate-900">{me.sme_profile.legal_rep_name || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số CCCD người đại diện</label>
                                    <p className="text-base font-mono font-bold text-slate-900">{me.sme_profile.legal_rep_cccd || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Số điện thoại liên hệ</label>
                                    <p className="text-base font-bold text-slate-900">{me.sme_profile.phone_number || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Địa chỉ trụ sở</label>
                                    <p className="text-base font-bold text-slate-900">{me.sme_profile.address || "N/A"}</p>
                                </div>
                            </div>
                        </Surface>

                        {/* Document Gallery */}
                        <Surface className="p-6">
                            <h3 className="mb-4 text-lg font-black text-slate-950">Tài liệu pháp lý đã tải lên (KYC)</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {[
                                    { label: "Giấy phép đăng ký kinh doanh", path: me.sme_profile.business_license_path },
                                    { label: "CCCD Người đại diện (Mặt trước)", path: me.sme_profile.cccd_front_path },
                                    { label: "CCCD Người đại diện (Mặt sau)", path: me.sme_profile.cccd_back_path },
                                    { label: "Ảnh chân dung tự chụp", path: me.sme_profile.portrait_path },
                                ].map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-900">{doc.label}</p>
                                            <p className="text-xs font-medium text-slate-500">{doc.path ? "Tệp hợp lệ" : "Chưa tải lên"}</p>
                                        </div>
                                        {doc.path && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={getFileUrl(doc.path)} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                    Xem
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Surface>
                    </div>
                </div>
            )}

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <InvoiceUploadRedesign onSuccess={() => setUploadOpen(false)} />
                </DialogContent>
            </Dialog>

            <OfferListDialogRedesign
                open={offerDialogOpen}
                onOpenChange={setOfferDialogOpen}
                invoice={selectedInvoice}
            />

            <ChatWidgetRedesign />
        </ProductShell>
    );
}
