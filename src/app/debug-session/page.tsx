import { auth } from '@/lib/auth';

export default async function DebugSessionPage() {
  const session = await auth();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Debug Session</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Session Data:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          {session ? '✅ Active session' : '❌ No session'}
        </p>
      </div>
    </div>
  );
}
