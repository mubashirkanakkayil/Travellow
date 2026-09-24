import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Hero from "@/components/home/Hero";
import SearchBar from "@/components/home/SearchBar";
import PopularDestinations from "@/components/home/PopularDestinations";
import HotelsSection from "@/components/home/HotelsSection";
import GuidesSection from "@/components/home/GuidesSection";
import AIPlannerSection from "@/components/home/AIPlannerSection";
import HowItWorks from "@/components/home/HowItWorks";
import AIAssistantSection from "@/components/home/AIAssistantSection";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  // If logged in as ADMIN, redirect directly to Admin Panel
  if (user && user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-0 w-full overflow-hidden">
      {/* 1. Hero Section (Video Inspired Dynamic Carousel) */}
      <Hero />

      {/* 2. Search & Exploration Bar */}
      <SearchBar />

      {/* 3. Popular Destinations Grid */}
      <PopularDestinations />

      {/* 4. Hotels & Accommodation Section */}
      <HotelsSection />

      {/* 5. Local Vetted Tour Guides */}
      <GuidesSection />

      {/* 6. AI Trip Planner Showcase */}
      <AIPlannerSection />

      {/* 7. How It Works - 4 Step Process */}
      <HowItWorks />

      {/* 8. AI Travel Assistant Showcase */}
      <AIAssistantSection />
    </div>
  );
}
