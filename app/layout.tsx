// app/layout.tsx
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Dofus Quetes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
