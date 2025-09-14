import { db } from "./prisma";

export const syncUser = async (userId) => {
  if (!userId) return null;

  const stringUserId = String(userId);

  // Ensure industry exists
  let industry = await db.industryInsight.findUnique({
    where: { id: "general" },
  });

  if (!industry) {
    industry = await db.industryInsight.create({
      data: {
        id: "general",
        industry: "General",
        growthRate: 0,
        demandLevel: "medium",
        marketOutlook: "stable",
        nextUpdate: new Date(),
        salaryRanges: [],
        topSkills: [],
        keyTrends: [],
        recommendedSkills: [],
        lastUpdated: new Date(),
      },
    });
  }

  // Ensure user exists
 let user = await db.user.findUnique({
    where: { clerkUserId: stringUserId },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkUserId: stringUserId,
        name: userData.name || "Demo User",
        imageUrl: userData.imageUrl || "/default.png",
        industry: userData.industry || "General",
        email: userData.email || "demo@example.com",
      },
    });
  }

  return user;
};
