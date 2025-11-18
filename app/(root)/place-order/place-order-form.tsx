'use client';

import { useRouter } from 'next/navigation';
import { Check, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createOrder } from '@/lib/actions/order-actions';
import { paymentMethodSchema } from '@/lib/validators';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEFAULT_PAYMENT_METHOD } from '@/lib/constants';
import { updateUserPaymentMethod } from '@/lib/actions/user.actions';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';

const PlaceOrderForm = ({ preferredPaymentMethod }: { preferredPaymentMethod: string | null }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
    },
  });

  const handleSubmit = async (values: z.infer<typeof paymentMethodSchema>) => {
    startTransition(async () => {
      const updateRes = await updateUserPaymentMethod(values);

      if (!updateRes.success) {
        toast({
          variant: 'destructive',
          description: updateRes.message,
        });
        return;
      }

      const res = await createOrder();

      if (res.redirectTo) {
        router.push(res.redirectTo);
      }
    });
  };

  const PlaceOrderButton = () => {
    return (
      <Button disabled={isPending} className='w-full'>
        {isPending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Check className='w-4 h-4' />
        )}{' '}
        Place Order
      </Button>
    );
  };

  return (
    <>
      <div className='space-y-4 mb-4'>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className='w-full'
        >
          <PlaceOrderButton />
        </form>
      </div>
    </>
  );
};

export default PlaceOrderForm;
