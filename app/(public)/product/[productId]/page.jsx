'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const products = useSelector(state => state.product.list);

    const fetchProductFromAPI = async () => {
        try {
            const { data } = await axios.get(`/api/product/${productId}`);
            setProduct(data.product);
        } catch (err) {
            setError(err.response?.data?.error || "Product not found");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // First try to get from Redux store
        const productFromStore = products.find((p) => p.id === productId);
        
        if (productFromStore) {
            setProduct(productFromStore);
            setLoading(false);
        } else {
            // Fallback to API call if not in store
            fetchProductFromAPI();
        }
        
        scrollTo(0, 0);
    }, [productId, products]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-16 text-center">
                <h1 className="text-2xl font-semibold text-slate-800 mb-2">Product Not Found</h1>
                <p className="text-slate-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}
            </div>
        </div>
    );
}