import razorpay from "@/configs/razorpay";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensureUser";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId, has } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { addressId, items, couponCode } = await request.json();

        // Validate required fields
        if (!addressId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Missing order details" }, { status: 400 });
        }

        // Ensure user exists in database
        await ensureUser(userId);

        // Check coupon if provided
        let coupon = null;
        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode }
            });
            if (!coupon) {
                return NextResponse.json({ error: "Coupon not found" }, { status: 400 });
            }

            // Check if coupon is for new users
            if (coupon.forNewUser) {
                const userOrders = await prisma.order.findMany({ where: { userId } });
                if (userOrders.length > 0) {
                    return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 400 });
                }
            }
        }

        const isPlusMember = has({ plan: 'plus' });

        // Check if coupon is for members only
        if (couponCode && coupon?.forMember && !isPlusMember) {
            return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 });
        }

        // Group items by store
        const ordersByStore = new Map();
        let grandSubtotal = 0;
        let grandGstAmount = 0;

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } });
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 });
            }

            const storeId = product.storeId;
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, []);
            }

            const basePrice = product.price * item.quantity;
            const gstPercent = product.gst || 0;
            const gstAmount = (basePrice * gstPercent) / 100;

            grandSubtotal += basePrice;
            grandGstAmount += gstAmount;

            ordersByStore.get(storeId).push({
                ...item,
                price: product.price,
                gstPercent,
                gstAmount,
                basePrice,
                itemTotal: basePrice + gstAmount
            });
        }

        // Calculate shipping (₹50 for non-Plus members, applied once)
        const shippingCharge = isPlusMember ? 0 : 50;

        // Calculate discount if coupon applied
        let discountAmount = 0;
        if (coupon) {
            discountAmount = (grandSubtotal * coupon.discount) / 100;
        }

        // Grand total
        const grandTotal = grandSubtotal + grandGstAmount + shippingCharge - discountAmount;

        // Create orders in database (one per store)
        const orderIds = [];
        let isFirstOrder = true;

        for (const [storeId, storeItems] of ordersByStore.entries()) {
            const storeSubtotal = storeItems.reduce((acc, item) => acc + item.basePrice, 0);
            const storeGst = storeItems.reduce((acc, item) => acc + item.gstAmount, 0);
            
            // Apply shipping only to first order
            const orderShipping = isFirstOrder ? shippingCharge : 0;
            
            // Apply discount proportionally to each store
            const storeDiscount = coupon ? (storeSubtotal / grandSubtotal) * discountAmount : 0;
            
            const orderTotal = storeSubtotal + storeGst + orderShipping - storeDiscount;

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    subtotal: parseFloat(storeSubtotal.toFixed(2)),
                    gstAmount: parseFloat(storeGst.toFixed(2)),
                    shippingCharge: parseFloat(orderShipping.toFixed(2)),
                    total: parseFloat(orderTotal.toFixed(2)),
                    paymentMethod: 'RAZORPAY',
                    isPaid: false,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {},
                    orderItems: {
                        create: storeItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                            gstPercent: item.gstPercent,
                            gstAmount: item.gstAmount
                        }))
                    }
                }
            });

            orderIds.push(order.id);
            isFirstOrder = false;
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(grandTotal * 100), // Amount in paise
            currency: "INR",
            receipt: orderIds.join('_').substring(0, 40), // Max 40 chars
            notes: {
                orderIds: orderIds.join(','),
                userId,
                appId: 'cartoo'
            }
        });

        // Update orders with Razorpay order ID
        await Promise.all(orderIds.map(orderId => 
            prisma.order.update({
                where: { id: orderId },
                data: { razorpayOrderId: razorpayOrder.id }
            })
        ));

        return NextResponse.json({
            razorpayOrder: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            },
            orderIds,
            breakdown: {
                subtotal: grandSubtotal,
                gstAmount: grandGstAmount,
                shippingCharge,
                discount: discountAmount,
                total: grandTotal
            }
        });

    } catch (error) {
        console.error('Razorpay create order error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
