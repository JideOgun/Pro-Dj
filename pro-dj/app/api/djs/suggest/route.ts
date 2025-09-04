import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventDate,
      startTime,
      endTime,
      eventType,
      preferredGenres = [],
      musicStyle = "",
      eventVibe = "",
      priceRange = "",
      maxResults = 10,
    } = body;

    if (!eventDate || !startTime || !endTime) {
      return NextResponse.json(
        { ok: false, error: "Event date and times are required" },
        { status: 400 }
      );
    }

    // Parse the event times
    const eventStartTime = new Date(`${eventDate}T${startTime}`);
    const eventEndTime = new Date(`${eventDate}T${endTime}`);

    // Get all active, verified DJs
    const djUsers = await prisma.user.findMany({
      where: {
        role: "DJ",
        status: "ACTIVE",
      },
    });

    // Get their profiles and check availability
    const djsWithProfiles = await Promise.all(
      djUsers.map(async (user) => {
        const profile = await prisma.djProfile.findUnique({
          where: { userId: user.id },
        });

        if (
          !profile ||
          !profile.isApprovedByAdmin ||
          !profile.isAcceptingBookings
        ) {
          return null;
        }

        // Check if DJ has any conflicting bookings for this time slot
        const conflictingBookings = await prisma.booking.findMany({
          where: {
            djId: profile.id,
            eventDate: new Date(eventDate),
            status: {
              in: ["PENDING_ADMIN_REVIEW", "ADMIN_REVIEWING", "DJ_ASSIGNED", "CONFIRMED"],
            },
            OR: [
              {
                startTime: {
                  lt: eventEndTime,
                },
                endTime: {
                  gt: eventStartTime,
                },
              },
            ],
          },
        });

        if (conflictingBookings.length > 0) {
          return null; // DJ is not available
        }

        return {
          id: profile.id,
          stageName: profile.stageName,
          genres: profile.genres || [],
          customGenres: profile.customGenres || "",
          basePriceCents: profile.basePriceCents || 0,
          bio: profile.bio || "",
          location: user.location || profile.location || "Location not set",
          specialties: profile.specialties || "",
          equipment: profile.equipment || "",
          languages: profile.languages || [],
          availability: profile.availability || "",
          socialLinks: profile.socialLinks || {},
        };
      })
    );

    const availableDjs = djsWithProfiles.filter(Boolean);

    // Score and rank DJs based on preferences
    const scoredDjs = availableDjs.map((dj) => {
      let score = 0;

      // Genre matching (highest weight)
      if (preferredGenres.length > 0) {
        const genreMatches = dj.genres.filter((genre) =>
          preferredGenres.includes(genre)
        ).length;
        score += (genreMatches / preferredGenres.length) * 50; // Up to 50 points
      }

      // Price range matching
      if (priceRange) {
        const hourlyRate = dj.basePriceCents / 100;
        const inRange = (() => {
          switch (priceRange) {
            case "budget":
              return hourlyRate <= 100;
            case "mid":
              return hourlyRate > 100 && hourlyRate <= 200;
            case "premium":
              return hourlyRate > 200;
            default:
              return true;
          }
        })();
        if (inRange) score += 20;
      }

      // Music style matching (if specified)
      if (musicStyle && dj.specialties) {
        const styleKeywords = {
          "high-energy": ["energy", "upbeat", "dance", "party"],
          moderate: ["moderate", "mix", "variety"],
          chill: ["chill", "relaxed", "ambient", "background"],
          romantic: ["romantic", "intimate", "slow"],
          professional: ["professional", "corporate", "formal"],
        };

        const keywords =
          styleKeywords[musicStyle as keyof typeof styleKeywords] || [];
        const hasStyleMatch = keywords.some((keyword) =>
          dj.specialties.toLowerCase().includes(keyword)
        );
        if (hasStyleMatch) score += 15;
      }

      // Event vibe matching (if specified)
      if (eventVibe && dj.bio) {
        const vibeWords = eventVibe.toLowerCase().split(" ");
        const bioWords = dj.bio.toLowerCase().split(" ");
        const vibeMatches = vibeWords.filter((word) =>
          bioWords.includes(word)
        ).length;
        score += (vibeMatches / vibeWords.length) * 10; // Up to 10 points
      }

      // Base score for being available
      score += 5;

      return { ...dj, score };
    });

    // Sort by score (highest first) and limit results
    const suggestedDjs = scoredDjs
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return NextResponse.json(
      {
        ok: true,
        data: suggestedDjs,
        total: availableDjs.length,
        suggested: suggestedDjs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error suggesting DJs:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to suggest DJs" },
      { status: 500 }
    );
  }
}
