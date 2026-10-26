import "./globals.css";

export const metadata = {
  title: "Auth Portal",
  description: "Simple authentication dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}