export default function VLLogo({ size = 40 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vl-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14B8A6" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#vl-grad)" />
        {/* Loop arrows */}
        <path d="M12 14 C12 14 20 10 28 14 C32 16 32 20 28 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M28 26 C28 26 20 30 12 26 C8 24 8 20 12 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M26 20 L28 22 L30 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M14 20 L12 18 L10 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="font-bold text-gray-900 tracking-tight" style={{ fontSize: size * 0.55 }}>
        Value<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-purple-600">Loop</span>
      </span>
    </div>
  )
}
