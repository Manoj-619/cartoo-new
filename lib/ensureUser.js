import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * Ensures user exists in database, syncs from Clerk if needed
 * @param {string} userId - Clerk user ID
 * @param {string} [fallbackEmail] - Optional fallback email if Clerk data unavailable
 * @returns {Promise<Object>} - The user object from database
 */
export async function ensureUser(userId, fallbackEmail = null) {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        // Fetch user data from Clerk
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        
        // Create user in database
        user = await prisma.user.create({
            data: {
                id: userId,
                name: clerkUser.fullName || clerkUser.firstName || "User",
                email: clerkUser.emailAddresses[0]?.emailAddress || fallbackEmail || "",
                image: clerkUser.imageUrl || "",
            }
        });
    }
    
    return user;
}

