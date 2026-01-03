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

// Get all orders from all vendors with financial summary
export async function GET(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId'); // Optional filter
        const status = searchParams.get('status'); // Optional filter
        const paymentMethod = searchParams.get('paymentMethod'); // Optional filter
        const startDate = searchParams.get('startDate'); // Optional date filter
        const endDate = searchParams.get('endDate'); // Optional date filter

        // Build where clause - Only show paid orders
        const where = {
            isPaid: true
        };
        
        if (storeId && storeId !== 'all') {
            where.storeId = storeId;
        }
        
        if (status && status !== 'all') {
            where.status = status;
        }

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // Fetch all orders with relations
        const orders = await prisma.order.findMany({
            where,
            include: {
                orderItems: {
                    include: { product: true }
                },
                address: true,
                user: {
                    select: { name: true, email: true, image: true }
                },
                store: {
                    select: { id: true, name: true, username: true, logo: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch all stores for filter dropdown
        const stores = await prisma.store.findMany({
            where: { status: 'approved' },
            select: { id: true, name: true, username: true, logo: true }
        });

        // Calculate financial summary (all orders are paid since we filter by isPaid: true)
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
        const processingOrders = orders.filter(o => o.status === 'PROCESSING' || o.status === 'ORDER_PLACED');
        const shippedOrders = orders.filter(o => o.status === 'SHIPPED');

        const financials = {
            // Overall totals
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
            
            // Subtotals breakdown
            totalSubtotal: orders.reduce((sum, o) => sum + (o.subtotal || 0), 0),
            totalGst: orders.reduce((sum, o) => sum + (o.gstAmount || 0), 0),
            totalShipping: orders.reduce((sum, o) => sum + (o.shippingCharge || 0), 0),
            
            // Status breakdown
            deliveredOrders: deliveredOrders.length,
            deliveredRevenue: deliveredOrders.reduce((sum, o) => sum + o.total, 0),
            processingOrders: processingOrders.length,
            shippedOrders: shippedOrders.length,
            
            // Average order value
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
        };

        // Per-vendor breakdown (all orders are paid)
        const vendorBreakdown = {};
        orders.forEach(order => {
            const storeKey = order.storeId;
            if (!vendorBreakdown[storeKey]) {
                vendorBreakdown[storeKey] = {
                    store: order.store,
                    totalOrders: 0,
                    totalRevenue: 0,
                    gstCollected: 0,
                    deliveredOrders: 0,
                };
            }
            vendorBreakdown[storeKey].totalOrders += 1;
            vendorBreakdown[storeKey].totalRevenue += order.total;
            vendorBreakdown[storeKey].gstCollected += (order.gstAmount || 0);
            
            if (order.status === 'DELIVERED') {
                vendorBreakdown[storeKey].deliveredOrders += 1;
            }
        });

        return NextResponse.json({ 
            orders, 
            stores,
            financials,
            vendorBreakdown: Object.values(vendorBreakdown)
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
