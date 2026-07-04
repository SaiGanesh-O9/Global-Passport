import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">Page not found</h1>
        <Link
          className="mt-4 inline-flex font-semibold text-blue-700 hover:text-blue-800"
          to="/"
        >
          Go back home
        </Link>
      </section>
    </main>
  );
}
