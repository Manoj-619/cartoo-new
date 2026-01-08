'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { addToWishlist, removeFromWishlist } from "@/lib/features/wishlist/wishlistSlice";
import { StarIcon, TagIcon, CreditCardIcon, Heart, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const cart = useSelector(state => state.cart.cartItems);
    const wishlistProductIds = useSelector(state => state.wishlist.productIds);
    const isInWishlist = wishlistProductIds.includes(productId);
    const dispatch = useDispatch();
    const { getToken, isSignedIn } = useAuth();

    const router = useRouter()

    // Parse variants from product - handle both old and new structure
    const { colorVariants, hasNewStructure } = useMemo(() => {
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            // Check if it's the new structure (has sizes array)
            const isNewStructure = product.variants[0]?.sizes && Array.isArray(product.variants[0].sizes)
            
            if (isNewStructure) {
                return { colorVariants: product.variants, hasNewStructure: true }
            }
            
            // Old flat structure - convert to display
            return { 
                colorVariants: product.variants.map(v => ({
                    ...v,
                    sizes: [{ size: v.name || 'Default', mrp: v.mrp, price: v.price }]
                })), 
                hasNewStructure: false 
            }
        }
        
        // Fallback for products without variants
        return {
            colorVariants: [{
                name: "",
                color: product.colors?.[0] || "",
                colorHex: "#000000",
                images: product.images,
                sizes: [{ size: 'Default', mrp: product.mrp, price: product.price }]
            }],
            hasNewStructure: false
        }
    }, [product])

    // Check if we should show variant selector (multiple variants with names or colors)
    const hasValidVariants = colorVariants.length > 1 || colorVariants.some(cv => cv.name || cv.color)
    const showVariantSelector = hasValidVariants && colorVariants.some(cv => cv.name || cv.color)

    const [selectedColorIndex, setSelectedColorIndex] = useState(0)
    const [selectedSizeIndex, setSelectedSizeIndex] = useState(0)
    
    const selectedColor = colorVariants[selectedColorIndex]
    const selectedSize = selectedColor?.sizes?.[selectedSizeIndex] || { mrp: product.mrp, price: product.price }
    
    // Check if we should show size selector (has actual size values, not empty or 'Default')
    const hasValidSizes = selectedColor?.sizes?.some(s => s.size && s.size !== 'Default' && s.size.trim() !== '')
    
    const [mainImage, setMainImage] = useState(selectedColor.images?.[0] || product.images[0]);

    // Update main image when color changes
    const handleColorChange = (index) => {
        setSelectedColorIndex(index)
        setSelectedSizeIndex(0) // Reset size selection when color changes
        const newColor = colorVariants[index]
        if (newColor.images?.[0]) {
            setMainImage(newColor.images[0])
        }
    }

    const handleSizeChange = (index) => {
        setSelectedSizeIndex(index)
    }

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
    }

    const handleWishlistClick = () => {
        if (!isSignedIn) {
            toast.error('Please sign in to add to wishlist')
            return
        }

        if (isInWishlist) {
            dispatch(removeFromWishlist({ productId, getToken }))
            toast.success('Removed from wishlist')
        } else {
            dispatch(addToWishlist({ productId, getToken }))
            toast.success('Added to wishlist')
        }
    }

    const averageRating = product.rating.length > 0 
        ? product.rating.reduce((acc, item) => acc + item.rating, 0) / product.rating.length 
        : 0;

    // Get current display values
    const currentPrice = selectedSize.price || product.price
    const currentMrp = selectedSize.mrp || product.mrp
    const currentImages = selectedColor.images || product.images
    const discountPercent = ((currentMrp - currentPrice) / currentMrp * 100).toFixed(0)
    
    return (
        <div className="flex max-lg:flex-col gap-12">
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {currentImages.map((image, index) => (
                        <div 
                            key={index} 
                            onClick={() => setMainImage(image)} 
                            className={`bg-slate-100 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-lg group cursor-pointer transition overflow-hidden p-2 ${mainImage === image ? 'ring-2 ring-slate-800' : ''}`}
                        >
                            <Image 
                                src={image} 
                                className="w-full h-full object-contain group-hover:scale-105 group-active:scale-95 transition" 
                                alt="" 
                                width={80} 
                                height={80} 
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center w-full sm:w-[450px] h-[350px] sm:h-[450px] bg-slate-100 rounded-lg overflow-hidden p-4">
                    <Image 
                        src={mainImage} 
                        alt="" 
                        width={400} 
                        height={400} 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
            <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                    <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                    <button 
                        onClick={handleWishlistClick}
                        className="p-2 rounded-full border border-slate-200 hover:border-red-300 transition"
                        title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart 
                            size={22} 
                            className={isInWishlist ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-500'} 
                        />
                    </button>
                </div>

                {/* Vendor Name */}
                {product.store?.name && (
                    <p className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                        <Store size={14} />
                        Sold by <span className="font-medium text-slate-700">{product.store.name}</span>
                    </p>
                )}

                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{product.rating.length} Reviews</p>
                </div>

                {/* Variant Selector - only show if there are multiple variants with names or colors */}
                {showVariantSelector && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-slate-600 mb-3">
                            {selectedColor.color ? 'Color' : 'Variant'}: <span className="text-slate-800">{selectedColor.name || selectedColor.color}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {colorVariants.map((variant, index) => {
                                const displayName = variant.name || variant.color
                                if (!displayName) return null // Skip variants without name or color
                                
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleColorChange(index)}
                                        className={`px-4 py-2.5 rounded-lg border-2 transition font-medium text-sm flex items-center gap-2 ${
                                            selectedColorIndex === index 
                                                ? 'bg-slate-800 text-white border-slate-800' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                        }`}
                                    >
                                        {variant.color && (
                                            <span 
                                                className="w-4 h-4 rounded-full border border-slate-300" 
                                                style={{ backgroundColor: variant.colorHex || '#6B7280' }}
                                            />
                                        )}
                                        {displayName}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Size Selector - only show if there are actual sizes with values */}
                {hasValidSizes && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-slate-600 mb-3">
                            Size: <span className="text-slate-800">{selectedSize.size}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {selectedColor.sizes.filter(s => s.size && s.size !== 'Default' && s.size.trim() !== '').map((sizeVar, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSizeChange(index)}
                                    className={`min-w-[50px] px-4 py-2.5 rounded-lg border-2 transition font-medium text-sm ${
                                        selectedSizeIndex === index 
                                            ? 'bg-slate-800 text-white border-slate-800' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                    }`}
                                >
                                    {sizeVar.size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p>{currency}{currentPrice}</p>
                    {currentMrp > currentPrice && (
                        <p className="text-xl text-slate-500 line-through">{currency}{currentMrp}</p>
                    )}
                </div>

                {currentMrp > currentPrice && (
                    <div className="flex items-center gap-2 text-slate-500">
                        <TagIcon size={14} />
                        <p>Save {discountPercent}% right now</p>
                    </div>
                )}

                <div className="flex items-end gap-5 mt-10">
                    {
                        cart[productId] && (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} />
                            </div>
                        )
                    }
                    <button onClick={() => !cart[productId] ? addToCartHandler() : router.push('/cart')} className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition">
                        {!cart[productId] ? 'Add to Cart' : 'View Cart'}
                    </button>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    {/* <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p> */}
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    {/* <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p> */}
                </div>

            </div>
        </div>
    )
}

export default ProductDetails
