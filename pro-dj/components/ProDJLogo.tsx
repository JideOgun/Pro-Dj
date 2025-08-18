import Image from "next/image";

interface ProDJLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "transparent" | "opaque" | "full";
  format?: "svg" | "png";
  className?: string;
}

export default function ProDJLogo({
  size = "md",
  variant = "transparent",
  format = "png",
  className = "",
}: ProDJLogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-20 h-20",
  };

  const logoSrc =
    format === "png"
      ? variant === "full"
        ? "/icons/prodj_logo_full.png"
        : "/icons/prodj_logo.png"
      : variant === "full"
      ? "/icons/prodj_logo_full.svg"
      : "/icons/prodj_logo.svg";

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <Image
        src={logoSrc}
        alt="Pro-DJ Logo"
        fill
        className="object-contain"
        sizes={`${
          size === "sm"
            ? "24px"
            : size === "md"
            ? "32px"
            : size === "lg"
            ? "48px"
            : size === "xl"
            ? "64px"
            : "80px"
        }`}
      />
    </div>
  );
}
