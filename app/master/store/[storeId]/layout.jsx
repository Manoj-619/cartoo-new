'use client'
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import MasterNavbar from "@/components/master/MasterNavbar"
import MasterSidebar from "@/components/master/MasterSidebar"
import Loading from "@/components/Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

export default function StoreLayout({ children }) {
    const { storeId } = useParams()
    const { getToken } = useAuth()
    
    const [loading, setLoading] = useState(true)
    const [isMaster, setIsMaster] = useState(false)
    const [selectedStore, setSelectedStore] = useState(null)
    const [pendingCount, setPendingCount] = useState(0)

    const fetchData = async () => {
        try {
            const token = await getToken()
            
            // Check if master vendor and get pending count
            const [masterRes, vendorRes] = await Promise.all([
                axios.get('/api/master/is-master', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/master/vendor', {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: { pendingCount: 0 } }))
            ])
            
            setIsMaster(masterRes.data.isMaster)
            setPendingCount(vendorRes.data.pendingCount || 0)
            
            if (masterRes.data.isMaster) {
                // Get all stores and find the selected one
                const { data: storesData } = await axios.get('/api/master/stores', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const store = storesData.stores.find(s => s.id === storeId)
                setSelectedStore(store)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [storeId])

    if (loading) return <Loading />

    if (!isMaster) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <h1 className="text-2xl font-semibold text-slate-700 mb-2">Access Denied</h1>
                    <p className="text-slate-500 mb-6">You are not authorized to access this page.</p>
                    <Link href="/" className="bg-slate-700 text-white flex items-center justify-center gap-2 p-3 px-6 rounded-lg">
                        Go to Home <ArrowRightIcon size={18} />
                    </Link>
                </div>
            </div>
        )
    }

    if (!selectedStore) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                    <h1 className="text-2xl font-semibold text-slate-700 mb-2">Store Not Found</h1>
                    <p className="text-slate-500 mb-6">The store you're looking for doesn't exist.</p>
                    <Link href="/master/stores" className="bg-purple-600 text-white flex items-center justify-center gap-2 p-3 px-6 rounded-lg">
                        View All Stores <ArrowRightIcon size={18} />
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <MasterNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <MasterSidebar selectedStore={selectedStore} pendingCount={pendingCount} />
                <div className="flex-1 h-full p-5 lg:p-8 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}
