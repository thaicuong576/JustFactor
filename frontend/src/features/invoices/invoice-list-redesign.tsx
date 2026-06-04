import { ArrowLeftRight, FileBarChart, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { InvoiceStatus, type Invoice } from "@/types";
import { formatVND } from "@/lib/format";
import { useInvoices } from "./hooks/useInvoices";

interface InvoiceListProps {
    onViewOffers?: (invoice: Invoice) => void;
}

const statusMap: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "outline" | "warning" }> = {
    [InvoiceStatus.DRAFT]: { label: "Bản nháp", variant: "secondary" },
    [InvoiceStatus.PROCESSING]: { label: "Đang xử lý", variant: "warning" },
    [InvoiceStatus.VERIFIED]: { label: "Đã xác thực", variant: "success" },
    [InvoiceStatus.REJECTED]: { label: "Từ chối", variant: "destructive" },
    [InvoiceStatus.TRADING]: { label: "Đang gọi vốn", variant: "default" },
    [InvoiceStatus.FINANCED]: { label: "Đã tài trợ", variant: "success" },
    [InvoiceStatus.DISBURSED]: { label: "Đã giải ngân", variant: "success" },
    [InvoiceStatus.REPAYMENT_RECEIVED]: { label: "Chờ tất toán", variant: "warning" },
    [InvoiceStatus.CLOSED]: { label: "Đã đóng", variant: "outline" },
};

export function InvoiceListRedesign({ onViewOffers }: InvoiceListProps) {
    const { data: invoices, isLoading, isError } = useInvoices();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-64 max-w-full" />
                            <Skeleton className="h-4 w-44 max-w-full" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
                Không thể tải danh sách hóa đơn. Vui lòng thử lại.
            </div>
        );
    }

    if (!invoices || invoices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                    <FileBarChart className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="mb-2 text-lg font-black text-slate-950">Chưa có hóa đơn</h3>
                <p className="mb-6 max-w-sm text-sm font-medium leading-6 text-slate-500">
                    Tải lên bộ hồ sơ hóa đơn để bắt đầu xác thực, chấm điểm và nhận đề nghị tài trợ.
                </p>
                <Button variant="outline">
                    <PlusCircle className="h-4 w-4" />
                    Sử dụng nút tải lên phía trên
                </Button>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Hóa đơn</TableHead>
                    <TableHead>Bên mua</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Ngày phát hành</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tín dụng</TableHead>
                    <TableHead />
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-black text-slate-950">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.buyer_name}</TableCell>
                        <TableCell className="font-black text-slate-950">{formatVND(invoice.total_amount)}</TableCell>
                        <TableCell>{invoice.issue_date || "Chưa có"}</TableCell>
                        <TableCell>
                            <Badge variant={statusMap[invoice.status]?.variant || "secondary"}>
                                {statusMap[invoice.status]?.label || invoice.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {invoice.grade ? (
                                <Badge
                                    variant="outline"
                                    className={
                                        invoice.grade === "A"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : invoice.grade === "B"
                                                ? "border-teal-200 bg-teal-50 text-teal-700"
                                                : "border-amber-200 bg-amber-50 text-amber-700"
                                    }
                                >
                                    Hạng {invoice.grade} ({invoice.credit_score})
                                </Badge>
                            ) : (
                                <span className="block text-center font-mono text-xs text-slate-300">--</span>
                            )}
                        </TableCell>
                        <TableCell>
                            {(invoice.status === InvoiceStatus.TRADING ||
                                invoice.status === InvoiceStatus.FINANCED ||
                                invoice.status === InvoiceStatus.DISBURSED ||
                                invoice.status === InvoiceStatus.CLOSED) &&
                                onViewOffers && (
                                    <Button size="sm" variant="outline" onClick={() => onViewOffers(invoice)}>
                                        <ArrowLeftRight className="h-3 w-3" />
                                        {invoice.status === InvoiceStatus.TRADING ? "Đề nghị" : "Chi tiết"}
                                    </Button>
                                )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
