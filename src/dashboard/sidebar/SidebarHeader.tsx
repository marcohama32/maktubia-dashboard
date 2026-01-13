import Image from "next/image";

export function SidebarHeader() {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-center bg-white py-6">
      <div className="relative h-[150px] w-[300px]">
        <Image
          src="/images/logo3.png"
          alt="Maktubia Logo"
          fill
          className="object-contain"
          priority
          sizes="300px"
        />
      </div>
    </div>
  );
}
