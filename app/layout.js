import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "SaaS LO - Control Reproductivo Bovino",
  description: "Estado reproductivo y alertas clave del rebaño en tiempo real",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
