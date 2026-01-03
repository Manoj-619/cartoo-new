'use client'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { categories as defaultCategories } from "@/assets/assets"

// These are the valid categories from the shop page filter
const shopCategories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

const CategoriesMarquee = () => {
    const router = useRouter()
    const [categories, setCategories] = useState(defaultCategories)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/api/admin/banner')
                if (data.settings?.marqueeCategories) {
                    const cats = data.settings.marqueeCategories.split(',').filter(Boolean).map(c => c.trim())
                    if (cats.length > 0) {
                        setCategories(cats)
                    }
                }
            } catch (error) {
                // Use default categories
            } finally {
                setLoading(false)
            }
        }
        fetchCategories()
    }, [])

    const handleCategoryClick = (category) => {
        // Check if category matches any shop filter category (case-insensitive)
        const matchedCategory = shopCategories.find(
            shopCat => shopCat.toLowerCase() === category.toLowerCase()
        )
        
        if (matchedCategory) {
            router.push(`/shop?category=${encodeURIComponent(matchedCategory)}`)
        } else {
            // Navigate to shop without filter
            router.push('/shop')
        }
    }

    if (loading) {
        return (
            <div className="overflow-hidden w-full relative max-w-7xl mx-auto select-none group sm:my-20">
                <div className="flex gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="px-5 py-2 bg-slate-200 rounded-lg h-9 w-24"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-hidden w-full relative max-w-7xl mx-auto select-none group sm:my-20">
            <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
            <div className="flex min-w-[200%] animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused] gap-4" >
                {[...categories, ...categories, ...categories, ...categories].map((category, index) => (
                    <button 
                        key={index} 
                        onClick={() => handleCategoryClick(category)}
                        className="px-5 py-2 bg-slate-100 rounded-lg text-slate-500 text-xs sm:text-sm hover:bg-slate-600 hover:text-white active:scale-95 transition-all duration-300"
                    >
                        {category}
                    </button>
                ))}
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
        </div>
    )
}

export default CategoriesMarquee
