export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">nukopt.com</h1>
      <p className="text-xl text-gray-600 mb-8">
        Disposable Email for AI Agents — No OAuth, No Human Signup
      </p>
      
      <section className="mb-8 bg-blue-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🔑 API Key Passport</h2>
        <p className="text-gray-700">
          If you run agents or automation, you already have API keys (GitHub, Discord, OpenAI, Stripe, etc.). 
          Use any of them to register. Zero additional human intervention.
        </p>
      </section>
      
      <section className="mb-8 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">🐛 Found a Bug? Need a Feature?</h2>
        <p className="text-gray-700 mb-2">
          We have a <strong>built-in feedback API</strong> — no email, no forms, just code:
        </p>
        <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST https://nukopt.com/api/v1/feedback \\
  -H "Authorization: Bearer nk-..." \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Your feedback here", "category": "bug"}'`}
        </pre>
        <p className="text-gray-600 text-sm mt-2">
          Categories: <code className="bg-gray-200 px-1 rounded">bug</code>, 
          <code className="bg-gray-200 px-1 rounded ml-1">feature</code>, 
          <code className="bg-gray-200 px-1 rounded ml-1">question</code>, 
          <code className="bg-gray-200 px-1 rounded ml-1">other</code> · 
          Max 500 chars · Check status via <code className="bg-gray-200 px-1 rounded">GET /api/v1/feedback</code>
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔑</div>
            <div className="font-semibold">1. Register</div>
            <div className="text-sm text-gray-500">Use your existing API key</div>
          </div>
          <div className="text-2xl text-gray-300 hidden md:block">→</div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">📬</div>
            <div className="font-semibold">2. Create Mailbox</div>
            <div className="text-sm text-gray-500">Get xyz@nukopt.com</div>
          </div>
          <div className="text-2xl text-gray-300 hidden md:block">→</div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">✉️</div>
            <div className="font-semibold">3. Receive Email</div>
            <div className="text-sm text-gray-500">Sign up for services</div>
          </div>
          <div className="text-2xl text-gray-300 hidden md:block">→</div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🔢</div>
            <div className="font-semibold">4. Get OTP</div>
            <div className="text-sm text-gray-500">Auto-extracted for you</div>
          </div>
        </div>
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
# Returns: {"id": "uuid", "email": "x7f2k9@nukopt.com"}

# 3. Check for emails (with auto-extracted OTPs!)
curl https://nukopt.com/api/v1/mailbox/{id}/messages \\
  -H "Authorization: Bearer nk-..."
# Returns: {"messages": [{"otp": "123456", ...}]}`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
        <div className="space-y-4">
          <details className="border rounded-lg">
            <summary className="p-3 cursor-pointer font-semibold bg-gray-50 rounded-t-lg">🐍 Python</summary>
            <pre className="bg-gray-900 text-green-400 p-4 text-sm overflow-x-auto rounded-b-lg">
{`import requests

API_KEY = "nk-..."
BASE = "https://nukopt.com/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Create mailbox
mailbox = requests.post(f"{BASE}/mailbox", headers=headers).json()
email = mailbox["email"]  # xyz@nukopt.com

# Poll for OTP
messages = requests.get(f"{BASE}/mailbox/{mailbox['id']}/messages", headers=headers).json()
if messages["messages"]:
    otp = messages["messages"][0]["otp"]  # Auto-extracted!`}
            </pre>
          </details>
          
          <details className="border rounded-lg">
            <summary className="p-3 cursor-pointer font-semibold bg-gray-50 rounded-t-lg">📦 Node.js</summary>
            <pre className="bg-gray-900 text-green-400 p-4 text-sm overflow-x-auto rounded-b-lg">
{`const API_KEY = "nk-...";
const BASE = "https://nukopt.com/api/v1";
const headers = { Authorization: \`Bearer \${API_KEY}\` };

// Create mailbox
const mailbox = await fetch(\`\${BASE}/mailbox\`, { 
  method: "POST", headers 
}).then(r => r.json());

// Poll for OTP
const { messages } = await fetch(
  \`\${BASE}/mailbox/\${mailbox.id}/messages\`, { headers }
).then(r => r.json());

const otp = messages[0]?.otp; // Auto-extracted!`}
            </pre>
          </details>
        </div>
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
            <h3 className="font-semibold mb-2">🔍 Smart OTP Extraction</h3>
            <p className="text-gray-600 text-sm">
              Auto-extracts verification codes in 15+ languages including 
              English, Chinese, Japanese, Korean, Arabic, Russian, and more.
            </p>
          </div>
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">🛡️ Anti-Abuse by Design</h3>
            <p className="text-gray-600 text-sm">
              API Key Passport means only real AI users can register. 
              No spam accounts.
            </p>
          </div>
          <div className="border rounded p-4 border-yellow-300 bg-yellow-50">
            <h3 className="font-semibold mb-2">💬 Agent-Native Feedback</h3>
            <p className="text-gray-600 text-sm">
              Report bugs or request features via API. No human forms, no email — 
              just <code className="text-xs bg-gray-200 px-1 rounded">POST /api/v1/feedback</code>.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mb-8 bg-green-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">✅ Works With Major Services</h2>
        <p className="text-gray-700">
          Tested and verified with Linear, Vercel, Railway, PlanetScale, and more. 
          Not on disposable email blocklists.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">API Reference</h2>
        <div className="space-y-2 font-mono text-sm">
          <p className="text-gray-500 text-xs mb-2">Authentication: Bearer nk-... header on all endpoints except register</p>
          <div className="flex gap-2">
            <span className="text-blue-600 w-20">POST</span>
            <span>/api/v1/register</span>
            <span className="text-gray-500">— Register with AI API key</span>
          </div>
          <div className="flex gap-2">
            <span className="text-blue-600 w-20">POST</span>
            <span>/api/v1/mailbox</span>
            <span className="text-gray-500">— Create mailbox (max 5)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-20">GET</span>
            <span>/api/v1/mailbox</span>
            <span className="text-gray-500">— List your mailboxes</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-20">GET</span>
            <span>/api/v1/mailbox/:id</span>
            <span className="text-gray-500">— Get mailbox details</span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 w-20">DELETE</span>
            <span>/api/v1/mailbox/:id</span>
            <span className="text-gray-500">— Delete mailbox</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-20">GET</span>
            <span>/api/v1/mailbox/:id/messages</span>
            <span className="text-gray-500">— List messages</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-20">GET</span>
            <span>/api/v1/mailbox/:id/messages/:mid</span>
            <span className="text-gray-500">— Get message + OTP</span>
          </div>
          <div className="flex gap-2">
            <span className="text-red-600 w-20">DELETE</span>
            <span>/api/v1/mailbox/:id/messages/:mid</span>
            <span className="text-gray-500">— Delete message</span>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <span className="text-blue-600 w-20">POST</span>
            <span>/api/v1/feedback</span>
            <span className="text-gray-500">— Submit feedback (500 char max)</span>
          </div>
          <div className="flex gap-2">
            <span className="text-green-600 w-20">GET</span>
            <span>/api/v1/feedback</span>
            <span className="text-gray-500">— List your tickets</span>
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Feedback API</h2>
        <p className="text-gray-600 mb-3">Something broken? Need a feature? Let us know:</p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
{`# Submit feedback
curl -X POST https://nukopt.com/api/v1/feedback \\
  -H "Authorization: Bearer nk-..." \\
  -H "Content-Type: application/json" \\
  -d '{"message": "OTP not extracted from XYZ service", "category": "bug"}'
# Categories: bug, feature, question, other

# Check your tickets
curl https://nukopt.com/api/v1/feedback \\
  -H "Authorization: Bearer nk-..."
# Returns: {"tickets": [{"id": "...", "status": "open", ...}]}`}
        </pre>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Message Response</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "id": "msg-uuid",
  "from_address": "noreply@example.com",
  "subject": "Your verification code",
  "otp": "123456",           // Auto-extracted!
  "verification_links": [     // Auto-extracted!
    "https://example.com/verify?token=abc"
  ],
  "created_at": "2024-01-29T12:00:00Z"
}`}
        </pre>
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
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🌍 International OTP Support</h2>
        <p className="text-gray-600 mb-3">
          Verification codes are extracted in 15+ languages:
        </p>
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">English</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">中文</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">日本語</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">한국어</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">العربية</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">Русский</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">Deutsch</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">Español</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">Français</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">Português</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-sm">+ more</span>
        </div>
      </section>
      
      <section className="mb-8 border rounded p-4 bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">Limits</h2>
        <ul className="text-gray-600 space-y-1">
          <li>• <strong>5 mailboxes</strong> per API key</li>
          <li>• <strong>100 emails/day</strong> per mailbox</li>
          <li>• <strong>7-day retention</strong> (auto-cleanup)</li>
          <li>• <strong>50KB</strong> text body limit</li>
        </ul>
      </section>
      
      <footer className="text-gray-500 text-sm border-t pt-4">
        <p>
          <a href="https://github.com/james-sib/nukopt" className="text-blue-600 hover:underline">
            GitHub
          </a>
          {" · "}
          <a href="/openapi.yaml" className="text-blue-600 hover:underline">
            OpenAPI Spec
          </a>
          {" · "}
          <a href="/api/v1/register" className="text-blue-600 hover:underline">
            API
          </a>
        </p>
        <p className="mt-1 text-xs">Built for the agentic era 🤖</p>
      </footer>
    </main>
  );
}
