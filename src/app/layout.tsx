import './globals.css'

export const metadata = {
  title: 'gitignore.in',
  description: '.gitignore generator for your project',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
