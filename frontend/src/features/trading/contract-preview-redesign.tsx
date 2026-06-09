import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Invoice, Offer } from "@/types";
import { formatVND } from "@/lib/format";
import { API_URL } from "@/services/api";

interface ContractPreviewProps {
    invoice: Invoice;
    offer: Offer;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ContractPreviewRedesign({ invoice, offer, onConfirm, onCancel }: ContractPreviewProps) {
    const handleDownloadPdf = () => {
        const token = localStorage.getItem("access_token");
        const url = `${API_URL}/trading/offers/${offer.id}/contract-preview?token=${token}`;
        window.open(url, "_blank");
    };

    return (
        <div className="space-y-6">
            <div className="h-[60vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-7 shadow-inner">
                <div className="mb-8 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">JustFactor</p>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Hợp đồng bao thanh toán</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Số tham chiếu: JF-{invoice.invoice_number}</p>
                </div>

                <section className="space-y-3">
                    <p><strong>Bên A (bên bán khoản phải thu):</strong> Doanh nghiệp SME phát hành hóa đơn.</p>
                    <p><strong>Bên B (bên mua khoản phải thu):</strong> Tổ chức tài chính trên nền tảng JustFactor.</p>
                    <p>
                        Hai bên thống nhất chuyển nhượng khoản phải thu phát sinh từ hóa đơn
                        <strong> #{invoice.invoice_number}</strong> với bên mua là <strong>{invoice.buyer_name}</strong>.
                    </p>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h2 className="mb-3 text-base font-black text-slate-950">Điều khoản tài chính</h2>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Giá trị hóa đơn</dt>
                            <dd className="mt-1 font-black text-slate-950">{formatVND(invoice.total_amount)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Số tiền ứng trước</dt>
                            <dd className="mt-1 font-black text-slate-950">{formatVND(offer.funding_amount)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Lãi suất chiết khấu</dt>
                            <dd className="mt-1 font-black text-slate-950">{offer.interest_rate}% / năm</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Kỳ hạn</dt>
                            <dd className="mt-1 font-black text-slate-950">{offer.tenor_days} ngày</dd>
                        </div>
                    </dl>
                </section>

                <section className="mt-6 space-y-3">
                    <h2 className="text-base font-black text-slate-950">Cam kết</h2>
                    <p>Bên A cam kết hóa đơn là hợp lệ, khoản phải thu chưa được chuyển nhượng cho bên thứ ba và các chứng từ đính kèm phản ánh giao dịch thật.</p>
                    <p>Bên B cam kết giải ngân đúng số tiền và thời hạn sau khi hợp đồng được ký điện tử và nền tảng xác nhận điều kiện giao dịch.</p>
                </section>

                <div className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-200 pt-6 text-center">
                    <div>
                        <p className="font-black text-slate-950">Đại diện bên A</p>
                        <p className="text-xs text-slate-500">Ký bởi SME</p>
                        <div className="mx-auto mt-4 w-fit rotate-[-3deg] rounded-xl border-2 border-dashed border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
                            Đã ký điện tử
                        </div>
                    </div>
                    <div>
                        <p className="font-black text-slate-950">Đại diện bên B</p>
                        <p className="text-xs text-slate-500">Ký bởi tổ chức tài chính</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <Button variant="outline" onClick={onCancel}>Hủy</Button>
                <Button variant="outline" onClick={handleDownloadPdf}>
                    <Download className="h-4 w-4" />
                    Tải PDF
                </Button>
                <Button onClick={onConfirm} className="px-8">
                    <Check className="h-4 w-4" />
                    Ký và xác nhận
                </Button>
            </div>
        </div>
    );
}
