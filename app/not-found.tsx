import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="p-6 max-w-xl mx-auto text-center">
      <h1 className="text-xl font-bold mb-2">찾을 수 없습니다</h1>
      <Link href="/" className="text-blue-600 underline">메인으로</Link>
    </main>
  );
}
