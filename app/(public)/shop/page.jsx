'use client'
import { Suspense, useState, useMemo, useEffect } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import Loading from "@/components/Loading"

const categories = ['All', 'Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']
const PRODUCTS_PER_PAGE = 12

const sortOptions = [
    { label: 'Recommended', value: 'recommended' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Rating: High to Low', value: 'rating_desc' },
    { label: 'Name: A to Z', value: 'name_asc' },
]

const PRIORITY_VENDOR_EMAIL = 'eswaricartoo123@gmail.com'

// Skeleton loader for product cards
const ProductCardSkeleton = () => (
    <div className="animate-pulse">
        <div className="bg-slate-200 h-40 sm:h-68 rounded-lg"></div>
        <div className="mt-3 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
    </div>
)

function ShopContent() {
    const searchParams = useSearchParams()
    const search = searchParams.get('search')
    const categoryParam = searchParams.get('category')
    const router = useRouter()
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const { list: products, loading, error } = useSelector(state => state.product)

    // Filter states - initialize category from URL if valid
    const initialCategory = categoryParam && categories.includes(categoryParam) ? categoryParam : 'All'
    const [selectedCategory, setSelectedCategory] = useState(initialCategory)
    const [priceRange, setPriceRange] = useState({ min: '', max: '' })
    const [sortBy, setSortBy] = useState('recommended')
    const [showFilters, setShowFilters] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    // Sync category with URL param changes
    useEffect(() => {
        if (categoryParam && categories.includes(categoryParam)) {
            setSelectedCategory(categoryParam)
        } else if (!categoryParam) {
            setSelectedCategory('All')
        }
    }, [categoryParam])

    // Calculate max price for reference
    const maxProductPrice = useMemo(() => {
        return Math.max(...products.map(p => p.price), 0)
    }, [products])

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let result = [...products]

        // Search filter
        if (search) {
            result = result.filter(product =>
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.description.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Category filter
        if (selectedCategory !== 'All') {
            result = result.filter(product => product.category === selectedCategory)
        }

        // Price range filter
        if (priceRange.min !== '') {
            result = result.filter(product => product.price >= Number(priceRange.min))
        }
        if (priceRange.max !== '') {
            result = result.filter(product => product.price <= Number(priceRange.max))
        }

        // Sorting
        switch (sortBy) {
            case 'price_asc':
                result.sort((a, b) => a.price - b.price)
                break
            case 'price_desc':
                result.sort((a, b) => b.price - a.price)
                break
            case 'rating_desc':
                result.sort((a, b) => {
                    const ratingA = a.rating.length > 0 ? a.rating.reduce((acc, r) => acc + r.rating, 0) / a.rating.length : 0
                    const ratingB = b.rating.length > 0 ? b.rating.reduce((acc, r) => acc + r.rating, 0) / b.rating.length : 0
                    return ratingB - ratingA
                })
                break
            case 'name_asc':
                result.sort((a, b) => a.name.localeCompare(b.name))
                break
            case 'recommended':
            default:
                // Prioritize products from priority vendor, then sort by creation date
                result.sort((a, b) => {
                    const aIsPriority = a.store?.email === PRIORITY_VENDOR_EMAIL
                    const bIsPriority = b.store?.email === PRIORITY_VENDOR_EMAIL
                    
                    // Priority vendor products come first
                    if (aIsPriority && !bIsPriority) return -1
                    if (!aIsPriority && bIsPriority) return 1
                    
                    // Within same priority level, sort by creation date (newest first)
                    return new Date(b.createdAt) - new Date(a.createdAt)
                })
                break
        }

        return result
    }, [products, search, selectedCategory, priceRange, sortBy])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedCategory, priceRange, sortBy, search])

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
        return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)
    }, [filteredProducts, currentPage])

    const goToPage = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const clearFilters = () => {
        setSelectedCategory('All')
        setPriceRange({ min: '', max: '' })
        setSortBy('recommended')
        setCurrentPage(1)
    }

    const hasActiveFilters = selectedCategory !== 'All' || priceRange.min !== '' || priceRange.max !== '' || sortBy !== 'recommended'

    // Show error state
    if (error) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <p className="text-red-500 text-lg mb-2">Failed to load products</p>
                <p className="text-slate-400 text-sm">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
                >
                    Try Again
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-6">
                    <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 flex items-center gap-2 cursor-pointer">
                        {search && <MoveLeftIcon size={20} />}
                        All <span className="text-slate-700 font-medium">Products</span>
                        {!loading && (
                            <span className="text-sm font-normal text-slate-400">({filteredProducts.length} items)</span>
                        )}
                    </h1>
                    
                    {/* Mobile Filter Toggle */}
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="sm:hidden flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                    >
                        <SlidersHorizontal size={18} />
                        Filters & Sort
                    </button>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters - Desktop */}
                    <div className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:w-64 flex-shrink-0`}>
                        <div className="bg-white border border-slate-200 rounded-lg p-5 sticky top-4">
                            {/* Filter Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <SlidersHorizontal size={18} />
                                    Filters
                                </h2>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Sort By */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                                <div className="relative">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full p-2.5 pr-8 border border-slate-200 rounded-lg outline-none appearance-none bg-white text-sm"
                                    >
                                        {sortOptions.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {categories.map(category => (
                                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={selectedCategory === category}
                                                onChange={() => setSelectedCategory(category)}
                                                className="w-4 h-4 text-slate-600"
                                            />
                                            <span className="text-sm text-slate-600">{category}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Price Range
                                    {!loading && maxProductPrice > 0 && (
                                        <span className="font-normal text-slate-400 ml-1">(max: {currency}{maxProductPrice.toFixed(0)})</span>
                                    )}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={priceRange.min}
                                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm"
                                        min="0"
                                    />
                                    <span className="text-slate-400">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={priceRange.max}
                                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg outline-none text-sm"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Active Filters Tags */}
                            {hasActiveFilters && (
                                <div className="pt-4 border-t border-slate-200">
                                    <p className="text-xs text-slate-500 mb-2">Active filters:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCategory !== 'All' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                {selectedCategory}
                                                <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory('All')} />
                                            </span>
                                        )}
                                        {(priceRange.min || priceRange.max) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                {currency}{priceRange.min || '0'} - {currency}{priceRange.max || '∞'}
                                                <X size={12} className="cursor-pointer" onClick={() => setPriceRange({ min: '', max: '' })} />
                                            </span>
                                        )}
                                        {sortBy !== 'recommended' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                                {sortOptions.find(o => o.value === sortBy)?.label}
                                                <X size={12} className="cursor-pointer" onClick={() => setSortBy('recommended')} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Close button for mobile */}
                            <button 
                                onClick={() => setShowFilters(false)}
                                className="sm:hidden w-full mt-4 py-2 bg-slate-800 text-white rounded-lg"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            // Skeleton loader grid
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 mb-32">
                                {[...Array(8)].map((_, i) => (
                                    <ProductCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                                    {paginatedProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10 mb-20">
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => goToPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-1">
                                            {/* First page */}
                                            {currentPage > 3 && (
                                                <>
                                                    <button
                                                        onClick={() => goToPage(1)}
                                                        className="w-10 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                                    >
                                                        1
                                                    </button>
                                                    {currentPage > 4 && <span className="px-1 text-slate-400">...</span>}
                                                </>
                                            )}

                                            {/* Visible page numbers */}
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => {
                                                    if (totalPages <= 5) return true
                                                    if (page >= currentPage - 1 && page <= currentPage + 1) return true
                                                    return false
                                                })
                                                .map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                                                            currentPage === page
                                                                ? 'bg-slate-800 text-white'
                                                                : 'text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                            {/* Last page */}
                                            {currentPage < totalPages - 2 && (
                                                <>
                                                    {currentPage < totalPages - 3 && <span className="px-1 text-slate-400">...</span>}
                                                    <button
                                                        onClick={() => goToPage(totalPages)}
                                                        className="w-10 h-10 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                                                    >
                                                        {totalPages}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Next Button */}
                                        <button
                                            onClick={() => goToPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronRight size={20} />
                                        </button>

                                        {/* Page info */}
                                        <span className="ml-4 text-sm text-slate-500">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-slate-500 text-lg">No products found</p>
                                <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                                <button 
                                    onClick={clearFilters}
                                    className="mt-4 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function Shop() {
    return (
        <Suspense fallback={<Loading />}>
            <ShopContent />
        </Suspense>
    );
}
