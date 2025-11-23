'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addPromoToProduct } from '@/lib/actions/settings.actions';

interface ProductPromoDialogProps {
  productId: string;
}

export default function ProductPromoDialog({ productId }: ProductPromoDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!code || !discountValue) {
      toast({
        variant: 'destructive',
        description: 'Code and discount value are required',
      });
      return;
    }

    startTransition(async () => {
      const res = await addPromoToProduct({
        productId,
        code,
        description: description || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        maxUses: maxUses ? parseInt(maxUses) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });

      if (res.success) {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>Add Promo Code</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Promo Code to Product</DialogTitle>
        </DialogHeader>
        <div className='space-y-3 py-2'>
          <div>
            <label className='block text-sm font-medium mb-1'>Code</label>
            <Input
              placeholder='ROCK10'
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Description</label>
            <Input
              placeholder='10% off this product'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <label className='block text-sm font-medium mb-1'>Discount Type</label>
              <select
                className='w-full border rounded px-2 py-1 bg-background'
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              >
                <option value='percentage'>Percentage (%)</option>
                <option value='fixed'>Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Discount Value</label>
              <Input
                type='number'
                step='0.01'
                placeholder='10'
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div>
              <label className='block text-sm font-medium mb-1'>Min Order Amount</label>
              <Input
                type='number'
                step='0.01'
                placeholder='Optional'
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>
            <div>
              <label className='block text-sm font-medium mb-1'>Max Uses</label>
              <Input
                type='number'
                placeholder='Optional'
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Expiration Date</label>
            <Input
              type='date'
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save Promo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
