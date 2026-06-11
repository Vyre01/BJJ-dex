import { TechniqueForm } from '@/components/TechniqueForm';
import { Header } from '@/components/Header';

export default function NewCardPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl p-4">
        <h1 className="mb-5 font-display text-2xl font-extrabold tracking-tight">새 기술 추가</h1>
        <TechniqueForm />
      </main>
    </>
  );
}
