'use client';

interface ErrorDisplayProps {
  errors: (string | null | undefined)[];
}

export function ErrorDisplay({ errors }: ErrorDisplayProps) {
  const activeErrors = errors.filter(Boolean);
  
  if (activeErrors.length === 0) return null;

  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 text-sm space-y-1">
      {activeErrors.map((error, i) => (
        <div key={i}>
          <strong>Error:</strong> {error}
        </div>
      ))}
    </div>
  );
}
