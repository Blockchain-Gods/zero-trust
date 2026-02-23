import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-visible:ring-2 focus-visible:ring-amber-400/50 aria-invalid:ring-red-400/30 aria-invalid:border-red-400/50 border text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap outline-none select-none",
  {
    variants: {
      variant: {
        default:
          "bg-amber-400 text-stone-950 border-amber-400 hover:bg-amber-300 hover:border-amber-300 font-bold",
        outline:
          "border-stone-700 bg-transparent text-stone-300 hover:border-stone-500 hover:text-white",
        secondary:
          "border-stone-700 bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white",
        ghost:
          "border-transparent bg-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200",
        destructive:
          "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60",
        link: "border-transparent bg-transparent text-amber-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-base",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
