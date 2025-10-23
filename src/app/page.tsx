import ServerTime from '@/components/ServerTime';
import ClientApp from '@/components/ClientApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <ServerTime />
      <ClientApp />
    </main>
  );
}