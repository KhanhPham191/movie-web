import Image from "next/image";

// Global loading UI khi chuyển trang (App Router)
export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f0f0f]">
      <div className="relative flex items-center justify-center">
        {/* Vòng xoay quanh logo */}
        <div className="h-20 w-20 rounded-full border-[3px] border-t-[#fb743E] border-r-transparent border-b-transparent border-l-transparent animate-spin" />

        {/* Logo ở giữa */}
        <div className="absolute h-10 w-10 drop-shadow-[0_0_22px_rgba(251,116,62,0.9)]">
          <Image
            src="/movpey-logo.ico?v=2"
            alt="MovPey"
            fill
            sizes="40px"
            priority
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}


