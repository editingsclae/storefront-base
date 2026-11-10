import type { Metadata } from "next";
import "./globals.css";
import { STORE_NAME, getCategories } from "@/lib/medusa";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ClientProviders } from "@/components/ClientProviders";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${STORE_NAME}`,
  description: `Shop online at ${STORE_NAME}. Fast delivery across Tunisia. Pay on delivery.`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getCategories();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-zinc-900 antialiased">
        <ClientProviders>
          <Header categories={categories} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
