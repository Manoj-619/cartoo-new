import { getAuth } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";
import { getMasterVendorEmails } from "@/middlewares/authMaster";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        
        if (!userId) {
            return NextResponse.json({ isMaster: false }, { status: 401 });
        }

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ isMaster: false }, { status: 401 });
        }

        const userEmail = user.emailAddresses?.[0]?.emailAddress;
        const masterEmails = getMasterVendorEmails();
        const isMaster = masterEmails.includes(userEmail);

        return NextResponse.json({ 
            isMaster,
            email: userEmail 
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
