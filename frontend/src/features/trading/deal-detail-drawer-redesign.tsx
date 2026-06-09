/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Building2, DollarSign, ExternalLink, FileText, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { roleThemes } from "@/lib/role-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService, API_URL } from "@/services/api";
import { formatVND } from "@/lib/format";
import { PaymentKitRedesign } from "./components/payment-kit-redesign";
import { AlternativeDataScorecard } from "@/components/AlternativeDataScorecard";

interface DealDetailDrawerProps {
    invoiceId: number | null;
    onClose: () => void;
    onOfferSuccess: () => void;
}

export function DealDetailDrawerRedesign({ invoiceId, onClose, onOfferSuccess }: DealDetailDrawerProps) {
    const theme = roleThemes.fi;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [offerForm, setOfferForm] = useState({ rate: 12, amount: 0, tenor: 30 });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!invoiceId) return;

        setLoading(true);
        apiService.getDealDetails(invoiceId)
            .then((response) => {
                setData(response.data);
                setOfferForm((current) => ({ ...current, amount: response.data.invoice.total_amount }));
            })
            .catch(() => toast.error("Không thể tải chi tiết giao dịch"))
            .finally(() => setLoading(false));
    }, [invoiceId]);

    if (!invoiceId) return null;

    const isPaymentStage = data?.invoice?.status === "FINANCED" || data?.invoice?.status === "CLOSED";

    const getFileUrl = (path: string) => {
        if (path.startsWith("http")) return path;
        const cleanPath = path.replace(/^\/+/, "");
        const token = localStorage.getItem("access_token");
        return `${API_URL}/auth/files/${cleanPath}?token=${token}`;
    };

    const recalculateFromRate = (rate: number, tenor = offerForm.tenor) => {
        const total = Number(data?.invoice?.total_amount || 0);
        const discount = total * (rate / 100) * (tenor / 365);
        return Math.max(0, Math.floor(total - discount));
    };

    const handleSubmitOffer = async () => {
        if (!invoiceId) return;
        setSubmitting(true);
        try {
            await apiService.makeOffer({
                invoice_id: invoiceId,
                interest_rate: offerForm.rate,
                funding_amount: offerForm.amount,
                tenor_days: offerForm.tenor,
                terms: "Hợp đồng bao thanh toán tiêu chuẩn JustFactor",
            });
            toast.success("Đã gửi đề nghị tài trợ");
            onOfferSuccess();
            onClose();
        } catch {
            toast.error("Không thể gửi đề nghị. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full overflow-y-auto bg-white text-slate-950 sm:max-w-3xl">
                <SheetHeader className="mb-6 pr-8">
                    <SheetTitle className="flex flex-wrap items-center gap-3 text-2xl font-black">
                        Phòng giao dịch #{data?.invoice?.invoice_number || invoiceId}
                        {data?.sme?.rating && (
                            <Badge variant={data.sme.rating === "A" ? "default" : "secondary"} className="text-sm">
                                Hạng {data.sme.rating}
                            </Badge>
                        )}
                    </SheetTitle>
                    <SheetDescription className="text-base font-medium text-slate-600">
                        {data?.sme?.company_name || "Đang tải thông tin doanh nghiệp"}
                    </SheetDescription>
                </SheetHeader>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                ) : data ? (
                    <Tabs defaultValue="overview">
                        <TabsList className="mb-6 grid h-auto w-full grid-cols-3 rounded-2xl bg-slate-100 p-1">
                            <TabsTrigger value="overview" className="rounded-xl font-bold data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md">Tổng quan</TabsTrigger>
                            <TabsTrigger value="documents" className="rounded-xl font-bold data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md">Tài liệu</TabsTrigger>
                            <TabsTrigger value={isPaymentStage ? "payment" : "offer"} className="rounded-xl font-bold data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                {isPaymentStage ? "Thanh toán" : "Ra giá"}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoCard label="Giá trị hóa đơn" value={formatVND(data.invoice.total_amount)} />
                                <InfoCard label="Bên mua" value={data.invoice.buyer_name} />
                            </div>

                            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                                <h3 className="mb-4 flex items-center gap-2 font-black text-amber-950">
                                    <ShieldCheck className="h-5 w-5 text-amber-600" />
                                    Đánh giá rủi ro
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <RiskMetric label="Điểm tín dụng" value={data.sme.score || "--"} className="text-amber-700" />
                                    <RiskMetric label="Xếp hạng" value={data.sme.rating || "--"} className="text-amber-700" />
                                    <RiskMetric label="PD" value={typeof data.sme.pd === "number" ? `${(data.sme.pd * 100).toFixed(1)}%` : "--"} className="text-amber-700" />
                                </div>
                            </div>

                            <AlternativeDataScorecard data={data.sme.alternative_data} />

                            <div className="rounded-2xl border border-slate-200 p-5">
                                <h3 className="mb-4 flex items-center gap-2 font-black text-slate-950">
                                    <Building2 className="h-5 w-5" />
                                    Thông tin doanh nghiệp
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <DetailRow label="Mã số thuế" value={data.sme.tax_code} mono />
                                    <DetailRow label="Địa chỉ" value={data.sme.address} />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-3">
                            {data.documents?.map((doc: any, index: number) => (
                                <div key={`${doc.path}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="rounded-xl bg-slate-100 p-2">
                                            <FileText className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-950">{doc.name}</p>
                                            <p className="text-xs font-medium text-slate-500">{doc.type}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={getFileUrl(doc.path)} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                            Xem
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </TabsContent>

                        {!isPaymentStage && (
                            <TabsContent value="offer" className="space-y-6">
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-black uppercase text-amber-950">
                                        <DollarSign className="h-4 w-4 text-amber-600" />
                                        Đề nghị mua khoản phải thu
                                    </h4>
                                    <p className="text-sm font-medium leading-6 text-amber-900">
                                        Bạn đang đề nghị mua hóa đơn với mệnh giá <strong>{formatVND(data.invoice.total_amount)}</strong>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Lãi suất chiết khấu (%/năm)</Label>
                                        <Input
                                            type="number"
                                            value={offerForm.rate || ""}
                                            onChange={(event) => {
                                                const rate = Number(event.target.value);
                                                setOfferForm({ ...offerForm, rate });
                                            }}
                                            className="h-12 text-lg font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kỳ hạn (ngày)</Label>
                                        <Input
                                            type="number"
                                            value={offerForm.tenor || ""}
                                            onChange={(event) => {
                                                const tenor = Number(event.target.value);
                                                setOfferForm({ ...offerForm, tenor });
                                            }}
                                            className="h-12 text-lg font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Giá mua / số tiền ứng trước</Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            value={offerForm.amount > 0 ? offerForm.amount.toLocaleString("vi-VN") : ""}
                                            onChange={(event) => {
                                                const rawValue = event.target.value.replace(/[.,\s]/g, "");
                                                if (rawValue === "") {
                                                    setOfferForm({ ...offerForm, amount: 0 });
                                                    return;
                                                }
                                                if (!/^\d*$/.test(rawValue)) return;
                                                const amount = Number(rawValue);
                                                setOfferForm({ ...offerForm, amount });
                                            }}
                                            className="h-14 pr-16 text-2xl font-black"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">VND</div>
                                    </div>
                                    <div className="flex justify-between px-1 text-xs font-bold text-slate-500">
                                        <span>Tối đa: {formatVND(data.invoice.total_amount)}</span>
                                        <span className={offerForm.amount > data.invoice.total_amount ? "text-red-600" : "text-amber-700"}>
                                            Tỷ lệ ứng trước: {data.invoice.total_amount > 0 ? ((offerForm.amount / data.invoice.total_amount) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
                                    {(() => {
                                        const total = Number(data.invoice.total_amount || 0);
                                        const amount = offerForm.amount;
                                        const rate = offerForm.rate;
                                        const tenor = offerForm.tenor;
                                        const interestIncome = amount * (rate / 100) * (tenor / 365);
                                        const platformCommission = total * 0.005;
                                        const grossProfit = interestIncome - platformCommission;
                                        const netDisbursement = amount * 0.99;
                                        return (
                                            <>
                                                <DetailRow label="Lãi thu được (FI)" value={`+${formatVND(interestIncome)}`} positive />
                                                <DetailRow label="Phí nền tảng (0.5%)" value={`-${formatVND(platformCommission)}`} />
                                                <DetailRow label="Lợi nhuận gộp dự kiến" value={`+${formatVND(grossProfit)}`} positive />
                                                <Separator />
                                                <DetailRow label="Giải ngân ròng (SME nhận)" value={formatVND(netDisbursement)} strong />
                                            </>
                                        );
                                    })()}
                                </div>

                                <Button onClick={handleSubmitOffer} className={cn("h-14 w-full text-lg", theme.buttonClass)} disabled={submitting}>
                                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <DollarSign className="h-5 w-5" />}
                                    Gửi đề nghị tài trợ
                                </Button>
                            </TabsContent>
                        )}

                        {isPaymentStage && (
                            <TabsContent value="payment">
                                <PaymentKitRedesign invoiceId={invoiceId} userRole="FI" />
                            </TabsContent>
                        )}
                    </Tabs>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
            <p className="mt-1 truncate text-xl font-black text-slate-950" title={value}>{value}</p>
        </div>
    );
}

function RiskMetric({ label, value, className }: { label: string; value: string | number; className?: string }) {
    return (
        <div>
            <div className={cn("text-2xl font-black text-amber-600", className)}>{value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{label}</div>
        </div>
    );
}

function DetailRow({ label, value, mono, positive, strong }: { label: string; value: string; mono?: boolean; positive?: boolean; strong?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-slate-500">{label}</span>
            <span className={`${mono ? "font-mono" : ""} ${positive ? "text-emerald-700" : "text-slate-950"} ${strong ? "text-base font-black" : "font-bold"} max-w-[60%] text-right`}>
                {value}
            </span>
        </div>
    );
}
