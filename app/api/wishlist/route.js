import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensureUser";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get user's wishlist
export async function GET(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        rating: true,
                        store: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Filter out products from inactive stores
        const activeWishlist = wishlist.filter(item => item.product.store.isActive);

        return NextResponse.json({ 
            wishlist: activeWishlist,
            productIds: activeWishlist.map(item => item.productId)
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Add item to wishlist
export async function POST(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // Ensure user exists in database
        await ensureUser(userId);

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check if already in wishlist
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: { userId, productId }
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Product already in wishlist" }, { status: 400 });
        }

        // Add to wishlist
        const wishlistItem = await prisma.wishlist.create({
            data: { userId, productId }
        });

        return NextResponse.json({ message: "Added to wishlist", wishlistItem });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Remove item from wishlist
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // Check if item exists in wishlist
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: { userId, productId }
            }
        });

        if (!existing) {
            return NextResponse.json({ error: "Product not in wishlist" }, { status: 404 });
        }

        // Remove from wishlist
        await prisma.wishlist.delete({
            where: {
                userId_productId: { userId, productId }
            }
        });

        return NextResponse.json({ message: "Removed from wishlist" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
