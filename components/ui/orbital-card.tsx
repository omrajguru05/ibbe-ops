import * as React from "react"
import { cn } from "@/lib/utils"

const OrbitalCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-[2rem] border-[3px] border-orbital-ink bg-orbital-surface text-orbital-ink shadow-orbital",
            className
        )}
        {...props}
    />
))
OrbitalCard.displayName = "OrbitalCard"

export { OrbitalCard }
