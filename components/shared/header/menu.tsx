import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModeToggle from './mode-toggle';
import Link from 'next/link';
import { EllipsisVertical, ShoppingCart } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserButton from './user-button';
import { getMyCart } from '@/lib/actions/cart.actions';

const Menu = async () => {
  const cart = await getMyCart();
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
  return (
    <div className='flex justify-end gap-3'>
      <nav className='hidden md:flex w-full max-w-xs gap-1'>
        <ModeToggle />
        <Button asChild variant='ghost' className='relative'>
          <Link href='/cart' className='relative flex items-center gap-1'>
            <div className='relative'>
              <ShoppingCart />
              {cartItemCount > 0 && (
                <Badge variant='destructive' className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full'>
                  {cartItemCount}
                </Badge>
              )}
            </div>
            Cart
          </Link>
        </Button>
        <UserButton />
      </nav>
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle'>
            <EllipsisVertical />
          </SheetTrigger>
          <SheetContent className='flex flex-col items-start'>
            <SheetTitle>Menu</SheetTitle>
            <ModeToggle />
            <Button asChild variant='ghost' className='w-full justify-start relative'>
              <Link href='/cart' className='relative flex items-center gap-1'>
                <div className='relative'>
                  <ShoppingCart />
                  {cartItemCount > 0 && (
                    <Badge variant='destructive' className='absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full'>
                      {cartItemCount}
                    </Badge>
                  )}
                </div>
                Cart
              </Link>
            </Button>
            <UserButton />
            <SheetDescription></SheetDescription>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default Menu;
