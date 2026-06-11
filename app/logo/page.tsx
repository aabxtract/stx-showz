import Image from "next/image";

export default function LogoPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
      <Image
        src="/ChatGPT Image Jun 9, 2026, 06_31_13 PM (1).png"
        alt="Veritix logo"
        width={800}
        height={800}
        priority
        className="h-auto max-w-full"
      />
    </div>
  );
}
