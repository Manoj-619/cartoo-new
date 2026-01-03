'use client'
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import ContentLoader from "@/components/ContentLoader"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

export default function StoreLayout({ children }) {
    const { storeId } = useParams()
    const { getToken } = useAuth()
    
    const [loading, setLoading] = useState(true)
    const [selectedStore, setSelectedStore] = useState(null)

    const fetchStore = async () => {
        try {
            const token = await getToken()
            const { data: storesData } = await axios.get('/api/master/stores', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const store = storesData.stores.find(s => s.id === storeId)
            setSelectedStore(store)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStore()
    }, [storeId])

    if (loading) return <ContentLoader />

    if (!selectedStore) {
        return (
            <div className="flex flex-col items-center justify-center text-center px-6 py-20">
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

    return children
}
