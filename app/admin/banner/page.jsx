'use client'
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Type, Ticket, Palette, Eye, EyeOff, Save, RefreshCw, Layout, Tag, DollarSign, ImageIcon, Upload, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Plus, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import Loading from "@/components/Loading"
import Image from "next/image"

const gradientPresets = [
    { name: "Purple Orange", value: "from-violet-500 via-[#9938CA] to-[#E0724A]" },
    { name: "Blue Purple", value: "from-blue-500 via-purple-500 to-pink-500" },
    { name: "Green Teal", value: "from-green-500 via-teal-500 to-cyan-500" },
    { name: "Red Orange", value: "from-red-500 via-orange-500 to-yellow-500" },
    { name: "Pink Purple", value: "from-pink-500 via-purple-500 to-indigo-500" },
    { name: "Slate Gray", value: "from-slate-700 via-slate-600 to-slate-500" },
    { name: "Black", value: "from-gray-900 to-gray-800" },
]

export default function AdminSiteSettingsPage() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState({})
    const [activeTab, setActiveTab] = useState('banner')
    
    const mainImageRef = useRef(null)
    const card1ImageRef = useRef(null)
    const card2ImageRef = useRef(null)
    
    const [settings, setSettings] = useState({
        bannerEnabled: true,
        bannerText: "",
        bannerButtonText: "",
        bannerCouponCode: "",
        bannerGradient: "",
        heroTagText: "",
        heroHeadline: "",
        heroStartPrice: "",
        heroButtonText: "",
        heroMainImage: "",
        heroCard1Title: "",
        heroCard1Image: "",
        heroCard2Title: "",
        heroCard2Image: "",
        marqueeCategories: "",
        footerDescription: "",
        footerPhone: "",
        footerEmail: "",
        footerAddress: "",
        footerFacebook: "",
        footerInstagram: "",
        footerTwitter: "",
        footerLinkedin: "",
        footerCopyright: ""
    })

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/api/admin/banner')
            setSettings(data.settings)
        } catch (error) {
            toast.error('Failed to fetch settings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleSave = async () => {
        try {
            setSaving(true)
            const token = await getToken()
            await axios.put('/api/admin/banner', settings, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success('Settings saved!')
        } catch (error) {
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const handleImageUpload = async (field, file) => {
        if (!file) return

        try {
            setUploading(prev => ({ ...prev, [field]: true }))
            const token = await getToken()
            
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'hero-images')

            const { data } = await axios.post('/api/admin/upload-image', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })

            handleChange(field, data.url)
            toast.success('Image uploaded!')
        } catch (error) {
            toast.error('Failed to upload image')
        } finally {
            setUploading(prev => ({ ...prev, [field]: false }))
        }
    }

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    if (loading) return <Loading />

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">Site Settings</h1>
                <p className="text-slate-500 mt-1">Customize the banner and hero section of your store</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('banner')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                        activeTab === 'banner' 
                            ? 'border-green-500 text-green-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Banner
                </button>
                <button
                    onClick={() => setActiveTab('hero')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                        activeTab === 'hero' 
                            ? 'border-green-500 text-green-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Hero Section
                </button>
                <button
                    onClick={() => setActiveTab('footer')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                        activeTab === 'footer' 
                            ? 'border-green-500 text-green-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Footer
                </button>
            </div>

            {/* Banner Tab */}
            {activeTab === 'banner' && (
                <div className="space-y-6">
                    {/* Banner Preview */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <Eye size={16} />
                            Live Preview
                        </h2>
                        <div className={`w-full px-6 py-3 font-medium text-sm text-white text-center bg-gradient-to-r ${settings.bannerGradient} rounded-lg`}>
                            <div className='flex items-center justify-between'>
                                <p>{settings.bannerText}</p>
                                <div className="flex items-center space-x-4">
                                    <button type="button" className="font-normal text-gray-800 bg-white px-6 py-2 rounded-full text-sm">
                                        {settings.bannerButtonText}
                                    </button>
                                    <button type="button" className="font-normal text-white py-2 rounded-full">✕</button>
                                </div>
                            </div>
                        </div>
                        {!settings.bannerEnabled && (
                            <p className="text-center text-orange-600 text-sm mt-2">⚠️ Banner is currently disabled</p>
                        )}
                    </div>

                    {/* Banner Settings Form */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6">
                        {/* Enable/Disable */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {settings.bannerEnabled ? <Eye size={20} className="text-green-600" /> : <EyeOff size={20} className="text-slate-400" />}
                                <div>
                                    <p className="font-medium text-slate-800">Banner Visibility</p>
                                    <p className="text-sm text-slate-500">{settings.bannerEnabled ? "Visible to customers" : "Hidden"}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('bannerEnabled', !settings.bannerEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.bannerEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.bannerEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {/* Banner Text */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Type size={16} /> Banner Text
                            </label>
                            <input
                                type="text"
                                value={settings.bannerText}
                                onChange={(e) => handleChange('bannerText', e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            />
                        </div>

                        {/* Button Text */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Type size={16} /> Button Text
                            </label>
                            <input
                                type="text"
                                value={settings.bannerButtonText}
                                onChange={(e) => handleChange('bannerButtonText', e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            />
                        </div>

                        {/* Coupon Code */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Ticket size={16} /> Coupon Code
                            </label>
                            <input
                                type="text"
                                value={settings.bannerCouponCode}
                                onChange={(e) => handleChange('bannerCouponCode', e.target.value.toUpperCase())}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 uppercase"
                            />
                        </div>

                        {/* Gradient Selection */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                                <Palette size={16} /> Background Gradient
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                {gradientPresets.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => handleChange('bannerGradient', preset.value)}
                                        className={`h-10 rounded-lg bg-gradient-to-r ${preset.value} transition-all ${
                                            settings.bannerGradient === preset.value ? 'ring-2 ring-offset-2 ring-green-500' : 'hover:scale-105'
                                        }`}
                                        title={preset.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Tab */}
            {activeTab === 'hero' && (
                <div className="space-y-6">
                    {/* Hero Preview */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <Layout size={16} />
                            Live Preview
                        </h2>
                        <div className="bg-green-200 rounded-xl p-6 relative">
                            <div className="inline-flex items-center gap-2 bg-green-300 text-green-600 pr-3 p-1 rounded-full text-xs">
                                <span className="bg-green-600 px-2 py-0.5 rounded-full text-white text-xs">NEWS</span> 
                                {settings.heroTagText}
                            </div>
                            <h2 className="text-2xl leading-tight my-3 font-medium bg-gradient-to-r from-slate-600 to-[#A0FF74] bg-clip-text text-transparent max-w-xs">
                                {settings.heroHeadline}
                            </h2>
                            <div className="text-slate-800 text-sm font-medium mt-3">
                                <p>Starts from</p>
                                <p className="text-2xl">{currency}{settings.heroStartPrice}</p>
                            </div>
                            <button className="bg-slate-800 text-white text-xs py-2 px-6 mt-4 rounded-md">
                                {settings.heroButtonText}
                            </button>
                            {settings.heroMainImage && (
                                <Image src={settings.heroMainImage} alt="Hero" width={150} height={150} className="absolute bottom-0 right-4 w-32 h-auto object-contain" />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-orange-200 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium bg-gradient-to-r from-slate-800 to-[#FFAD51] bg-clip-text text-transparent">
                                        {settings.heroCard1Title}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-2">View more →</p>
                                </div>
                                {settings.heroCard1Image && (
                                    <Image src={settings.heroCard1Image} alt="Card 1" width={60} height={60} className="w-16 h-16 object-contain" />
                                )}
                            </div>
                            <div className="bg-blue-200 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium bg-gradient-to-r from-slate-800 to-[#78B2FF] bg-clip-text text-transparent">
                                        {settings.heroCard2Title}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-2">View more →</p>
                                </div>
                                {settings.heroCard2Image && (
                                    <Image src={settings.heroCard2Image} alt="Card 2" width={60} height={60} className="w-16 h-16 object-contain" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Hero Settings Form */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6">
                        {/* Tag Text */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Tag size={16} /> Tag Text (News badge)
                            </label>
                            <input
                                type="text"
                                value={settings.heroTagText}
                                onChange={(e) => handleChange('heroTagText', e.target.value)}
                                placeholder="Free Shipping on Orders Above $50!"
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            />
                        </div>

                        {/* Headline */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Type size={16} /> Main Headline
                            </label>
                            <textarea
                                value={settings.heroHeadline}
                                onChange={(e) => handleChange('heroHeadline', e.target.value)}
                                placeholder="Gadgets you'll love. Prices you'll trust."
                                rows={2}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 resize-none"
                            />
                        </div>

                        {/* Start Price */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <DollarSign size={16} /> Starting Price
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-lg text-slate-500">{currency}</span>
                                <input
                                    type="text"
                                    value={settings.heroStartPrice}
                                    onChange={(e) => handleChange('heroStartPrice', e.target.value)}
                                    placeholder="4.90"
                                    className="flex-1 p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                />
                            </div>
                        </div>

                        {/* Button Text */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Type size={16} /> Button Text
                            </label>
                            <input
                                type="text"
                                value={settings.heroButtonText}
                                onChange={(e) => handleChange('heroButtonText', e.target.value)}
                                placeholder="LEARN MORE"
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            />
                        </div>

                        {/* Main Hero Image */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <ImageIcon size={16} /> Main Hero Image
                            </label>
                            <div className="flex gap-3 items-start">
                                <div 
                                    onClick={() => mainImageRef.current?.click()}
                                    className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-400 transition overflow-hidden bg-slate-50"
                                >
                                    {settings.heroMainImage ? (
                                        <Image src={settings.heroMainImage} alt="Main" width={128} height={128} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <Upload size={24} className="mx-auto mb-1" />
                                            <p className="text-xs">Upload</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={mainImageRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload('heroMainImage', e.target.files[0])}
                                />
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={settings.heroMainImage || ''}
                                        onChange={(e) => handleChange('heroMainImage', e.target.value)}
                                        placeholder="Or paste image URL..."
                                        className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                    />
                                    {settings.heroMainImage && (
                                        <button 
                                            onClick={() => handleChange('heroMainImage', '')}
                                            className="text-red-500 text-sm mt-2 flex items-center gap-1 hover:text-red-600"
                                        >
                                            <X size={14} /> Remove image
                                        </button>
                                    )}
                                </div>
                            </div>
                            {uploading.heroMainImage && <p className="text-sm text-green-600 mt-2">Uploading...</p>}
                        </div>

                        {/* Card Titles and Images */}
                        <div className="grid sm:grid-cols-2 gap-6">
                            {/* Card 1 */}
                            <div className="p-4 bg-orange-50 rounded-lg space-y-3">
                                <p className="font-medium text-slate-700">Card 1 (Orange)</p>
                                <input
                                    type="text"
                                    value={settings.heroCard1Title}
                                    onChange={(e) => handleChange('heroCard1Title', e.target.value)}
                                    placeholder="Best products"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                />
                                <div 
                                    onClick={() => card1ImageRef.current?.click()}
                                    className="w-20 h-20 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400 transition overflow-hidden bg-white"
                                >
                                    {settings.heroCard1Image ? (
                                        <Image src={settings.heroCard1Image} alt="Card 1" width={80} height={80} className="w-full h-full object-contain" />
                                    ) : (
                                        <Upload size={20} className="text-orange-400" />
                                    )}
                                </div>
                                <input
                                    ref={card1ImageRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload('heroCard1Image', e.target.files[0])}
                                />
                                <input
                                    type="text"
                                    value={settings.heroCard1Image || ''}
                                    onChange={(e) => handleChange('heroCard1Image', e.target.value)}
                                    placeholder="Image URL..."
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-xs"
                                />
                                {uploading.heroCard1Image && <p className="text-xs text-green-600">Uploading...</p>}
                            </div>

                            {/* Card 2 */}
                            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                                <p className="font-medium text-slate-700">Card 2 (Blue)</p>
                                <input
                                    type="text"
                                    value={settings.heroCard2Title}
                                    onChange={(e) => handleChange('heroCard2Title', e.target.value)}
                                    placeholder="20% discounts"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                />
                                <div 
                                    onClick={() => card2ImageRef.current?.click()}
                                    className="w-20 h-20 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition overflow-hidden bg-white"
                                >
                                    {settings.heroCard2Image ? (
                                        <Image src={settings.heroCard2Image} alt="Card 2" width={80} height={80} className="w-full h-full object-contain" />
                                    ) : (
                                        <Upload size={20} className="text-blue-400" />
                                    )}
                                </div>
                                <input
                                    ref={card2ImageRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload('heroCard2Image', e.target.files[0])}
                                />
                                <input
                                    type="text"
                                    value={settings.heroCard2Image || ''}
                                    onChange={(e) => handleChange('heroCard2Image', e.target.value)}
                                    placeholder="Image URL..."
                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-xs"
                                />
                                {uploading.heroCard2Image && <p className="text-xs text-green-600">Uploading...</p>}
                            </div>
                        </div>

                        {/* Marquee Categories */}
                        <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                            <div>
                                <p className="font-medium text-slate-700">Categories Marquee</p>
                                <p className="text-xs text-slate-500 mt-1">These categories appear as scrolling buttons below the hero section</p>
                            </div>
                            
                            {/* Preview */}
                            <div className="overflow-hidden rounded-lg bg-white p-3">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {(settings.marqueeCategories || '').split(',').filter(c => c.trim()).map((cat, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs whitespace-nowrap">
                                            {cat.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Categories List */}
                            <div className="space-y-2">
                                {(settings.marqueeCategories || '').split(',').map((cat, idx, arr) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={cat}
                                            onChange={(e) => {
                                                const cats = (settings.marqueeCategories || '').split(',')
                                                cats[idx] = e.target.value
                                                handleChange('marqueeCategories', cats.join(','))
                                            }}
                                            placeholder="Category name"
                                            className="flex-1 p-2 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                const cats = (settings.marqueeCategories || '').split(',')
                                                cats.splice(idx, 1)
                                                handleChange('marqueeCategories', cats.join(','))
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Category */}
                            <button
                                onClick={() => {
                                    const current = settings.marqueeCategories || ''
                                    const newValue = current ? current + ',New Category' : 'New Category'
                                    handleChange('marqueeCategories', newValue)
                                }}
                                className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-green-400 hover:text-green-600 transition flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus size={16} /> Add Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Tab */}
            {activeTab === 'footer' && (
                <div className="space-y-6">
                    {/* Footer Preview */}
                    <div>
                        <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <Eye size={16} />
                            Live Preview
                        </h2>
                        <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="font-bold text-lg text-slate-800 mb-2">Cartoo</div>
                                    <p className="text-slate-500 text-xs leading-relaxed">{settings.footerDescription}</p>
                                    <div className="flex gap-2 mt-3">
                                        {settings.footerFacebook && <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Facebook size={14} className="text-slate-500" /></div>}
                                        {settings.footerInstagram && <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Instagram size={14} className="text-slate-500" /></div>}
                                        {settings.footerTwitter && <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Twitter size={14} className="text-slate-500" /></div>}
                                        {settings.footerLinkedin && <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Linkedin size={14} className="text-slate-500" /></div>}
                                    </div>
                                </div>
                                <div className="text-slate-500 space-y-1 text-xs">
                                    <p className="font-medium text-slate-700 mb-2">CONTACT</p>
                                    <p className="flex items-center gap-2"><Phone size={12} /> {settings.footerPhone}</p>
                                    <p className="flex items-center gap-2"><Mail size={12} /> {settings.footerEmail}</p>
                                    <p className="flex items-center gap-2"><MapPin size={12} /> {settings.footerAddress}</p>
                                </div>
                            </div>
                            <div className="border-t border-slate-200 mt-4 pt-3 text-xs text-slate-400">
                                {settings.footerCopyright}
                            </div>
                        </div>
                    </div>

                    {/* Footer Settings Form */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6">
                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Type size={16} /> Footer Description
                            </label>
                            <textarea
                                value={settings.footerDescription}
                                onChange={(e) => handleChange('footerDescription', e.target.value)}
                                placeholder="Welcome to cartoo..."
                                rows={3}
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400 resize-none"
                            />
                        </div>

                        {/* Contact Info */}
                        <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                            <p className="font-medium text-slate-700">Contact Information</p>
                            
                            <div>
                                <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                    <Phone size={14} /> Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={settings.footerPhone}
                                    onChange={(e) => handleChange('footerPhone', e.target.value)}
                                    placeholder="+91 1234567890"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                    <Mail size={14} /> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={settings.footerEmail}
                                    onChange={(e) => handleChange('footerEmail', e.target.value)}
                                    placeholder="contact@example.com"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                    <MapPin size={14} /> Address
                                </label>
                                <input
                                    type="text"
                                    value={settings.footerAddress}
                                    onChange={(e) => handleChange('footerAddress', e.target.value)}
                                    placeholder="City, Pincode"
                                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                                />
                            </div>
                        </div>

                        {/* Social Media Links */}
                        <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                            <p className="font-medium text-slate-700">Social Media Links</p>
                            <p className="text-xs text-slate-500">Leave empty to hide the icon</p>
                            
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                        <Facebook size={14} /> Facebook
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.footerFacebook || ''}
                                        onChange={(e) => handleChange('footerFacebook', e.target.value)}
                                        placeholder="https://facebook.com/..."
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                        <Instagram size={14} /> Instagram
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.footerInstagram || ''}
                                        onChange={(e) => handleChange('footerInstagram', e.target.value)}
                                        placeholder="https://instagram.com/..."
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                        <Twitter size={14} /> Twitter / X
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.footerTwitter || ''}
                                        onChange={(e) => handleChange('footerTwitter', e.target.value)}
                                        placeholder="https://twitter.com/..."
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 mb-1.5">
                                        <Linkedin size={14} /> LinkedIn
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.footerLinkedin || ''}
                                        onChange={(e) => handleChange('footerLinkedin', e.target.value)}
                                        placeholder="https://linkedin.com/..."
                                        className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-green-400 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Copyright */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Type size={16} /> Copyright Text
                            </label>
                            <input
                                type="text"
                                value={settings.footerCopyright}
                                onChange={(e) => handleChange('footerCopyright', e.target.value)}
                                placeholder="Copyright 2025 © Your Company"
                                className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-green-400"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={fetchSettings}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition flex items-center gap-2"
                >
                    <RefreshCw size={16} />
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    )
}
