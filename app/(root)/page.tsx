import ProductList from '@/components/shared/product/product-list';
import { getLatestProducts} from '@/lib/actions/product.actions';
import {  getFeaturedProducts} from '@/lib/actions/product.actions';
import ProductCarousel from '@/components/shared/product/product-carousel';
import ViewAllProductsButton from '@/components/view-all-products-button';
// import DealCountdown from '@/components/deal-countdown';
import Hero from '@/components/hero/hero';

const Homepage = async () => {
  const latestProducts = await getLatestProducts();
  const featuredProducts = await getFeaturedProducts();

  return (
    <>

      <Hero />
      <ProductList data={latestProducts} title='Newest Arrivals' limit={4} />
      <ViewAllProductsButton />
      {/* <DealCountdown /> */}

        {featuredProducts.length > 0 && (
        <ProductCarousel data={featuredProducts}
         />
      )}
    </>
  );
};

export default Homepage;
