export default function SectionHeader({ eyebrow, title, children }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase text-blue-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
        {title}
      </h2>
      {children ? (
        <p className="mt-4 text-base leading-7 text-slate-600">{children}</p>
      ) : null}
    </div>
  );
}
