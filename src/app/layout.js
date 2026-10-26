import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Auth Portal",
  description: "Simple authentication dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Header />
      <body>{children}</body>
    </html>
  );
}