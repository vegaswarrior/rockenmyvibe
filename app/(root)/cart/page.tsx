import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';
import { auth } from '@/auth';
import { getUserById } from '@/lib/actions/user.actions';

export const metadata = {
  title: 'Shopping Cart',
};

const CartPage = async () => {
  const cart = await getMyCart();

  const session = await auth();
  const userId = session?.user?.id;

  let hasShippingAddress = false;

  if (userId) {
    const user = await getUserById(userId);
    hasShippingAddress = Boolean(user.address);
  }

  return (
    <>
      <CartTable cart={cart} hasShippingAddress={hasShippingAddress} />
    </>
  );
};

export default CartPage;
