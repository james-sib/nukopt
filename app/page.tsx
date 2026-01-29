export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">nukopt.com</h1>
      <p className="text-xl text-gray-600 mb-8">
        Email for AI Agents — No OAuth, No Human Signup
      </p>
      
      <section className="mb-8 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🔑 API Key Passport</h2>
        <p className="text-gray-700">
          If you run agents or automation, you already have API keys (GitHub, Discord, OpenAI, Stripe, etc.). 
          Use any of them to register. Zero additional human intervention.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`# 1. Register with your AI API key
curl -X POST https://nukopt.com/api/v1/register \\
  -H "Content-Type: application/json" \\
  -d '{"provider": "openai", "key": "sk-..."}'
# Returns: {"api_key": "nk-..."}

# 2. Create a mailbox
curl -X POST https://nukopt.com/api/v1/mailbox \\
  -H "Authorization: Bearer nk-..."
# Returns: {"email": "x7f2k9@nukopt.com"}

# 3. Check for emails (with auto-extracted OTPs!)
curl https://nukopt.com/api/v1/mailbox/{id}/messages \\
  -H "Authorization: Bearer nk-..."`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Why NukOpt?</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">🤖 Built for Agents</h3>
            <p className="text-gray-600 text-sm">
              No CAPTCHAs, no OAuth, no phone numbers. 
              Register with the API key your agent already has.
            </p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">📨 Receive-Only</h3>
            <p className="text-gray-600 text-sm">
              No sending = no spam risk. Just receive verification emails 
              and sign up for services.
            </p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">🔍 Auto OTP Extraction</h3>
            <p className="text-gray-600 text-sm">
              We parse verification codes and confirmation links automatically. 
              No regex needed.
            </p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">🛡️ Anti-Abuse by Design</h3>
            <p className="text-gray-600 text-sm">
              API Key Passport means only real AI users can register. 
              No spam accounts.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex gap-2">
            <span className="text-blue-600 w-16">POST</span>
            <span>/api/v1/register</span>
            <span className="text-gray-500">— Register with AI API key</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600 w-16">POST</span>
            <span>/api/v1/mailbox</span>
            <span className="text-gray-500">— Create mailbox</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-16">GET</span>
            <span>/api/v1/mailbox</span>
            <span className="text-gray-500">— List mailboxes</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-16">GET</span>
            <span>/api/v1/mailbox/:id/messages</span>
            <span className="text-gray-500">— List messages</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-16">GET</span>
            <span>/api/v1/mailbox/:id/messages/:mid</span>
            <span className="text-gray-500">— Get message + OTP</span>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Supported Providers (15)</h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-gray-500">AI APIs:</span>
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="px-3 py-1 bg-green-100 rounded text-sm">OpenAI</span>
              <span className="px-3 py-1 bg-green-100 rounded text-sm">Anthropic</span>
              <span className="px-3 py-1 bg-green-100 rounded text-sm">OpenRouter</span>
              <span className="px-3 py-1 bg-green-100 rounded text-sm">Hugging Face</span>
              <span className="px-3 py-1 bg-green-100 rounded text-sm">Replicate</span>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Dev Platforms:</span>
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="px-3 py-1 bg-blue-100 rounded text-sm">GitHub</span>
              <span className="px-3 py-1 bg-blue-100 rounded text-sm">GitLab</span>
              <span className="px-3 py-1 bg-blue-100 rounded text-sm">Vercel</span>
              <span className="px-3 py-1 bg-blue-100 rounded text-sm">Render</span>
              <span className="px-3 py-1 bg-blue-100 rounded text-sm">Supabase</span>
              <span className="px-3 py-1 bg-blue-100 rounded text-sm">Cloudflare</span>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Bot Platforms:</span>
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="px-3 py-1 bg-purple-100 rounded text-sm">Discord</span>
              <span className="px-3 py-1 bg-purple-100 rounded text-sm">Telegram</span>
              <span className="px-3 py-1 bg-purple-100 rounded text-sm">Slack</span>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500">Payment:</span>
            <div className="flex gap-2 flex-wrap mt-1">
              <span className="px-3 py-1 bg-yellow-100 rounded text-sm">Stripe</span>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="text-gray-500 text-sm border-t pt-4">
        <p>Free tier: 5 mailboxes, 100 emails/day, 7-day retention</p>
        <p className="mt-1">
          <a href="https://github.com/james-sib/nukopt" className="text-blue-600 hover:underline">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
