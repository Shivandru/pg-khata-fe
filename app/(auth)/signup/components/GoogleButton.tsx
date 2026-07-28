"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

export function GoogleButton({
  onClick,
  loading = false,
  className,
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex items-center justify-center gap-3 w-full rounded-md border",
        "bg-white text-gray-800 font-medium",
        "px-4 py-2 transition",
        "hover:bg-gray-100 active:scale-[0.98]",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      <Image
        src="/google.svg"
        alt="Google logo"
        width={20}
        height={20}
      /> 
      <span>
        {loading ? "Signing in..." : "Continue with Google"}
      </span>
    </button>
  );
}
