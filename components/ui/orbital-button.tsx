import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean
    variant?: "default" | "secondary" | "danger"
}

const OrbitalButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variants = {
            default: "bg-orbital-surface text-orbital-ink hover:bg-orbital-accent",
            secondary: "bg-orbital-ink text-white hover:bg-black",
            danger: "bg-red-500 text-white border-red-900 hover:bg-red-600 shadow-[4px_4px_0px_0px_#7f1d1d]"
        }

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full border-[3px] border-orbital-ink shadow-orbital transition-all hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_var(--ink)] active:translate-y-0 active:shadow-orbital disabled:pointer-events-none disabled:opacity-50 px-8 py-3 text-sm font-bold uppercase tracking-widest",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
OrbitalButton.displayName = "OrbitalButton"

export { OrbitalButton }
