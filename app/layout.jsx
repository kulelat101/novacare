import './globals.css';
import AuthWrap from '@/components/AuthWrap';

export const metadata = {
  title: 'NovaCare',
  description: 'BSN210 Nursing Informatics Hospital Information System demo',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AuthWrap>{children}</AuthWrap></body>
    </html>
  );
}
