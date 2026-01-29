export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <a 
          href="/" 
          className="text-blue-600 hover:underline"
        >
          ← Back to nukopt.com
        </a>
      </div>
    </main>
  );
}
