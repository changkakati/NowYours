import "./globals.css";
import Header from "@/components/Header";
import { Suspense } from "react";

export const metadata = {
    title: "Auth Portal",
    description: "Simple authentication dashboard",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <Suspense fallback={<header className="h-[72px]" />}>
                    <Header />
                </Suspense>

                {children}
            </body>
        </html>
    );
}