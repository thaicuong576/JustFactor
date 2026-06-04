import { useState } from "react";
import { CheckCircle2, Clock, FileText, LayoutDashboard, Plus, Settings, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChatWidgetRedesign } from "@/features/chatbot/ChatWidgetRedesign";
import { InvoiceListRedesign } from "@/features/invoices/invoice-list-redesign";
import { InvoiceUploadRedesign } from "@/features/invoices/invoice-upload-redesign";
import { OfferListDialogRedesign } from "@/features/trading/offer-list-dialog-redesign";
import { apiService } from "@/services/api";
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
            roleLabel="Không gian SME"
            currentPage={activeView}
            onNavigate={(page) => setActiveView(page as "dashboard" | "invoices" | "settings")}
            onLogout={onLogout}
            navItems={[
                { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
                { id: "invoices", label: "Hóa đơn", icon: FileText },
                { id: "settings", label: "Cài đặt", icon: Settings },
            ]}
            balance={formatVND(stats?.credit_limit || 0)}
        >
            <PageHeader
                eyebrow="SME control"
                title={activeView === "dashboard" ? "Tổng quan tài chính" : activeView === "invoices" ? "Bàn xử lý hóa đơn" : "Cài đặt tài khoản"}
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

            {activeView === "settings" && (
                <EmptyState
                    title="Khu vực cài đặt đã sẵn sàng cho vòng backend tiếp theo"
                    description="Tài khoản ngân hàng, thông báo, hồ sơ công ty và phân quyền có thể được đưa vào đây khi endpoint đã sẵn sàng."
                />
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
