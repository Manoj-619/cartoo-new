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

// Get orders for a specific store
export async function GET(request) {
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

        const orders = await prisma.order.findMany({
            where: { storeId },
            include: {
                orderItems: {
                    include: { product: true }
                },
                address: true,
                user: {
                    select: { name: true, email: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update order status
export async function PUT(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
        }

        // Validate status
        const validStatuses = ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { status }
        });

        return NextResponse.json({ message: "Order status updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
