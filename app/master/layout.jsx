import MasterLayout from "@/components/master/MasterLayout";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";

export const metadata = {
    title: "Cartoo - Master Vendor",
    description: "Cartoo - Master Vendor Dashboard",
};

export default function RootMasterLayout({ children }) {
    return (
        <>
            <SignedIn>
                <MasterLayout>
                    {children}
                </MasterLayout>
            </SignedIn>
            <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <SignIn fallbackRedirectUrl="/master" routing="hash" />
                </div>
            </SignedOut>
        </>
    );
}
