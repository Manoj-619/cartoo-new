'use client'
import { assets } from '@/assets/assets'
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import CategoriesMarquee from './CategoriesMarquee'
import axios from 'axios'

const Hero = () => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
    
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({
        heroTagText: "Free Shipping on Orders Above $50!",
        heroHeadline: "Gadgets you'll love. Prices you'll trust.",
        heroStartPrice: "4.90",
        heroButtonText: "LEARN MORE",
        heroMainImage: null,
        heroCard1Title: "Best products",
        heroCard1Image: null,
        heroCard2Title: "20% discounts",
        heroCard2Image: null
    })

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get('/api/admin/banner')
                if (data.settings) {
                    setSettings(prev => ({
                        ...prev,
                        heroTagText: data.settings.heroTagText || prev.heroTagText,
                        heroHeadline: data.settings.heroHeadline || prev.heroHeadline,
                        heroStartPrice: data.settings.heroStartPrice || prev.heroStartPrice,
                        heroButtonText: data.settings.heroButtonText || prev.heroButtonText,
                        heroMainImage: data.settings.heroMainImage || null,
                        heroCard1Title: data.settings.heroCard1Title || prev.heroCard1Title,
                        heroCard1Image: data.settings.heroCard1Image || null,
                        heroCard2Title: data.settings.heroCard2Title || prev.heroCard2Title,
                        heroCard2Image: data.settings.heroCard2Image || null
                    }))
                }
            } catch (error) {
                // Use default settings if fetch fails
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    if (loading) {
        return (
            <div className='mx-6'>
                <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                    <div className='relative flex-1 flex flex-col bg-green-200/50 rounded-3xl xl:min-h-100 animate-pulse'>
                        <div className='p-5 sm:p-16'>
                            <div className='h-6 w-64 bg-green-300/50 rounded-full'></div>
                            <div className='h-12 w-72 bg-green-300/50 rounded-lg mt-4'></div>
                            <div className='h-8 w-48 bg-green-300/50 rounded-lg mt-2'></div>
                            <div className='mt-8'>
                                <div className='h-4 w-20 bg-green-300/50 rounded'></div>
                                <div className='h-10 w-24 bg-green-300/50 rounded mt-1'></div>
                            </div>
                            <div className='h-12 w-36 bg-slate-700/30 rounded-md mt-10'></div>
                        </div>
                    </div>
                    <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm'>
                        <div className='flex-1 w-full bg-orange-200/50 rounded-3xl p-6 px-8 animate-pulse min-h-32'>
                            <div className='h-8 w-32 bg-orange-300/50 rounded-lg'></div>
                            <div className='h-4 w-24 bg-orange-300/50 rounded mt-4'></div>
                        </div>
                        <div className='flex-1 w-full bg-blue-200/50 rounded-3xl p-6 px-8 animate-pulse min-h-32'>
                            <div className='h-8 w-32 bg-blue-300/50 rounded-lg'></div>
                            <div className='h-4 w-24 bg-blue-300/50 rounded mt-4'></div>
                        </div>
                    </div>
                </div>
                <CategoriesMarquee />
            </div>
        )
    }

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                <div className='relative flex-1 flex flex-col bg-green-200 rounded-3xl xl:min-h-100 group'>
                    <div className='p-5 sm:p-16'>
                        <div className='inline-flex items-center gap-3 bg-green-300 text-green-600 pr-4 p-1 rounded-full text-xs sm:text-sm'>
                            <span className='bg-green-600 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs'>NEWS</span> 
                            {settings.heroTagText} 
                            <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                        </div>
                        <h2 className='text-3xl sm:text-5xl leading-[1.2] my-3 font-medium bg-gradient-to-r from-slate-600 to-[#A0FF74] bg-clip-text text-transparent max-w-xs sm:max-w-md'>
                            {settings.heroHeadline}
                        </h2>
                        <div className='text-slate-800 text-sm font-medium mt-4 sm:mt-8'>
                            <p>Starts from</p>
                            <p className='text-3xl'>{currency}{settings.heroStartPrice}</p>
                        </div>
                        <button className='bg-slate-800 text-white text-sm py-2.5 px-7 sm:py-5 sm:px-12 mt-4 sm:mt-10 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition'>
                            {settings.heroButtonText}
                        </button>
                    </div>
                    {settings.heroMainImage ? (
                        <Image 
                            className='sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm' 
                            src={settings.heroMainImage} 
                            alt="Hero" 
                            width={400} 
                            height={400}
                            unoptimized
                        />
                    ) : (
                        <Image 
                            className='sm:absolute bottom-0 right-0 md:right-10 w-full sm:max-w-sm' 
                            src={assets.hero_model_img} 
                            alt="" 
                        />
                    )}
                </div>
                <div className='flex flex-col md:flex-row xl:flex-col gap-5 w-full xl:max-w-sm text-sm text-slate-600'>
                    <div className='flex-1 flex items-center justify-between w-full bg-orange-200 rounded-3xl p-6 px-8 group'>
                        <div>
                            <p className='text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#FFAD51] bg-clip-text text-transparent max-w-40'>
                                {settings.heroCard1Title}
                            </p>
                            <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                        </div>
                        {settings.heroCard1Image ? (
                            <Image 
                                className='w-35' 
                                src={settings.heroCard1Image} 
                                alt="Card 1" 
                                width={140} 
                                height={140}
                                unoptimized
                            />
                        ) : (
                            <Image className='w-35' src={assets.hero_product_img1} alt="" />
                        )}
                    </div>
                    <div className='flex-1 flex items-center justify-between w-full bg-blue-200 rounded-3xl p-6 px-8 group'>
                        <div>
                            <p className='text-3xl font-medium bg-gradient-to-r from-slate-800 to-[#78B2FF] bg-clip-text text-transparent max-w-40'>
                                {settings.heroCard2Title}
                            </p>
                            <p className='flex items-center gap-1 mt-4'>View more <ArrowRightIcon className='group-hover:ml-2 transition-all' size={18} /> </p>
                        </div>
                        {settings.heroCard2Image ? (
                            <Image 
                                className='w-35' 
                                src={settings.heroCard2Image} 
                                alt="Card 2" 
                                width={140} 
                                height={140}
                                unoptimized
                            />
                        ) : (
                            <Image className='w-35' src={assets.hero_product_img2} alt="" />
                        )}
                    </div>
                </div>
            </div>
            <CategoriesMarquee />
        </div>
    )
}

export default Hero
