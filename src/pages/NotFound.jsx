import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-950">Page not found</h1>
      <Link className="font-medium text-blue-700 hover:text-blue-800" to="/">
        Go back home
      </Link>
    </section>
  );
}
