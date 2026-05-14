import { TechniqueForm } from '@/components/TechniqueForm';
import { Header } from '@/components/Header';

export default function NewCardPage() {
  return (
    <>
      <Header />
      <main className="max-w-xl mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">새 기술 추가</h1>
        <TechniqueForm />
      </main>
    </>
  );
}
