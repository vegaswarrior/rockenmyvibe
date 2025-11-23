import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import { getMyCart } from '@/lib/actions/cart.actions';
import ReviewList from './review-list';
import { auth } from '@/auth';
import ProductDetailClient from '@/components/shared/product/product-detail-client';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id;

  const cart = await getMyCart();

  const clientProduct = {
    ...product,
    // Ensure numeric fields are numbers for the client component typing
    price: Number(product.price),
    rating: Number(product.rating),
    variants: (product.variants || []).map((v) => ({
      id: v.id,
      price: Number(v.price),
      images: v.images as string[] | undefined,
      color: v.color
        ? { id: v.color.id, name: v.color.name, slug: v.color.slug }
        : null,
      size: v.size
        ? { id: v.size.id, name: v.size.name, slug: v.size.slug }
        : null,
    })),
  };

  return (
    <>
      <ProductDetailClient product={clientProduct} cart={cart} />
      <section className='mt-10'>
        <h2 className='h2-bold mb-5'>Customer Reviews</h2>
        <ReviewList
          userId={userId || ''}
          productId={product.id}
          productSlug={product.slug}
        />
      </section>
    </>
  );
};

export default ProductDetailsPage;
