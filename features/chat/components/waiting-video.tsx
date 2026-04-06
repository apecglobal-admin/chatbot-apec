"use client"

interface WaitingVideoProps {
  url: string
}

export function WaitingVideo({ url }: WaitingVideoProps) {
  return (
    <div className="rounded-[24px] rounded-bl-md bg-white px-3 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.06)] border border-slate-200/60">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label="AI is preparing a response"
        className="h-28 w-28 rounded-[18px] object-contain"
      >
        <source src={url} />
      </video>
    </div>
  )
}
