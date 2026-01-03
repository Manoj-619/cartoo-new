'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Plus, Trash2, Package } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
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

export default function StoreAddProduct() {
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()
    
    // Product info (shared across variants)
    const [productName, setProductName] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")
    const [gst, setGst] = useState(0)
    const [aiUsed, setAiUsed] = useState(false)
    
    // Variants
    const [variants, setVariants] = useState([createEmptyVariant()])

    const updateVariant = (index, field, value) => {
        setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
    }

    const handleImageUpload = async (variantIndex, imageKey, file) => {
        const variant = variants[variantIndex]
        updateVariant(variantIndex, 'images', { ...variant.images, [imageKey]: file })

        // AI analysis for first image of first variant
        if (variantIndex === 0 && imageKey === "1" && file && !aiUsed) {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onloadend = async () => {
                const base64String = reader.result.split(",")[1]
                const mimeType = file.type
                const token = await getToken()

                try {
                    await toast.promise(
                        axios.post(
                            "/api/store/ai",
                            { base64Image: base64String, mimeType },
                            { headers: { Authorization: `Bearer ${token}` } }
                        ),
                        {
                            loading: "Analyzing image with AI...",
                            success: (res) => {
                                const data = res.data
                                if (data.name && data.description) {
                                    setProductName(data.name)
                                    setDescription(data.description)
                                    setAiUsed(true)
                                    return "AI filled product info 🎉"
                                }
                                return "AI could not analyze the image"
                            },
                            error: (err) => err?.response?.data?.error || err.message
                        }
                    )
                } catch (error) {
                    console.error(error)
                }
            }
        }
    }

    const addVariant = () => {
        // Copy price from last variant for convenience
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
        
        // Validate product info
        if (!productName || !description || !category) {
            return toast.error("Please fill product name, description and category")
        }

        // Validate variants
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
            
            formData.append('name', productName)
            formData.append('description', description)
            formData.append('gst', gst)
            formData.append('category', category)
            
            // Prepare variants data (without images - they go separately)
            const variantsForJson = variants.map(v => ({
                name: v.name,
                mrp: v.mrp,
                price: v.price,
                color: v.color,
                colorHex: v.colorHex
            }))
            formData.append('variants', JSON.stringify(variantsForJson))

            // Append images for each variant
            variants.forEach((v, index) => {
                Object.keys(v.images).forEach((key) => {
                    if (v.images[key]) {
                        formData.append(`variant_${index}_images`, v.images[key])
                    }
                })
            })

            await axios.post('/api/store/product', formData, { 
                headers: { Authorization: `Bearer ${token}` } 
            })

            toast.success('Product added successfully!')
            
            // Reset form
            setProductName("")
            setDescription("")
            setCategory("")
            setGst(0)
            setAiUsed(false)
            setVariants([createEmptyVariant()])
            
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28 max-w-4xl">
            <div className="flex items-center gap-3 mb-2">
                <Package className="text-slate-700" size={28} />
                <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Product</span></h1>
            </div>
            <p className="text-sm text-slate-400 mb-6">Create a single product with multiple variants (e.g., storage sizes, colors)</p>

            {/* Product Info Section */}
            <div className="p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
                <h2 className="text-lg font-medium text-slate-700 mb-1">Product Information</h2>
                <p className="text-sm text-slate-400 mb-5">This info is shared across all variants</p>

                {/* Name */}
                <label className="flex flex-col gap-2 mb-5">
                    <span>Product Name <span className="text-red-400">*</span></span>
                    <input 
                        type="text" 
                        value={productName} 
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., iPhone 15, Cotton T-Shirt, Running Shoes" 
                        className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded focus:border-slate-400 transition" 
                        required 
                    />
                </label>

                {/* Description */}
                <label className="flex flex-col gap-2 mb-5">
                    <span>Description <span className="text-red-400">*</span></span>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter product description" 
                        rows={4} 
                        className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded resize-none focus:border-slate-400 transition" 
                        required 
                    />
                </label>

                {/* Category and GST */}
                <div className="flex flex-wrap gap-5">
                    <label className="flex flex-col gap-2 flex-1 min-w-[200px]">
                        <span>Category <span className="text-red-400">*</span></span>
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded focus:border-slate-400 transition" 
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span>GST (%)</span>
                        <select 
                            value={gst} 
                            onChange={(e) => setGst(Number(e.target.value))}
                            className="w-full p-2.5 px-4 outline-none border border-slate-200 rounded min-w-[120px] focus:border-slate-400 transition"
                        >
                            {gstOptions.map((g) => (
                                <option key={g} value={g}>{g}%</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {/* Variants Section */}
            <div className="mt-6 p-6 border border-slate-200 rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-medium text-slate-700">Product Variants</h2>
                    <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">{variants.length} variant{variants.length > 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-slate-400 mb-5">Add different options like 64GB, 128GB, 256GB or Small, Medium, Large</p>

                {variants.map((variant, index) => (
                    <div key={variant.id} className="mb-5 p-5 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200">
                        {/* Variant Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-medium">
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
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded transition"
                                    title="Remove variant"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        {/* Variant Name & Color */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <label className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                                <span className="text-sm text-slate-600">Variant Name <span className="text-slate-400">(e.g., 64GB, Large, Red)</span></span>
                                <input 
                                    type="text" 
                                    value={variant.name} 
                                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                    placeholder="e.g., 128GB, XL, Blue" 
                                    className="w-full p-2.5 px-3 outline-none border border-slate-200 rounded bg-white focus:border-slate-400 transition"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-slate-600">Color <span className="text-slate-400">(Optional)</span></span>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={variant.color} 
                                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                        placeholder="Color name" 
                                        className="w-28 p-2.5 px-3 outline-none border border-slate-200 rounded bg-white focus:border-slate-400 transition"
                                    />
                                    <input 
                                        type="color" 
                                        value={variant.colorHex}
                                        onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                                        className="w-10 h-10 border border-slate-200 rounded cursor-pointer"
                                        title="Pick color"
                                    />
                                </div>
                            </label>
                        </div>

                        {/* Prices */}
                        <div className="flex flex-wrap gap-4 mb-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-slate-600">MRP ($) <span className="text-red-400">*</span></span>
                                <input 
                                    type="number" 
                                    value={variant.mrp} 
                                    onChange={(e) => updateVariant(index, 'mrp', e.target.value)}
                                    placeholder="0" 
                                    className="w-28 p-2.5 px-3 outline-none border border-slate-200 rounded bg-white focus:border-slate-400 transition" 
                                    required 
                                />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-sm text-slate-600">Selling Price ($) <span className="text-red-400">*</span></span>
                                <input 
                                    type="number" 
                                    value={variant.price} 
                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                    placeholder="0" 
                                    className="w-28 p-2.5 px-3 outline-none border border-slate-200 rounded bg-white focus:border-slate-400 transition" 
                                    required 
                                />
                            </label>
                            {variant.mrp && variant.price && Number(variant.price) < Number(variant.mrp) && (
                                <div className="flex items-end pb-2.5">
                                    <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">
                                        {Math.round((1 - Number(variant.price) / Number(variant.mrp)) * 100)}% off
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Images */}
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Product Images <span className="text-red-400">*</span></p>
                            <div className="flex gap-3 flex-wrap">
                                {Object.keys(variant.images).map((key) => (
                                    <label key={key} htmlFor={`img-${variant.id}-${key}`} className="cursor-pointer group">
                                        <div className="relative">
                                            <Image
                                                width={300}
                                                height={300}
                                                className='h-16 w-auto border border-slate-200 rounded bg-white group-hover:border-slate-400 transition'
                                                src={variant.images[key] ? URL.createObjectURL(variant.images[key]) : assets.upload_area}
                                                alt=""
                                            />
                                            {variant.images[key] && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs">✓</span>
                                                </span>
                                            )}
                                        </div>
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
                            <p className="text-xs text-slate-400 mt-2">Upload up to 4 images for this variant</p>
                        </div>
                    </div>
                ))}

                {/* Add Variant Button */}
                <button
                    type="button"
                    onClick={addVariant}
                    className="w-full py-3.5 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={20} />
                    Add Another Variant
                </button>
            </div>

            {/* Preview */}
            {productName && variants.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600 mb-3">Preview: How variants will appear on product page</p>
                    <div className="flex flex-wrap gap-2">
                        {variants.map((v, i) => (
                            <div key={i} className={`px-4 py-2 rounded-lg text-sm border-2 ${i === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                                {v.name || `Variant ${i + 1}`}
                                {v.price && <span className="ml-2 opacity-75">${v.price}</span>}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">Users will be able to switch between these variants on the product page</p>
                </div>
            )}

            {/* Submit Button */}
            <div className="mt-8">
                <button 
                    disabled={loading} 
                    className="bg-slate-800 text-white px-10 py-3.5 hover:bg-slate-900 rounded-lg transition disabled:opacity-50 font-medium"
                >
                    {loading ? 'Adding Product...' : 'Add Product'}
                </button>
            </div>
        </form>
    )
}
