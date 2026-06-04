/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Activity, Briefcase, Check, CheckCircle, Copy, DollarSign, Eye, FileText, LayoutDashboard, TrendingUp, Users, Building2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, MetricCard, PageHeader, ProductShell, Surface } from "@/components/product-shell";
import { apiService } from "@/services/api";
import { formatVND } from "@/lib/format";
import { AlternativeDataScorecard } from "@/components/AlternativeDataScorecard";

export function AdminLayoutRedesign({
    currentPage,
    onNavigate,
    onLogout,
    children,
}: {
    currentPage: string;
    onNavigate: (page: string) => void;
    onLogout: () => void;
    children: React.ReactNode;
}) {
    return (
        <ProductShell
            roleTheme="admin"
            currentPage={currentPage}
            onNavigate={onNavigate}
            onLogout={onLogout}
            navItems={[
                { id: "dashboard", label: "Tổng quan Ops", icon: LayoutDashboard },
                { id: "users", label: "Hàng chờ KYC", icon: Users },
                { id: "invoices", label: "Kiểm toán hóa đơn", icon: FileText },
                { id: "transactions", label: "Giám sát giao dịch", icon: Activity },
            ]}
        >
            {children}
        </ProductShell>
    );
}

export function AdminDashboardOverviewRedesign() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-summary"],
        queryFn: async () => {
            const response = await apiService.getAdminSummary();
            return response.data;
        },
    });

    const { data: approvedSmes, isLoading: smeLoading } = useQuery({
        queryKey: ["admin-approved-smes"],
        queryFn: async () => {
            const response = await apiService.getApprovedSmes();
            return response.data;
        },
    });

    return (
        <>
            <PageHeader
                eyebrow="JustFactor Ops"
                title="Hệ thống điều hành trung tâm"
                description="Theo dõi GMV đã tài trợ, doanh thu phí, SME hoạt động và tổ chức tài chính đang tham gia."
            />
            {isLoading ? (
                <Surface>Đang tải chỉ số hệ thống...</Surface>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <MetricCard label="GMV đã tài trợ" value={formatVND(stats?.total_gmv)} icon={DollarSign} tone="emerald" />
                    <MetricCard label="Phí nền tảng" value={formatVND(stats?.platform_fees)} icon={TrendingUp} tone="blue" />
                    <MetricCard label="SME hoạt động" value={stats?.active_smes || 0} icon={Briefcase} tone="slate" />
                    <MetricCard label="FI hoạt động" value={stats?.active_fis || 0} icon={Users} tone="amber" />
                </div>
            )}

            {/* Danh sách SME đã duyệt */}
            <div className="mt-6">
                <Surface className="p-0">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-slate-600" />
                                Doanh nghiệp SME đã duyệt
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Danh sách SME đã được phê duyệt và đang hoạt động trên sàn, kèm thống kê hóa đơn.
                            </p>
                        </div>
                    </div>
                    {smeLoading ? (
                        <div className="p-6 text-slate-500">Đang tải danh sách SME...</div>
                    ) : !approvedSmes || approvedSmes.length === 0 ? (
                        <EmptyState title="Chưa có SME nào được duyệt" description="Sau khi admin duyệt hồ sơ KYC, SME sẽ xuất hiện tại đây." />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-slate-900">Tên công ty</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Mã số thuế</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Email</TableHead>
                                    <TableHead className="font-semibold text-slate-900">SĐT</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-right">Số hóa đơn</TableHead>
                                    <TableHead className="font-semibold text-slate-900 text-right">Đã tài trợ</TableHead>
                                    <TableHead className="font-semibold text-slate-900">Ngày đăng ký</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {approvedSmes.map((sme: any) => (
                                    <TableRow key={sme.id} className="hover:bg-slate-50">
                                        <TableCell className="font-bold text-slate-900">
                                            {sme.sme_profile?.company_name || "—"}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-slate-700">
                                            {sme.sme_profile?.tax_code || "—"}
                                        </TableCell>
                                        <TableCell className="text-slate-700">{sme.email}</TableCell>
                                        <TableCell className="text-slate-700">
                                            {sme.sme_profile?.phone_number || "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-slate-700">
                                            {sme.total_invoices}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-emerald-700">
                                            {sme.financed_amount ? formatVND(sme.financed_amount) : "—"}
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {sme.created_at ? new Date(sme.created_at).toLocaleDateString("vi-VN") : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Surface>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Surface>
                    <h3 className="text-lg font-black text-slate-950">Hoạt động gần đây</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">Luồng sự kiện realtime có thể kết nối tại đây khi audit log đã sẵn sàng.</p>
                </Surface>
                <Surface>
                    <h3 className="text-lg font-black text-slate-950">Hàng chờ xét duyệt</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500">Dùng khu vực duyệt hồ sơ và kiểm toán hóa đơn để mở khóa các luồng vốn đang chờ.</p>
                </Surface>
            </div>
        </>
    );
}

export function UserApprovalPageRedesign() {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [rejectReason, setRejectReason] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin-users-pending"],
        queryFn: async () => {
            const response = await apiService.getPendingUsers();
            return response.data;
        },
    });

    const { mutate: approve, isPending: isApproving } = useMutation({
        mutationFn: async (userId: number) => apiService.approveUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users-pending"] });
            queryClient.invalidateQueries({ queryKey: ["admin-approved-smes"] });
            queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
            setSelectedUser(null);
            setRejectReason("");
            toast.success("Đã duyệt thành viên");
        },
    });

    const { mutate: reject, isPending: isRejecting } = useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) => apiService.rejectUser(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users-pending"] });
            setSelectedUser(null);
            setRejectReason("");
            toast.info("Đã từ chối hồ sơ");
        },
    });

    const selectedSmeId = selectedUser?.sme_profile?.id;
    const { data: alternativeData, isLoading: alternativeDataLoading } = useQuery({
        queryKey: ["admin-alternative-data", selectedSmeId],
        queryFn: async () => {
            const response = await apiService.getAlternativeData(selectedSmeId as number);
            return response.data;
        },
        enabled: !!selectedSmeId,
    });

    return (
        <>
            <PageHeader
                eyebrow="Hàng chờ KYC"
                title="Duyệt thành viên"
                description="Kiểm tra hồ sơ SME và FI trước khi cho phép truy cập sàn giao dịch."
            />
            <Surface className="p-0">
                {isLoading ? (
                    <div className="p-6">Đang tải hồ sơ chờ duyệt...</div>
                ) : users?.length === 0 ? (
                    <EmptyState title="Không có hồ sơ chờ duyệt" description="Yêu cầu đăng ký SME và FI mới sẽ xuất hiện tại đây." />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Công ty</TableHead>
                                <TableHead>Mã số thuế</TableHead>
                                <TableHead>Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-black text-slate-950">{user.email}</TableCell>
                                    <TableCell><Badge variant={user.role === "SME" ? "default" : "secondary"}>{user.role}</Badge></TableCell>
                                    <TableCell>{user.role === "SME" ? user.sme_profile?.company_name : user.fi_profile?.name}</TableCell>
                                    <TableCell className="font-mono">{user.role === "SME" ? user.sme_profile?.tax_code : "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {user.role === "SME" && (
                                                <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                                    <Eye className="h-4 w-4" />
                                                    Xem hồ sơ
                                                </Button>
                                            )}
                                            <Button size="sm" onClick={() => approve(user.id)} disabled={isApproving}>
                                                <Check className="h-4 w-4" />
                                                Duyệt
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Surface>

            {selectedUser && (
                <Dialog
                    open={!!selectedUser}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedUser(null);
                            setRejectReason("");
                        }
                    }}
                >
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>{selectedUser.sme_profile?.company_name || selectedUser.email}</DialogTitle>
                            <DialogDescription>Kiểm tra thông tin doanh nghiệp và chỉ duyệt khi giấy tờ gốc khớp với hồ sơ.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                                ["Công ty", selectedUser.sme_profile?.company_name],
                                ["Mã số thuế", selectedUser.sme_profile?.tax_code],
                                ["Người đại diện", selectedUser.sme_profile?.legal_rep_name],
                                ["Điện thoại", selectedUser.sme_profile?.phone_number],
                                ["Địa chỉ", selectedUser.sme_profile?.address],
                                ["Website", selectedUser.sme_profile?.company_website],
                                ["LinkedIn", selectedUser.sme_profile?.linkedin_url],
                                ["Email", selectedUser.email],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                                    <div className="mt-1 font-black text-slate-950">{value || "Chưa cung cấp"}</div>
                                </div>
                            ))}
                        </div>
                        {alternativeDataLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                                Loading alternative data...
                            </div>
                        ) : (
                            <AlternativeDataScorecard data={alternativeData} />
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="reject-reason">Lý do từ chối</Label>
                            <textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(event) => setRejectReason(event.target.value)}
                                className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/20"
                                placeholder="Ghi rõ thiếu tài liệu, sai thông tin, hoặc lỗi cần SME bổ sung."
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                disabled={isRejecting || isApproving || rejectReason.trim().length < 3}
                                onClick={() => reject({ id: selectedUser.id, reason: rejectReason.trim() })}
                            >
                                Từ chối
                            </Button>
                            <Button disabled={isApproving} onClick={() => approve(selectedUser.id)}>
                                Duyệt hồ sơ
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

export function InvoiceAuditPageRedesign() {
    const queryClient = useQueryClient();
    const [disburseData, setDisburseData] = useState<any>(null);
    const { data: invoices, isLoading } = useQuery({
        queryKey: ["admin-invoices-all"],
        queryFn: async () => {
            const response = await apiService.getAllInvoices();
            return response.data;
        },
    });

    return (
        <>
            <PageHeader
                eyebrow="Vận hành dòng vốn"
                title="Kiểm toán hóa đơn"
                description="Xác minh trạng thái hóa đơn và kích hoạt giải ngân hoặc hoàn trả thủ công khi cần."
            />
            <Surface className="p-0">
                {isLoading ? <div className="p-6">Đang tải hóa đơn...</div> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Hóa đơn</TableHead>
                                <TableHead>Bên mua</TableHead>
                                <TableHead>Giá trị</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Điểm</TableHead>
                                <TableHead>Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice: any) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-black text-slate-950">{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.buyer_name}</TableCell>
                                    <TableCell>{formatVND(invoice.total_amount)}</TableCell>
                                    <TableCell>{new Date(invoice.created_at).toLocaleDateString("vi-VN")}</TableCell>
                                    <TableCell><AdminStatusBadge status={invoice.status} /></TableCell>
                                    <TableCell>{invoice.credit_score || "-"}</TableCell>
                                    <TableCell>
                                        {invoice.status === "FINANCED" && (
                                            <Button size="sm" variant="outline" onClick={async () => {
                                                await apiService.confirmFunding(invoice.id);
                                                toast.success("Đã xác nhận tiền FI");
                                                queryClient.invalidateQueries({ queryKey: ["admin-invoices-all"] });
                                            }}>Xác nhận tiền FI</Button>
                                        )}
                                        {invoice.status === "FUNDING_RECEIVED" && (
                                            <Button size="sm" onClick={async () => {
                                                const response = await apiService.approveDisbursement(invoice.id);
                                                setDisburseData({ ...response.data, related_invoice_id: invoice.id });
                                                queryClient.invalidateQueries({ queryKey: ["admin-invoices-all"] });
                                            }}>Duyệt giải ngân</Button>
                                        )}
                                        {invoice.status === "REPAYMENT_RECEIVED" && (
                                            <Button size="sm" variant="secondary" onClick={() => {
                                                const offer = invoice.offers?.find((item: any) => item.status === "ACCEPTED");
                                                setDisburseData({
                                                    type: "FI",
                                                    amount: offer?.net_to_fi || invoice.total_amount * 0.995,
                                                    account_number: "FI_BANK_9999",
                                                    content: `PAYOUT INV-${invoice.id} PROFIT`,
                                                    related_invoice_id: invoice.id,
                                                });
                                            }}>Hoàn trả FI</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Surface>

            <Dialog open={!!disburseData} onOpenChange={(open) => !open && setDisburseData(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{disburseData?.type === "FI" ? "Lệnh hoàn trả FI" : "Lệnh giải ngân SME"}</DialogTitle>
                        <DialogDescription>Sao chép chính xác thông tin chuyển khoản vào quy trình ngân hàng.</DialogDescription>
                    </DialogHeader>
                    {disburseData && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                                <Label className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Số tiền chuyển</Label>
                                <div className="mt-2 text-3xl font-black text-emerald-800">{formatVND(disburseData.amount)}</div>
                            </div>
                            {[
                                ["Tài khoản", disburseData.account_number || "MOCK_ACCOUNT_NUMBER"],
                                ["Nội dung", disburseData.content],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <Label>{label}</Label>
                                    <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200">
                                        <div className="flex-1 bg-slate-50 px-4 py-3 font-mono text-sm font-bold">{value}</div>
                                        <Button variant="ghost" className="rounded-none border-l" onClick={() => navigator.clipboard.writeText(value)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            <Button className="w-full" size="lg" onClick={() => {
                                setDisburseData(null);
                                toast.info("Đang chờ ngân hàng xác nhận");
                            }}>
                                <CheckCircle className="h-4 w-4" />
                                Đánh dấu đã khởi tạo chuyển khoản
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export function TransactionMonitorPageRedesign() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ["admin-transactions"],
        queryFn: async () => {
            const response = await apiService.getTransactionLogs();
            return response.data;
        },
    });

    return (
        <>
            <PageHeader
                eyebrow="Ngân hàng"
                title="Giám sát giao dịch"
                description="Kiểm tra log SePay và đối soát mã tham chiếu chuyển tiền vào hoặc ra."
            />
            <Surface className="p-0">
                {isLoading ? <div className="p-6">Đang tải log ngân hàng...</div> : logs?.length === 0 ? (
                    <EmptyState title="Chưa có log ngân hàng" description="Sự kiện webhook sẽ xuất hiện tại đây sau khi SePay gửi bản ghi giao dịch." />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Thời gian</TableHead>
                                <TableHead>Số tiền</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead>Nội dung</TableHead>
                                <TableHead>Tài khoản</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs?.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell>{new Date(log.transaction_date).toLocaleString("vi-VN")}</TableCell>
                                    <TableCell className={log.transfer_type === "in" ? "font-black text-emerald-700" : "font-black text-red-600"}>
                                        {log.transfer_type === "in" ? "+" : "-"}{formatVND(log.transfer_amount)}
                                    </TableCell>
                                    <TableCell><Badge variant={log.transfer_type === "in" ? "success" : "destructive"}>{log.transfer_type === "in" ? "Tiền vào" : "Tiền ra"}</Badge></TableCell>
                                    <TableCell>{log.content}</TableCell>
                                    <TableCell className="font-mono">{log.account_number}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Surface>
        </>
    );
}

function AdminStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
        DRAFT: { label: "Bản nháp", variant: "secondary" },
        PROCESSING: { label: "Đang xử lý", variant: "warning" },
        VERIFIED: { label: "Đã xác thực", variant: "success" },
        TRADING: { label: "Đang gọi vốn", variant: "default" },
        FINANCED: { label: "Đã tài trợ", variant: "success" },
        FUNDING_RECEIVED: { label: "Đã nhận tiền FI", variant: "warning" },
        DISBURSED: { label: "Đã giải ngân", variant: "success" },
        REPAYMENT_RECEIVED: { label: "Đã nhận hoàn trả", variant: "warning" },
        CLOSED: { label: "Đã đóng", variant: "outline" },
        REJECTED: { label: "Từ chối", variant: "destructive" },
    };

    const item = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={item.variant}>{item.label}</Badge>;
}
