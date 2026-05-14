'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">문제가 발생했습니다</h1>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>
      <button type="button" onClick={reset} className="rounded-md border px-3 py-1 text-sm">
        다시 시도
      </button>
    </main>
  );
}
