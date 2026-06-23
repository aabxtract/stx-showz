export default function EmptyState({
  title,
  description,
  action,
  icon = "📭",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: string;
}) {
  return (
    <div className="card p-8 sm:p-10 text-center">
      <div className="text-3xl sm:text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
      {description && (
        <p className="text-slate-600 mt-1.5 max-w-md mx-auto text-sm sm:text-base">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
