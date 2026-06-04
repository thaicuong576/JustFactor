import { useState, useEffect } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/api";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

interface LoginFormProps {
    selectedRole: "sme" | "fi" | "admin";
    onRoleSelect: (role: "sme" | "fi" | "admin") => void;
    onLoginSuccess: (token: string, email: string, role: UserRole) => void;
    onRegisterClick: () => void;
}

export function LoginFormRedesign({
    selectedRole,
    onRoleSelect,
    onLoginSuccess,
    onRegisterClick
}: LoginFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const demoCredentials = {
        sme: { email: "contact@gfigroup.io", password: "123456" },
        fi: { email: "tpbank@partner.com", password: "123456" },
        admin: { email: "admin@invoice-platform.com", password: "admin_password_sieumanh_123" },
    };

    useEffect(() => {
        const creds = demoCredentials[selectedRole];
        form.setValue("email", creds.email);
        form.setValue("password", creds.password);
    }, [selectedRole, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("username", values.email);
            formData.append("password", values.password);

            const response = await apiService.login(formData);
            const token = response.data.access_token;
            localStorage.setItem("access_token", token);

            let role = UserRole.SME;
            try {
                const userResponse = await apiService.getMe();
                role = userResponse.data.role;
            } catch (roleError) {
                console.warn("Không thể lấy vai trò người dùng, tạm dùng SME", roleError);
            }

            onLoginSuccess(token, values.email, role);
        } catch (loginError) {
            console.error("Login error:", loginError);
            setError("Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.");
            localStorage.removeItem("access_token");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/70">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-black text-slate-950">Đăng nhập JUSTFACTOR</CardTitle>
                    <CardDescription className="font-medium">
                        Chọn vai trò để tự động cấu hình hoặc đăng nhập tài khoản của bạn.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Role Switcher Tabs */}
                    <div className="grid grid-cols-3 gap-2 mb-6 rounded-2xl bg-slate-100 p-1 border border-slate-200">
                        {(["sme", "fi", "admin"] as const).map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => onRoleSelect(role)}
                                className={cn(
                                    "rounded-xl py-2 text-xs font-black transition-all",
                                    selectedRole === role
                                        ? role === "sme"
                                            ? "bg-teal-700 text-white shadow-sm"
                                            : role === "fi"
                                            ? "bg-amber-600 text-white shadow-sm"
                                            : "bg-slate-800 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-200/50"
                                )}
                            >
                                {role === "sme" ? "SME" : role === "fi" ? "FI / Quỹ" : "Admin Ops"}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" placeholder="ten@congty.vn" {...form.register("email")} />
                            {form.formState.errors.email && (
                                <p className="text-xs font-medium text-red-600">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input id="password" type="password" {...form.register("password")} />
                            {form.formState.errors.password && (
                                <p className="text-xs font-medium text-red-600">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        {error && (
                            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                                {error}
                            </p>
                        )}

                        <Button
                            className={cn(
                                "w-full transition-all duration-300",
                                selectedRole === "sme"
                                    ? "bg-teal-700 hover:bg-teal-800 text-white"
                                    : selectedRole === "fi"
                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                    : "bg-slate-800 hover:bg-slate-900 text-white"
                            )}
                            size="lg"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                            Đăng nhập
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 font-bold text-slate-500">Hoặc</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" size="lg" className="w-full" onClick={onRegisterClick}>
                            Đăng ký tài khoản SME
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
