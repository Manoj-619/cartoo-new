import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensureUser";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
    try {
        const { userId, has } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }
        const { addressId, items, couponCode, paymentMethod } = await request.json()

        // Check if all required fields are present
        if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "missing order details." }, { status: 401 });
        }

        // Ensure user exists in database
        await ensureUser(userId)

        let coupon = null;

        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: { code: couponCode }
            })
            if (!coupon) {
                return NextResponse.json({ error: "Coupon not found" }, { status: 400 })
            }
        }

        // Check if coupon is applicable for new users
        if (couponCode && coupon.forNewUser) {
            const userorders = await prisma.order.findMany({ where: { userId } })
            if (userorders.length > 0) {
                return NextResponse.json({ error: "Coupon valid for new users" }, { status: 400 })
            }
        }

        const isPlusMember = has({ plan: 'plus' })

        // Check if coupon is applicable for members
        if (couponCode && coupon.forMember) {
            if (!isPlusMember) {
                return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 })
            }
        }

        // Group orders by storeId using a Map
        const ordersByStore = new Map()
        let grandSubtotal = 0;
        let grandGstAmount = 0;

        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } })
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
            }
            
            const storeId = product.storeId
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, [])
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
            })
        }

        // Calculate shipping (₹50 for non-Plus members)
        const shippingCharge = isPlusMember ? 0 : 50;

        // Calculate discount
        const discountAmount = coupon ? (grandSubtotal * coupon.discount) / 100 : 0;

        // Grand total
        const grandTotal = grandSubtotal + grandGstAmount + shippingCharge - discountAmount;

        let orderIds = [];
        let isFirstOrder = true;

        // Create orders for each seller
        for (const [storeId, storeItems] of ordersByStore.entries()) {
            const storeSubtotal = storeItems.reduce((acc, item) => acc + item.basePrice, 0);
            const storeGst = storeItems.reduce((acc, item) => acc + item.gstAmount, 0);

            // Apply shipping only to first order
            const orderShipping = isFirstOrder ? shippingCharge : 0;

            // Apply discount proportionally
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
                    paymentMethod,
                    isPaid: paymentMethod === 'COD' ? false : false,
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
            })
            orderIds.push(order.id)
            isFirstOrder = false;
        }

        // Handle Stripe payment (legacy support)
        if (paymentMethod === 'STRIPE') {
            const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
            const origin = await request.headers.get('origin')

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Order'
                        },
                        unit_amount: Math.round(grandTotal * 100)
                    },
                    quantity: 1
                }],
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
                mode: 'payment',
                success_url: `${origin}/loading?nextUrl=orders`,
                cancel_url: `${origin}/cart`,
                metadata: {
                    orderIds: orderIds.join(','),
                    userId,
                    appId: 'cartoo'
                }
            })
            return NextResponse.json({ session })
        }

        // For COD orders - clear cart and return success
        if (paymentMethod === 'COD') {
            await prisma.user.update({
                where: { id: userId },
                data: { cart: {} }
            })
            return NextResponse.json({ message: 'Orders Placed Successfully' })
        }

        return NextResponse.json({ 
            message: 'Orders created', 
            orderIds,
            total: grandTotal
        })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all paid orders for a user
export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const orders = await prisma.order.findMany({
            where: {
                userId,
                isPaid: true
            },
            include: {
                orderItems: { include: { product: true } },
                address: true,
                store: {
                    select: { name: true, username: true, logo: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ orders })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
