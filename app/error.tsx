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
      <p className="text-sm text-gray-600 mb-4">
        잠시 후 다시 시도해 주세요.
        {error.digest && (
          <span className="ml-1 text-gray-400">(코드: {error.digest})</span>
        )}
      </p>
      {isDev && (
        <pre className="mb-4 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
          {error.message}
        </pre>
      )}
      <button type="button" onClick={reset} className="rounded-md border px-3 py-1 text-sm">
        다시 시도
      </button>
    </main>
  );
}
