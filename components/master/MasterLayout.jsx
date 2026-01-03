'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import MasterNavbar from "./MasterNavbar"
import MasterSidebar from "./MasterSidebar"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

const MasterLayout = ({ children, selectedStore = null, pendingCount: propPendingCount }) => {
    const { getToken } = useAuth()

    const [isMaster, setIsMaster] = useState(false)
    const [loading, setLoading] = useState(true)
    const [pendingCount, setPendingCount] = useState(propPendingCount || 0)

    const fetchMasterData = async () => {
        try {
            const token = await getToken()
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
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMasterData()
    }, [])

    return loading ? (
        <Loading />
    ) : isMaster ? (
        <div className="flex flex-col h-screen bg-slate-50">
            <MasterNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <MasterSidebar selectedStore={selectedStore} pendingCount={pendingCount} />
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
    )
}

export default MasterLayout
