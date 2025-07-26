import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HotelTasker - Hotel Task Management",
  description: "Efficiently manage hotel service requests and task assignments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          {children}
          {/* Stagewise toolbar container for client-side rendering */}
          <div id="stagewise-toolbar-container" />
        </AuthProvider>
      </body>
    </html>
  );
}
