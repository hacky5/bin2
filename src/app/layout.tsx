import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backend API',
  description: 'Backend-only service.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
