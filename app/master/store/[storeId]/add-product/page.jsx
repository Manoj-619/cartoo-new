'use client'
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Plus, Trash2, Package, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { assets } from "@/assets/assets"
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

    const handleImageUpload = (colorIndex, imageKey, file) => {
        const cv = colorVariants[colorIndex]
        updateColorVariant(colorIndex, 'images', { ...cv.images, [imageKey]: file })
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
            
            // Validate pricing (size is optional, but prices are required)
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
            
            formData.append('storeId', storeId)
            formData.append('name', productName)
            formData.append('description', description)
            formData.append('gst', gst)
            formData.append('category', category)
            
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

            colorVariants.forEach((cv, index) => {
                Object.keys(cv.images).forEach((key) => {
                    if (cv.images[key]) {
                        formData.append(`variant_${index}_images`, cv.images[key])
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
                <p className="text-slate-500 mb-6">Add a product with multiple colors and sizes</p>

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
                                placeholder="e.g., Cotton T-Shirt, Running Shoes" 
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
                        <h2 className="font-medium text-slate-700">Variants</h2>
                        <span className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
                            {colorVariants.length} variant{colorVariants.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    {colorVariants.map((colorVariant, colorIndex) => (
                        <div key={colorVariant.id} className="mb-4 border border-slate-200 rounded-xl overflow-hidden">
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
                                        className="flex-1 max-w-[300px] px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-400 transition"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {colorVariants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); removeColorVariant(colorIndex); }}
                                            className="text-red-500 hover:text-red-600 p-1.5"
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
                                <div className="p-5 bg-slate-50">
                                    {/* Color (Optional) */}
                                    <div className="mb-4 p-4 bg-white rounded-lg border border-slate-100">
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Color <span className="text-slate-400">(Optional)</span></label>
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
                                                className="flex-1 max-w-[250px] p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-600 mb-2">Product Images <span className="text-red-400">*</span></label>
                                        <div className="flex gap-3 flex-wrap">
                                            {Object.keys(colorVariant.images).map((key) => (
                                                <label key={key} htmlFor={`img-${colorVariant.id}-${key}`} className="cursor-pointer group">
                                                    <div className="relative">
                                                        <Image
                                                            width={300}
                                                            height={300}
                                                            className='h-16 w-auto border border-slate-200 rounded-lg bg-white group-hover:border-purple-400 transition'
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

                                    {/* Sizes & Pricing */}
                                    <div className="border-t border-slate-200 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-medium text-slate-600">Sizes & Pricing <span className="text-slate-400">(Optional)</span></label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">Quick add:</span>
                                                <button
                                                    type="button"
                                                    onClick={() => addQuickSizes(colorIndex, ['S', 'M', 'L', 'XL'])}
                                                    className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                                >
                                                    S-XL
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => addQuickSizes(colorIndex, ['XS', 'S', 'M', 'L', 'XL', 'XXL'])}
                                                    className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                                >
                                                    All
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {colorVariant.sizes.map((size, sizeIndex) => (
                                                <div key={size.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                                                    <div className="flex-1 grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-600 mb-1">Size</label>
                                                            <input
                                                                type="text"
                                                                value={size.size}
                                                                onChange={(e) => updateSize(colorIndex, sizeIndex, 'size', e.target.value)}
                                                                placeholder="S, M, L"
                                                                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-purple-400"
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
                                                                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-purple-400"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-600 mb-1">Offer Price <span className="text-red-400">*</span></label>
                                                            <input
                                                                type="number"
                                                                value={size.price}
                                                                onChange={(e) => updateSize(colorIndex, sizeIndex, 'price', e.target.value)}
                                                                placeholder="0"
                                                                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-purple-400"
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
                                            className="w-full mt-3 py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-purple-400 hover:text-purple-600 transition flex items-center justify-center gap-1 text-sm"
                                        >
                                            <Plus size={14} /> Add Size
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addColorVariant}
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
