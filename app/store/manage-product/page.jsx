'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import ContentLoader from "@/components/ContentLoader"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { Pencil, Trash2, X, Layers, Plus, Upload, ChevronDown, ChevronUp } from "lucide-react"
import { assets } from "@/assets/assets"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const gstOptions = [0, 5, 18, 40]
const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

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
        colorVariants: []
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
            // New structure: count total color variants
            return product.variants.length
        }
        return 1
    }

    const getTotalSizesCount = (product) => {
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            // New structure: count total sizes across all colors
            return product.variants.reduce((total, v) => {
                if (v.sizes && Array.isArray(v.sizes)) {
                    return total + v.sizes.length
                }
                return total + 1
            }, 0)
        }
        return 1
    }

    const getVariantPriceRange = (product) => {
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            const prices = []
            product.variants.forEach(v => {
                if (v.sizes && Array.isArray(v.sizes)) {
                    v.sizes.forEach(s => prices.push(s.price || v.price))
                } else {
                    prices.push(v.price)
                }
            })
            if (prices.length > 0) {
                const min = Math.min(...prices)
                const max = Math.max(...prices)
                if (min === max) return `${currency}${min}`
                return `${currency}${min} - ${currency}${max}`
            }
        }
        return `${currency}${product.price}`
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        
        // Parse variants - handle both old and new structure
        let colorVariants = []
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            // Check if it's the new structure (has sizes array) or old structure
            const hasNewStructure = product.variants[0]?.sizes && Array.isArray(product.variants[0].sizes)
            
            if (hasNewStructure) {
                colorVariants = product.variants.map(v => ({
                    id: Date.now() + Math.random(),
                    name: v.name || '',
                    color: v.color || '',
                    colorHex: v.colorHex || '#000000',
                    existingImages: v.images || [],
                    newImages: [],
                    sizes: v.sizes.map(s => ({
                        id: Date.now() + Math.random(),
                        size: s.size || '',
                        mrp: s.mrp || 0,
                        price: s.price || 0
                    })),
                    expanded: true
                }))
            } else {
                // Old flat structure - convert to new structure (each variant becomes a color with one "Default" size)
                colorVariants = product.variants.map(v => ({
                    id: Date.now() + Math.random(),
                    name: '',
                    color: v.color || v.name || '',
                    colorHex: v.colorHex || '#000000',
                    existingImages: v.images || [],
                    newImages: [],
                    sizes: [{
                        id: Date.now() + Math.random(),
                        size: v.name || 'Default',
                        mrp: v.mrp || product.mrp,
                        price: v.price || product.price
                    }],
                    expanded: true
                }))
            }
        } else {
            // No variants - create a default one
            colorVariants = [{
                id: Date.now() + Math.random(),
                name: '',
                color: product.colors?.[0] || 'Default',
                colorHex: '#000000',
                existingImages: product.images || [],
                newImages: [],
                sizes: [{
                    id: Date.now() + Math.random(),
                    size: 'Default',
                    mrp: product.mrp,
                    price: product.price
                }],
                expanded: true
            }]
        }
        
        setEditForm({
            name: product.name,
            description: product.description,
            gst: product.gst || 0,
            category: product.category,
            colorVariants: colorVariants
        })
        setShowEditModal(true)
    }

    const updateColorVariant = (colorIndex, field, value) => {
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex ? { ...cv, [field]: value } : cv
            )
        }))
    }

    const toggleColorExpanded = (colorIndex) => {
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex ? { ...cv, expanded: !cv.expanded } : cv
            )
        }))
    }

    const updateSize = (colorIndex, sizeIndex, field, value) => {
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, ci) => 
                ci === colorIndex 
                    ? { 
                        ...cv, 
                        sizes: cv.sizes.map((s, si) => 
                            si === sizeIndex ? { ...s, [field]: value } : s
                        )
                    }
                    : cv
            )
        }))
    }

    const addSize = (colorIndex) => {
        const lastSize = editForm.colorVariants[colorIndex].sizes[editForm.colorVariants[colorIndex].sizes.length - 1]
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex 
                    ? { 
                        ...cv, 
                        sizes: [...cv.sizes, {
                            id: Date.now() + Math.random(),
                            size: '',
                            mrp: lastSize?.mrp || 0,
                            price: lastSize?.price || 0
                        }]
                    }
                    : cv
            )
        }))
    }

    const removeSize = (colorIndex, sizeIndex) => {
        if (editForm.colorVariants[colorIndex].sizes.length > 1) {
            setEditForm(prev => ({
                ...prev,
                colorVariants: prev.colorVariants.map((cv, i) => 
                    i === colorIndex 
                        ? { ...cv, sizes: cv.sizes.filter((_, si) => si !== sizeIndex) }
                        : cv
                )
            }))
        }
    }

    const addColorVariant = () => {
        setEditForm(prev => ({
            ...prev,
            colorVariants: [...prev.colorVariants, {
                id: Date.now() + Math.random(),
                name: '',
                color: '',
                colorHex: '#000000',
                existingImages: [],
                newImages: [],
                sizes: [{
                    id: Date.now() + Math.random(),
                    size: '',
                    mrp: 0,
                    price: 0
                }],
                expanded: true
            }]
        }))
    }

    const removeColorVariant = (colorIndex) => {
        if (editForm.colorVariants.length > 1) {
            setEditForm(prev => ({
                ...prev,
                colorVariants: prev.colorVariants.filter((_, i) => i !== colorIndex)
            }))
        }
    }

    const handleNewImageUpload = (colorIndex, files) => {
        const fileArray = Array.from(files)
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex 
                    ? { ...cv, newImages: [...cv.newImages, ...fileArray] }
                    : cv
            )
        }))
    }

    const removeExistingImage = (colorIndex, imageIndex) => {
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex 
                    ? { ...cv, existingImages: cv.existingImages.filter((_, idx) => idx !== imageIndex) }
                    : cv
            )
        }))
    }

    const removeNewImage = (colorIndex, imageIndex) => {
        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex 
                    ? { ...cv, newImages: cv.newImages.filter((_, idx) => idx !== imageIndex) }
                    : cv
            )
        }))
    }

    const addQuickSizes = (colorIndex, sizesToAdd) => {
        const existingSizes = editForm.colorVariants[colorIndex].sizes.map(s => s.size.toUpperCase())
        const newSizes = sizesToAdd.filter(s => !existingSizes.includes(s.toUpperCase()))
        
        if (newSizes.length === 0) {
            toast.error('All selected sizes already exist')
            return
        }

        const lastSize = editForm.colorVariants[colorIndex].sizes[editForm.colorVariants[colorIndex].sizes.length - 1]
        const sizesWithPrices = newSizes.map(size => ({
            id: Date.now() + Math.random(),
            size,
            mrp: lastSize?.mrp || 0,
            price: lastSize?.price || 0
        }))

        setEditForm(prev => ({
            ...prev,
            colorVariants: prev.colorVariants.map((cv, i) => 
                i === colorIndex 
                    ? { ...cv, sizes: [...cv.sizes.filter(s => s.size), ...sizesWithPrices] }
                    : cv
            )
        }))
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        
        // Validate variants
        for (let ci = 0; ci < editForm.colorVariants.length; ci++) {
            const cv = editForm.colorVariants[ci]
            const variantLabel = cv.name || `Variant ${ci + 1}`
            
            if (cv.existingImages.length === 0 && cv.newImages.length === 0) {
                toast.error(`${variantLabel}: Please add at least one image`)
                return
            }
            
            // Validate pricing (size is optional, but prices are required)
            for (let si = 0; si < cv.sizes.length; si++) {
                const size = cv.sizes[si]
                if (!size.mrp || !size.price) {
                    const sizeLabel = size.size || `Entry ${si + 1}`
                    toast.error(`${variantLabel}, ${sizeLabel}: Please enter Actual Price and Offer Price`)
                    return
                }
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
            const variantsForJson = editForm.colorVariants.map(cv => ({
                name: cv.name || "",
                color: cv.color,
                colorHex: cv.colorHex,
                existingImages: cv.existingImages,
                sizes: cv.sizes.map(s => ({
                    size: s.size,
                    mrp: parseFloat(s.mrp),
                    price: parseFloat(s.price)
                }))
            }))
            formData.append('variants', JSON.stringify(variantsForJson))

            // Append new images for each color variant
            editForm.colorVariants.forEach((cv, index) => {
                cv.newImages.forEach((file) => {
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

    if (loading) return <ContentLoader />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Manage <span className="text-slate-800 font-medium">Products</span></h1>
            <div className="overflow-x-auto">
                <table className="w-full max-w-5xl text-left ring ring-slate-200 rounded overflow-hidden text-sm">
                    <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden md:table-cell">Description</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Colors / Sizes</th>
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
                                        <span className="text-slate-600">{getVariantCount(product)} / {getTotalSizesCount(product)}</span>
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
                                        Variants ({editForm.colorVariants.length})
                                    </h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {editForm.colorVariants.map((colorVariant, colorIndex) => (
                                        <div key={colorVariant.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                            {/* Variant Header */}
                                            <div className="flex items-center justify-between p-3 bg-slate-100">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-xs font-medium text-slate-500">#{colorIndex + 1}</span>
                                                    <input 
                                                        type="text" 
                                                        value={colorVariant.name || ''} 
                                                        onChange={(e) => updateColorVariant(colorIndex, 'name', e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        placeholder="Enter variant name"
                                                        className="flex-1 max-w-[200px] px-2 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded outline-none focus:border-slate-400"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {editForm.colorVariants.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); removeColorVariant(colorIndex); }}
                                                            className="text-red-500 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleColorExpanded(colorIndex)}
                                                        className="p-1 hover:bg-slate-200 rounded transition"
                                                    >
                                                        {colorVariant.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Variant Content */}
                                            {colorVariant.expanded && (
                                                <div className="p-4 bg-white">
                                                    {/* Color (Optional) */}
                                                    <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                        <label className="block text-xs font-medium text-slate-600 mb-2">Color <span className="text-slate-400">(Optional)</span></label>
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="color" 
                                                                value={colorVariant.colorHex}
                                                                onChange={(e) => updateColorVariant(colorIndex, 'colorHex', e.target.value)}
                                                                className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                                                                title="Pick color"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={colorVariant.color} 
                                                                onChange={(e) => updateColorVariant(colorIndex, 'color', e.target.value)}
                                                                placeholder="e.g., Red, Navy Blue"
                                                                className="flex-1 max-w-[180px] p-2 text-sm bg-white border border-slate-200 rounded outline-none focus:border-slate-400"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Images */}
                                                    <div className="mb-4">
                                                        <label className="block text-xs font-medium text-slate-600 mb-2">Images <span className="text-red-400">*</span></label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {/* Existing Images */}
                                                            {colorVariant.existingImages.map((img, imgIdx) => (
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
                                                                        onClick={() => removeExistingImage(colorIndex, imgIdx)}
                                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* New Images */}
                                                            {colorVariant.newImages.map((file, imgIdx) => (
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
                                                                        onClick={() => removeNewImage(colorIndex, imgIdx)}
                                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            
                                                            {/* Add Image Button */}
                                                            <label className="w-14 h-14 border-2 border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition">
                                                                <Upload size={16} className="text-slate-400" />
                                                                <input 
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    onChange={(e) => handleNewImageUpload(colorIndex, e.target.files)}
                                                                    className="hidden"
                                                                />
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Sizes & Pricing */}
                                                    <div className="border-t border-slate-100 pt-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <label className="text-xs font-medium text-slate-600">Sizes & Pricing <span className="text-slate-400">(Optional)</span></label>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[10px] text-slate-400">Quick:</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addQuickSizes(colorIndex, ['S', 'M', 'L', 'XL'])}
                                                                    className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                                                >
                                                                    S-XL
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Size Labels Header */}
                                                        <div className="grid grid-cols-3 gap-2 mb-1 pr-8">
                                                            <label className="text-xs font-medium text-slate-600">Size</label>
                                                            <label className="text-xs font-medium text-slate-600">Actual Price <span className="text-red-400">*</span></label>
                                                            <label className="text-xs font-medium text-slate-600">Offer Price <span className="text-red-400">*</span></label>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {colorVariant.sizes.map((size, sizeIndex) => (
                                                                <div key={size.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                                                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={size.size}
                                                                            onChange={(e) => updateSize(colorIndex, sizeIndex, 'size', e.target.value)}
                                                                            placeholder="e.g., S, M, L"
                                                                            className="p-1.5 text-sm border border-slate-200 rounded outline-none focus:border-slate-400"
                                                                            list={`sizes-edit-${colorVariant.id}`}
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            value={size.mrp}
                                                                            onChange={(e) => updateSize(colorIndex, sizeIndex, 'mrp', e.target.value)}
                                                                            placeholder="0"
                                                                            className="p-1.5 text-sm border border-slate-200 rounded outline-none focus:border-slate-400"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            value={size.price}
                                                                            onChange={(e) => updateSize(colorIndex, sizeIndex, 'price', e.target.value)}
                                                                            placeholder="0"
                                                                            className="p-1.5 text-sm border border-slate-200 rounded outline-none focus:border-slate-400"
                                                                        />
                                                                    </div>
                                                                    {colorVariant.sizes.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeSize(colorIndex, sizeIndex)}
                                                                            className="text-red-400 hover:text-red-600 p-1"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <datalist id={`sizes-edit-${colorVariant.id}`}>
                                                                {defaultSizes.map(s => <option key={s} value={s} />)}
                                                            </datalist>
                                                        </div>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => addSize(colorIndex)}
                                                            className="w-full mt-2 py-1.5 border border-dashed border-slate-300 text-slate-500 rounded hover:border-slate-400 text-xs flex items-center justify-center gap-1"
                                                        >
                                                            <Plus size={12} /> Add Size
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={addColorVariant}
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
