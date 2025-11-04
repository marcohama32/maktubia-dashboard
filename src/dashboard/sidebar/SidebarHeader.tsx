import Image from "next/image";

export function SidebarHeader() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-center bg-white py-6">
      <div className="relative h-[60px] w-[180px]">
        <Image
          src="/images/logo2.png"
          alt="Maktubia Logo"
          fill
          className="object-contain"
          priority
          sizes="180px"
        />
      </div>
    </div>
  );
}
