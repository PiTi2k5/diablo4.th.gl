import { Inter } from "next/font/google";
import "./globals.css";
import { isOverwolf } from "./lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Diablo 4 Companion",
  description: "Generated by create next app",
};

function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

function OverwolfLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

export default isOverwolf ? OverwolfLayout : WebLayout;
