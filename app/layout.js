import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Travellow - AI-Powered Smart Tour Guide & Travel Booking",
  description: "Discover curated destinations, book luxury stays, connect with verified local tour guides, and build smart trip itineraries powered by Google Gemini.",
  keywords: ["travel", "AI travel guide", "tour guide", "hotel booking", "Kerala", "Bali", "Japan", "Switzerland"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="flex flex-col min-h-screen bg-background text-primaryText antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
