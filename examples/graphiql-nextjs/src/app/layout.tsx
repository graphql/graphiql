import type { FC, ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  description: 'Example of using GraphiQL with the Next.js App Router',
  // Empty object adds open graph and twitter meta-tags
  openGraph: {},
};

const RootLayout: FC<Readonly<{ children: ReactNode }>> = ({ children }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
