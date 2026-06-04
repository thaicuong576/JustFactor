import { useState } from "react";
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

const formSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

interface LoginFormProps {
    onLoginSuccess: (token: string, email: string, role: UserRole) => void;
    onRegisterClick: () => void;
}

export function LoginFormRedesign({ onLoginSuccess, onRegisterClick }: LoginFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

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
                        Nhập thông tin tài khoản để tiếp tục.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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

                        <Button className="w-full" size="lg" type="submit" disabled={loading}>
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
