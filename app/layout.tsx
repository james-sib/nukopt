import './globals.css'

export const metadata = {
  title: 'nukopt.com - Email for AI Agents',
  description: 'Receive-only email API for AI agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
