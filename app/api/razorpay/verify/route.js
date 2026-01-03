import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
    try {
        // Get auth - try multiple methods
        const auth = getAuth(request);
        const userId = auth?.userId;
        
        console.log('Verify API - Auth check:', { userId: userId ? 'present' : 'missing' });
        
        if (!userId) {
            // Try to get user from the orders themselves as fallback
            console.log('No userId from auth, will verify from order data');
        }

        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderIds
        } = body;
        
        console.log('Verify API - Request data:', { 
            razorpay_order_id, 
            razorpay_payment_id: razorpay_payment_id ? 'present' : 'missing',
            orderIds 
        });

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderIds) {
            console.log('Missing fields:', { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderIds });
            return NextResponse.json({ error: "Missing payment verification details" }, { status: 400 });
        }

        // Verify signature
        const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(signatureBody.toString())
            .digest("hex");

        const isValid = expectedSignature === razorpay_signature;
        console.log('Signature verification:', { isValid });

        if (!isValid) {
            // Payment verification failed - delete orders
            await Promise.all(orderIds.map(orderId =>
                prisma.order.delete({ where: { id: orderId } }).catch(() => {})
            ));
            return NextResponse.json({ error: "Payment verification failed - invalid signature" }, { status: 400 });
        }

        // Payment verified - mark orders as paid
        await Promise.all(orderIds.map(orderId =>
            prisma.order.update({
                where: { id: orderId },
                data: {
                    isPaid: true,
                    razorpayPaymentId: razorpay_payment_id
                }
            })
        ));

        // Get userId from the first order if not available from auth
        let userIdToUpdate = userId;
        if (!userIdToUpdate && orderIds.length > 0) {
            const firstOrder = await prisma.order.findUnique({
                where: { id: orderIds[0] },
                select: { userId: true }
            });
            userIdToUpdate = firstOrder?.userId;
        }

        // Clear user's cart
        if (userIdToUpdate) {
            await prisma.user.update({
                where: { id: userIdToUpdate },
                data: { cart: {} }
            });
        }

        console.log('Payment verified successfully for orders:', orderIds);

        return NextResponse.json({
            success: true,
            message: "Payment verified successfully",
            orderIds
        });

    } catch (error) {
        console.error('Razorpay verify error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
