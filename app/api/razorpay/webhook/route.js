import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error('Webhook signature verification failed');
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        const { event: eventType, payload } = event;

        switch (eventType) {
            case 'payment.captured': {
                const payment = payload.payment.entity;
                const razorpayOrderId = payment.order_id;
                const razorpayPaymentId = payment.id;

                // Find and update orders with this Razorpay order ID
                const orders = await prisma.order.findMany({
                    where: { razorpayOrderId }
                });

                if (orders.length > 0) {
                    await Promise.all(orders.map(order =>
                        prisma.order.update({
                            where: { id: order.id },
                            data: {
                                isPaid: true,
                                razorpayPaymentId
                            }
                        })
                    ));

                    // Clear user's cart
                    const userId = orders[0].userId;
                    await prisma.user.update({
                        where: { id: userId },
                        data: { cart: {} }
                    });

                    console.log(`Payment captured for orders: ${orders.map(o => o.id).join(', ')}`);
                }
                break;
            }

            case 'payment.failed': {
                const payment = payload.payment.entity;
                const razorpayOrderId = payment.order_id;

                // Find and delete unpaid orders with this Razorpay order ID
                const orders = await prisma.order.findMany({
                    where: { razorpayOrderId, isPaid: false }
                });

                if (orders.length > 0) {
                    await Promise.all(orders.map(order =>
                        prisma.order.delete({ where: { id: order.id } }).catch(() => {})
                    ));
                    console.log(`Payment failed, deleted orders: ${orders.map(o => o.id).join(', ')}`);
                }
                break;
            }

            case 'order.paid': {
                const order = payload.order.entity;
                const razorpayOrderId = order.id;

                // Backup check - mark as paid if not already
                await prisma.order.updateMany({
                    where: { razorpayOrderId, isPaid: false },
                    data: { isPaid: true }
                });
                break;
            }

            default:
                console.log('Unhandled webhook event:', eventType);
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Disable body parsing for webhook
export const config = {
    api: { bodyParser: false }
};
