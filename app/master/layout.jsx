'use client'
import { useEffect, useState } from "react"
import { SignedIn, SignedOut, SignIn, useAuth } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import axios from "axios"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import MasterNavbar from "@/components/master/MasterNavbar"
import MasterSidebar from "@/components/master/MasterSidebar"
import ContentLoader from "@/components/ContentLoader"

export default function RootMasterLayout({ children }) {
    const { getToken } = useAuth()
    const pathname = usePathname()

    const [isMaster, setIsMaster] = useState(false)
    const [loading, setLoading] = useState(true)
    const [pendingCount, setPendingCount] = useState(0)
    const [stores, setStores] = useState([])
    const [selectedStore, setSelectedStore] = useState(null)

    // Extract storeId from pathname if on a store-specific page
    const storeIdMatch = pathname.match(/\/master\/store\/([^\/]+)/)
    const currentStoreId = storeIdMatch ? storeIdMatch[1] : null

    const fetchMasterData = async () => {
        try {
            const token = await getToken()
            const [masterRes, vendorRes, storesRes] = await Promise.all([
                axios.get('/api/master/is-master', { 
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/master/vendor', { 
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { pendingCount: 0 } })),
                axios.get('/api/master/stores', { 
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { stores: [] } }))
            ])
            setIsMaster(masterRes.data.isMaster)
            setPendingCount(vendorRes.data.pendingCount || 0)
            setStores(storesRes.data.stores || [])
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMasterData()
    }, [])

    // Update selectedStore when pathname or stores change
    useEffect(() => {
        if (currentStoreId && stores.length > 0) {
            const store = stores.find(s => s.id === currentStoreId)
            setSelectedStore(store || null)
        } else {
            setSelectedStore(null)
        }
    }, [currentStoreId, stores])

    return (
        <>
            <SignedIn>
                {loading ? (
                    <div className="flex flex-col h-screen bg-slate-50">
                        <MasterNavbar />
                        <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                            <MasterSidebar pendingCount={0} />
                            <div className="flex-1 h-full p-5 lg:p-8 overflow-y-scroll">
                                <ContentLoader />
                            </div>
                        </div>
                    </div>
                ) : isMaster ? (
                    <div className="flex flex-col h-screen bg-slate-50">
                        <MasterNavbar />
                        <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                            <MasterSidebar pendingCount={pendingCount} selectedStore={selectedStore} />
                            <div className="flex-1 h-full p-5 lg:p-8 overflow-y-scroll">
                                {children}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🔒</span>
                            </div>
                            <h1 className="text-2xl font-semibold text-slate-700 mb-2">Access Denied</h1>
                            <p className="text-slate-500 mb-6">You are not authorized to access the Master Vendor dashboard.</p>
                            <Link href="/" className="bg-slate-700 text-white flex items-center justify-center gap-2 p-3 px-6 rounded-lg hover:bg-slate-800 transition">
                                Go to Home <ArrowRightIcon size={18} />
                            </Link>
                        </div>
                    </div>
                )}
            </SignedIn>
            <SignedOut>
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <SignIn fallbackRedirectUrl="/master" routing="hash" />
                </div>
            </SignedOut>
        </>
    )
}
