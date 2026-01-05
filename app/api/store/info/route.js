import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get store info for the logged-in seller
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
        }

        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                name: true,
                description: true,
                username: true,
                email: true,
                contact: true,
                address: true,
                logo: true,
                bankAccount: true,
                bankIfsc: true,
                bankName: true,
                bankUpi: true
            }
        })

        return NextResponse.json({ store })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}

// Update store info
export async function PUT(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, description, email, contact, address, bankAccount, bankIfsc, bankName, bankUpi } = body

        // Validate required fields
        if (!name || !description || !email || !contact || !address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!bankAccount || !bankIfsc || !bankName) {
            return NextResponse.json({ error: 'Bank details are required' }, { status: 400 })
        }

        const updatedStore = await prisma.store.update({
            where: { id: storeId },
            data: {
                name,
                description,
                email,
                contact,
                address,
                bankAccount,
                bankIfsc,
                bankName,
                bankUpi: bankUpi || null
            }
        })

        return NextResponse.json({ message: 'Store updated successfully', store: updatedStore })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
