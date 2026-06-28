import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page max-w-lg py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-slate-600 mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-primary">
        Go home
      </Link>
    </div>
  );
}
