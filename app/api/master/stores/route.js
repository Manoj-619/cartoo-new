import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
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

// Get all stores
export async function GET(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const stores = await prisma.store.findMany({
            include: {
                user: {
                    select: { name: true, email: true, image: true }
                },
                _count: {
                    select: { Product: true, Order: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ stores });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update store (enable/disable, edit details)
export async function PUT(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { storeId, name, description, isActive, status } = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: "Store ID required" }, { status: 400 });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (status !== undefined) updateData.status = status;

        const store = await prisma.store.update({
            where: { id: storeId },
            data: updateData
        });

        return NextResponse.json({ message: "Store updated successfully", store });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete store
export async function DELETE(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ error: "Store ID required" }, { status: 400 });
        }

        await prisma.store.delete({
            where: { id: storeId }
        });

        return NextResponse.json({ message: "Store deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
