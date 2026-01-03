'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { Pencil, Trash2, X, Layers } from "lucide-react"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const gstOptions = [0, 5, 18, 40]

export default function StoreManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    
    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        mrp: 0,
        price: 0,
        gst: 0,
        category: '',
        color: '',
        size: ''
    })

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingProduct, setDeletingProduct] = useState(null)

    const fetchProducts = async () => {
        try {
             const token = await getToken()
             const { data } = await axios.get('/api/store/product', {headers: { Authorization: `Bearer ${token}` } })
             setProducts(data.products.sort((a, b)=> new Date(b.createdAt) - new Date(a.createdAt)))
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/store/stock-toggle',{ productId }, {headers: { Authorization: `Bearer ${token}` } })
            setProducts(prevProducts => prevProducts.map(product =>  product.id === productId ? {...product, inStock: !product.inStock} : product))

            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const getVariantCount = (product) => {
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            return product.variants.length
        }
        return 1
    }

    const getVariantPriceRange = (product) => {
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 1) {
            const prices = product.variants.map(v => v.price)
            const min = Math.min(...prices)
            const max = Math.max(...prices)
            if (min === max) return `${currency}${min}`
            return `${currency}${min} - ${currency}${max}`
        }
        return `${currency}${product.price}`
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        setEditForm({
            name: product.name,
            description: product.description,
            mrp: product.mrp,
            price: product.price,
            gst: product.gst || 0,
            category: product.category,
            color: product.colors?.[0] || '',
            size: product.sizes?.[0] || ''
        })
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            const { data } = await axios.put('/api/store/product', {
                productId: editingProduct.id,
                ...editForm
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            // Update local state
            setProducts(prevProducts => prevProducts.map(product => 
                product.id === editingProduct.id 
                    ? { 
                        ...product, 
                        ...editForm,
                        gst: Number(editForm.gst),
                        colors: editForm.color ? [editForm.color] : [],
                        sizes: editForm.size ? [editForm.size] : []
                    } 
                    : product
            ))
            
            toast.success(data.message)
            setShowEditModal(false)
            setEditingProduct(null)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const openDeleteConfirm = (product) => {
        setDeletingProduct(product)
        setShowDeleteConfirm(true)
    }

    const handleDelete = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.delete(`/api/store/product?productId=${deletingProduct.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            // Remove from local state
            setProducts(prevProducts => prevProducts.filter(product => product.id !== deletingProduct.id))
            
            toast.success(data.message)
            setShowDeleteConfirm(false)
            setDeletingProduct(null)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        if(user){
            fetchProducts()
        }  
    }, [user])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <div className="overflow-x-auto">
                <table className="w-full max-w-5xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden md:table-cell">Description</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Variants</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {products.map((product) => (
                            <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center">
                                        <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt="" />
                                        <span className="max-w-32 truncate">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">{product.description}</td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <div className="flex items-center gap-1.5">
                                        <Layers size={14} className="text-slate-400" />
                                        <span className="text-slate-600">{getVariantCount(product)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm">{getVariantPriceRange(product)}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleStock(product.id), { loading: "Updating..." })} checked={product.inStock} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => openEditModal(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={() => openDeleteConfirm(product)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.length === 0 && (
                <p className="text-slate-500 mt-8">No products found. Add some products to get started.</p>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-medium text-slate-800">Edit Product</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Show variants info */}
                        {editingProduct?.variants && Array.isArray(editingProduct.variants) && editingProduct.variants.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-700 mb-2">
                                    <Layers size={14} className="inline mr-1" />
                                    This product has {editingProduct.variants.length} variant{editingProduct.variants.length > 1 ? 's' : ''}:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {editingProduct.variants.map((variant, idx) => (
                                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-600">
                                            {variant.name || `Variant ${idx + 1}`} - {currency}{variant.price}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-blue-500 mt-2">Note: Variant prices can be edited individually through the add product page</p>
                            </div>
                        )}

                        <form onSubmit={e => toast.promise(handleEditSubmit(e), { loading: "Updating product..." })}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Name</label>
                                    <input 
                                        type="text" 
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded outline-slate-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Description</label>
                                    <textarea 
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                        rows={3}
                                        className="w-full p-2 border border-slate-200 rounded outline-slate-400 resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm text-slate-600 mb-1">Base MRP ({currency})</label>
                                        <input 
                                            type="number" 
                                            value={editForm.mrp}
                                            onChange={(e) => setEditForm({...editForm, mrp: e.target.value})}
                                            className="w-full p-2 border border-slate-200 rounded outline-slate-400"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm text-slate-600 mb-1">Base Price ({currency})</label>
                                        <input 
                                            type="number" 
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                                            className="w-full p-2 border border-slate-200 rounded outline-slate-400"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">GST (%)</label>
                                    <select 
                                        value={editForm.gst}
                                        onChange={(e) => setEditForm({...editForm, gst: Number(e.target.value)})}
                                        className="w-full p-2 border border-slate-200 rounded outline-slate-400"
                                    >
                                        {gstOptions.map(gst => (
                                            <option key={gst} value={gst}>{gst}%</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Category</label>
                                    <select 
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                        className="w-full p-2 border border-slate-200 rounded outline-slate-400"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-medium text-slate-800 mb-2">Delete Product</h2>
                        <p className="text-slate-600 mb-4">
                            Are you sure you want to delete <span className="font-medium">"{deletingProduct?.name}"</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => toast.promise(handleDelete(), { loading: "Deleting product..." })}
                                className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
