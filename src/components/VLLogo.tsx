/* eslint-disable @next/next/no-img-element */
export default function VLLogo({ size = 40, wordmark = true, dark = false }: { size?: number; wordmark?: boolean; dark?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <img
        src="/valueloop-logo.png"
        alt="ValueLoop"
        width={size}
        height={size}
        className="rounded-[28%] object-cover shadow-sm"
        style={{ width: size, height: size }}
      />
      {wordmark && (
        <span className="font-bold tracking-tight" style={{ fontSize: size * 0.55 }}>
          <span className={dark ? 'text-white' : 'text-gray-900'}>Value</span>
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg,#1E8BF5,#19C95F)' }}
          >
            Loop
          </span>
        </span>
      )}
    </div>
  )
}
