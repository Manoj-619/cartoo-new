'use client'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '@clerk/nextjs'
import { fetchWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { addToCart } from '@/lib/features/cart/cartSlice'
import { Heart, ShoppingCart, Trash2, StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import Loading from '@/components/Loading'

export default function WishlistPage() {
    const dispatch = useDispatch()
    const { getToken, isSignedIn, isLoaded } = useAuth()
    const { items, loading } = useSelector(state => state.wishlist)
    const cart = useSelector(state => state.cart.cartItems)
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    useEffect(() => {
        if (isSignedIn) {
            dispatch(fetchWishlist({ getToken }))
        }
    }, [isSignedIn, dispatch, getToken])

    const handleRemove = (productId) => {
        dispatch(removeFromWishlist({ productId, getToken }))
        toast.success('Removed from wishlist')
    }

    const handleAddToCart = (productId) => {
        dispatch(addToCart({ productId }))
        toast.success('Added to cart')
    }

    if (!isLoaded || loading) {
        return <Loading />
    }

    if (!isSignedIn) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="text-center">
                    <Heart size={64} className="mx-auto text-slate-300 mb-4" />
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Sign in to view your wishlist</h1>
                    <p className="text-slate-500 mb-6">Save your favorite items and access them anytime</p>
                    <Link href="/sign-in" className="bg-slate-800 text-white px-6 py-3 rounded hover:bg-slate-900 transition">
                        Sign In
                    </Link>
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="text-center">
                    <Heart size={64} className="mx-auto text-slate-300 mb-4" />
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Your wishlist is empty</h1>
                    <p className="text-slate-500 mb-6">Start adding items you love to your wishlist</p>
                    <Link href="/" className="bg-slate-800 text-white px-6 py-3 rounded hover:bg-slate-900 transition">
                        Browse Products
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-3 mb-8">
                <Heart size={28} className="text-red-500" />
                <h1 className="text-2xl font-semibold text-slate-800">My Wishlist</h1>
                <span className="text-slate-500">({items.length} items)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(({ product }) => {
                    const rating = Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length) || 0
                    const isInCart = cart[product.id]

                    return (
                        <div key={product.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden group">
                            <Link href={`/product/${product.id}`}>
                                <div className="bg-slate-100 h-48 flex items-center justify-center relative">
                                    <Image 
                                        src={product.images[0]} 
                                        alt={product.name}
                                        width={150}
                                        height={150}
                                        className="max-h-36 w-auto group-hover:scale-110 transition duration-300"
                                    />
                                </div>
                            </Link>
                            <div className="p-4">
                                <Link href={`/product/${product.id}`}>
                                    <h3 className="font-medium text-slate-800 hover:text-slate-600 transition line-clamp-1">
                                        {product.name}
                                    </h3>
                                </Link>
                                <div className="flex items-center mt-1">
                                    {Array(5).fill('').map((_, index) => (
                                        <StarIcon key={index} size={12} className='text-transparent' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                    ))}
                                    <span className="text-xs text-slate-400 ml-2">({product.rating.length})</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-lg font-semibold text-slate-800">{currency}{product.price}</span>
                                    {product.mrp > product.price && (
                                        <span className="text-sm text-slate-400 line-through">{currency}{product.mrp}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => handleAddToCart(product.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-sm font-medium transition ${
                                            isInCart 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`}
                                    >
                                        <ShoppingCart size={16} />
                                        {isInCart ? 'In Cart' : 'Add to Cart'}
                                    </button>
                                    <button
                                        onClick={() => handleRemove(product.id)}
                                        className="p-2 border border-slate-200 rounded hover:border-red-300 hover:bg-red-50 transition"
                                        title="Remove from wishlist"
                                    >
                                        <Trash2 size={18} className="text-slate-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
