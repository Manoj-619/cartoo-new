import imagekit from "@/configs/imageKit";
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

// Get all products for a specific store
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

        const products = await prisma.product.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Add a new product to any store (with color > size structure)
export async function POST(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const storeId = formData.get("storeId");
        const name = formData.get("name");
        const description = formData.get("description");
        const gst = Number(formData.get("gst")) || 0;
        const category = formData.get("category");
        const variantsData = formData.get("variants");

        if (!storeId || !name || !description || !category) {
            return NextResponse.json({ error: "Missing product details" }, { status: 400 });
        }

        // Verify store exists
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            return NextResponse.json({ error: "Store not found" }, { status: 404 });
        }

        // Parse color variants (new structure: color variants with nested sizes)
        let colorVariants = [];
        try {
            colorVariants = JSON.parse(variantsData || "[]");
        } catch (e) {
            return NextResponse.json({ error: "Invalid variants data" }, { status: 400 });
        }

        if (colorVariants.length === 0) {
            return NextResponse.json({ error: "At least one color variant is required" }, { status: 400 });
        }

        // Process each color variant's images
        const processedVariants = [];

        for (let i = 0; i < colorVariants.length; i++) {
            const colorVariant = colorVariants[i];
            const variantImages = formData.getAll(`variant_${i}_images`);

            if (variantImages.length === 0) {
                return NextResponse.json({ error: `Color "${colorVariant.color || i + 1}" requires at least one image` }, { status: 400 });
            }

            // Upload images for this color variant
            const uploadedImages = await Promise.all(variantImages.map(async (image) => {
                const buffer = Buffer.from(await image.arrayBuffer());
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: image.name,
                    folder: "products",
                });
                const url = imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: 'auto' },
                        { format: 'webp' },
                        { width: '1024' }
                    ]
                });
                return url;
            }));

            processedVariants.push({
                name: colorVariant.name || "",
                color: colorVariant.color || "",
                colorHex: colorVariant.colorHex || "#000000",
                images: uploadedImages,
                sizes: (colorVariant.sizes || []).map(s => ({
                    size: s.size || "",
                    mrp: Number(s.mrp) || 0,
                    price: Number(s.price) || 0
                }))
            });
        }

        // Extract data for product base fields
        const firstVariant = processedVariants[0];
        const firstSize = firstVariant.sizes[0] || { mrp: 0, price: 0 };
        const allImages = processedVariants.flatMap(v => v.images);
        const allColors = [...new Set(processedVariants.map(v => v.color).filter(Boolean))];
        const allSizes = [...new Set(processedVariants.flatMap(v => v.sizes.map(s => s.size)).filter(Boolean))];

        await prisma.product.create({
            data: {
                name,
                description,
                mrp: firstSize.mrp,
                price: firstSize.price,
                gst,
                category,
                colors: allColors,
                sizes: allSizes,
                images: allImages,
                variants: processedVariants,
                storeId
            }
        });

        return NextResponse.json({ message: "Product added successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update a product (JSON only, for simple updates like stock toggle)
export async function PUT(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { productId, name, description, gst, category, variants, inStock } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (gst !== undefined) updateData.gst = Number(gst);
        if (category) updateData.category = category;
        if (inStock !== undefined) updateData.inStock = inStock;

        if (variants !== undefined && Array.isArray(variants) && variants.length > 0) {
            updateData.variants = variants;
            
            // Check if new structure (has sizes array)
            const hasNewStructure = variants[0]?.sizes && Array.isArray(variants[0].sizes);
            
            if (hasNewStructure) {
                const firstVariant = variants[0];
                const firstSize = firstVariant.sizes[0] || { mrp: 0, price: 0 };
                updateData.mrp = Number(firstSize.mrp);
                updateData.price = Number(firstSize.price);
                updateData.colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
                updateData.sizes = [...new Set(variants.flatMap(v => v.sizes?.map(s => s.size) || []).filter(Boolean))];
            } else {
                // Legacy structure
                const firstVariant = variants[0];
                updateData.mrp = Number(firstVariant.mrp);
                updateData.price = Number(firstVariant.price);
                updateData.colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
                updateData.sizes = [...new Set(variants.map(v => v.name).filter(Boolean))];
            }
        }

        await prisma.product.update({
            where: { id: productId },
            data: updateData
        });

        return NextResponse.json({ message: "Product updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a product
export async function DELETE(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        await prisma.product.delete({
            where: { id: productId }
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
