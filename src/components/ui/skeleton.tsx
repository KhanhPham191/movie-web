import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent md:animate-[pulse_0.8s_ease-in-out_infinite] rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
