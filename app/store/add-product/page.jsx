'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { X, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"

const availableColors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple', 'Orange', 'Gray', 'Brown']
const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

const createEmptyProduct = () => ({
    id: Date.now(),
    images: { 1: null, 2: null, 3: null, 4: null },
    name: "",
    description: "",
    mrp: 0,
    price: 0,
    category: "",
    colors: [],
    sizes: [],
    sizeInput: "",
    aiUsed: false
})

export default function StoreAddProduct() {
    const [products, setProducts] = useState([createEmptyProduct()])
    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    const updateProduct = (index, field, value) => {
        setProducts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
    }

    const handleImageUpload = async (productIndex, imageKey, file) => {
        const product = products[productIndex]
        updateProduct(productIndex, 'images', { ...product.images, [imageKey]: file })

        // AI analysis for first image
        if (imageKey === "1" && file && !product.aiUsed) {
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
                            loading: `Analyzing image for Product ${productIndex + 1}...`,
                            success: (res) => {
                                const data = res.data
                                if (data.name && data.description) {
                                    setProducts(prev => prev.map((p, i) => i === productIndex ? {
                                        ...p,
                                        name: data.name,
                                        description: data.description,
                                        aiUsed: true
                                    } : p))
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

    const addProduct = () => {
        setProducts(prev => [...prev, createEmptyProduct()])
    }

    const removeProduct = (index) => {
        if (products.length > 1) {
            setProducts(prev => prev.filter((_, i) => i !== index))
        }
    }

    const toggleColor = (productIndex, color) => {
        const product = products[productIndex]
        const newColors = product.colors.includes(color)
            ? product.colors.filter(c => c !== color)
            : [...product.colors, color]
        updateProduct(productIndex, 'colors', newColors)
    }

    const addSize = (productIndex) => {
        const product = products[productIndex]
        if (product.sizeInput.trim()) {
            const newSize = product.sizeInput.trim().toUpperCase()
            if (!product.sizes.includes(newSize)) {
                updateProduct(productIndex, 'sizes', [...product.sizes, newSize])
                updateProduct(productIndex, 'sizeInput', "")
            } else {
                toast.error("Size already added")
            }
        }
    }

    const removeSize = (productIndex, sizeIndex) => {
        const product = products[productIndex]
        updateProduct(productIndex, 'sizes', product.sizes.filter((_, i) => i !== sizeIndex))
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        
        // Validate all products
        for (let i = 0; i < products.length; i++) {
            const p = products[i]
            if (!p.images[1] && !p.images[2] && !p.images[3] && !p.images[4]) {
                return toast.error(`Product ${i + 1}: Please upload at least one image`)
            }
            if (!p.name || !p.description || !p.mrp || !p.price || !p.category) {
                return toast.error(`Product ${i + 1}: Please fill all required fields`)
            }
        }

        setLoading(true)
        const token = await getToken()
        let successCount = 0
        let failCount = 0

        try {
            // Submit each product
            for (let i = 0; i < products.length; i++) {
                const p = products[i]
                const formData = new FormData()
                formData.append('name', p.name)
                formData.append('description', p.description)
                formData.append('mrp', p.mrp)
                formData.append('price', p.price)
                formData.append('category', p.category)
                formData.append('colors', p.colors.join(','))
                formData.append('sizes', p.sizes.join(','))

                Object.keys(p.images).forEach((key) => {
                    p.images[key] && formData.append('images', p.images[key])
                })

                try {
                    await axios.post('/api/store/product', formData, { headers: { Authorization: `Bearer ${token}` } })
                    successCount++
                } catch (error) {
                    failCount++
                    console.error(`Failed to add product ${i + 1}:`, error)
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} product${successCount > 1 ? 's' : ''} added successfully!`)
                setProducts([createEmptyProduct()])
            }
            if (failCount > 0) {
                toast.error(`${failCount} product${failCount > 1 ? 's' : ''} failed to add`)
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: `Adding ${products.length} Product${products.length > 1 ? 's' : ''}...` })} className="text-slate-500 mb-28">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
                <span className="text-sm bg-slate-100 px-3 py-1 rounded-full">{products.length} product{products.length > 1 ? 's' : ''}</span>
            </div>

            {products.map((product, productIndex) => (
                <div key={product.id} className="mt-8 p-6 border border-slate-200 rounded-lg relative">
                    {/* Product Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-slate-700">Product {productIndex + 1}</h2>
                        {products.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeProduct(productIndex)}
                                className="text-red-500 hover:text-red-600 transition p-1"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>

                    {/* Product Images */}
                    <p className="mb-2">Product Images</p>
                    <div className="flex gap-3">
                        {Object.keys(product.images).map((key) => (
                            <label key={key} htmlFor={`images-${product.id}-${key}`} className="cursor-pointer">
                                <Image
                                    width={300}
                                    height={300}
                                    className='h-15 w-auto border border-slate-200 rounded'
                                    src={product.images[key] ? URL.createObjectURL(product.images[key]) : assets.upload_area}
                                    alt=""
                                />
                                <input
                                    type="file"
                                    accept='image/*'
                                    id={`images-${product.id}-${key}`}
                                    onChange={e => handleImageUpload(productIndex, key, e.target.files[0])}
                                    hidden
                                />
                            </label>
                        ))}
                    </div>

                    {/* Name */}
                    <label className="flex flex-col gap-2 my-6">
                        Name
                        <input 
                            type="text" 
                            value={product.name} 
                            onChange={(e) => updateProduct(productIndex, 'name', e.target.value)}
                            placeholder="Enter product name" 
                            className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" 
                            required 
                        />
                    </label>

                    {/* Description */}
                    <label className="flex flex-col gap-2 my-6">
                        Description
                        <textarea 
                            value={product.description} 
                            onChange={(e) => updateProduct(productIndex, 'description', e.target.value)}
                            placeholder="Enter product description" 
                            rows={4} 
                            className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" 
                            required 
                        />
                    </label>

                    {/* Prices */}
                    <div className="flex gap-5">
                        <label className="flex flex-col gap-2">
                            Actual Price ($)
                            <input 
                                type="number" 
                                value={product.mrp} 
                                onChange={(e) => updateProduct(productIndex, 'mrp', e.target.value)}
                                placeholder="0" 
                                className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" 
                                required 
                            />
                        </label>
                        <label className="flex flex-col gap-2">
                            Offer Price ($)
                            <input 
                                type="number" 
                                value={product.price} 
                                onChange={(e) => updateProduct(productIndex, 'price', e.target.value)}
                                placeholder="0" 
                                className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" 
                                required 
                            />
                        </label>
                    </div>

                    {/* Category */}
                    <select 
                        value={product.category} 
                        onChange={(e) => updateProduct(productIndex, 'category', e.target.value)}
                        className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded" 
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>

                    {/* Colors */}
                    <div className="my-6">
                        <p className="mb-2">Colors <span className="text-slate-400 text-sm">(Optional)</span></p>
                        <div className="flex flex-wrap gap-2 max-w-sm">
                            {availableColors.map((color) => (
                                <button
                                    type="button"
                                    key={color}
                                    onClick={() => toggleColor(productIndex, color)}
                                    className={`px-3 py-1 rounded border transition ${
                                        product.colors.includes(color) 
                                            ? 'bg-slate-800 text-white border-slate-800' 
                                            : 'border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                        {product.colors.length > 0 && (
                            <p className="mt-2 text-sm text-slate-400">Selected: {product.colors.join(', ')}</p>
                        )}
                    </div>

                    {/* Sizes */}
                    <div className="my-6">
                        <p className="mb-2">Sizes <span className="text-slate-400 text-sm">(Optional)</span></p>
                        <div className="flex items-center gap-3 max-w-sm">
                            <input 
                                type="text" 
                                value={product.sizeInput} 
                                onChange={(e) => updateProduct(productIndex, 'sizeInput', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addSize(productIndex)
                                    }
                                }}
                                placeholder="Enter size (e.g. XL, 42, 128GB)" 
                                className="flex-1 p-2 px-4 outline-none border border-slate-200 rounded"
                            />
                            <button
                                type="button"
                                onClick={() => addSize(productIndex)}
                                className="p-2 bg-slate-800 text-white rounded hover:bg-slate-900 transition"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {product.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {product.sizes.map((size, sizeIndex) => (
                                    <div 
                                        key={sizeIndex} 
                                        className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full"
                                    >
                                        <span className="text-sm font-medium">{size}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeSize(productIndex, sizeIndex)}
                                            className="text-slate-400 hover:text-red-500 transition"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Add Another Product Button */}
            <button
                type="button"
                onClick={addProduct}
                className="mt-6 w-full max-w-sm border-2 border-dashed border-slate-300 text-slate-500 p-4 rounded-lg hover:border-slate-400 hover:text-slate-600 transition flex items-center justify-center gap-2"
            >
                <Plus size={20} />
                Add Another Product
            </button>

            {/* Submit Button */}
            <div className="mt-8">
                <button 
                    disabled={loading} 
                    className="bg-slate-800 text-white px-8 py-3 hover:bg-slate-900 rounded transition disabled:opacity-50"
                >
                    {loading ? 'Adding...' : `Add ${products.length} Product${products.length > 1 ? 's' : ''}`}
                </button>
            </div>
        </form>
    )
}
