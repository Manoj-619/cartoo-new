import imagekit from "@/configs/imageKit";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Upload image for site settings (admin only)
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const folder = formData.get("folder") || "site-settings";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to ImageKit
        const result = await imagekit.upload({
            file: buffer,
            fileName: `hero-${Date.now()}-${file.name}`,
            folder: folder
        });

        // Return optimized URL
        const optimizedUrl = `${result.url}?tr=w-800,q-80`;

        return NextResponse.json({ 
            url: optimizedUrl,
            originalUrl: result.url 
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
