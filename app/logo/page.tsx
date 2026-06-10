import Image from "next/image";

const logoImage = "/ChatGPT Image Jun 9, 2026, 06_33_40 PM.png";

export const metadata = {
  title: "App Logo | Veritix",
  description: "View the Veritix app logo.",
};

export default function LogoPage() {
  return (
    <div className="container-page">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700">Brand asset</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            App logo
          </h1>
          <p className="mt-1.5 max-w-2xl text-slate-600">
            A clean preview of the current Veritix logo asset.
          </p>
        </div>
        <a href={logoImage} download className="btn-secondary w-fit">
          Download PNG
        </a>
      </div>

      <section className="card overflow-hidden p-4 sm:p-8">
        <div className="relative flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-950 p-6 sm:min-h-[520px] sm:p-12">
          <Image
            src={logoImage}
            alt="Veritix app logo"
            fill
            priority
            sizes="(min-width: 1024px) 960px, calc(100vw - 48px)"
            className="object-contain p-8 sm:p-14"
          />
        </div>
      </section>
    </div>
  );
}
