'use client'
import React from 'react'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

// Skeleton loader for product cards
const ProductCardSkeleton = () => (
    <div className="animate-pulse w-full sm:w-60">
        <div className="bg-slate-200 h-40 sm:h-68 rounded-lg"></div>
        <div className="mt-3 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
    </div>
)

const LatestProducts = () => {

    const displayQuantity = 4
    const { list: products, loading } = useSelector(state => state.product)

    return (
        <div className='px-6 my-30 max-w-6xl mx-auto'>
            <Title 
                title='Latest Products' 
                description={loading ? 'Loading products...' : `Showing ${products.length < displayQuantity ? products.length : displayQuantity} of ${products.length} products`} 
                href='/shop' 
            />
            <div className='mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 justify-between'>
                {loading ? (
                    // Show skeleton loaders
                    [...Array(displayQuantity)].map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))
                ) : (
                    products.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, displayQuantity).map((product, index) => (
                        <ProductCard key={index} product={product} />
                    ))
                )}
            </div>
        </div>
    )
}

export default LatestProducts
