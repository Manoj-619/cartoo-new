import imagekit from "@/configs/imageKit"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import { getAuth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server";

// Update a product with image support (uses FormData)
export async function PUT(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const productId = formData.get("productId")
        const name = formData.get("name")
        const description = formData.get("description")
        const gst = Number(formData.get("gst")) || 0
        const category = formData.get("category")
        const variantsData = formData.get("variants") // JSON string with existing images info

        if (!productId) {
            return NextResponse.json({ error: 'product ID is required' }, { status: 400 })
        }

        // Check if product belongs to this store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if (!product) {
            return NextResponse.json({ error: 'product not found' }, { status: 404 })
        }

        // Parse variants
        let variants = []
        try {
            variants = JSON.parse(variantsData || "[]")
        } catch (e) {
            return NextResponse.json({ error: 'invalid variants data' }, { status: 400 })
        }

        // Process each variant's images
        const processedVariants = []

        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i]
            const newImages = formData.getAll(`variant_${i}_new_images`)
            
            // Start with existing images that weren't removed
            let variantImages = variant.existingImages || []

            // Upload new images if any
            if (newImages && newImages.length > 0) {
                const uploadedImages = await Promise.all(newImages.map(async (image) => {
                    // Skip if it's not a file (might be empty)
                    if (!image || !image.name || image.size === 0) return null
                    
                    const buffer = Buffer.from(await image.arrayBuffer());
                    const response = await imagekit.upload({
                        file: buffer,
                        fileName: image.name,
                        folder: "products",
                    })
                    const url = imagekit.url({
                        path: response.filePath,
                        transformation: [
                            { quality: 'auto' },
                            { format: 'webp' },
                            { width: '1024' }
                        ]
                    })
                    return url
                }))
                
                // Add uploaded images (filter out nulls)
                variantImages = [...variantImages, ...uploadedImages.filter(Boolean)]
            }

            processedVariants.push({
                name: variant.name || "",
                mrp: Number(variant.mrp) || 0,
                price: Number(variant.price) || 0,
                color: variant.color || "",
                colorHex: variant.colorHex || "#000000",
                images: variantImages
            })
        }

        // Build update data
        const updateData = {
            name,
            description,
            gst,
            category,
            variants: processedVariants
        }

        // Update base product values from first variant
        if (processedVariants.length > 0) {
            const firstVariant = processedVariants[0]
            updateData.mrp = Number(firstVariant.mrp)
            updateData.price = Number(firstVariant.price)
            updateData.colors = [...new Set(processedVariants.map(v => v.color).filter(Boolean))]
            updateData.sizes = [...new Set(processedVariants.map(v => v.name).filter(Boolean))]
            updateData.images = processedVariants.flatMap(v => v.images)
        }

        await prisma.product.update({
            where: { id: productId },
            data: updateData
        })

        return NextResponse.json({ message: "Product updated successfully" })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
