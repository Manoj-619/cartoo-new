'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { Pencil, Trash2, X, Layers, Plus, Upload, XCircle } from "lucide-react"
import { assets } from "@/assets/assets"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const gstOptions = [0, 5, 18, 40]

export default function StoreManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [products, setProducts] = useState([])
    
    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        gst: 0,
        category: '',
        variants: []
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
        
        // Parse variants or create default from base product
        let variants = []
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            variants = product.variants.map(v => ({
                name: v.name || '',
                color: v.color || '',
                colorHex: v.colorHex || '#000000',
                mrp: v.mrp || product.mrp,
                price: v.price || product.price,
                existingImages: v.images || [], // URLs of existing images
                newImages: [] // New files to upload
            }))
        } else {
            // Create a single variant from base product data
            variants = [{
                name: '',
                color: product.colors?.[0] || '',
                colorHex: '#000000',
                mrp: product.mrp,
                price: product.price,
                existingImages: product.images || [],
                newImages: []
            }]
        }
        
        setEditForm({
            name: product.name,
            description: product.description,
            gst: product.gst || 0,
            category: product.category,
            variants: variants
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
                name: '',
                color: '',
                colorHex: '#000000',
                mrp: lastVariant?.mrp || 0,
                price: lastVariant?.price || 0,
                existingImages: [],
                newImages: []
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

    const handleNewImageUpload = (variantIndex, files) => {
        const fileArray = Array.from(files)
        setEditForm(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => 
                i === variantIndex 
                    ? { ...v, newImages: [...v.newImages, ...fileArray] }
                    : v
            )
        }))
    }

    const removeExistingImage = (variantIndex, imageIndex) => {
        setEditForm(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => 
                i === variantIndex 
                    ? { ...v, existingImages: v.existingImages.filter((_, idx) => idx !== imageIndex) }
                    : v
            )
        }))
    }

    const removeNewImage = (variantIndex, imageIndex) => {
        setEditForm(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) => 
                i === variantIndex 
                    ? { ...v, newImages: v.newImages.filter((_, idx) => idx !== imageIndex) }
                    : v
            )
        }))
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        
        // Validate variants
        for (let i = 0; i < editForm.variants.length; i++) {
            const v = editForm.variants[i]
            if (!v.mrp || !v.price) {
                toast.error(`Variant ${i + 1}: Please enter MRP and Price`)
                return
            }
            // Check if variant has at least one image (existing or new)
            if (v.existingImages.length === 0 && v.newImages.length === 0) {
                toast.error(`Variant ${i + 1}: Please add at least one image`)
                return
            }
        }
        
        setSaving(true)
        
        try {
            const token = await getToken()
            const formData = new FormData()
            
            formData.append('productId', editingProduct.id)
            formData.append('name', editForm.name)
            formData.append('description', editForm.description)
            formData.append('gst', editForm.gst)
            formData.append('category', editForm.category)
            
            // Prepare variants data (with existing images info)
            const variantsForJson = editForm.variants.map(v => ({
                name: v.name,
                color: v.color,
                colorHex: v.colorHex,
                mrp: v.mrp,
                price: v.price,
                existingImages: v.existingImages
            }))
            formData.append('variants', JSON.stringify(variantsForJson))

            // Append new images for each variant
            editForm.variants.forEach((v, index) => {
                v.newImages.forEach((file) => {
                    formData.append(`variant_${index}_new_images`, file)
                })
            })

            const { data } = await axios.put('/api/store/product/update', formData, { 
                headers: { Authorization: `Bearer ${token}` } 
            })
            
            // Refresh products list
            await fetchProducts()
            
            toast.success(data.message)
            setShowEditModal(false)
            setEditingProduct(null)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setSaving(false)
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-medium text-slate-800">Edit Product</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            {/* Product Info Section */}
                            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                                <h3 className="text-sm font-medium text-slate-700 mb-3">Product Information</h3>
                                <div className="space-y-3">
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
                                        <div>
                                            <label className="block text-sm text-slate-600 mb-1">GST (%)</label>
                                            <select 
                                                value={editForm.gst}
                                                onChange={(e) => setEditForm({...editForm, gst: Number(e.target.value)})}
                                                className="w-full p-2 border border-slate-200 rounded outline-slate-400 min-w-[100px]"
                                            >
                                                {gstOptions.map(gst => (
                                                    <option key={gst} value={gst}>{gst}%</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Variants Section */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-slate-700">
                                        <Layers size={14} className="inline mr-1" />
                                        Variants ({editForm.variants.length})
                                    </h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {editForm.variants.map((variant, index) => (
                                        <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-slate-600">
                                                    Variant {index + 1}
                                                    {variant.name && <span className="text-slate-400 ml-1">— {variant.name}</span>}
                                                </span>
                                                {editForm.variants.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index)}
                                                        className="text-red-500 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                                <div className="col-span-2 sm:col-span-1">
                                                    <label className="block text-xs text-slate-500 mb-1">Variant Name</label>
                                                    <input 
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                                        placeholder="e.g., 64GB"
                                                        className="w-full p-2 text-sm border border-slate-200 rounded outline-slate-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Color</label>
                                                    <div className="flex gap-1">
                                                        <input 
                                                            type="text"
                                                            value={variant.color}
                                                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                                            placeholder="Color"
                                                            className="w-full p-2 text-sm border border-slate-200 rounded outline-slate-400"
                                                        />
                                                        <input 
                                                            type="color"
                                                            value={variant.colorHex}
                                                            onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                                                            className="w-9 h-9 border border-slate-200 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">MRP ({currency})</label>
                                                    <input 
                                                        type="number"
                                                        value={variant.mrp}
                                                        onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                                                        className="w-full p-2 text-sm border border-slate-200 rounded outline-slate-400"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-500 mb-1">Price ({currency})</label>
                                                    <input 
                                                        type="number"
                                                        value={variant.price}
                                                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                        className="w-full p-2 text-sm border border-slate-200 rounded outline-slate-400"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Images Section */}
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-2">Images</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Existing Images */}
                                                    {variant.existingImages.map((img, imgIdx) => (
                                                        <div key={`existing-${imgIdx}`} className="relative group">
                                                            <Image 
                                                                src={img} 
                                                                alt="" 
                                                                width={60} 
                                                                height={60} 
                                                                className="w-14 h-14 object-cover rounded border border-slate-200"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeExistingImage(index, imgIdx)}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                                                title="Remove image"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* New Images (previews) */}
                                                    {variant.newImages.map((file, imgIdx) => (
                                                        <div key={`new-${imgIdx}`} className="relative group">
                                                            <Image 
                                                                src={URL.createObjectURL(file)} 
                                                                alt="" 
                                                                width={60} 
                                                                height={60} 
                                                                className="w-14 h-14 object-cover rounded border-2 border-green-400"
                                                            />
                                                            <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[8px] text-center">NEW</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeNewImage(index, imgIdx)}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                                                title="Remove image"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    
                                                    {/* Add Image Button */}
                                                    <label className="w-14 h-14 border-2 border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition">
                                                        <Upload size={18} className="text-slate-400" />
                                                        <input 
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            onChange={(e) => handleNewImageUpload(index, e.target.files)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">
                                                    {variant.existingImages.length + variant.newImages.length} image(s) • Click ✕ to remove
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="w-full mt-3 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-slate-400 hover:text-slate-600 transition flex items-center justify-center gap-2 text-sm"
                                >
                                    <Plus size={16} />
                                    Add Variant
                                </button>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button 
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={saving}
                                    className="flex-1 py-2 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
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
