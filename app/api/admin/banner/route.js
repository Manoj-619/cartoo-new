import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const defaultSettings = {
    id: "main",
    bannerEnabled: true,
    bannerText: "Get 20% OFF on Your First Order!",
    bannerButtonText: "Claim Offer",
    bannerCouponCode: "NEW20",
    bannerGradient: "from-violet-500 via-[#9938CA] to-[#E0724A]",
    heroTagText: "Free Shipping on Orders Above $50!",
    heroHeadline: "Gadgets you'll love. Prices you'll trust.",
    heroStartPrice: "4.90",
    heroButtonText: "LEARN MORE",
    heroMainImage: null,
    heroCard1Title: "Best products",
    heroCard1Image: null,
    heroCard2Title: "20% discounts",
    heroCard2Image: null,
    marqueeCategories: "Headphones,Speakers,Watch,Earbuds,Mouse,Decoration",
    footerDescription: "Welcome to cartoo, your ultimate destination for the latest and smartest gadgets. From smartphones and smartwatches to essential accessories, we bring you the best in innovation — all in one place.",
    footerPhone: "+91 6381550266",
    footerEmail: "cartoobusiness@gmail.com",
    footerAddress: "Rajapalaym, 626102",
    footerFacebook: "https://www.facebook.com",
    footerInstagram: "https://www.instagram.com",
    footerTwitter: "https://twitter.com",
    footerLinkedin: "https://www.linkedin.com",
    footerCopyright: "Copyright 2025 © cartoo All Right Reserved."
};

// Get site settings (public)
export async function GET() {
    try {
        let settings = await prisma.siteSettings.findUnique({
            where: { id: "main" }
        });

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: defaultSettings
            });
        }

        return NextResponse.json({ settings });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update site settings (admin only)
export async function PUT(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        const body = await request.json();
        const { 
            bannerEnabled, bannerText, bannerButtonText, bannerCouponCode, bannerGradient,
            heroTagText, heroHeadline, heroStartPrice, heroButtonText, 
            heroMainImage, heroCard1Title, heroCard1Image, heroCard2Title, heroCard2Image,
            marqueeCategories,
            footerDescription, footerPhone, footerEmail, footerAddress,
            footerFacebook, footerInstagram, footerTwitter, footerLinkedin, footerCopyright
        } = body;

        const settings = await prisma.siteSettings.upsert({
            where: { id: "main" },
            update: {
                bannerEnabled: bannerEnabled ?? defaultSettings.bannerEnabled,
                bannerText: bannerText || defaultSettings.bannerText,
                bannerButtonText: bannerButtonText || defaultSettings.bannerButtonText,
                bannerCouponCode: bannerCouponCode || defaultSettings.bannerCouponCode,
                bannerGradient: bannerGradient || defaultSettings.bannerGradient,
                heroTagText: heroTagText || defaultSettings.heroTagText,
                heroHeadline: heroHeadline || defaultSettings.heroHeadline,
                heroStartPrice: heroStartPrice || defaultSettings.heroStartPrice,
                heroButtonText: heroButtonText || defaultSettings.heroButtonText,
                heroMainImage: heroMainImage || null,
                heroCard1Title: heroCard1Title || defaultSettings.heroCard1Title,
                heroCard1Image: heroCard1Image || null,
                heroCard2Title: heroCard2Title || defaultSettings.heroCard2Title,
                heroCard2Image: heroCard2Image || null,
                marqueeCategories: marqueeCategories || defaultSettings.marqueeCategories,
                footerDescription: footerDescription || defaultSettings.footerDescription,
                footerPhone: footerPhone || defaultSettings.footerPhone,
                footerEmail: footerEmail || defaultSettings.footerEmail,
                footerAddress: footerAddress || defaultSettings.footerAddress,
                footerFacebook: footerFacebook || null,
                footerInstagram: footerInstagram || null,
                footerTwitter: footerTwitter || null,
                footerLinkedin: footerLinkedin || null,
                footerCopyright: footerCopyright || defaultSettings.footerCopyright
            },
            create: {
                ...defaultSettings,
                bannerEnabled: bannerEnabled ?? defaultSettings.bannerEnabled,
                bannerText: bannerText || defaultSettings.bannerText,
                bannerButtonText: bannerButtonText || defaultSettings.bannerButtonText,
                bannerCouponCode: bannerCouponCode || defaultSettings.bannerCouponCode,
                bannerGradient: bannerGradient || defaultSettings.bannerGradient,
                heroTagText: heroTagText || defaultSettings.heroTagText,
                heroHeadline: heroHeadline || defaultSettings.heroHeadline,
                heroStartPrice: heroStartPrice || defaultSettings.heroStartPrice,
                heroButtonText: heroButtonText || defaultSettings.heroButtonText,
                heroMainImage: heroMainImage || null,
                heroCard1Title: heroCard1Title || defaultSettings.heroCard1Title,
                heroCard1Image: heroCard1Image || null,
                heroCard2Title: heroCard2Title || defaultSettings.heroCard2Title,
                heroCard2Image: heroCard2Image || null,
                marqueeCategories: marqueeCategories || defaultSettings.marqueeCategories,
                footerDescription: footerDescription || defaultSettings.footerDescription,
                footerPhone: footerPhone || defaultSettings.footerPhone,
                footerEmail: footerEmail || defaultSettings.footerEmail,
                footerAddress: footerAddress || defaultSettings.footerAddress,
                footerFacebook: footerFacebook || null,
                footerInstagram: footerInstagram || null,
                footerTwitter: footerTwitter || null,
                footerLinkedin: footerLinkedin || null,
                footerCopyright: footerCopyright || defaultSettings.footerCopyright
            }
        });

        return NextResponse.json({ message: "Settings updated", settings });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
