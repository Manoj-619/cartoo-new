'use client'

import { usePathname } from "next/navigation"
import { HomeIcon, StoreIcon, Package, ShoppingCart, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

const MasterSidebar = ({ selectedStore }) => {
    const { user } = useUser()
    const pathname = usePathname()

    const mainLinks = [
        { name: 'Dashboard', href: '/master', icon: HomeIcon },
        { name: 'All Stores', href: '/master/stores', icon: StoreIcon },
    ]

    const storeLinks = selectedStore ? [
        { name: 'Products', href: `/master/store/${selectedStore.id}/products`, icon: Package },
        { name: 'Add Product', href: `/master/store/${selectedStore.id}/add-product`, icon: Plus },
        { name: 'Orders', href: `/master/store/${selectedStore.id}/orders`, icon: ShoppingCart },
    ] : []

    return user && (
        <div className="inline-flex h-full flex-col border-r border-slate-200 sm:min-w-64 bg-white">
            {/* User Info */}
            <div className="flex flex-col gap-3 justify-center items-center pt-6 pb-4 border-b border-slate-100 max-sm:hidden">
                <Image className="w-12 h-12 rounded-full shadow" src={user.imageUrl} alt="" width={80} height={80} />
                <div className="text-center">
                    <p className="text-slate-700 font-medium">{user.fullName}</p>
                    <p className="text-xs text-purple-600 font-medium">Master Vendor</p>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="py-4">
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 max-sm:hidden">Navigation</p>
                {mainLinks.map((link, index) => (
                    <Link 
                        key={index} 
                        href={link.href} 
                        className={`relative flex items-center gap-3 text-slate-600 hover:bg-slate-50 p-3 transition ${pathname === link.href && 'bg-purple-50 text-purple-700'}`}
                    >
                        <link.icon size={18} className="sm:ml-3" />
                        <p className="max-sm:hidden">{link.name}</p>
                        {pathname === link.href && <span className="absolute bg-purple-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                    </Link>
                ))}
            </div>

            {/* Selected Store Section */}
            {selectedStore && (
                <div className="py-4 border-t border-slate-100">
                    <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 max-sm:hidden">
                        Managing Store
                    </p>
                    <div className="px-4 py-2 mx-3 bg-purple-50 rounded-lg mb-3 max-sm:hidden">
                        <div className="flex items-center gap-2">
                            {selectedStore.logo ? (
                                <Image src={selectedStore.logo} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 text-sm font-semibold">
                                    {selectedStore.name?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{selectedStore.name}</p>
                                <p className="text-xs text-slate-500">@{selectedStore.username}</p>
                            </div>
                        </div>
                    </div>
                    
                    {storeLinks.map((link, index) => (
                        <Link 
                            key={index} 
                            href={link.href} 
                            className={`relative flex items-center gap-3 text-slate-600 hover:bg-slate-50 p-3 transition ${pathname === link.href && 'bg-purple-50 text-purple-700'}`}
                        >
                            <link.icon size={18} className="sm:ml-3" />
                            <p className="max-sm:hidden">{link.name}</p>
                            {pathname === link.href && <span className="absolute bg-purple-500 right-0 top-1.5 bottom-1.5 w-1 rounded-l"></span>}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MasterSidebar
