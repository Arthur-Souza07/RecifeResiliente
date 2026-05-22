import React from "react";

interface LogoProps {
  layout?: "vertical" | "horizontal" | "iconOnly";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  isDarkBg?: boolean;
}

export default function Logo({
  layout = "horizontal",
  size = "md",
  className = "",
  isDarkBg = true,
}: LogoProps) {
  // Size metrics
  const sizes = {
    xs: { icon: "w-6 h-6", text: "text-xs", subtitle: "text-[6px]", gap: "gap-1.5" },
    sm: { icon: "w-8 h-8", text: "text-sm", subtitle: "text-[7px]", gap: "gap-2" },
    md: { icon: "w-12 h-12", text: "text-lg", subtitle: "text-[8px]", gap: "gap-3" },
    lg: { icon: "w-20 h-20", text: "text-2xl", subtitle: "text-[10px]", gap: "gap-4" },
    xl: { icon: "w-32 h-32", text: "text-4xl", subtitle: "text-[13px]", gap: "gap-6" },
  };

  const currentSize = sizes[size];
  const textColor = isDarkBg ? "text-white" : "text-slate-800";
  const subColor = isDarkBg ? "text-sky-400" : "text-sky-600";
  const extraTextClass = isDarkBg ? "text-slate-400" : "text-slate-500";

  // Monogram SVG of the "R" with wave
  const MonogramSvg = () => (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentSize.icon} select-none filter drop-shadow-[0_2px_8px_rgba(56,189,248,0.2)]`}
    >
      <defs>
        {/* Sky/Water ocean gradient */}
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="60%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        {/* Subtle white shadow grad for R */}
        <linearGradient id="rGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDarkBg ? "#ffffff" : "#0f172a"} />
          <stop offset="100%" stopColor={isDarkBg ? "#e2e8f0" : "#334155"} />
        </linearGradient>
      </defs>

      {/* Main Backing "R" Letter Structure */}
      {/* Designed to match the Recife Resiliente logo geometry */}
      <path
        d="M 60,40 H 135 C 165,40 165,85 135,85 H 90 V 40"
        stroke="url(#rGrad)"
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      <path
        d="M 60,35 V 135"
        stroke="url(#rGrad)"
        strokeWidth="24"
        strokeLinecap="round"
      />

      <path
        d="M 85,85 H 125 C 150,85 160,110 165,135"
        stroke="url(#rGrad)"
        strokeWidth="24"
        strokeLinecap="round"
      />

      <path
        d="M 60,95 H 90"
        stroke="url(#rGrad)"
        strokeWidth="24"
        strokeLinecap="round"
      />

      {/* The wave flowing across the R cut out, matching the prompt image custom wave */}
      <path
        d="M 50,140 Q 95,95 135,135 T 185,120 Q 155,145 130,135 T 50,140 Z"
        fill="url(#waveGrad)"
        className="animate-pulse"
        style={{ animationDuration: "3s" }}
      />
      <path
        d="M 55,145 Q 98,105 135,143 T 180,128 Q 152,153 128,143 T 55,145 Z"
        fill="#06b6d4"
        opacity="0.6"
      />
    </svg>
  );

  const LogoImage = () => {
    const [imgError, setImgError] = React.useState(false);

    if (imgError) {
      return <MonogramSvg />;
    }

    return (
      <img
        src="/logo.png"
        alt="Logo Recife Resiliente"
        className={`${currentSize.icon} object-contain rounded-none select-none`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  };

  if (layout === "iconOnly") {
    return <LogoImage />;
  }

  if (layout === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center ${currentSize.gap} ${className}`}>
        <LogoImage />
        <div className="flex flex-col items-center">
          <h1 className={`font-extrabold tracking-[0.2em] uppercase font-sans ${currentSize.text} ${textColor} leading-none`}>
            RECIFE
          </h1>
          <h2 className={`font-semibold tracking-[0.15em] uppercase font-sans mt-0.5 ${subColor} text-[85%] leading-none`}>
            RESILIENTE
          </h2>
          <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#0ea5e9]/40 to-transparent my-1.5" />
          <p className={`font-mono uppercase tracking-[0.2em] font-medium ${extraTextClass} ${currentSize.subtitle}`}>
            Gestão Inteligente de Riscos e Desastres
          </p>
        </div>
      </div>
    );
  }

  // Horizontal Layout
  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      <LogoImage />
      <div className="flex flex-col text-left justify-center">
        <div className="flex items-baseline gap-1 leading-none">
          <span className={`font-black tracking-wider uppercase font-sans ${currentSize.text} ${textColor}`}>
            RECIFE
          </span>
          <span className={`font-medium tracking-wide uppercase font-sans text-[75%] ${subColor}`}>
            RESILIENTE
          </span>
        </div>
        <p className={`font-mono text-left uppercase tracking-wider font-semibold ${extraTextClass} ${currentSize.subtitle} mt-0.5`}>
          Gestão de Riscos e Desastres • PCR
        </p>
      </div>
    </div>
  );
}
