
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Inter } from 'next/font/google';
import "../i18n";

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: "Agronomist Webapp",
  description: "Professional agriculture management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" >
      <body    
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
