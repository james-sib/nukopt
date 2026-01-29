export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">NukOpt</h1>
      <p className="text-xl text-gray-600 mb-8">
        AI API Proxy — One key for all your AI providers
      </p>
      
      <section className="mb-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">
          Register your OpenAI, Anthropic, or OpenRouter keys once. Get a unified <code className="bg-blue-100 px-1 rounded">nk-...</code> key that works everywhere. 
          Your original keys are encrypted and never exposed.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`# 1. Register your API key
curl -X POST https://nukopt.onrender.com/api/v1/register \\
  -H "Content-Type: application/json" \\
  -d '{"provider": "openrouter", "key": "sk-or-..."}'

# Response: {"api_key": "nk-abc123..."}

# 2. Make API calls (OpenAI-compatible)
curl -X POST https://nukopt.onrender.com/api/v1/chat/completions \\
  -H "Authorization: Bearer nk-abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# 3. Check your usage
curl https://nukopt.onrender.com/api/v1/usage \\
  -H "Authorization: Bearer nk-abc123..."`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Supported Providers</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-semibold">OpenAI</div>
            <div className="text-sm text-gray-500">GPT-4, GPT-4o</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-semibold">Anthropic</div>
            <div className="text-sm text-gray-500">Claude 3, Opus</div>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl mb-2">🌐</div>
            <div className="font-semibold">OpenRouter</div>
            <div className="text-sm text-gray-500">100+ models</div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Why NukOpt?</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>AI Agents</strong> — Give agents one key that works across all providers</li>
          <li><strong>Security</strong> — Your keys are encrypted, never exposed in logs or errors</li>
          <li><strong>Key Rotation</strong> — Rotate provider keys without updating clients</li>
          <li><strong>Usage Tracking</strong> — Monitor API usage across all your apps</li>
          <li><strong>Rate Limiting</strong> — Built-in protection (100 req/min per key)</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
        <div className="space-y-3 font-mono text-sm">
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-blue-600 font-bold">POST</span> <span className="text-gray-700">/api/v1/register</span>
            <span className="text-gray-500 ml-4">— Register provider key, get nk-... key</span>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-blue-600 font-bold">POST</span> <span className="text-gray-700">/api/v1/chat/completions</span>
            <span className="text-gray-500 ml-4">— Proxy to AI provider (OpenAI-compatible)</span>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <span className="text-green-600 font-bold">GET</span> <span className="text-gray-700">/api/v1/usage</span>
            <span className="text-gray-500 ml-4">— Get usage stats for your key</span>
          </div>
        </div>
      </section>

      <section className="text-center text-gray-500 text-sm">
        <p>
          <a href="https://github.com/james-sib/nukopt" className="text-blue-600 hover:underline">GitHub</a>
          {' · '}
          Built by <a href="https://sibscientific.com" className="text-blue-600 hover:underline">SIB Scientific</a>
        </p>
      </section>
    </main>
  );
}
