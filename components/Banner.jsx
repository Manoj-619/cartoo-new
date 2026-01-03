'use client'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Banner() {
    const [isOpen, setIsOpen] = useState(true);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get('/api/admin/banner');
                setSettings(data.settings);
            } catch (error) {
                // Use default settings if fetch fails
                setSettings({
                    bannerEnabled: true,
                    bannerText: "Get 20% OFF on Your First Order!",
                    bannerButtonText: "Claim Offer",
                    bannerCouponCode: "NEW20",
                    bannerGradient: "from-violet-500 via-[#9938CA] to-[#E0724A]"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleClaim = () => {
        setIsOpen(false);
        toast.success('Coupon copied to clipboard!');
        navigator.clipboard.writeText(settings?.bannerCouponCode || 'NEW20');
    };

    // Don't render while loading or if banner is disabled
    if (loading || !settings?.bannerEnabled || !isOpen) return null;

    return (
        <div className={`w-full px-6 py-1 font-medium text-sm text-white text-center bg-gradient-to-r ${settings.bannerGradient}`}>
            <div className='flex items-center justify-between max-w-7xl mx-auto'>
                <p>{settings.bannerText}</p>
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={handleClaim} 
                        type="button" 
                        className="font-normal text-gray-800 bg-white px-7 py-2 rounded-full max-sm:hidden"
                    >
                        {settings.bannerButtonText}
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        type="button" 
                        className="font-normal text-gray-800 py-2 rounded-full"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect y="12.532" width="17.498" height="2.1" rx="1.05" transform="rotate(-45.74 0 12.532)" fill="#fff" />
                            <rect x="12.533" y="13.915" width="17.498" height="2.1" rx="1.05" transform="rotate(-135.74 12.533 13.915)" fill="#fff" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
