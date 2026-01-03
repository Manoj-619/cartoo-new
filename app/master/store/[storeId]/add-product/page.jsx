'use client'
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Plus, Trash2, Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { assets } from "@/assets/assets"
import { toast } from "react-hot-toast"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const gstOptions = [0, 5, 18, 40]

const createEmptyVariant = () => ({
    id: Date.now() + Math.random(),
    name: "",
    color: "",
    colorHex: "#000000",
    mrp: "",
    price: "",
    images: { 1: null, 2: null, 3: null, 4: null }
})

export default function MasterAddProduct() {
    const { storeId } = useParams()
    const router = useRouter()
    const { getToken } = useAuth()
    
    const [loading, setLoading] = useState(false)
    
    // Product info
    const [productName, setProductName] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [gst, setGst] = useState(0)
    
    // Variants
    const [variants, setVariants] = useState([createEmptyVariant()])

    const updateVariant = (index, field, value) => {
        setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
    }

    const handleImageUpload = (variantIndex, imageKey, file) => {
        const variant = variants[variantIndex]
        updateVariant(variantIndex, 'images', { ...variant.images, [imageKey]: file })
    }

    const addVariant = () => {
        const lastVariant = variants[variants.length - 1]
        const newVariant = createEmptyVariant()
        if (lastVariant.mrp) newVariant.mrp = lastVariant.mrp
        if (lastVariant.price) newVariant.price = lastVariant.price
        setVariants(prev => [...prev, newVariant])
    }

    const removeVariant = (index) => {
        if (variants.length > 1) {
            setVariants(prev => prev.filter((_, i) => i !== index))
        }
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        
        if (!productName || !description || !category) {
            return toast.error("Please fill product name, description and category")
        }

        for (let i = 0; i < variants.length; i++) {
            const v = variants[i]
            const hasImages = v.images[1] || v.images[2] || v.images[3] || v.images[4]
            if (!hasImages) {
                return toast.error(`Variant ${i + 1}: Please upload at least one image`)
            }
            if (!v.mrp || !v.price) {
                return toast.error(`Variant ${i + 1}: Please enter MRP and Price`)
            }
        }

        setLoading(true)
        const token = await getToken()

        try {
            const formData = new FormData()
            
            formData.append('storeId', storeId)
            formData.append('name', productName)
            formData.append('description', description)
            formData.append('gst', gst)
            formData.append('category', category)
            
            const variantsForJson = variants.map(v => ({
                name: v.name,
                mrp: v.mrp,
                price: v.price,
                color: v.color,
                colorHex: v.colorHex
            }))
            formData.append('variants', JSON.stringify(variantsForJson))

            variants.forEach((v, index) => {
                Object.keys(v.images).forEach((key) => {
                    if (v.images[key]) {
                        formData.append(`variant_${index}_images`, v.images[key])
                    }
                })
            })

            await axios.post('/api/master/products', formData, { 
                headers: { Authorization: `Bearer ${token}` } 
            })

            toast.success('Product added successfully!')
            router.push(`/master/store/${storeId}/products`)
            
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl">
            <Link 
                href={`/master/store/${storeId}/products`}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6"
            >
                <ArrowLeft size={18} /> Back to Products
            </Link>

            <form onSubmit={onSubmitHandler}>
                <div className="flex items-center gap-3 mb-2">
                    <Package className="text-purple-600" size={28} />
                    <h1 className="text-2xl font-semibold text-slate-800">Add New Product</h1>
                </div>
                <p className="text-slate-500 mb-6">Add a product to this store with multiple variants</p>

                {/* Product Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <h2 className="font-medium text-slate-700 mb-4">Product Information</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Product Name <span className="text-red-400">*</span></label>
                            <input 
                                type="text" 
                                value={productName} 
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., iPhone 15, Cotton T-Shirt" 
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-600 mb-1">Description <span className="text-red-400">*</span></label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter product description" 
                                rows={4} 
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 resize-none" 
                                required 
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm text-slate-600 mb-1">Category <span className="text-red-400">*</span></label>
                                <select 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400" 
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-600 mb-1">GST (%)</label>
                                <select 
                                    value={gst} 
                                    onChange={(e) => setGst(Number(e.target.value))}
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 min-w-[120px]"
                                >
                                    {gstOptions.map((g) => (
                                        <option key={g} value={g}>{g}%</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium text-slate-700">Product Variants</h2>
                        <span className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
                            {variants.length} variant{variants.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    {variants.map((variant, index) => (
                        <div key={variant.id} className="mb-4 p-5 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-medium text-slate-700">
                                        {variant.name || `Variant ${index + 1}`}
                                    </h3>
                                </div>
                                {variants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="text-red-500 hover:text-red-600 p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-4 mb-4">
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-xs text-slate-500 mb-1">Variant Name</label>
                                    <input 
                                        type="text" 
                                        value={variant.name} 
                                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                        placeholder="e.g., 128GB" 
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            value={variant.color} 
                                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                            placeholder="Color" 
                                            className="w-24 p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white"
                                        />
                                        <input 
                                            type="color" 
                                            value={variant.colorHex}
                                            onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                                            className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">MRP ($) <span className="text-red-400">*</span></label>
                                    <input 
                                        type="number" 
                                        value={variant.mrp} 
                                        onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                                        placeholder="0" 
                                        className="w-28 p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Price ($) <span className="text-red-400">*</span></label>
                                    <input 
                                        type="number" 
                                        value={variant.price} 
                                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                        placeholder="0" 
                                        className="w-28 p-2.5 border border-slate-200 rounded-lg outline-none focus:border-purple-400 bg-white" 
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 mb-2">Images <span className="text-red-400">*</span></label>
                                <div className="flex gap-3 flex-wrap">
                                    {Object.keys(variant.images).map((key) => (
                                        <label key={key} htmlFor={`img-${variant.id}-${key}`} className="cursor-pointer">
                                            <Image
                                                width={300}
                                                height={300}
                                                className='h-16 w-auto border border-slate-200 rounded-lg bg-white hover:border-purple-400 transition'
                                                src={variant.images[key] ? URL.createObjectURL(variant.images[key]) : assets.upload_area}
                                                alt=""
                                            />
                                            <input
                                                type="file"
                                                accept='image/*'
                                                id={`img-${variant.id}-${key}`}
                                                onChange={e => handleImageUpload(index, key, e.target.files[0])}
                                                hidden
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addVariant}
                        className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-purple-400 hover:text-purple-600 transition flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus size={20} /> Add Another Variant
                    </button>
                </div>

                {/* Submit */}
                <button 
                    disabled={loading} 
                    className="w-full sm:w-auto bg-purple-600 text-white px-10 py-3.5 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 font-medium"
                >
                    {loading ? 'Adding Product...' : 'Add Product'}
                </button>
            </form>
        </div>
    )
}
