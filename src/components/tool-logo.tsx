import { builtInToolLogoInfo } from "@/lib/tool-logos";

function ChatGptMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.282 9.821a5.9853 5.9853 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9809 4.1818a5.984 5.984 0 0 0-4.91 5.9847 5.9892 5.9892 0 0 0 .482 3.4406A6.0279 6.0279 0 0 0 .5157 18.5233a6.0598 6.0598 0 0 0 6.4965 2.9 6.0652 6.0652 0 0 0 6.261 3.4069 6.0321 6.0321 0 0 0 4.019-2.1638 5.984 5.984 0 0 0 4.91-5.9847 5.9892 5.9892 0 0 0-.482-3.4406 6.0279 6.0279 0 0 0 .5617-3.4203zm-2.3777 3.3504l-.0003.001c.0312.1047.0617.2098.0891.3156.0079.0285.0156.0571.023.0857.015.0551.0295.1103.0433.1658.0105.0415.0205.0831.0295.1249.0131.0563.0254.1128.0363.1695.0082.0424.0158.0849.0227.1275.0108.0563.0208.1127.0295.1694.0063.0411.012.0823.0173.1235.0081.0569.0152.1139.0208.171.0038.0394.0069.0788.0094.1183.0051.0562.0089.1125.0113.169.0017.0406.0027.0813.0031.122.0036.0538.0058.1076.0066.1615.0004.0301.0001.0603-.0005.0904.0011.0788.0007.1576-.0013.2365-.002.0314-.0048.0628-.0083.0941-.0005.0166-.0011.0331-.0018.0497l.0002.0037a6.0549 6.0549 0 0 1-5.9828 5.1865l-.0392.0015-.0354-.0064c-.3252-.0557-.6482-.1325-.9691-.231l-.0408-.0126.022-.0144c1.8669-1.076 3.1716-1.8315 3.1716-1.8315a.6995.6995 0 0 0 .3511-.6049v-4.0822l1.0804.6238a.7054.7054 0 0 0 .3467.0932zm.375-2.0147c-.0118-.0685-.025-.1369-.0399-.2049-.0159-.0722-.0338-.1441-.0535-.2155a6.0672 6.0672 0 0 0-4.7563-4.7563 6.0633 6.0633 0 0 0-.2155-.0535 5.9346 5.9346 0 0 0 .2504-1.8617 5.9899 5.9899 0 0 0-5.1677-5.9847l-.0002-.0005a5.9444 5.9444 0 0 0-.6698-.0436A6.0549 6.0549 0 0 0 3.6734 7.2229l-.0392.0016-.0354-.0065a5.9819 5.9819 0 0 0-.9691.231l-.0408.0127.022.0143a10.1018 10.1018 0 0 1 1.3005.7508l1.8711 1.0804a.6996.6996 0 0 0 .7002 0l4.0823-2.3566v1.2469a.705.705 0 0 0 .3467.6061l1.8045 1.0416zM8.7057 11.2545l2.3988 1.3851 2.3989-1.3851v2.7701l-2.3989 1.3851-2.3988-1.3851z" />
    </svg>
  );
}

function GeminiMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0z" />
    </svg>
  );
}

function FlowMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 7.5c3.2 0 3.2 3 6.4 3s3.2-3 6.4-3 3.2 3 3.2 3" />
      <path d="M4 13.5c3.2 0 3.2 3 6.4 3s3.2-3 6.4-3 3.2 3 3.2 3" />
    </svg>
  );
}

export function ToolLogo({
  tool,
  className = "w-12 h-12",
}: {
  tool: { name: string; slug?: string | null };
  className?: string;
}) {
  const key = `${tool.slug ?? ""} ${tool.name ?? ""}`;

  const box = `${className} rounded-xl border border-border flex items-center justify-center shrink-0`;
  const iconBox = `${box} bg-secondary text-foreground`;

  if (/chat\s*-?\s*gpt/i.test(key)) {
    return (
      <div className={iconBox}>
        <ChatGptMark />
      </div>
    );
  }
  if (/gemini/i.test(key)) {
    return (
      <div className={`${box} bg-secondary text-brand-violet`}>
        <GeminiMark />
      </div>
    );
  }
  if (/veo|flow/i.test(key)) {
    return (
      <div className={iconBox}>
        <FlowMark />
      </div>
    );
  }

  const logo = builtInToolLogoInfo(tool);
  if (logo) {
    const container = logo.container ?? "bg-background";
    return (
      <img
        src={logo.url}
        alt={`${tool.name} logo`}
        loading="lazy"
        className={`${className} rounded-xl border border-border ${container} ${logo.bleed ? "object-cover p-0" : "object-contain p-1.5"}`}
      />
    );
  }

  return (
    <div className={`${box} bg-accent text-accent-foreground text-sm font-semibold`}>
      {tool.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
