import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Copy, Download, Loader2, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/services/api";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";

interface PaymentKitProps {
    invoiceId: number;
    userRole?: "SME" | "FI" | "ADMIN";
}

export function PaymentKitRedesign({ invoiceId, userRole = "SME" }: PaymentKitProps) {
    const defaultTab = userRole === "FI" ? "disburse" : "repay";
    const [activeTab, setActiveTab] = useState(defaultTab);

    const { data: kit, isLoading, isError, refetch } = useQuery({
        queryKey: ["payment-kit", invoiceId],
        queryFn: async () => {
            const response = await apiService.getPaymentKit(invoiceId);
            return response.data;
        },
        refetchInterval: 5000,
    });

    useEffect(() => {
        if (kit?.status === "DISBURSED" || kit?.status === "CLOSED") {
            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#059669", "#1d4ed8", "#f59e0b"],
            });
        }
    }, [kit?.status]);

    useEffect(() => {
        if (userRole === "SME" && kit?.status === "DISBURSED") {
            const timer = setTimeout(() => setActiveTab("repay"), 0);
            return () => clearTimeout(timer);
        }
    }, [kit?.status, userRole]);

    const copyToClipboard = (text?: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép", { description: text, duration: 2000 });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "FINANCED": return "bg-teal-500/20 text-teal-100 border-teal-400/30";
            case "DISBURSED": return "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";
            case "CLOSED": return "bg-slate-500/20 text-slate-100 border-slate-400/30";
            default: return "bg-white/10 text-white border-white/20";
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 p-10">
                <Loader2 className="h-10 w-10 animate-spin text-teal-700" />
                <p className="font-medium text-slate-500">Đang khởi tạo bộ thanh toán...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                <AlertCircle className="mb-2 h-10 w-10 text-red-500" />
                <p className="font-bold text-red-700">Không thể kết nối bộ thanh toán</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4 border-red-200 text-red-600 hover:bg-red-100">
                    <RefreshCw className="h-4 w-4" />
                    Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-lg">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5">
                <div className="flex items-start justify-between bg-slate-950 px-6 py-5">
                    <div className="space-y-1">
                        <h2 className="flex items-center gap-2 text-lg font-black text-white">
                            <ShieldCheck className="h-5 w-5 text-emerald-400" />
                            Cổng thanh toán
                        </h2>
                        <p className="text-xs font-medium tracking-wide text-slate-400">Luồng giải ngân và thu hồi bảo mật</p>
                    </div>
                    <Badge variant="outline" className={cn("font-mono tracking-wider backdrop-blur-md", getStatusColor(kit.status))}>
                        {kit.status}
                    </Badge>
                </div>

                <div className="p-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 rounded-xl bg-slate-100/80 p-1.5">
                            <TabsTrigger value="disburse" className="rounded-lg py-2 text-xs font-bold">
                                Giải ngân
                            </TabsTrigger>
                            <TabsTrigger value="repay" className="rounded-lg py-2 text-xs font-bold">
                                Thu hồi nợ
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="disburse" className="space-y-4">
                            {userRole === "SME" ? (
                                <WaitingState
                                    icon={<Smartphone className="h-6 w-6 text-teal-600" />}
                                    title="Đang chờ giải ngân"
                                    description="Nhà đầu tư đang thực hiện chuyển khoản qua tài khoản trung gian của nền tảng."
                                />
                            ) : (
                                <div className="space-y-4">
                                    <BankCard
                                        bankName={kit.intermediary_account?.bank_name}
                                        accountName={kit.intermediary_account?.account_name}
                                        accountNumber={kit.intermediary_account?.account_number}
                                        onCopy={copyToClipboard}
                                    />

                                    <QrPanel
                                        qrUrl={kit.disbursement?.qr_url}
                                        amount={kit.disbursement?.amount}
                                        content={kit.disbursement?.content}
                                        completed={kit.status === "DISBURSED"}
                                        completedLabel="Đã giải ngân"
                                        onCopy={copyToClipboard}
                                    />

                                    {kit.status === "FINANCED" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-full text-[11px] text-slate-400 hover:text-teal-700"
                                            onClick={async () => {
                                                await apiService.simulateFIFunding(invoiceId);
                                                refetch();
                                            }}
                                        >
                                            Mô phỏng webhook FI (dev)
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="repay" className="space-y-4">
                            {userRole === "FI" ? (
                                <WaitingState
                                    icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
                                    title="Thông tin dành cho SME"
                                    description="Mã QR thu hồi nợ sẽ được SME sử dụng sau khi khoản tài trợ đã giải ngân."
                                />
                            ) : !kit.repayment || kit.status === "FINANCED" || kit.status === "FUNDING_RECEIVED" ? (
                                <WaitingState
                                    icon={<Smartphone className="h-6 w-6 text-slate-500" />}
                                    title="Chưa đến bước thu hồi"
                                    description="QR thanh toán sẽ hiển thị sau khi SME đã nhận giải ngân."
                                />
                            ) : (
                                <div className="space-y-4">
                                    <QrPanel
                                        qrUrl={kit.repayment.qr_url}
                                        amount={kit.repayment.amount}
                                        content={kit.repayment.content}
                                        onCopy={copyToClipboard}
                                    />

                                    <Button
                                        onClick={() => window.open(kit.repayment.qr_url, "_blank")}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Download className="h-4 w-4" />
                                        Tải mã QR
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-full text-[11px] text-slate-400 hover:text-emerald-700"
                                        onClick={async () => {
                                            await apiService.simulateDebtorPay(kit.invoice_id);
                                            refetch();
                                        }}
                                    >
                                        Mô phỏng thanh toán bên mua (dev)
                                    </Button>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1 text-center text-xs font-semibold text-slate-500">
                <ShieldCheck className="h-3 w-3" />
                Kết nối được mã hóa và đối soát qua mã nội dung chuyển khoản
            </p>
        </div>
    );
}

function WaitingState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                {icon}
            </div>
            <h3 className="mb-1 text-sm font-black text-slate-950">{title}</h3>
            <p className="mx-auto max-w-[240px] text-xs font-medium leading-5 text-slate-500">{description}</p>
        </div>
    );
}

function BankCard({
    bankName,
    accountName,
    accountNumber,
    onCopy,
}: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    onCopy: (text?: string) => void;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-4 text-white shadow-lg">
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/5 blur-xl" />
            <div className="relative">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tài khoản trung gian</p>
                <h3 className="truncate text-sm font-black">{bankName || "Ngân hàng nền tảng"}</h3>
                <p className="truncate text-xs text-slate-400">{accountName || "JustFactor Escrow"}</p>
                <button
                    className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/10 p-3 text-left transition hover:bg-white/15"
                    onClick={() => onCopy(accountNumber)}
                >
                    <span className="font-mono text-lg font-black tracking-widest">{accountNumber || "Chưa có STK"}</span>
                    <Copy className="h-4 w-4 text-slate-400" />
                </button>
            </div>
        </div>
    );
}

function QrPanel({
    qrUrl,
    amount,
    content,
    completed,
    completedLabel,
    onCopy,
}: {
    qrUrl?: string;
    amount?: number;
    content?: string;
    completed?: boolean;
    completedLabel?: string;
    onCopy: (text?: string) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="relative rounded-2xl border-2 border-slate-950 bg-white p-2 shadow-lg">
                    {qrUrl ? (
                        <img src={qrUrl} alt="Mã QR thanh toán" className="h-40 w-40 object-contain" />
                    ) : (
                        <div className="grid h-40 w-40 place-items-center rounded-xl bg-slate-100 text-center text-xs font-semibold text-slate-400">
                            Chưa có QR
                        </div>
                    )}
                    {completed && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/90 text-center">
                            <CheckCircle className="mb-1 h-10 w-10 text-emerald-600" />
                            <span className="text-xs font-black uppercase text-emerald-700">{completedLabel}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Số tiền</p>
                <p className="text-3xl font-black tracking-tight text-slate-950">{formatVND(amount)}</p>
            </div>

            <button
                onClick={() => onCopy(content)}
                className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-teal-400 hover:bg-white"
            >
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Nội dung chuyển khoản</p>
                    <code className="block truncate text-sm font-black text-slate-950">{content || "Chưa có nội dung"}</code>
                </div>
                <Copy className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700" />
            </button>
        </div>
    );
}
