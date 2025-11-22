'use client';
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { ShoppingCart} from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductPrice from "./product-price";
import {Product} from '@/types'

const ProductCard = ({product}:{product:Product}) => {
const [isFlipped, setIsFlipped] = useState(false);
const [selectedColor, setSelectedColor] = useState<string>('');
const [selectedSize, setSelectedSize] = useState<string>('');

    return ( 
        <div className="relative w-full" style={{ perspective: '1000px' }} onMouseEnter={() => setIsFlipped(true)} onMouseLeave={() => setIsFlipped(false)} >
            <div className="absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
                <div className="absolute inset-0 rounded-lg" style={{ animation: 'border-flow 3s linear infinite' }}>
                    <div className="absolute inset-0 rounded-lg bg-linear-to-r from-transparent via-purple-500 to-transparent blur-sm"></div>
                </div>
            </div>
            <div
                className="relative w-full aspect-square group" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',  transition: 'transform 0.7s'}}>
                <Card className="absolute inset-0 bg-transparent border-2 border-white/20 group-hover:border-purple-400/50 transition-colors duration-300 overflow-hidden" style={{ backfaceVisibility: 'hidden' }} >
                    <CardHeader className="p-0 w-full h-full flex items-center justify-center">
                        <Link href={`/product/${product.slug}`} className="block w-full h-full relative">
                            <Image className="object-contain transition-transform duration-700 group-hover:scale-110" 
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                alt={product.name} 
                                src={product.images[0]} 
                                priority={true}
                            />
                        </Link>
                    </CardHeader>
                </Card>

                {/* Back of card */}
                <Card
                    className="absolute inset-0 bg-transparent overflow-hidden"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>
                    <div className="h-full flex flex-col justify-between p-4 sm:p-6 text-white">
                        <div>
                            <h3>{product.name}</h3>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                            <ProductPrice value={Number(product.price)}/>
                            {product.variants && product.variants.length > 0 && (
                                <div className="space-y-2">
                                    {product.variants.some(v => v.color) && (
                                        <div>
                                            <label className="text-xs block mb-1">Color</label>
                                            <select 
                                                value={selectedColor} 
                                                onChange={(e) => setSelectedColor(e.target.value)}
                                                className="w-full bg-black/30 text-white text-sm py-1 px-2 rounded border border-white/20"
                                            >
                                                <option value="">Select</option>
                                                {Array.from(new Set(product.variants.filter(v => v.color).map(v => JSON.stringify(v.color)))).map((color) => {
                                                    const c = JSON.parse(color);
                                                    return <option key={c.id} value={c.slug}>{c.name}</option>
                                                })}
                                            </select>
                                        </div>
                                    )}
                                    {product.variants.some(v => v.size) && (
                                        <div>
                                            <label className="text-xs block mb-1">Size</label>
                                            <select 
                                                value={selectedSize} 
                                                onChange={(e) => setSelectedSize(e.target.value)}
                                                className="w-full bg-black/30 text-white text-sm py-1 px-2 rounded border border-white/20"
                                            >
                                                <option value="">Select</option>
                                                {Array.from(new Set(product.variants.filter(v => v.size).map(v => JSON.stringify(v.size)))).map((size) => {
                                                    const s = JSON.parse(size);
                                                    return <option key={s.id} value={s.slug}>{s.name}</option>
                                                })}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                            <Link href={`/product/${product.slug}`}>
                                <Button className="w-full hover:bg-blue-600 hover:text-black hover:border-b-black hover:cursor-pointer ">
                                    <ShoppingCart size={16} />
                                    View Details
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>

            <style jsx>{`
                @keyframes border-flow {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
 
export default ProductCard;