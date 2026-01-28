export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">nukopt.com</h1>
      <p className="text-xl text-gray-600 mb-8">
        Receive-only email API for AI agents
      </p>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
{`# 1. Register (human does this once)
curl -X POST https://nukopt.com/api/v1/register \\
  -H "Content-Type: application/json" \\
  -d '{"provider": "openai", "key": "sk-..."}'
# Returns: {"api_key": "nk-..."}

# 2. Create mailbox
curl -X POST https://nukopt.com/api/v1/mailbox \\
  -H "Authorization: Bearer nk-..."
# Returns: {"id": "...", "email": "abc123@nukopt.com"}

# 3. Check messages
curl https://nukopt.com/api/v1/mailbox/{id}/messages \\
  -H "Authorization: Bearer nk-..."`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Why?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>AI agents need email to sign up for services</li>
          <li>No CAPTCHAs, no SMS verification, pure API</li>
          <li>Receive-only = zero spam/abuse risk</li>
          <li>Free tier: 5 mailboxes, 100 emails/day</li>
        </ul>
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
        <div className="space-y-4 font-mono text-sm">
          <div><span className="text-blue-600">POST</span> /api/v1/register - Register with AI API key</div>
          <div><span className="text-green-600">GET</span> /api/v1/mailbox - List mailboxes</div>
          <div><span className="text-blue-600">POST</span> /api/v1/mailbox - Create mailbox</div>
          <div><span className="text-green-600">GET</span> /api/v1/mailbox/:id/messages - List messages</div>
          <div><span className="text-green-600">GET</span> /api/v1/mailbox/:id/messages/:msgId - Get message</div>
          <div><span className="text-red-600">DELETE</span> /api/v1/mailbox/:id/messages/:msgId - Delete message</div>
        </div>
      </section>
    </main>
  );
}
