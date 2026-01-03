'use client'
import { Heart, StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '@/lib/features/wishlist/wishlistSlice'
import { toast } from 'react-hot-toast'

const ProductCard = ({ product }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const { getToken, isSignedIn } = useAuth()
    const dispatch = useDispatch()
    const wishlistProductIds = useSelector(state => state.wishlist.productIds)
    const isInWishlist = wishlistProductIds.includes(product.id)

    // calculate the average rating of the product
    const rating = Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length);

    const handleWishlistClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (!isSignedIn) {
            toast.error('Please sign in to add to wishlist')
            return
        }

        if (isInWishlist) {
            dispatch(removeFromWishlist({ productId: product.id, getToken }))
            toast.success('Removed from wishlist')
        } else {
            dispatch(addToWishlist({ productId: product.id, getToken }))
            toast.success('Added to wishlist')
        }
    }

    return (
        <Link href={`/product/${product.id}`} className='group max-xl:mx-auto relative'>
            <div className='bg-[#F5F5F5] h-40 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center relative'>
                <Image width={500} height={500} className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300' src={product.images[0]} alt="" />
                <button 
                    onClick={handleWishlistClick}
                    className='absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition shadow-sm'
                >
                    <Heart 
                        size={18} 
                        className={isInWishlist ? 'text-red-500 fill-red-500' : 'text-slate-400 hover:text-red-500'} 
                    />
                </button>
            </div>
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60'>
                <div>
                    <p>{product.name}</p>
                    <div className='flex'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                </div>
                <p>{currency}{product.price}</p>
            </div>
        </Link>
    )
}

export default ProductCard