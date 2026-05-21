'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">문제가 발생했습니다</h1>
      <p className="text-sm text-foreground-muted mb-4">
        잠시 후 다시 시도해 주세요.
        {error.digest && (
          <span className="ml-1 text-foreground-subtle">(코드: {error.digest})</span>
        )}
      </p>
      {isDev && (
        <pre className="mb-4 max-h-48 overflow-auto rounded bg-surface-muted p-2 text-xs text-foreground-muted">
          {error.message}
        </pre>
      )}
      <button type="button" onClick={reset} className="rounded-md border px-3 py-1 text-sm">
        다시 시도
      </button>
    </main>
  );
}
