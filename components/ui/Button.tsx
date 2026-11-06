import React from "react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: Props) {
  const styles = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "border border-neutral-300 hover:bg-neutral-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-neutral-100",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}