import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';

export default async function DebugSessionPage() {
  // Only allow access in development mode
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const session = await auth();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Development Mode Only</p>
        <p className="text-sm">
          This debug page is only accessible in development mode.
        </p>
      </div>

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
