'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Plus, Trash2, Package, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"

const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const gstOptions = [0, 5, 18, 40]
const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

const createEmptySize = () => ({
    id: Date.now() + Math.random(),
    size: "",
    mrp: "",
    price: ""
})

const createEmptyColorVariant = () => ({
    id: Date.now() + Math.random(),
    name: "",  // Variant name (e.g., "Summer Collection", "Premium", etc.)
    color: "",
    colorHex: "#000000",
    images: { 1: null, 2: null, 3: null, 4: null },
    sizes: [createEmptySize()],
    expanded: true
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
    
    // Color variants (each color has multiple sizes)
    const [colorVariants, setColorVariants] = useState([createEmptyColorVariant()])

    const updateColorVariant = (colorIndex, field, value) => {
        setColorVariants(prev => prev.map((cv, i) => 
            i === colorIndex ? { ...cv, [field]: value } : cv
        ))
    }

    const toggleColorExpanded = (colorIndex) => {
        setColorVariants(prev => prev.map((cv, i) => 
            i === colorIndex ? { ...cv, expanded: !cv.expanded } : cv
        ))
    }

    const updateSize = (colorIndex, sizeIndex, field, value) => {
        setColorVariants(prev => prev.map((cv, ci) => 
            ci === colorIndex 
                ? { 
                    ...cv, 
                    sizes: cv.sizes.map((s, si) => 
                        si === sizeIndex ? { ...s, [field]: value } : s
                    )
                }
                : cv
        ))
    }

    const addSize = (colorIndex) => {
        const lastSize = colorVariants[colorIndex].sizes[colorVariants[colorIndex].sizes.length - 1]
        const newSize = createEmptySize()
        // Copy prices from last size for convenience
        if (lastSize) {
            newSize.mrp = lastSize.mrp
            newSize.price = lastSize.price
        }
        setColorVariants(prev => prev.map((cv, i) => 
            i === colorIndex ? { ...cv, sizes: [...cv.sizes, newSize] } : cv
        ))
    }

    const removeSize = (colorIndex, sizeIndex) => {
        if (colorVariants[colorIndex].sizes.length > 1) {
            setColorVariants(prev => prev.map((cv, i) => 
                i === colorIndex 
                    ? { ...cv, sizes: cv.sizes.filter((_, si) => si !== sizeIndex) }
                    : cv
            ))
        }
    }

    const handleImageUpload = async (colorIndex, imageKey, file) => {
        const cv = colorVariants[colorIndex]
        updateColorVariant(colorIndex, 'images', { ...cv.images, [imageKey]: file })

        // AI analysis for first image of first color
        if (colorIndex === 0 && imageKey === "1" && file && !aiUsed) {
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

    const addColorVariant = () => {
        setColorVariants(prev => [...prev, createEmptyColorVariant()])
    }

    const removeColorVariant = (colorIndex) => {
        if (colorVariants.length > 1) {
            setColorVariants(prev => prev.filter((_, i) => i !== colorIndex))
        }
    }

    const addQuickSizes = (colorIndex, sizesToAdd) => {
        const existingSizes = colorVariants[colorIndex].sizes.map(s => s.size.toUpperCase())
        const newSizes = sizesToAdd.filter(s => !existingSizes.includes(s.toUpperCase()))
        
        if (newSizes.length === 0) {
            toast.error('All selected sizes already exist')
            return
        }

        const lastSize = colorVariants[colorIndex].sizes[colorVariants[colorIndex].sizes.length - 1]
        const sizesWithPrices = newSizes.map(size => ({
            id: Date.now() + Math.random(),
            size,
            mrp: lastSize?.mrp || "",
            price: lastSize?.price || ""
        }))

        setColorVariants(prev => prev.map((cv, i) => 
            i === colorIndex 
                ? { ...cv, sizes: [...cv.sizes.filter(s => s.size), ...sizesWithPrices] }
                : cv
        ))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        
        // Validate product info
        if (!productName || !description || !category) {
            return toast.error("Please fill product name, description and category")
        }

        // Validate variants
        for (let ci = 0; ci < colorVariants.length; ci++) {
            const cv = colorVariants[ci]
            const variantLabel = cv.name || `Variant ${ci + 1}`
            const hasImages = cv.images[1] || cv.images[2] || cv.images[3] || cv.images[4]
            
            if (!hasImages) {
                return toast.error(`${variantLabel}: Please upload at least one image`)
            }
            
            // Validate pricing (size is optional, but if entered, prices are required)
            for (let si = 0; si < cv.sizes.length; si++) {
                const size = cv.sizes[si]
                if (!size.mrp || !size.price) {
                    const sizeLabel = size.size || `Entry ${si + 1}`
                    return toast.error(`${variantLabel}, ${sizeLabel}: Please enter Actual Price and Offer Price`)
                }
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
            const variantsForJson = colorVariants.map(cv => ({
                name: cv.name || "",
                color: cv.color,
                colorHex: cv.colorHex,
                sizes: cv.sizes.map(s => ({
                    size: s.size,
                    mrp: parseFloat(s.mrp),
                    price: parseFloat(s.price)
                }))
            }))
            formData.append('variants', JSON.stringify(variantsForJson))

            // Append images for each color variant
            colorVariants.forEach((cv, index) => {
                Object.keys(cv.images).forEach((key) => {
                    if (cv.images[key]) {
                        formData.append(`variant_${index}_images`, cv.images[key])
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
            setColorVariants([createEmptyColorVariant()])
            
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
            <p className="text-sm text-slate-400 mb-6">Create a product with multiple variants</p>

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
                        placeholder="e.g., Cotton T-Shirt, Running Shoes, Formal Shirt" 
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
                    <h2 className="text-lg font-medium text-slate-700">Variants</h2>
                    <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        {colorVariants.length} variant{colorVariants.length > 1 ? 's' : ''}
                    </span>
                </div>
                <p className="text-sm text-slate-400 mb-5">Add different variants with color and size options</p>

                {colorVariants.map((colorVariant, colorIndex) => (
                    <div key={colorVariant.id} className="mb-5 border border-slate-200 rounded-lg overflow-hidden bg-gradient-to-br from-slate-50 to-white">
                        {/* Variant Header */}
                        <div className="flex items-center justify-between p-4 bg-slate-100">
                            <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm font-medium text-slate-500">#{colorIndex + 1}</span>
                                <input 
                                    type="text" 
                                    value={colorVariant.name} 
                                    onChange={(e) => updateColorVariant(colorIndex, 'name', e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Enter variant name (e.g., 64GB, Premium, Classic)"
                                    className="flex-1 max-w-[300px] px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded outline-none focus:border-slate-400 transition"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {colorVariants.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeColorVariant(colorIndex); }}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                                        title="Remove variant"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => toggleColorExpanded(colorIndex)}
                                    className="p-1 hover:bg-slate-200 rounded transition"
                                >
                                    {colorVariant.expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Variant Content */}
                        {colorVariant.expanded && (
                            <div className="p-5">
                                {/* Color (Optional) */}
                                <div className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-sm font-medium text-slate-600 mb-3">Color <span className="text-slate-400">(Optional)</span></p>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={colorVariant.colorHex}
                                            onChange={(e) => updateColorVariant(colorIndex, 'colorHex', e.target.value)}
                                            className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                                            title="Pick color"
                                        />
                                        <input 
                                            type="text" 
                                            value={colorVariant.color} 
                                            onChange={(e) => updateColorVariant(colorIndex, 'color', e.target.value)}
                                            placeholder="e.g., Red, Navy Blue, Black"
                                            className="flex-1 max-w-[250px] p-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded outline-none focus:border-slate-400 transition"
                                        />
                                    </div>
                                </div>

                                {/* Images */}
                                <div className="mb-5">
                                    <p className="text-sm font-medium text-slate-600 mb-2">Product Images <span className="text-red-400">*</span></p>
                                    <div className="flex gap-3 flex-wrap">
                                        {Object.keys(colorVariant.images).map((key) => (
                                            <label key={key} htmlFor={`img-${colorVariant.id}-${key}`} className="cursor-pointer group">
                                                <div className="relative">
                                                    <Image
                                                        width={300}
                                                        height={300}
                                                        className='h-16 w-auto border border-slate-200 rounded bg-white group-hover:border-slate-400 transition'
                                                        src={colorVariant.images[key] ? URL.createObjectURL(colorVariant.images[key]) : assets.upload_area}
                                                        alt=""
                                                    />
                                                    {colorVariant.images[key] && (
                                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs">✓</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept='image/*'
                                                    id={`img-${colorVariant.id}-${key}`}
                                                    onChange={e => handleImageUpload(colorIndex, key, e.target.files[0])}
                                                    hidden
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Upload up to 4 images for this variant</p>
                                </div>

                                {/* Sizes Section */}
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-slate-600">
                                            Sizes & Pricing <span className="text-slate-400">(Optional)</span>
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">Quick add:</span>
                                            <button
                                                type="button"
                                                onClick={() => addQuickSizes(colorIndex, ['S', 'M', 'L', 'XL'])}
                                                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                            >
                                                S-XL
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addQuickSizes(colorIndex, ['XS', 'S', 'M', 'L', 'XL', 'XXL'])}
                                                className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                            >
                                                All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {colorVariant.sizes.map((size, sizeIndex) => (
                                            <div key={size.id} className="flex items-center gap-3 p-3 bg-white rounded border border-slate-100">
                                                <div className="flex-1 grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">Size</label>
                                                        <input
                                                            type="text"
                                                            value={size.size}
                                                            onChange={(e) => updateSize(colorIndex, sizeIndex, 'size', e.target.value)}
                                                            placeholder="e.g., S, M, L"
                                                            className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-slate-400"
                                                            list={`sizes-${colorVariant.id}`}
                                                        />
                                                        <datalist id={`sizes-${colorVariant.id}`}>
                                                            {defaultSizes.map(s => <option key={s} value={s} />)}
                                                        </datalist>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">Actual Price <span className="text-red-400">*</span></label>
                                                        <input
                                                            type="number"
                                                            value={size.mrp}
                                                            onChange={(e) => updateSize(colorIndex, sizeIndex, 'mrp', e.target.value)}
                                                            placeholder="0"
                                                            className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-slate-400"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">Offer Price <span className="text-red-400">*</span></label>
                                                        <input
                                                            type="number"
                                                            value={size.price}
                                                            onChange={(e) => updateSize(colorIndex, sizeIndex, 'price', e.target.value)}
                                                            placeholder="0"
                                                            className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-slate-400"
                                                        />
                                                    </div>
                                                </div>
                                                {colorVariant.sizes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSize(colorIndex, sizeIndex)}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => addSize(colorIndex)}
                                        className="w-full mt-3 py-2 border border-dashed border-slate-300 text-slate-500 rounded hover:border-slate-400 hover:text-slate-600 transition flex items-center justify-center gap-1 text-sm"
                                    >
                                        <Plus size={14} />
                                        Add Size
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Variant Button */}
                <button
                    type="button"
                    onClick={addColorVariant}
                    className="w-full py-3.5 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition flex items-center justify-center gap-2 font-medium"
                >
                    <Plus size={20} />
                    Add Another Variant
                </button>
            </div>

            {/* Preview */}
            {productName && colorVariants.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-600 mb-3">Preview: How variants will appear</p>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Colors:</p>
                            <div className="flex flex-wrap gap-2">
                                {colorVariants.filter(cv => cv.color).map((cv, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
                                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: cv.colorHex }} />
                                        <span className="text-sm text-slate-600">{cv.color}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Sizes (for {colorVariants[0]?.color || 'first color'}):</p>
                            <div className="flex flex-wrap gap-2">
                                {colorVariants[0]?.sizes.filter(s => s.size).map((s, i) => (
                                    <div key={i} className={`px-3 py-1.5 rounded-lg text-sm border ${i === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                                        {s.size}
                                        {s.price && <span className="ml-1 opacity-75">₹{s.price}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
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
