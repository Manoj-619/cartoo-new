import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { getMasterVendorEmails } from "@/middlewares/authMaster";
import { NextResponse } from "next/server";

// Helper to check if user is master vendor
async function checkMasterAuth(request) {
    const { userId } = getAuth(request);
    if (!userId) return false;
    
    const user = await currentUser();
    if (!user) return false;
    
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    return getMasterVendorEmails().includes(userEmail);
}

// Create a new vendor store (by master vendor)
export async function POST(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        
        const name = formData.get("name");
        const username = formData.get("username")?.trim()?.toLowerCase();
        const description = formData.get("description");
        const email = formData.get("email");
        const contact = formData.get("contact");
        const address = formData.get("address");
        const image = formData.get("image");
        const autoApprove = formData.get("autoApprove") === "true";
        const bankAccount = formData.get("bankAccount");
        const bankIfsc = formData.get("bankIfsc");
        const bankName = formData.get("bankName");
        const bankUpi = formData.get("bankUpi");

        if (!name || !username || !description || !email || !contact || !address) {
            return NextResponse.json({ error: "Missing store info" }, { status: 400 });
        }

        if (!bankAccount || !bankIfsc || !bankName) {
            return NextResponse.json({ error: "Bank details are required" }, { status: 400 });
        }

        // Check if username is already taken
        const isUsernameTaken = await prisma.store.findFirst({
            where: { username: username }
        });

        if (isUsernameTaken) {
            return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }

        // Check if a store already exists for this email
        const existingUserByEmail = await prisma.user.findFirst({
            where: { email: email },
            include: { store: true }
        });

        if (existingUserByEmail?.store) {
            return NextResponse.json({ error: "A store already exists for this email" }, { status: 400 });
        }

        // Image upload to imagekit (optional)
        let optimizedImage = null;
        if (image && image.size > 0) {
            const buffer = Buffer.from(await image.arrayBuffer());
            const response = await imagekit.upload({
                file: buffer,
                fileName: image.name,
                folder: "logos"
            });

            optimizedImage = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '512' }
                ]
            });
        }

        // If user exists, connect to them. Otherwise, create a placeholder user
        let userId;
        if (existingUserByEmail) {
            userId = existingUserByEmail.id;
        } else {
            // Create a placeholder user in the database
            // The actual Clerk user will be created when they sign up
            const placeholderUser = await prisma.user.create({
                data: {
                    id: `placeholder_${Date.now()}`,
                    name: name,
                    email: email,
                    image: optimizedImage || ""
                }
            });
            userId = placeholderUser.id;
        }

        // Create the store
        const newStore = await prisma.store.create({
            data: {
                name,
                description,
                username,
                email,
                contact,
                address,
                logo: optimizedImage,
                status: autoApprove ? "approved" : "pending",
                isActive: autoApprove,
                bankAccount,
                bankIfsc,
                bankName,
                bankUpi: bankUpi || null,
                user: { connect: { id: userId } }
            }
        });

        return NextResponse.json({ 
            message: autoApprove ? "Vendor created and approved" : "Vendor created (pending approval)",
            store: newStore
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get pending vendors count
export async function GET(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const pendingCount = await prisma.store.count({
            where: { status: "pending" }
        });

        const pendingStores = await prisma.store.findMany({
            where: { status: "pending" },
            include: {
                user: {
                    select: { name: true, email: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ pendingCount, pendingStores });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
