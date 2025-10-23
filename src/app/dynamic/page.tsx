import { cookies } from 'next/headers';

export default async function DynamicPage() {
  const cookieStore = cookies();
  const timestamp = new Date().toISOString();
  
  return (
    <div className="p-4">
      <h1>Dynamic Page with Cookies</h1>
      <p>Server rendered at: {timestamp}</p>
      <p>Cookies: {cookieStore.toString()}</p>
    </div>
  );
}