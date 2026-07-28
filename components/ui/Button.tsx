import { cn } from "@/lib/utils";
import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

type Variant = "primary" | "accent" | "danger" | "ghost" | "outline";

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-800 text-white border border-cyan-950 shadow-md shadow-cyan-950/25 hover:bg-cyan-900 hover:-translate-y-0.5 [color:#fff]",
  accent:
    "bg-amber-600 text-white border border-amber-800 shadow-md shadow-amber-900/25 hover:bg-amber-700 hover:-translate-y-0.5 [color:#fff]",
  danger:
    "bg-white text-red-700 border-2 border-red-200 hover:bg-red-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
  outline:
    "bg-white text-slate-900 border-2 border-slate-800 hover:bg-slate-50",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  href,
  children,
  className,
  ...props
}: Props) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all disabled:opacity-50",
    variants[variant],
    className,
  );
  if (href) {
    const external =
      href.startsWith("http") ||
      href.startsWith("tel:") ||
      href.startsWith("mailto:");
    if (external) {
      return (
        <a href={href} className={cls} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={cls}
        onClick={props.onClick as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}
