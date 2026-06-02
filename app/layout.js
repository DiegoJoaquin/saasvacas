import "./globals.css";
import { FarmProvider } from "../context/FarmContext";
import Sidebar from "../components/Sidebar";

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
        <FarmProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </FarmProvider>
      </body>
    </html>
  );
}
