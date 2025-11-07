// app/layout.tsx
import "./globals.css";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Dofus LFG",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
