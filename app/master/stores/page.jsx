'use client'
import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Search, MoreVertical, Package, ShoppingCart, Pencil, Trash2, Power, X, Check } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ContentLoader from "@/components/ContentLoader"
import { toast } from "react-hot-toast"

export default function MasterStores() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stores, setStores] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    
    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingStore, setEditingStore] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', description: '' })
    
    // Delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingStore, setDeletingStore] = useState(null)

    const fetchStores = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/master/stores', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStores(data.stores)
        } catch (error) {
            console.error(error)
            toast.error('Failed to fetch stores')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    const filteredStores = stores.filter(store => {
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            store.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            store.email.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (filterStatus === 'all') return matchesSearch
        if (filterStatus === 'active') return matchesSearch && store.isActive
        if (filterStatus === 'inactive') return matchesSearch && !store.isActive
        if (filterStatus === 'pending') return matchesSearch && store.status === 'pending'
        return matchesSearch
    })

    const toggleStoreStatus = async (store) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/stores', {
                storeId: store.id,
                isActive: !store.isActive,
                status: !store.isActive ? 'approved' : store.status
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setStores(prev => prev.map(s => 
                s.id === store.id ? { ...s, isActive: !s.isActive, status: !s.isActive ? 'approved' : s.status } : s
            ))
            toast.success(`Store ${!store.isActive ? 'activated' : 'deactivated'}`)
        } catch (error) {
            toast.error('Failed to update store status')
        }
    }

    const approveStore = async (store) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/stores', {
                storeId: store.id,
                isActive: true,
                status: 'approved'
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setStores(prev => prev.map(s => 
                s.id === store.id ? { ...s, isActive: true, status: 'approved' } : s
            ))
            toast.success('Store approved')
        } catch (error) {
            toast.error('Failed to approve store')
        }
    }

    const rejectStore = async (store) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/stores', {
                storeId: store.id,
                isActive: false,
                status: 'rejected'
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setStores(prev => prev.map(s => 
                s.id === store.id ? { ...s, isActive: false, status: 'rejected' } : s
            ))
            toast.success('Store rejected')
        } catch (error) {
            toast.error('Failed to reject store')
        }
    }

    const openEditModal = (store) => {
        setEditingStore(store)
        setEditForm({ name: store.name, description: store.description })
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            await axios.put('/api/master/stores', {
                storeId: editingStore.id,
                ...editForm
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setStores(prev => prev.map(s => 
                s.id === editingStore.id ? { ...s, ...editForm } : s
            ))
            toast.success('Store updated')
            setShowEditModal(false)
        } catch (error) {
            toast.error('Failed to update store')
        }
    }

    const handleDelete = async () => {
        try {
            const token = await getToken()
            await axios.delete(`/api/master/stores?storeId=${deletingStore.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            setStores(prev => prev.filter(s => s.id !== deletingStore.id))
            toast.success('Store deleted')
            setShowDeleteModal(false)
        } catch (error) {
            toast.error('Failed to delete store')
        }
    }

    if (loading) return <ContentLoader />

    return (
        <div className="max-w-6xl">
                <h1 className="text-2xl font-semibold text-slate-800 mb-2">All Stores</h1>
                <p className="text-slate-500 mb-6">Manage all vendor stores on the platform</p>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search stores..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                    >
                        <option value="all">All Stores ({stores.length})</option>
                        <option value="active">Active ({stores.filter(s => s.isActive).length})</option>
                        <option value="inactive">Inactive ({stores.filter(s => !s.isActive && s.status !== 'pending').length})</option>
                        <option value="pending">Pending ({stores.filter(s => s.status === 'pending').length})</option>
                    </select>
                </div>

                {/* Stores Grid */}
                <div className="grid gap-4">
                    {filteredStores.map((store) => (
                        <div key={store.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {store.logo ? (
                                        <Image src={store.logo} alt="" width={56} height={56} className="w-14 h-14 rounded-xl object-cover" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-xl font-semibold">
                                            {store.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{store.name}</h3>
                                        <p className="text-sm text-slate-500">@{store.username}</p>
                                        <p className="text-sm text-slate-400">{store.email}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        store.isActive 
                                            ? 'bg-green-100 text-green-700' 
                                            : store.status === 'pending' 
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                    }`}>
                                        {store.isActive ? 'Active' : store.status === 'pending' ? 'Pending' : 'Inactive'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Package size={16} />
                                    <span>{store._count?.Product || 0} products</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <ShoppingCart size={16} />
                                    <span>{store._count?.Order || 0} orders</span>
                                </div>
                                
                                <div className="flex-1"></div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {store.status === 'pending' ? (
                                        <>
                                            <button
                                                onClick={() => approveStore(store)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                                            >
                                                <Check size={14} /> Approve
                                            </button>
                                            <button
                                                onClick={() => rejectStore(store)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                                            >
                                                <X size={14} /> Reject
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href={`/master/store/${store.id}/products`}
                                                className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
                                            >
                                                Manage
                                            </Link>
                                            <button
                                                onClick={() => toggleStoreStatus(store)}
                                                className={`p-1.5 rounded-lg transition ${store.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                title={store.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                <Power size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(store)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setDeletingStore(store); setShowDeleteModal(true); }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredStores.length === 0 && (
                    <p className="text-center text-slate-500 py-12">No stores found</p>
                )}

                {/* Edit Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-semibold text-slate-800 mb-4">Edit Store</h2>
                            <form onSubmit={handleEditSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Store Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Description</label>
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={3}
                                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 resize-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                            <h2 className="text-xl font-semibold text-slate-800 mb-2">Delete Store</h2>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to delete <span className="font-medium">{deletingStore?.name}</span>? 
                                This will also delete all products and orders.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    )
}