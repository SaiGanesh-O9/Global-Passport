import { Link } from 'react-router-dom';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-slate-200 px-5 transition-theme">
      <Card className="w-full max-w-sm p-8 text-center bg-white dark:bg-[#12131a] border border-slate-200 dark:border-slate-800/40 shadow-2xl">
        <h1 className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">404</h1>
        <h2 className="mt-4 text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Page Not Found</h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          The requested page does not exist or has been relocated.
        </p>
        <div className="mt-6">
          <Button to="/" variant="primary" className="w-full text-xs font-bold">
            Go Back Home
          </Button>
        </div>
      </Card>
    </main>
  );
}
