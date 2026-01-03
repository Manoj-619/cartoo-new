import imagekit from "@/configs/imageKit"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import {getAuth} from "@clerk/nextjs/server"
import { NextResponse } from "next/server";

// Add a new product with variants
export async function POST(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, { status: 401 } )
        }
        
        // Get the data from the form
        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const gst = Number(formData.get("gst")) || 0
        const category = formData.get("category")
        const variantsData = formData.get("variants") // JSON string of variants
        
        if(!name || !description || !category){
            return NextResponse.json({error: 'missing product details'}, { status: 400 } )
        }

        // Parse variants
        let variants = []
        try {
            variants = JSON.parse(variantsData || "[]")
        } catch (e) {
            return NextResponse.json({error: 'invalid variants data'}, { status: 400 } )
        }

        if(variants.length === 0){
            return NextResponse.json({error: 'at least one variant is required'}, { status: 400 } )
        }

        // Process each variant's images
        const processedVariants = []
        
        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i]
            const variantImages = formData.getAll(`variant_${i}_images`)
            
            if(variantImages.length === 0){
                return NextResponse.json({error: `Variant ${i + 1} requires at least one image`}, { status: 400 } )
            }

            // Upload images for this variant
            const uploadedImages = await Promise.all(variantImages.map(async (image) => {
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

            processedVariants.push({
                name: variant.name || "",
                mrp: Number(variant.mrp) || 0,
                price: Number(variant.price) || 0,
                color: variant.color || "",
                colorHex: variant.colorHex || "#000000",
                images: uploadedImages
            })
        }

        // Use first variant as default product values
        const firstVariant = processedVariants[0]
        const allImages = processedVariants.flatMap(v => v.images)
        const allColors = [...new Set(processedVariants.map(v => v.color).filter(Boolean))]
        const allSizes = [...new Set(processedVariants.map(v => v.name).filter(Boolean))]

        await prisma.product.create({
             data: {
                name,
                description,
                mrp: firstVariant.mrp,
                price: firstVariant.price,
                gst,
                category,
                colors: allColors,
                sizes: allSizes,
                images: allImages,
                variants: processedVariants,
                storeId
             }
        })

         return NextResponse.json({message: "Product added successfully"})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Get all products for a seller
export async function GET(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, { status: 401 } )
        }
        const products = await prisma.product.findMany({ where: { storeId }})

        return NextResponse.json({products})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Update a product
export async function PUT(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, { status: 401 } )
        }

        const { productId, name, description, mrp, price, gst, category, color, size, variants } = await request.json()

        if(!productId){
            return NextResponse.json({error: 'product ID is required'}, { status: 400 } )
        }

        // Check if product belongs to this store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if(!product){
            return NextResponse.json({error: 'product not found'}, { status: 404 } )
        }

        // Build update data object with only provided fields
        const updateData = {}
        if(name) updateData.name = name
        if(description) updateData.description = description
        if(gst !== undefined) updateData.gst = Number(gst)
        if(category) updateData.category = category
        
        // Handle variants update
        if(variants !== undefined && Array.isArray(variants) && variants.length > 0) {
            updateData.variants = variants
            
            // Update base product values from first variant
            const firstVariant = variants[0]
            updateData.mrp = Number(firstVariant.mrp)
            updateData.price = Number(firstVariant.price)
            
            // Update colors and sizes from all variants
            updateData.colors = [...new Set(variants.map(v => v.color).filter(Boolean))]
            updateData.sizes = [...new Set(variants.map(v => v.name).filter(Boolean))]
        } else {
            // Legacy update for products without variants
            if(mrp) updateData.mrp = Number(mrp)
            if(price) updateData.price = Number(price)
            if(color !== undefined) updateData.colors = color ? [color] : []
            if(size !== undefined) updateData.sizes = size ? [size] : []
        }

        await prisma.product.update({
            where: { id: productId },
            data: updateData
        })

        return NextResponse.json({message: "Product updated successfully"})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}

// Delete a product
export async function DELETE(request){
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if(!storeId){
            return NextResponse.json({error: 'not authorized'}, { status: 401 } )
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        if(!productId){
            return NextResponse.json({error: 'product ID is required'}, { status: 400 } )
        }

        // Check if product belongs to this store
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if(!product){
            return NextResponse.json({error: 'product not found'}, { status: 404 } )
        }

        await prisma.product.delete({
            where: { id: productId }
        })

        return NextResponse.json({message: "Product deleted successfully"})

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}
