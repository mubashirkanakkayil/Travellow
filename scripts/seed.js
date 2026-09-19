import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Destination from "../models/Destination.js";
import Hotel from "../models/Hotel.js";
import Guide from "../models/Guide.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import AIChat from "../models/AIChat.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not set in environment.");
  process.exit(1);
}

const seedDestinations = [
  // INDIA
  {
    name: "Kerala Backwaters & Hills",
    country: "India",
    region: "INDIA",
    slug: "kerala",
    shortDescription: "Serene houseboat cruises along palm-fringed backwaters, Munnar tea gardens, and spice plantations.",
    description: "Kerala, known as God's Own Country, offers a pristine blend of emerald backwaters, mist-laden tea hills in Munnar, heritage Ayurvedic sanctuaries, and palm-fringed Arabian Sea beaches.",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.9,
    reviewCount: 154,
    startingPrice: 35000,
    currency: "INR",
    bestTimeToVisit: "September to March",
    activities: ["Houseboat Cruise", "Tea Plantation Tour", "Kathakali Performance", "Ayurvedic Spa"],
    highlights: ["Alleppey Backwaters", "Munnar Hills", "Periyar Wildlife", "Kochi Fort"],
    latitude: 9.4981,
    longitude: 76.3388,
    featured: true,
  },
  {
    name: "Goa Coastline & Heritage",
    country: "India",
    region: "INDIA",
    slug: "goa",
    shortDescription: "Sun-kissed golden beaches, Portuguese heritage architecture, and vibrant coastal culture.",
    description: "Goa is India's coastal paradise featuring golden sandy shores, Portuguese colonial basilicas, spice farms, water sports, and bustling night flea markets.",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.7,
    reviewCount: 210,
    startingPrice: 28000,
    currency: "INR",
    bestTimeToVisit: "November to February",
    activities: ["Scuba Diving", "Heritage Walk", "Sunset Cruise", "Beach Volleyball"],
    highlights: ["Baga Beach", "Basilica of Bom Jesus", "Dudhsagar Falls", "Panaji Latin Quarter"],
    latitude: 15.2993,
    longitude: 74.124,
    featured: true,
  },
  {
    name: "Rajasthan Forts & Palaces",
    country: "India",
    region: "INDIA",
    slug: "rajasthan",
    shortDescription: "Royal Rajput palaces, Thar desert safaris, and grand lake fortresses in Jaipur & Udaipur.",
    description: "Step into royal India with Rajasthan's formidable hilltop forts, romantic marble lake palaces, vibrant artisan bazaars, and Thar desert camel safaris.",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.8,
    reviewCount: 188,
    startingPrice: 42000,
    currency: "INR",
    bestTimeToVisit: "October to March",
    activities: ["Camel Safari", "Palace Tour", "Bazaar Shopping", "Folk Music Night"],
    highlights: ["Amer Fort Jaipur", "City Palace Udaipur", "Jaisalmer Fort", "Pushkar Lake"],
    latitude: 26.9124,
    longitude: 75.7873,
    featured: true,
  },
  {
    name: "Kashmir Valley & Gulmarg",
    country: "India",
    region: "INDIA",
    slug: "kashmir",
    shortDescription: "Dal lake shikara rides, snow peaks in Gulmarg, and alpine flower valleys.",
    description: "Known as Paradise on Earth, Kashmir captivates visitors with wooden houseboats on Dal Lake, snow-clad slopes in Gulmarg, and fragrant saffron fields.",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.95,
    reviewCount: 172,
    startingPrice: 49000,
    currency: "INR",
    bestTimeToVisit: "March to October",
    activities: ["Shikara Ride", "Gondola Skiing", "Tulip Garden Walk", "Trekking"],
    highlights: ["Dal Lake Srinagar", "Gulmarg Gondola", "Pahalgam Valley", "Sonamarg"],
    latitude: 34.0837,
    longitude: 74.7973,
    featured: true,
  },
  {
    name: "Tamil Nadu Temples & Coast",
    country: "India",
    region: "INDIA",
    slug: "tamil-nadu",
    shortDescription: "Dravidian temple architecture, shore monuments in Mahabalipuram, and French heritage.",
    description: "Immerse yourself in centuries of living culture with grand Dravidian gopuram temples in Madurai, UNESCO shore temples, and French colonial Pondicherry.",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.75,
    reviewCount: 128,
    startingPrice: 32000,
    currency: "INR",
    bestTimeToVisit: "October to March",
    activities: ["Temple Architecture Tour", "Heritage Walk", "Silk Saree Shopping", "Beach Stroll"],
    highlights: ["Meenakshi Temple", "Shore Temple", "Brihadisvara Temple", "Pondicherry Promenade"],
    latitude: 13.0827,
    longitude: 80.2707,
    featured: false,
  },

  // ASIA
  {
    name: "Kyoto & Tokyo Heritage",
    country: "Japan",
    region: "ASIA",
    slug: "japan",
    shortDescription: "Futuristic neon metropolises blended with ancient Shinto shrines, cherry blossoms, and teahouses.",
    description: "Japan seamlessly connects ancient tradition with cutting-edge technology. Experience Kyoto's quiet bamboo groves, historic geisha districts, and Tokyo's vibrant pop culture.",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.95,
    reviewCount: 420,
    startingPrice: 89000,
    currency: "INR",
    bestTimeToVisit: "March to May, September to November",
    activities: ["Tea Ceremony", "Shinkansen Bullet Train", "Cherry Blossom Viewing", "Onsen Bath"],
    highlights: ["Fushimi Inari Shrine", "Mount Fuji", "Shibuya Crossing", "Arashiyama Bamboo Grove"],
    latitude: 35.0116,
    longitude: 135.7681,
    featured: true,
  },
  {
    name: "Phuket & Bangkok Islands",
    country: "Thailand",
    region: "ASIA",
    slug: "thailand",
    shortDescription: "Emerald limestone karst islands, floating markets, golden shrines, and world-famous street food.",
    description: "Thailand invites travelers with warm hospitality, golden Buddhist shrines, lush island archipelagos in Phuket & Phi Phi, and vibrant night bazaars.",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.8,
    reviewCount: 295,
    startingPrice: 39000,
    currency: "INR",
    bestTimeToVisit: "November to April",
    activities: ["Island Hopping", "Thai Cooking Class", "Floating Market Tour", "Elephant Sanctuary Visit"],
    highlights: ["Phi Phi Islands", "Grand Palace Bangkok", "Railay Beach", "Chiang Mai Old City"],
    latitude: 7.8804,
    longitude: 98.3923,
    featured: true,
  },
  {
    name: "Ubud & Kuta Beaches",
    country: "Indonesia",
    region: "ASIA",
    slug: "bali",
    shortDescription: "Terraced rice fields, sacred cliffside water temples, volcano hikes, and wellness retreats.",
    description: "Bali, the Island of the Gods, is renowned for its spiritual sanctuary in Ubud, iconic cliffside temples like Tanah Lot, black sand beaches, and thriving surf culture.",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.9,
    reviewCount: 310,
    startingPrice: 52000,
    currency: "INR",
    bestTimeToVisit: "April to October",
    activities: ["Surfing", "Rice Terrace Trekking", "Yoga Retreat", "Waterfall Hike"],
    highlights: ["Tegallalang Rice Terraces", "Uluwatu Temple", "Sacred Monkey Forest", "Nusa Penida"],
    latitude: -8.5069,
    longitude: 115.2625,
    featured: true,
  },
  {
    name: "Singapore Garden City",
    country: "Singapore",
    region: "ASIA",
    slug: "singapore",
    shortDescription: "Gardens by the Bay, futuristic skyline, Sentosa Island beaches, and hawker culinary culture.",
    description: "Singapore is a global metropolis featuring supertree groves, futuristic glass domes, luxury waterfront dining, and rich multicultural neighborhoods.",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.85,
    reviewCount: 230,
    startingPrice: 65000,
    currency: "INR",
    bestTimeToVisit: "Year round",
    activities: ["Night Safari", "Cable Car Ride", "Hawker Food Trail", "Marina Bay Sands SkyPark"],
    highlights: ["Gardens by the Bay", "Marina Bay Sands", "Sentosa Island", "Jewel Changi"],
    latitude: 1.3521,
    longitude: 103.8198,
    featured: false,
  },
  {
    name: "Dubai & Abu Dhabi Oasis",
    country: "UAE",
    region: "ASIA",
    slug: "uae",
    shortDescription: "Iconic skyscrapers, desert dune bashing, grand marble mosques, and luxury shopping.",
    description: "The United Arab Emirates showcases architectural wonders like the Burj Khalifa, Sheikh Zayed Grand Mosque, golden desert safaris, and luxury resort oases.",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.8,
    reviewCount: 340,
    startingPrice: 75000,
    currency: "INR",
    bestTimeToVisit: "November to March",
    activities: ["Desert Safari", "Burj Khalifa Observation Deck", "Dhow Dinner Cruise", "Louvre Abu Dhabi Visit"],
    highlights: ["Burj Khalifa", "Sheikh Zayed Mosque", "Palm Jumeirah", "Dubai Mall"],
    latitude: 25.2048,
    longitude: 55.2708,
    featured: false,
  },

  // EUROPE
  {
    name: "Swiss Alps & Interlaken",
    country: "Switzerland",
    region: "EUROPE",
    slug: "switzerland",
    shortDescription: "Snow-capped Alpine peaks, pristine glacial lakes, panoramic mountain trains, and wooden chalets.",
    description: "Switzerland boasts spectacular mountain landscapes, crystal-clear glacial lakes in Lucerne & Interlaken, scenic railways like the Glacier Express, and Alpine villages.",
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.95,
    reviewCount: 260,
    startingPrice: 115000,
    currency: "INR",
    bestTimeToVisit: "June to September, December to March",
    activities: ["Alpine Skiing", "Scenic Train Journey", "Lake Cruise", "Swiss Chocolate Tasting"],
    highlights: ["Jungfraujoch Top of Europe", "Matterhorn Zermatt", "Lake Lucerne", "Interlaken"],
    latitude: 46.6863,
    longitude: 7.8632,
    featured: true,
  },
  {
    name: "Amalfi Coast & Rome",
    country: "Italy",
    region: "EUROPE",
    slug: "italy",
    shortDescription: "Ancient Roman Colosseum, cliffside Mediterranean villages, olive groves, and culinary delights.",
    description: "Italy is an open-air museum filled with ancient Roman ruins, Renaissance masterpieces in Florence, romantic Venetian canals, and dramatic lemon-scented Amalfi cliffs.",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.9,
    reviewCount: 390,
    startingPrice: 98000,
    currency: "INR",
    bestTimeToVisit: "April to June, September to October",
    activities: ["Colosseum Tour", "Gondola Ride", "Pasta Making Class", "Wine Tasting in Tuscany"],
    highlights: ["Rome Colosseum", "Amalfi Coast Positano", "Venice Canals", "Florence Duomo"],
    latitude: 41.9028,
    longitude: 12.4964,
    featured: true,
  },
  {
    name: "Paris & French Riviera",
    country: "France",
    region: "EUROPE",
    slug: "france",
    shortDescription: "Eiffel Tower romance, Louvre art collections, lavender fields of Provence, and Mediterranean coast.",
    description: "France enchants with iconic Parisian landmarks, world-class gastronomy, famous art museums, rolling vineyards in Bordeaux, and blue waters of the Côte d'Azur.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.85,
    reviewCount: 450,
    startingPrice: 105000,
    currency: "INR",
    bestTimeToVisit: "April to May, September to November",
    activities: ["Seine River Cruise", "Louvre Museum Tour", "Wine Tasting", "Palace of Versailles Visit"],
    highlights: ["Eiffel Tower", "Louvre Museum", "Nice Promenade", "Mont Saint-Michel"],
    latitude: 48.8566,
    longitude: 2.3522,
    featured: false,
  },
  {
    name: "Santorini & Athens",
    country: "Greece",
    region: "EUROPE",
    slug: "greece",
    shortDescription: "Whitewashed Aegean cliff villages, cobalt sea views, ancient Acropolis, and Mediterranean dining.",
    description: "Greece dazzles with bright whitewashed island houses overlooking volcanic Aegean calderas in Santorini, ancient mythology ruins in Athens, and sun-kissed beaches.",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80",
    ],
    rating: 4.9,
    reviewCount: 380,
    startingPrice: 92000,
    currency: "INR",
    bestTimeToVisit: "May to October",
    activities: ["Acropolis Walking Tour", "Catamaran Sunset Cruise", "Greek Wine Tasting", "Island Hopping"],
    highlights: ["Oia Santorini", "Acropolis of Athens", "Mykonos Windmills", "Delphi Ruins"],
    latitude: 36.3932,
    longitude: 25.4615,
    featured: true,
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    // Clear existing data safely
    console.log("Clearing existing database collections...");
    await User.deleteMany({});
    await Destination.deleteMany({});
    await Hotel.deleteMany({});
    await Guide.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await AIChat.deleteMany({});

    // 1. Create Demo Users
    console.log("Seeding demo users...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const adminUser = await User.create({
      name: "Travellow Admin",
      email: "admin@travellow.ai",
      password: hashedPassword,
      phone: "+91 9876543210",
      role: "ADMIN",
      country: "India",
      preferredCurrency: "INR",
    });

    const demoUser = await User.create({
      name: "Anney Tester",
      email: "anney@example.com",
      password: hashedPassword,
      phone: "+91 9123456789",
      role: "USER",
      country: "India",
      preferredCurrency: "INR",
    });

    // 2. Create Destinations
    console.log("Seeding destinations...");
    const createdDestinations = await Destination.insertMany(seedDestinations);

    // Create a slug -> destination ID mapping
    const destMap = {};
    createdDestinations.forEach((dest) => {
      destMap[dest.slug] = dest;
    });

    // 3. Create Hotels (at least 10 records)
    console.log("Seeding hotels...");
    const seedHotels = [
      {
        name: "Kumarakom Lake Resort & Villas",
        destination: destMap["kerala"]._id,
        country: "India",
        description: "Heritage luxury retreat set beside Vembanad Lake featuring traditional Kerala architecture, meandering pools, and private houseboat charters.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewCount: 112,
        pricePerNight: 18000,
        currency: "INR",
        amenities: ["Wifi", "Breakfast", "Pool", "Spa", "Houseboat"],
        address: "Vembanad Lake, Kumarakom, Kerala",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Taj Fort Aguada Resort & Spa",
        destination: destMap["goa"]._id,
        country: "India",
        description: "Historic 5-star beachfront resort overlooking the Arabian Sea built into the ramparts of a 17th-century Portuguese fortress.",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewCount: 165,
        pricePerNight: 24000,
        currency: "INR",
        amenities: ["Wifi", "Beachfront", "Pool", "Spa", "Bar"],
        address: "Sinquerim Beach, Candolim, Goa",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Taj Lake Palace Udaipur",
        destination: destMap["rajasthan"]._id,
        country: "India",
        description: "Floating white marble palace floating in Lake Pichola, offering opulent royal suites, butler service, and panoramic mountain views.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        rating: 4.95,
        reviewCount: 210,
        pricePerNight: 35000,
        currency: "INR",
        amenities: ["Wifi", "Heritage Palace", "Lake View", "Butler Service"],
        address: "Lake Pichola, Udaipur, Rajasthan",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Khyber Himalayan Resort & Spa",
        destination: destMap["kashmir"]._id,
        country: "India",
        description: "Luxury alpine resort in Gulmarg situated amidst pine forests with mountain views and heated indoor glass pools.",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewCount: 140,
        pricePerNight: 28000,
        currency: "INR",
        amenities: ["Wifi", "Heated Pool", "Ski Access", "Spa"],
        address: "Gulmarg Ski Resort, Kashmir",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Maya Ubud Resort & Spa",
        destination: destMap["bali"]._id,
        country: "Indonesia",
        description: "Secluded riverside sanctuary surrounded by lush tropical valley gardens, infinity pools, and holistic yoga pavilions.",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        rating: 4.8,
        reviewCount: 145,
        pricePerNight: 22000,
        currency: "INR",
        amenities: ["Wifi", "Infinity Pool", "Yoga", "Breakfast", "Spa"],
        address: "Jl. Gunung Sari, Peliatan, Ubud, Bali",
        featured: true,
        aiEligible: true,
      },
      {
        name: "The Ritz-Carlton Kyoto",
        destination: destMap["japan"]._id,
        country: "Japan",
        description: "Luxury hotel situated along the banks of the Kamogawa river, blending traditional Japanese zen aesthetics with modern luxury.",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        rating: 4.95,
        reviewCount: 98,
        pricePerNight: 38000,
        currency: "INR",
        amenities: ["Wifi", "Onsen", "Fine Dining", "Concierge", "River View"],
        address: "Kamogawa Riverfront, Nakagyo Ward, Kyoto",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Grand Hyatt Erawan Bangkok",
        destination: destMap["thailand"]._id,
        country: "Thailand",
        description: "Boutique 5-star hotel located near the Erawan Shrine, featuring rooftop pools, spa bungalows, and fine dining.",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
        rating: 4.75,
        reviewCount: 165,
        pricePerNight: 15000,
        currency: "INR",
        amenities: ["Wifi", "Rooftop Pool", "Spa", "Breakfast", "Gym"],
        address: "494 Rajdamri Road, Bangkok",
        featured: false,
        aiEligible: true,
      },
      {
        name: "Marina Bay Sands Hotel",
        destination: destMap["singapore"]._id,
        country: "Singapore",
        description: "World-famous hotel featuring the world's largest rooftop Infinity Pool, casino, observation deck, and luxury shopping.",
        image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewCount: 340,
        pricePerNight: 42000,
        currency: "INR",
        amenities: ["Wifi", "Rooftop Infinity Pool", "SkyPark", "Casino", "Fine Dining"],
        address: "10 Bayfront Avenue, Singapore",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Canaves Oia Luxury Suites",
        destination: destMap["greece"]._id,
        country: "Greece",
        description: "Carved into the dramatic cliffs of Oia overlooking the Aegean sea, offering private plunge pools and whitewashed luxury.",
        image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
        rating: 4.9,
        reviewCount: 176,
        pricePerNight: 45000,
        currency: "INR",
        amenities: ["Wifi", "Caldera View", "Private Pool", "Breakfast"],
        address: "Main Street, Oia, Santorini",
        featured: true,
        aiEligible: true,
      },
      {
        name: "Badrutt's Palace Hotel",
        destination: destMap["switzerland"]._id,
        country: "Switzerland",
        description: "Historic Alpine palace hotel in St. Moritz featuring lake views, ski butler service, and indoor wellness spas.",
        image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80",
        rating: 4.95,
        reviewCount: 120,
        pricePerNight: 55000,
        currency: "INR",
        amenities: ["Wifi", "Ski Access", "Lake View", "Spa", "Fine Dining"],
        address: "Via Serlas 27, St. Moritz, Switzerland",
        featured: true,
        aiEligible: true,
      },
    ];

    const createdHotels = await Hotel.insertMany(seedHotels);

    // 4. Create Guides (at least 8 records)
    console.log("Seeding local guides...");
    const seedGuides = [
      {
        name: "Rajesh Kumar",
        destination: destMap["kerala"]._id,
        country: "India",
        bio: "Certified local historian and backwater guide with 10+ years showing guests authentic Kerala food, temples, and spice villages.",
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Hindi", "Malayalam"],
        specialties: ["Spice Tours", "Houseboat Trips", "Cochin History"],
        rating: 4.95,
        reviewCount: 68,
        hourlyRate: 1500,
        currency: "INR",
        verified: true,
        experienceYears: 10,
      },
      {
        name: "Vikram Rathore",
        destination: destMap["rajasthan"]._id,
        country: "India",
        bio: "Heritage storyteller from Jaipur specializing in Rajput royal fort architecture, desert astronomy, and artisan bazaars.",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Hindi", "Rajasthani"],
        specialties: ["Fort Architecture", "Camel Safaris", "Artisan Bazaars"],
        rating: 4.9,
        reviewCount: 54,
        hourlyRate: 1800,
        currency: "INR",
        verified: true,
        experienceYears: 8,
      },
      {
        name: "Tenzin Norbu",
        destination: destMap["kashmir"]._id,
        country: "India",
        bio: "Alpine mountain guide and Shikara expert born in Srinagar with deep knowledge of Himalayan flower valleys and crafts.",
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Hindi", "Kashmiri"],
        specialties: ["Valley Trekking", "Shikara Photography", "Craft Tours"],
        rating: 4.95,
        reviewCount: 42,
        hourlyRate: 1600,
        currency: "INR",
        verified: true,
        experienceYears: 7,
      },
      {
        name: "Wayan Suardana",
        destination: destMap["bali"]._id,
        country: "Indonesia",
        bio: "Native Balinese guide passionate about hidden jungle waterfalls, sacred dance ceremonies, and temple rituals in Ubud.",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Balinese", "Indonesian"],
        specialties: ["Waterfall Hikes", "Temple Rituals", "Photography"],
        rating: 4.9,
        reviewCount: 52,
        hourlyRate: 2000,
        currency: "INR",
        verified: true,
        experienceYears: 6,
      },
      {
        name: "Kenji Takahashi",
        destination: destMap["japan"]._id,
        country: "Japan",
        bio: "Kyoto native specializing in secret zen gardens, authentic matcha tea ceremonies, and samurai district history.",
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Japanese"],
        specialties: ["Tea Ceremony", "Zen Gardens", "Food Tasting"],
        rating: 5.0,
        reviewCount: 84,
        hourlyRate: 2500,
        currency: "INR",
        verified: true,
        experienceYears: 9,
      },
      {
        name: "Somchai Prasert",
        destination: destMap["thailand"]._id,
        country: "Thailand",
        bio: "Bangkok street food connoisseur and boat guide showing travelers secret canal villages and floating markets.",
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Thai"],
        specialties: ["Street Food Trails", "Floating Markets", "Temple Tours"],
        rating: 4.85,
        reviewCount: 61,
        hourlyRate: 1600,
        currency: "INR",
        verified: true,
        experienceYears: 5,
      },
      {
        name: "Elena Vasquez",
        destination: destMap["greece"]._id,
        country: "Greece",
        bio: "Licensed archaeologist guiding travelers through the Acropolis, Greek mythology stories, and Santorini wine tastings.",
        profileImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "Greek", "French"],
        specialties: ["Archaeology", "Mythology", "Wine Tours"],
        rating: 4.88,
        reviewCount: 45,
        hourlyRate: 2200,
        currency: "INR",
        verified: true,
        experienceYears: 7,
      },
      {
        name: "Marc Obermann",
        destination: destMap["switzerland"]._id,
        country: "Switzerland",
        bio: "Swiss Alpine mountain leader leading glacier walks, village heritage tours, and scenic photography treks.",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        languages: ["English", "German", "French"],
        specialties: ["Glacier Hikes", "Alpine Photography", "Scenic Rail"],
        rating: 4.95,
        reviewCount: 39,
        hourlyRate: 2800,
        currency: "INR",
        verified: true,
        experienceYears: 12,
      },
    ];

    const createdGuides = await Guide.insertMany(seedGuides);

    console.log("\n==========================================");
    console.log("TRAVELLOW SEED SUCCESSFUL!");
    console.log("==========================================");
    console.log(`Users Created: ${adminUser ? 2 : 0}`);
    console.log(`Destinations Created: ${createdDestinations.length}`);
    console.log(`Hotels Created: ${createdHotels.length}`);
    console.log(`Guides Created: ${createdGuides.length}`);
    console.log("==========================================\n");

    await mongoose.disconnect();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Seed script failed:", error);
    process.exit(1);
  }
}

seed();
