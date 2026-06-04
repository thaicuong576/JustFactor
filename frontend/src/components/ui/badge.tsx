/* eslint-disable react-refresh/only-export-components */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-teal-700 text-white hover:bg-teal-800",
                secondary:
                    "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200",
                destructive:
                    "border-transparent bg-red-600 text-white hover:bg-red-700",
                outline: "text-slate-950",
                success: "border-transparent bg-emerald-600 text-white hover:bg-emerald-700",
                warning: "border-transparent bg-amber-500 text-slate-950 hover:bg-amber-600",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
