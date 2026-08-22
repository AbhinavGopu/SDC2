import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hyderabad Traffic Planner Dashboard',
  description: 'Planner dashboard scaffold for Hyderabad Traffic Planner AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
