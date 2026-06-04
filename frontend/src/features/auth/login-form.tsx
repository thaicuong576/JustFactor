import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiService } from "@/services/api"
import { UserRole } from "@/types"

const formSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: z.string().min(6, { message: "Mật khẩu phải từ 6 ký tự" }),
})

interface LoginFormProps {
    onLoginSuccess: (token: string, email: string, role: UserRole) => void
    onRegisterClick: () => void  // Add this prop
}

export function LoginForm({ onLoginSuccess, onRegisterClick }: LoginFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError("")
        try {
            const formData = new FormData()
            formData.append("username", values.email)
            formData.append("password", values.password)

            const res = await apiService.login(formData)
            const token = res.data.access_token

            // Store token first to use in next request
            localStorage.setItem("access_token", token)

            // Fetch user details to get the correct role
            let role = UserRole.SME; // Default
            try {
                // Assuming we have an endpoint to get current user, or we decode token if it's JWT.
                // Since apiService doesn't have getMe, we'll try to use a generic approach or add it.
                // Let's assume we can add getMe to apiService or inferred from logic.
                // For this quick fix, let's hardcode a check or add getMe.
                // Better: Add getMe to apiService.
                const userRes = await apiService.getMe();
                role = userRes.data.role;
            } catch (e) {
                console.warn("Could not fetch user details, defaulting to SME", e);
            }

            onLoginSuccess(token, values.email, role)
        } catch (err) {
            console.error("Login error:", err);
            const status = typeof err === "object" && err !== null && "response" in err
                ? (err as { response?: { status?: number } }).response?.status
                : undefined;
            setError("Đăng nhập thất bại. Kiểm tra lại thông tin. (" + (status || 'Net') + ")")
            localStorage.removeItem("access_token"); // Clear invalid token
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/70">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-2xl font-bold text-center text-blue-700">Đăng nhập JUSTFACTOR</CardTitle>
                    <CardDescription className="font-medium">
                        Nhập email và mật khẩu của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="m@example.com"
                                {...form.register("email")}
                            />
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                type="password"
                                {...form.register("password")}
                            />
                            {form.formState.errors.password && (
                                <p className="text-xs text-red-500">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

                        <Button className="w-full" size="lg" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            Đăng nhập
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Hoặc</span>
                            </div>
                        </div>

                        <Button variant="outline" type="button" size="lg" className="w-full" onClick={onRegisterClick}>
                            Đăng ký tài khoản SME
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
