import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { apiService } from "@/services/api";

const companySchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    full_name: z.string().min(2, "Vui lòng nhập tên người dùng"),
    company_name: z.string().min(2, "Vui lòng nhập tên công ty"),
    tax_code: z.string().min(5, "Mã số thuế chưa hợp lệ"),
    address: z.string().min(5, "Vui lòng nhập địa chỉ"),
    legal_rep_name: z.string().min(2, "Vui lòng nhập người đại diện"),
    legal_rep_cccd: z.string().min(9, "CCCD/CMND chưa hợp lệ"),
    phone_number: z.string().min(10, "Số điện thoại chưa hợp lệ"),
}).extend({
    company_website: z.string().url("Website is not valid").optional().or(z.literal("")),
    linkedin_url: z.string().url("LinkedIn URL is not valid").optional().or(z.literal("")),
});

interface RegisterSMEFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const documentFields = [
    { key: "business_license", label: "Giấy phép kinh doanh" },
    { key: "cccd_front", label: "CCCD mặt trước" },
    { key: "cccd_back", label: "CCCD mặt sau" },
    { key: "portrait", label: "Ảnh chân dung" },
];

export function RegisterSMEFormRedesign({ onSuccess, onCancel }: RegisterSMEFormProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, { path: string; name: string }>>({});
    const [uploadingKey, setUploadingKey] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const form = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
    });

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let start: ReturnType<typeof setTimeout> | undefined;

        if (uploadingKey) {
            start = setTimeout(() => setProgress(10), 0);
            interval = setInterval(() => {
                setProgress((current) => (current >= 90 ? 90 : current + 10));
            }, 200);
        } else {
            start = setTimeout(() => setProgress(0), 0);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (start) clearTimeout(start);
        };
    }, [uploadingKey]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Chỉ chấp nhận JPG, PNG hoặc PDF.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Dung lượng tệp không được vượt quá 5MB.");
            return;
        }

        setUploadingKey(key);
        try {
            const path = await apiService.uploadKYC(file);
            setUploadedFiles((current) => ({ ...current, [key]: { path, name: file.name } }));
            setProgress(100);
            toast.success("Tải tệp thành công.");
        } catch (error) {
            console.error(error);
            toast.error("Tải tệp thất bại. Vui lòng thử lại.");
        } finally {
            setTimeout(() => setUploadingKey(null), 500);
        }
    };

    const onSubmit = async (values: z.infer<typeof companySchema>) => {
        if (Object.keys(uploadedFiles).length < 4) {
            toast.error("Vui lòng tải lên đủ 4 loại giấy tờ trước khi gửi.");
            return;
        }

        setLoading(true);
        try {
            await apiService.registerSME({
                user: {
                    email: values.email,
                    full_name: values.full_name,
                    password: values.password,
                },
                sme: {
                    tax_code: values.tax_code,
                    company_name: values.company_name,
                    address: values.address,
                    company_website: values.company_website || undefined,
                    linkedin_url: values.linkedin_url || undefined,
                    legal_rep_name: values.legal_rep_name,
                    legal_rep_cccd: values.legal_rep_cccd,
                    phone_number: values.phone_number,
                    business_license_path: uploadedFiles.business_license.path,
                    cccd_front_path: uploadedFiles.cccd_front.path,
                    cccd_back_path: uploadedFiles.cccd_back.path,
                    portrait_path: uploadedFiles.portrait.path,
                },
            });
            toast.success("Đăng ký thành công. Hồ sơ đang chờ xét duyệt.");
            onSuccess();
        } catch (error) {
            console.error("Registration Error:", error);
            const apiError = error as { response?: { data?: { detail?: unknown } }; message?: string };
            const detail = apiError.response?.data?.detail;
            const message = Array.isArray(detail)
                ? detail.map((item) => {
                    const validationError = item as { loc?: Array<string | number>; msg?: string };
                    return `${validationError.loc?.join(".") || "field"} ${validationError.msg || ""}`.trim();
                }).join(", ")
                : typeof detail === "string"
                    ? detail
                    : apiError.message || "Registration failed. Please check the submitted information.";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full border-slate-200 shadow-xl shadow-slate-200/70">
            <CardHeader>
                <CardTitle className="text-2xl font-black text-slate-950">Đăng ký tài khoản SME (Bước {step}/2)</CardTitle>
                <CardDescription className="font-medium">
                    Cung cấp hồ sơ doanh nghiệp để tham gia sàn tài trợ hóa đơn.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === 1 ? (
                    <div className="space-y-6">
                        <h3 className="text-lg font-black text-slate-950">Tải hồ sơ KYC</h3>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {documentFields.map((item) => (
                                <div key={item.key} className="space-y-2">
                                    <Label className="text-base font-semibold text-slate-700">{item.label} (*)</Label>
                                    <div className={`flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 transition-colors ${uploadedFiles[item.key] ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:bg-slate-50"}`}>
                                        {uploadedFiles[item.key] ? (
                                            <div className="flex flex-col items-center">
                                                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-700">
                                                    <CheckCircle size={20} />
                                                    Đã tải lên
                                                </div>
                                                <p className="mb-3 max-w-[180px] truncate text-center text-xs font-medium text-slate-600">
                                                    {uploadedFiles[item.key].name}
                                                </p>
                                                <label className="cursor-pointer text-xs font-bold text-teal-700 hover:underline">
                                                    Thay đổi
                                                    <input type="file" className="hidden" onChange={(event) => handleFileUpload(event, item.key)} />
                                                </label>
                                            </div>
                                        ) : uploadingKey === item.key ? (
                                            <div className="w-full space-y-2">
                                                <Progress value={progress} className="h-2 w-full" />
                                                <span className="block text-center text-xs text-slate-500">Đang tải lên... {progress}%</span>
                                            </div>
                                        ) : (
                                            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
                                                <Upload size={14} />
                                                Chọn tệp
                                                <input type="file" className="hidden" onChange={(event) => handleFileUpload(event, item.key)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={onCancel}>Hủy</Button>
                            <Button
                                size="lg"
                                onClick={() => {
                                    const missingFiles = documentFields.filter((item) => !uploadedFiles[item.key]);
                                    if (missingFiles.length > 0) {
                                        toast.error("Vui lòng tải đủ các giấy tờ bắt buộc.");
                                        return;
                                    }
                                    setStep(2);
                                }}
                            >
                                Tiếp tục
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Email"><Input {...form.register("email")} placeholder="email@congty.vn" /></Field>
                            <Field label="Mật khẩu"><Input type="password" {...form.register("password")} /></Field>
                            <Field label="Tên người dùng"><Input {...form.register("full_name")} placeholder="Nguyễn Văn A" /></Field>
                            <Field label="Tên công ty"><Input {...form.register("company_name")} placeholder="Công ty TNHH..." /></Field>
                            <Field label="Mã số thuế"><Input {...form.register("tax_code")} /></Field>
                            <Field label="Số điện thoại"><Input {...form.register("phone_number")} /></Field>
                        </div>
                        <Field label="Địa chỉ kinh doanh"><Input {...form.register("address")} /></Field>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Người đại diện"><Input {...form.register("legal_rep_name")} /></Field>
                            <Field label="CCCD/CMND người đại diện"><Input {...form.register("legal_rep_cccd")} /></Field>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field label="Website công ty"><Input {...form.register("company_website")} placeholder="https://congty.vn" /></Field>
                            <Field label="LinkedIn công ty"><Input {...form.register("linkedin_url")} placeholder="https://www.linkedin.com/company/..." /></Field>
                        </div>

                        <div className="flex justify-between pt-6">
                            <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại
                            </Button>
                            <Button type="submit" disabled={loading} size="lg" className="px-8">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hoàn tất đăng ký"}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
