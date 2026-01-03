'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { ShieldCheck, Check, X, Mail, Phone, MapPin, Calendar } from "lucide-react"
import Image from "next/image"
import ContentLoader from "@/components/ContentLoader"
import { toast } from "react-hot-toast"

export default function MasterApproveVendors() {
    const { getToken } = useAuth()
    
    const [loading, setLoading] = useState(true)
    const [pendingStores, setPendingStores] = useState([])
    const [selectedStore, setSelectedStore] = useState(null)

    const fetchPendingStores = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/master/vendor', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPendingStores(data.pendingStores)
        } catch (error) {
            toast.error('Failed to fetch pending vendors')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPendingStores()
    }, [])

    const handleApprove = async (store) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/stores', {
                storeId: store.id,
                isActive: true,
                status: 'approved'
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setPendingStores(prev => prev.filter(s => s.id !== store.id))
            setSelectedStore(null)
            toast.success(`${store.name} has been approved!`)
        } catch (error) {
            toast.error('Failed to approve vendor')
        }
    }

    const handleReject = async (store) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/stores', {
                storeId: store.id,
                isActive: false,
                status: 'rejected'
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setPendingStores(prev => prev.filter(s => s.id !== store.id))
            setSelectedStore(null)
            toast.success(`${store.name} has been rejected`)
        } catch (error) {
            toast.error('Failed to reject vendor')
        }
    }

    if (loading) return <ContentLoader />

    return (
        <div className="max-w-4xl">
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="text-purple-600" size={28} />
                    <h1 className="text-2xl font-semibold text-slate-800">Approve Vendors</h1>
                </div>
                <p className="text-slate-500 mb-6">Review and approve pending vendor applications</p>

                {pendingStores.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 mb-2">All caught up!</h3>
                        <p className="text-slate-500">No pending vendor applications to review</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingStores.map((store) => (
                            <div 
                                key={store.id} 
                                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Store Logo */}
                                    {store.logo ? (
                                        <Image 
                                            src={store.logo} 
                                            alt="" 
                                            width={64} 
                                            height={64} 
                                            className="w-16 h-16 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-semibold">
                                            {store.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}

                                    {/* Store Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-slate-800 text-lg">{store.name}</h3>
                                                <p className="text-slate-500">@{store.username}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                                Pending Review
                                            </span>
                                        </div>

                                        <p className="text-slate-600 mt-2 line-clamp-2">{store.description}</p>

                                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} /> {store.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} /> {store.contact}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} /> {new Date(store.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
                                            <MapPin size={14} /> {store.address}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => setSelectedStore(store)}
                                        className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                                    >
                                        View Details
                                    </button>
                                    <div className="flex-1"></div>
                                    <button
                                        onClick={() => handleReject(store)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(store)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                    >
                                        <Check size={16} /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedStore && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-slate-800">Vendor Details</h2>
                                <button onClick={() => setSelectedStore(null)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                {selectedStore.logo ? (
                                    <Image 
                                        src={selectedStore.logo} 
                                        alt="" 
                                        width={80} 
                                        height={80} 
                                        className="w-20 h-20 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-semibold">
                                        {selectedStore.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-lg">{selectedStore.name}</h3>
                                    <p className="text-slate-500">@{selectedStore.username}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Description</p>
                                    <p className="text-slate-700">{selectedStore.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Email</p>
                                        <p className="text-slate-700">{selectedStore.email}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500 mb-1">Contact</p>
                                        <p className="text-slate-700">{selectedStore.contact}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Address</p>
                                    <p className="text-slate-700">{selectedStore.address}</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-500 mb-1">Applied On</p>
                                    <p className="text-slate-700">
                                        {new Date(selectedStore.createdAt).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                {/* Bank Details Section */}
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm font-medium text-slate-700 mb-3">Bank Details</p>
                                    {selectedStore.bankName || selectedStore.bankAccount || selectedStore.bankIfsc ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Account Holder:</span>
                                                <span className="text-slate-700 font-medium">{selectedStore.bankName || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Account Number:</span>
                                                <span className="text-slate-700 font-medium">{selectedStore.bankAccount || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">IFSC Code:</span>
                                                <span className="text-slate-700 font-medium">{selectedStore.bankIfsc || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">UPI ID:</span>
                                                <span className="text-slate-700 font-medium">{selectedStore.bankUpi || '-'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">No bank details provided</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => handleReject(selectedStore)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                                >
                                    <X size={18} /> Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedStore)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                                >
                                    <Check size={18} /> Approve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    )
}
