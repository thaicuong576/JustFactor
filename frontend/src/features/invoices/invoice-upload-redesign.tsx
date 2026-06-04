import { useEffect, useState } from "react";
import { CheckCircle, FileText, Loader2, Upload } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUploadInvoice } from "./hooks/useInvoices";

interface InvoiceUploadProps {
    onSuccess: () => void;
}

type UploadFiles = {
    xml: File | null;
    invoice_pdf: File | null;
    contract_pdf: File | null;
    delivery_pdf: File | null;
};

export function InvoiceUploadRedesign({ onSuccess }: InvoiceUploadProps) {
    const { mutate: upload, isPending } = useUploadInvoice();
    const [uploadProgress, setUploadProgress] = useState(0);
    const [files, setFiles] = useState<UploadFiles>({
        xml: null,
        invoice_pdf: null,
        contract_pdf: null,
        delivery_pdf: null,
    });

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let start: ReturnType<typeof setTimeout> | undefined;

        if (isPending) {
            start = setTimeout(() => setUploadProgress(10), 0);
            interval = setInterval(() => {
                setUploadProgress((current) => (current >= 90 ? 90 : current + 10));
            }, 500);
        } else {
            start = setTimeout(() => setUploadProgress(0), 0);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (start) clearTimeout(start);
        };
    }, [isPending]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, key: keyof UploadFiles) => {
        const file = event.target.files?.[0];
        if (file) setFiles((current) => ({ ...current, [key]: file }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!files.xml || !files.invoice_pdf || !files.contract_pdf || !files.delivery_pdf) {
            toast.error("Vui lòng tải lên đủ 4 tệp bắt buộc.");
            return;
        }

        const formData = new FormData();
        formData.append("xml_file", files.xml);
        formData.append("invoice_pdf", files.invoice_pdf);
        formData.append("contract_file", files.contract_pdf);
        formData.append("delivery_file", files.delivery_pdf);

        upload(formData, {
            onSuccess: () => {
                setUploadProgress(100);
                toast.success("Tải hóa đơn thành công. Hệ thống sẽ bắt đầu chấm điểm.");
                setFiles({ xml: null, invoice_pdf: null, contract_pdf: null, delivery_pdf: null });
                setTimeout(onSuccess, 1000);
            },
            onError: (error: unknown) => {
                console.error("Upload Error:", error);
                const detail = axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
                if (detail) {
                    toast.error(detail);
                    setUploadProgress(0);
                    return;
                }
                const message = error instanceof Error ? error.message : "Không thể tải hóa đơn. Vui lòng thử lại.";
                toast.error(message);
                setUploadProgress(0);
            },
        });
    };

    const fields: Array<{ key: keyof UploadFiles; label: string; accept: string }> = [
        { key: "xml", label: "XML hóa đơn điện tử", accept: ".xml" },
        { key: "invoice_pdf", label: "PDF hóa đơn", accept: ".pdf" },
        { key: "contract_pdf", label: "Hợp đồng thương mại", accept: ".pdf" },
        { key: "delivery_pdf", label: "Biên bản giao hàng", accept: ".pdf" },
    ];

    return (
        <Card className="border-2 border-dashed bg-slate-50/70">
            <CardHeader>
                <CardTitle>Tải lên bộ hồ sơ hóa đơn</CardTitle>
                <CardDescription>
                    Cần đủ XML hóa đơn, PDF hóa đơn, hợp đồng và biên bản giao hàng để hệ thống xác thực.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.key} className="flex min-h-28 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <span className="text-sm font-bold text-slate-700">{field.label}</span>
                                {files[field.key] ? (
                                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                                        <CheckCircle size={14} />
                                        <span className="truncate">{files[field.key]?.name}</span>
                                    </div>
                                ) : (
                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-teal-700 hover:underline">
                                        <Upload size={14} />
                                        Chọn tệp
                                        <input
                                            type="file"
                                            accept={field.accept}
                                            className="hidden"
                                            onChange={(event) => handleFileChange(event, field.key)}
                                        />
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>

                    {isPending && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-slate-500">
                                <span>Đang tải lên và xử lý...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}

                    <Button type="submit" disabled={isPending} className="w-full" size="lg">
                        {isPending ? <Loader2 className="animate-spin" /> : <FileText />}
                        {isPending ? "Đang xử lý..." : "Gửi xác thực và chấm điểm"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
