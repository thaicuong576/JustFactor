import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Building2, FileText, Globe, Linkedin, Mail, Phone, User,
    ChevronDown, ChevronRight, ExternalLink, ShieldCheck,
    Check, X, AlertTriangle, Eye, FileWarning
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { AlternativeDataScorecard } from "@/components/AlternativeDataScorecard";
import { apiService, API_URL } from "@/services/api";

/* ─────────────────── Types ─────────────────── */

export interface AdminSmeProfileView {
    id: number;
    email: string;
    full_name: string | null;
    created_at: string | null;
    sme_profile: {
        id: number | null;
        company_name: string | null;
        tax_code: string | null;
        phone_number: string | null;
        address: string | null;
        company_website: string | null;
        linkedin_url: string | null;
        legal_rep_name: string | null;
        legal_rep_cccd: string | null;
        business_license_path: string | null;
        cccd_front_path: string | null;
        cccd_back_path: string | null;
        portrait_path: string | null;
    } | null;
    total_invoices?: number;
    financed_amount?: number;
}

/* ─── KYC document helpers ─── */

interface KyoDoc {
    label: string;
    path: string | null;
}

function getKycDocs(profile: AdminSmeProfileView["sme_profile"]): KyoDoc[] {
    return [
        { label: "Giấy phép kinh doanh", path: profile?.business_license_path ?? null },
        { label: "CCCD mặt trước", path: profile?.cccd_front_path ?? null },
        { label: "CCCD mặt sau", path: profile?.cccd_back_path ?? null },
        { label: "Ảnh chân dung", path: profile?.portrait_path ?? null },
    ];
}

function getDocUrl(path: string | null): string | null {
    if (!path) return null;
    const token = localStorage.getItem("access_token");
    const normalized = path.replace(/\\/g, "/");
    return `${API_URL}/auth/files/${normalized}?token=${token}`;
}

/* ─── Raw Evidence Panel ─── */

function RawEvidencePanel({ rawEvidence }: { rawEvidence: Record<string, unknown> | undefined | null }) {
    const [open, setOpen] = useState(false);

    if (!rawEvidence || Object.keys(rawEvidence).length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <FileWarning className="h-4 w-4" />
                    Raw evidence — Admin only
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400">No raw evidence available.</p>
            </div>
        );
    }

    const knownKeys = ["homepage_excerpt", "website_excerpt", "recruitment_snippets", "negative_snippets", "internal_links", "submitted_website", "submitted_linkedin", "llm_raw_response"];
    const unknownKeys = Object.keys(rawEvidence).filter((k) => !knownKeys.includes(k));

    const renderValue = (key: string, value: unknown) => {
        if (key === "llm_raw_response" && typeof value === "object" && value !== null) {
            return (
                <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto bg-slate-100 rounded-lg p-2 border border-slate-200">
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-xs italic text-slate-400">(empty)</span>;
            return (
                <ul className="space-y-1">
                    {value.map((item, i) => (
                        <li key={i} className="rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-medium text-slate-700 border border-slate-100">
                            {String(item)}
                        </li>
                    ))}
                </ul>
            );
        }
        if (typeof value === "string" && value.startsWith("http")) {
            return (
                <a href={value} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline break-all">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {value}
                </a>
            );
        }
        return (
            <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap break-words leading-relaxed max-h-48 overflow-y-auto">
                {String(value)}
            </p>
        );
    };

    const knownLabels: Record<string, string> = {
        homepage_excerpt: "Homepage excerpt",
        website_excerpt: "Website excerpt",
        recruitment_snippets: "Recruitment snippets",
        negative_snippets: "Negative signals",
        internal_links: "Internal links",
        submitted_website: "Submitted website",
        submitted_linkedin: "Submitted LinkedIn",
        llm_raw_response: "LLM raw response",
    };

    return (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
            {/* Header — clickable to toggle */}
            <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-black text-slate-950">Raw evidence — Admin only</span>
                    <Badge variant="outline" className="border-red-200 bg-red-100 text-red-700 text-[10px] px-1.5 py-0">
                        SENSITIVE
                    </Badge>
                </div>
                {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
            </button>

            {open && (
                <div className="mt-4 space-y-3">
                    {knownKeys.filter((k) => k in rawEvidence).map((key) => (
                        <div key={key} className="rounded-xl border border-red-100 bg-white p-3">
                            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                {knownLabels[key] || key}
                            </div>
                            {renderValue(key, rawEvidence[key])}
                        </div>
                    ))}

                    {/* Unknown keys — defensive rendering */}
                    {unknownKeys.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700">
                                Additional data ({unknownKeys.length})
                            </div>
                            <div className="space-y-2">
                                {unknownKeys.map((key) => (
                                    <div key={key}>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase">{key}</span>
                                        <div className="mt-0.5">{renderValue(key, rawEvidence[key])}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── KYC Documents Grid ─── */

function KycDocumentsGrid({ profile }: { profile: AdminSmeProfileView["sme_profile"] }) {
    const docs = getKycDocs(profile);
    const hasAny = docs.some((d) => d.path);

    if (!hasAny) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <FileText className="mx-auto h-6 w-6 text-slate-300" />
                <p className="mt-1 text-xs font-medium text-slate-400">No KYC documents uploaded.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {docs.map((doc) => {
                const url = getDocUrl(doc.path);
                const isPdf = doc.path?.toLowerCase().endsWith(".pdf");
                return (
                    <div key={doc.label} className="group">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{doc.label}</div>
                        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-100 bg-slate-50 transition group-hover:border-blue-400 group-hover:shadow-sm">
                            {url ? (
                                <a href={url} target="_blank" rel="noreferrer" className="flex h-full w-full items-center justify-center p-2">
                                    {isPdf ? (
                                        <div className="text-center">
                                            <FileText className="mx-auto h-8 w-8 text-red-500" />
                                            <span className="mt-1 block text-[10px] font-bold text-blue-600">PDF</span>
                                        </div>
                                    ) : (
                                        <img src={url} alt={doc.label} className="max-h-full max-w-full object-contain"
                                             onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                                    )}
                                </a>
                            ) : (
                                <div className="text-center text-slate-300">
                                    <Eye className="mx-auto h-6 w-6" />
                                    <p className="mt-1 text-[10px]">Not provided</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Company Info Card ─── */

function CompanyInfoCard({ view }: { view: AdminSmeProfileView }) {
    const p = view.sme_profile;
    const rows: [string, string | null | undefined][] = [
        ["Tên công ty", p?.company_name],
        ["Mã số thuế", p?.tax_code],
        ["Người đại diện", p?.legal_rep_name],
        ["CCCD", p?.legal_rep_cccd],
        ["SĐT", p?.phone_number],
        ["Email", view.email],
        ["Địa chỉ", p?.address],
        ["Website", p?.company_website],
        ["LinkedIn", p?.linkedin_url],
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {rows.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</div>
                    <div className="mt-1 text-sm font-bold text-slate-950 break-words">
                        {value || <span className="text-slate-300">—</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ─── Invoice Stats Card ─── */

function InvoiceStatsCard({ view }: { view: AdminSmeProfileView }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Total invoices</div>
                <div className="mt-1 text-xl font-black text-slate-950">{view.total_invoices ?? 0}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Financed amount</div>
                <div className="mt-1 text-lg font-black text-emerald-700">
                    {view.financed_amount
                        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(view.financed_amount)
                        : "—"}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Drawer ─── */

interface Props {
    open: boolean;
    onClose: () => void;
    view: AdminSmeProfileView | null;
    mode: "approved" | "pending";
    onApprove?: (userId: number) => void;
    onReject?: (userId: number, reason: string) => void;
    isApproving?: boolean;
    isRejecting?: boolean;
}

export function AdminSmeProfileDrawer({ open, onClose, view, mode, onApprove, onReject, isApproving, isRejecting }: Props) {
    const [rejectReason, setRejectReason] = useState("");
    const smeId = view?.sme_profile?.id;

    const { data: alternativeData, isLoading: altLoading } = useQuery({
        queryKey: ["admin-alternative-data", smeId],
        queryFn: async () => {
            const res = await apiService.getAlternativeData(smeId!);
            return res.data;
        },
        enabled: open && !!smeId,
    });

    // Reset reject reason when the drawer reopens for a new user
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setRejectReason("");
            onClose();
        }
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl p-0 flex flex-col">
                {view ? (
                    <>
                        {/* Sticky Header */}
                        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <SheetTitle className="text-xl font-black text-slate-950 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-slate-600 shrink-0" />
                                        <span className="truncate">{view.sme_profile?.company_name || "Unnamed SME"}</span>
                                    </SheetTitle>
                                    <SheetDescription className="mt-1">
                                        {mode === "pending" ? "Hồ sơ chờ duyệt" : "SME đã được phê duyệt"}
                                        {" · "}
                                        Mã số thuế: {view.sme_profile?.tax_code || "—"}
                                    </SheetDescription>
                                </div>
                                <Badge variant={mode === "pending" ? "warning" : "success"} className="shrink-0 ml-3">
                                    {mode === "pending" ? "Pending" : "Approved"}
                                </Badge>
                            </div>
                        </SheetHeader>

                        {/* Scrollable Body */}
                        <ScrollArea className="flex-1 px-6 py-5">
                            <div className="space-y-6">
                                {/* 1. Company / KYC Profile */}
                                <section>
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
                                        <User className="h-4 w-4" />
                                        Thông tin doanh nghiệp
                                    </h3>
                                    <CompanyInfoCard view={view} />
                                </section>

                                <Separator />

                                {/* 2. KYC Documents */}
                                <section>
                                    <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
                                        <FileText className="h-4 w-4" />
                                        Tài liệu KYC
                                    </h3>
                                    <KycDocumentsGrid profile={view.sme_profile} />
                                </section>

                                <Separator />

                                {/* 3. Invoice Stats (approved mode only) */}
                                {(mode === "approved" || (view.total_invoices ?? 0) > 0) && (
                                    <>
                                        <section>
                                            <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
                                                <FileText className="h-4 w-4" />
                                                Thống kê hóa đơn
                                            </h3>
                                            <InvoiceStatsCard view={view} />
                                        </section>
                                        <Separator />
                                    </>
                                )}

                                {/* 4. Alternative Data Scorecard */}
                                <section>
                                    {altLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-32 w-full" />
                                        </div>
                                    ) : (
                                        <AlternativeDataScorecard data={alternativeData} />
                                    )}
                                </section>

                                {/* If alternative data loaded, show raw_evidence */}
                                {alternativeData?.raw_evidence && (
                                    <>
                                        <Separator />
                                        <section>
                                            <RawEvidencePanel rawEvidence={alternativeData.raw_evidence} />
                                        </section>
                                    </>
                                )}

                                {/* 5. Pending-only actions */}
                                {mode === "pending" && (
                                    <>
                                        <Separator />
                                        <section className="space-y-4">
                                            <h3 className="flex items-center gap-2 text-sm font-black text-slate-800">
                                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                                Xét duyệt hồ sơ
                                            </h3>

                                            <div className="space-y-2">
                                                <Label htmlFor="reject-reason">Lý do từ chối (nếu có)</Label>
                                                <textarea
                                                    id="reject-reason"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    className="min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700/20"
                                                    placeholder="Ghi rõ thiếu tài liệu, sai thông tin..."
                                                />
                                            </div>

                                            <div className="flex justify-end gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    disabled={isRejecting || isApproving || rejectReason.trim().length < 3}
                                                    onClick={() => onReject?.(view.id, rejectReason.trim())}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    {isRejecting ? "Đang xử lý..." : "Từ chối"}
                                                </Button>
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    disabled={isApproving}
                                                    onClick={() => onApprove?.(view.id)}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    {isApproving ? "Đang xử lý..." : "Chấp thuận hồ sơ"}
                                                </Button>
                                            </div>
                                        </section>
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 p-6">
                        No profile data.
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
