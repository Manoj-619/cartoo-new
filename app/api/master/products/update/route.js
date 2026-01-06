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

// Update a product with FormData (for image uploads)
export async function PUT(request) {
    try {
        const isMaster = await checkMasterAuth(request);
        if (!isMaster) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const productId = formData.get("productId");
        const name = formData.get("name");
        const description = formData.get("description");
        const gst = Number(formData.get("gst")) || 0;
        const category = formData.get("category");
        const variantsData = formData.get("variants");

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        // Verify product exists
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Parse color variants (new structure with nested sizes)
        let colorVariants = [];
        try {
            colorVariants = JSON.parse(variantsData || "[]");
        } catch (e) {
            return NextResponse.json({ error: "Invalid variants data" }, { status: 400 });
        }

        // Process each color variant's images
        const processedVariants = [];

        for (let i = 0; i < colorVariants.length; i++) {
            const colorVariant = colorVariants[i];
            const newImages = formData.getAll(`variant_${i}_new_images`);
            
            // Start with existing images
            let variantImages = colorVariant.existingImages || [];

            // Upload new images if any
            if (newImages && newImages.length > 0) {
                const uploadedImages = await Promise.all(newImages.map(async (image) => {
                    // Skip if not a valid file
                    if (!image || !image.name || image.size === 0) return null;
                    
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
                
                // Add uploaded images (filter out nulls)
                variantImages = [...variantImages, ...uploadedImages.filter(Boolean)];
            }

            processedVariants.push({
                name: colorVariant.name || "",
                color: colorVariant.color || "",
                colorHex: colorVariant.colorHex || "#000000",
                images: variantImages,
                sizes: (colorVariant.sizes || []).map(s => ({
                    size: s.size || "",
                    mrp: Number(s.mrp) || 0,
                    price: Number(s.price) || 0
                }))
            });
        }

        // Build update data
        const updateData = {
            name,
            description,
            gst,
            category,
            variants: processedVariants
        };

        // Update base product values from first variant/size
        if (processedVariants.length > 0) {
            const firstVariant = processedVariants[0];
            const firstSize = firstVariant.sizes[0] || { mrp: 0, price: 0 };
            
            updateData.mrp = Number(firstSize.mrp);
            updateData.price = Number(firstSize.price);
            updateData.colors = [...new Set(processedVariants.map(v => v.color).filter(Boolean))];
            updateData.sizes = [...new Set(processedVariants.flatMap(v => v.sizes?.map(s => s.size) || []).filter(Boolean))];
            updateData.images = processedVariants.flatMap(v => v.images);
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
