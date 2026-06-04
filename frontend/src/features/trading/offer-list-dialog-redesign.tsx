import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentKitRedesign } from "./components/payment-kit-redesign";
import { ContractPreviewRedesign } from "./contract-preview-redesign";
import { useAcceptOffer, useOffers } from "./hooks/useTrading";
import type { Invoice, Offer } from "@/types";
import { formatVND } from "@/lib/format";

interface OfferListDialogProps {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OfferListDialogRedesign({ invoice, open, onOpenChange }: OfferListDialogProps) {
    const { data: offers, isLoading } = useOffers(invoice?.id || null);
    const { mutate: acceptOffer } = useAcceptOffer();
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

    if (!invoice) return null;

    const isFunded = ["FINANCED", "DISBURSED", "CLOSED"].includes(invoice.status);

    const handleConfirmSign = () => {
        if (!selectedOffer) return;
        acceptOffer(selectedOffer.id, {
            onSuccess: () => setSelectedOffer(null),
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) setSelectedOffer(null);
                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className={selectedOffer || isFunded ? "sm:max-w-3xl" : "sm:max-w-xl"}>
                <DialogHeader>
                    <DialogTitle>
                        {isFunded
                            ? `Thanh toán cho hóa đơn #${invoice.invoice_number}`
                            : selectedOffer
                                ? `Ký hợp đồng cho hóa đơn #${invoice.invoice_number}`
                                : `Đề nghị tài trợ cho hóa đơn #${invoice.invoice_number}`}
                    </DialogTitle>
                </DialogHeader>

                {isFunded ? (
                    <PaymentKitRedesign invoiceId={invoice.id} userRole="SME" />
                ) : selectedOffer ? (
                    <ContractPreviewRedesign
                        invoice={invoice}
                        offer={selectedOffer}
                        onConfirm={handleConfirmSign}
                        onCancel={() => setSelectedOffer(null)}
                    />
                ) : (
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="animate-spin text-teal-700" />
                            </div>
                        ) : offers?.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                                    <Loader2 className="text-slate-400" />
                                </div>
                                <p className="font-semibold text-slate-600">Chưa có đề nghị cho hóa đơn này.</p>
                                <p className="mt-1 text-xs text-slate-400">Vui lòng kiểm tra lại sau khi nhà đầu tư xem hồ sơ.</p>
                            </div>
                        ) : (
                            offers?.map((offer) => (
                                <div key={offer.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md">
                                    <div className="absolute right-4 top-4">
                                        <Badge variant={offer.status === "ACCEPTED" ? "success" : "secondary"}>
                                            {offer.status === "ACCEPTED" ? "Đã nhận" : "Đang chờ"}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-xs font-black text-teal-700">
                                                    FI
                                                </div>
                                                <span className="text-sm font-bold text-slate-700">Nhà đầu tư #{offer.fi_id}</span>
                                            </div>

                                            <div>
                                                <p className="text-3xl font-black tracking-tight text-teal-700">
                                                    {offer.interest_rate}% <span className="text-sm font-bold text-slate-400">/ năm</span>
                                                </p>
                                                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                                                    Tài trợ:
                                                    <span className="font-bold text-slate-950">{formatVND(offer.funding_amount)}</span>
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{offer.tenor_days} ngày</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-auto">
                                            <Button
                                                onClick={() => setSelectedOffer(offer)}
                                                disabled={offer.status !== "PENDING"}
                                                size="lg"
                                                className={offer.status === "ACCEPTED" ? "w-full bg-emerald-700 hover:bg-emerald-800" : "w-full"}
                                            >
                                                {offer.status === "ACCEPTED" ? "Đã chấp nhận" : "Chấp nhận đề nghị"}
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                            <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
                                                Mở bản xem trước hợp đồng
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
