'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { StoreIcon, Package, ShoppingCart, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Loading from "@/components/Loading"

export default function MasterDashboard() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stores, setStores] = useState([])

    const fetchStores = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/master/stores', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStores(data.stores)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    if (loading) return <Loading />

    const totalProducts = stores.reduce((acc, store) => acc + (store._count?.Product || 0), 0)
    const totalOrders = stores.reduce((acc, store) => acc + (store._count?.Order || 0), 0)
    const activeStores = stores.filter(s => s.isActive).length
    const pendingStores = stores.filter(s => s.status === 'pending').length

    const stats = [
        { label: 'Total Stores', value: stores.length, icon: StoreIcon, color: 'bg-blue-500' },
        { label: 'Active Stores', value: activeStores, icon: TrendingUp, color: 'bg-green-500' },
        { label: 'Total Products', value: totalProducts, icon: Package, color: 'bg-purple-500' },
        { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'bg-orange-500' },
    ]

    return (
        <div className="max-w-6xl">
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">Master Dashboard</h1>
            <p className="text-slate-500 mb-8">Manage all vendor stores and their products</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`${stat.color} p-2.5 rounded-lg`}>
                                <stat.icon size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                                <p className="text-sm text-slate-500">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Stores Alert */}
            {pendingStores > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="font-medium text-yellow-800">{pendingStores} store(s) pending approval</p>
                            <p className="text-sm text-yellow-600">Review and approve store requests</p>
                        </div>
                    </div>
                    <Link href="/master/stores" className="text-yellow-700 hover:text-yellow-800 font-medium flex items-center gap-1">
                        View <ArrowRight size={16} />
                    </Link>
                </div>
            )}

            {/* Recent Stores */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">Recent Stores</h2>
                    <Link href="/master/stores" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1">
                        View All <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {stores.slice(0, 5).map((store) => (
                        <Link 
                            key={store.id} 
                            href={`/master/store/${store.id}/products`}
                            className="flex items-center justify-between p-4 hover:bg-slate-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                {store.logo ? (
                                    <Image src={store.logo} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">
                                        {store.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-slate-700">{store.name}</p>
                                    <p className="text-sm text-slate-500">@{store.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-slate-500">{store._count?.Product || 0} products</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    store.isActive 
                                        ? 'bg-green-100 text-green-700' 
                                        : store.status === 'pending' 
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                }`}>
                                    {store.isActive ? 'Active' : store.status === 'pending' ? 'Pending' : 'Inactive'}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
                {stores.length === 0 && (
                    <p className="p-8 text-center text-slate-500">No stores found</p>
                )}
            </div>
        </div>
    )
}
