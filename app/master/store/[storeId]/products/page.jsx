'use client'
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Pencil, Trash2, X, Layers, Plus, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import ContentLoader from "@/components/ContentLoader"
import { toast } from "react-hot-toast"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const gstOptions = [0, 5, 18, 40]

export default function MasterStoreProducts() {
    const { storeId } = useParams()
    const { getToken } = useAuth()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    
    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '', description: '', gst: 0, category: '', variants: []
    })
    
    // Delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingProduct, setDeletingProduct] = useState(null)

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(`/api/master/products?storeId=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(data.products)
        } catch (error) {
            toast.error('Failed to fetch products')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [storeId])

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getVariantCount = (product) => {
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            return product.variants.length
        }
        return 1
    }

    const toggleStock = async (product) => {
        try {
            const token = await getToken()
            await axios.put('/api/master/products', {
                productId: product.id,
                inStock: !product.inStock
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            setProducts(prev => prev.map(p => 
                p.id === product.id ? { ...p, inStock: !p.inStock } : p
            ))
            toast.success(`Product ${!product.inStock ? 'in stock' : 'out of stock'}`)
        } catch (error) {
            toast.error('Failed to update stock status')
        }
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        
        let variants = []
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            variants = product.variants.map(v => ({
                name: v.name || '',
                color: v.color || '',
                colorHex: v.colorHex || '#000000',
                mrp: v.mrp || product.mrp,
                price: v.price || product.price,
                images: v.images || []
            }))
        } else {
            variants = [{
                name: '',
                color: product.colors?.[0] || '',
                colorHex: '#000000',
                mrp: product.mrp,
                price: product.price,
                images: product.images || []
            }]
        }
        
        setEditForm({
            name: product.name,
            description: product.description,
            gst: product.gst || 0,
            category: product.category,
            variants
        })
        setShowEditModal(true)
    }

    const updateVariant = (index, field, value) => {
        setEditForm(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => i === index ? { ...v, [field]: value } : v)
        }))
    }

    const addVariant = () => {
        const lastVariant = editForm.variants[editForm.variants.length - 1]
        setEditForm(prev => ({
            ...prev,
            variants: [...prev.variants, {
                name: '', color: '', colorHex: '#000000',
                mrp: lastVariant?.mrp || 0, price: lastVariant?.price || 0, images: []
            }]
        }))
    }

    const removeVariant = (index) => {
        if (editForm.variants.length > 1) {
            setEditForm(prev => ({
                ...prev,
                variants: prev.variants.filter((_, i) => i !== index)
            }))
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            await axios.put('/api/master/products', {
                productId: editingProduct.id,
                ...editForm
            }, { headers: { Authorization: `Bearer ${token}` } })
            
            await fetchProducts()
            toast.success('Product updated')
            setShowEditModal(false)
        } catch (error) {
            toast.error('Failed to update product')
        }
    }

    const handleDelete = async () => {
        try {
            const token = await getToken()
            await axios.delete(`/api/master/products?productId=${deletingProduct.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            setProducts(prev => prev.filter(p => p.id !== deletingProduct.id))
            toast.success('Product deleted')
            setShowDeleteModal(false)
        } catch (error) {
            toast.error('Failed to delete product')
        }
    }

    if (loading) return <ContentLoader />

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800">Products</h1>
                    <p className="text-slate-500">{products.length} products in this store</p>
                </div>
                <Link
                    href={`/master/store/${storeId}/add-product`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    <Plus size={18} /> Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                />
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 hidden md:table-cell">Category</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Variants</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Image 
                                            src={product.images[0]} 
                                            alt="" 
                                            width={40} 
                                            height={40} 
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-slate-500">{product.category}</td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <div className="flex items-center gap-1.5">
                                        <Layers size={14} className="text-slate-400" />
                                        <span className="text-slate-600">{getVariantCount(product)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-medium">{currency}{product.price}</td>
                                <td className="px-4 py-3">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={product.inStock}
                                            onChange={() => toggleStock(product)}
                                        />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-500 transition"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
                                    </label>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => { setDeletingProduct(product); setShowDeleteModal(true); }}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <p className="text-center text-slate-500 py-12">No products found</p>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-800">Edit Product</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">Name</label>
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
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm text-slate-600 mb-1">Category</label>
                                        <select
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">GST (%)</label>
                                        <select
                                            value={editForm.gst}
                                            onChange={(e) => setEditForm({ ...editForm, gst: Number(e.target.value) })}
                                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 min-w-[100px]"
                                        >
                                            {gstOptions.map(g => (
                                                <option key={g} value={g}>{g}%</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-slate-700 mb-3">Variants ({editForm.variants.length})</h3>
                                <div className="space-y-3">
                                    {editForm.variants.map((variant, index) => (
                                        <div key={index} className="p-4 bg-slate-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-slate-600">Variant {index + 1}</span>
                                                {editForm.variants.length > 1 && (
                                                    <button type="button" onClick={() => removeVariant(index)} className="text-red-500">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <input
                                                    type="text"
                                                    value={variant.name}
                                                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                                    placeholder="Name (e.g., 64GB)"
                                                    className="p-2 text-sm border border-slate-200 rounded-lg outline-none"
                                                />
                                                <div className="flex gap-1">
                                                    <input
                                                        type="text"
                                                        value={variant.color}
                                                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                                        placeholder="Color"
                                                        className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none"
                                                    />
                                                    <input
                                                        type="color"
                                                        value={variant.colorHex}
                                                        onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                                                        className="w-9 h-9 border border-slate-200 rounded-lg cursor-pointer"
                                                    />
                                                </div>
                                                <input
                                                    type="number"
                                                    value={variant.mrp}
                                                    onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                                                    placeholder="MRP"
                                                    className="p-2 text-sm border border-slate-200 rounded-lg outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                    placeholder="Price"
                                                    className="p-2 text-sm border border-slate-200 rounded-lg outline-none"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="w-full mt-3 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-purple-400 hover:text-purple-600 transition text-sm"
                                >
                                    + Add Variant
                                </button>
                            </div>

                            <div className="flex gap-3">
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
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Delete Product</h2>
                        <p className="text-slate-600 mb-6">
                            Are you sure you want to delete <span className="font-medium">{deletingProduct?.name}</span>?
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
