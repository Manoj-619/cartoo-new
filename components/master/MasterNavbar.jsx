'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { assets } from "@/assets/assets"

const MasterNavbar = () => {
    const { user } = useUser()

    return (
        <div className="flex items-center justify-between px-6 lg:px-12 py-3 border-b border-slate-200 transition-all bg-white">
            <Link href="/master" className="relative">
                <Image src={assets.cartoo_logo} alt="Cartoo" className="h-14 w-auto" />
                <p className="absolute text-[10px] font-semibold -top-1 -right-10 px-2 py-0.5 rounded-full flex items-center gap-2 text-white bg-purple-600">
                    Master
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <p className="text-slate-600 max-sm:hidden">Hi, {user?.firstName}</p>
                <UserButton />
            </div>
        </div>
    )
}

export default MasterNavbar
