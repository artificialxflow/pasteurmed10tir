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
    "bg-gradient-to-br from-cyan-500 via-primary-dark to-cyan-900 text-white border border-cyan-800/40 shadow-lg shadow-cyan-900/20 hover:-translate-y-0.5",
  accent:
    "bg-gradient-to-br from-amber-400 to-vip-dark text-white border border-amber-700/40 shadow-lg shadow-amber-900/20 hover:-translate-y-0.5",
  danger:
    "bg-white text-red-700 border-2 border-red-200 hover:bg-red-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
  outline:
    "bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-50",
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
