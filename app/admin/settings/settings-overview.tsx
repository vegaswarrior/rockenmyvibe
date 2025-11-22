'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  updateShippingSettings,
  updateTaxSettings,
  createCoupon,
  deleteCoupon,
  createPromoCode,
  deletePromoCode,
  calculateUSPSShippingRate,
} from '@/lib/actions/settings.actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Truck, Percent, Tag, Gift } from 'lucide-react';

interface Settings {
  shipping: {
    baseShippingCost: string | number;
    freeShippingThreshold: string | number;
    uspsIntegrationEnabled: boolean;
  };
  tax: {
    taxRate: string | number;
  };
}

interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: string;
  discountValue: number | string;
  minOrderAmount?: number | string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromoCode {
  id: string;
  code: string;
  description?: string | null;
  discountType: string;
  discountValue: number | string;
  minOrderAmount?: number | string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SettingsOverviewProps {
  initialSettings: Settings;
  initialCoupons: Coupon[];
  initialPromoCodes: PromoCode[];
}

const SettingsOverview = ({
  initialSettings,
  initialCoupons,
  initialPromoCodes,
}: SettingsOverviewProps) => {
  const { toast } = useToast();

  const [shippingCost, setShippingCost] = useState(
    initialSettings?.shipping?.baseShippingCost || '10'
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    initialSettings?.shipping?.freeShippingThreshold || '100'
  );
  const [taxRate, setTaxRate] = useState(initialSettings?.tax?.taxRate || '15');
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(initialPromoCodes);

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
  });

  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
  });

  const [uspsCalculator, setUSPSCalculator] = useState({
    weight: '',
    originZip: '',
    destZip: '',
    serviceType: 'PRIORITY',
    result: null as number | null,
  });

  const handleUpdateShipping = async () => {
    const result = await updateShippingSettings(
      parseFloat(shippingCost as string),
      parseFloat(freeShippingThreshold as string),
      false
    );
    toast({
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleUpdateTax = async () => {
    const result = await updateTaxSettings(parseFloat(taxRate as string));
    toast({
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleAddCoupon = async () => {
    if (!couponForm.code || !couponForm.discountValue) {
      toast({
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await createCoupon({
      code: couponForm.code,
      description: couponForm.description,
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue),
      minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : undefined,
      maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : undefined,
    });

    if (result.success && result.data) {
      setCoupons([result.data as Coupon, ...coupons]);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxUses: '',
      });
      toast({
        description: result.message,
      });
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddPromoCode = async () => {
    if (!promoForm.code || !promoForm.discountValue) {
      toast({
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await createPromoCode({
      code: promoForm.code,
      description: promoForm.description,
      discountType: promoForm.discountType,
      discountValue: parseFloat(promoForm.discountValue),
      minOrderAmount: promoForm.minOrderAmount ? parseFloat(promoForm.minOrderAmount) : undefined,
      maxUses: promoForm.maxUses ? parseInt(promoForm.maxUses) : undefined,
    });

    if (result.success && result.data) {
      setPromoCodes([result.data as PromoCode, ...promoCodes]);
      setPromoForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxUses: '',
      });
      toast({
        description: result.message,
      });
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const result = await deleteCoupon(id);
    if (result.success) {
      setCoupons(coupons.filter((c) => c.id !== id));
      toast({
        description: result.message,
      });
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePromoCode = async (id: string) => {
    const result = await deletePromoCode(id);
    if (result.success) {
      setPromoCodes(promoCodes.filter((p) => p.id !== id));
      toast({
        description: result.message,
      });
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleCalculateShipping = async () => {
    if (!uspsCalculator.weight || !uspsCalculator.originZip || !uspsCalculator.destZip) {
      toast({
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await calculateUSPSShippingRate(
      parseFloat(uspsCalculator.weight),
      uspsCalculator.originZip,
      uspsCalculator.destZip,
      uspsCalculator.serviceType as 'PRIORITY' | 'EXPRESS' | 'GROUND'
    );

    if (result.success && result.rate !== null) {
      setUSPSCalculator({
        ...uspsCalculator,
        result: result.rate,
      });
      toast({
        description: `Shipping rate: $${result.rate.toFixed(2)}`,
      });
    } else {
      toast({
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='space-y-8'>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Shipping Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'
        >
          <div className='flex items-center gap-3 mb-6'>
            <Truck className='w-6 h-6 text-blue-400' />
            <h3 className='text-2xl font-bold text-white'>Shipping Settings</h3>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Base Shipping Cost ($)
              </label>
              <input
                type='number'
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400'
                placeholder='10.00'
                step='0.01'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Free Shipping Threshold ($)
              </label>
              <input
                type='number'
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400'
                placeholder='100.00'
                step='0.01'
              />
            </div>

            <Button
              onClick={handleUpdateShipping}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition'
            >
              Update Shipping
            </Button>
          </div>
        </motion.div>

        {/* Tax Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'
        >
          <div className='flex items-center gap-3 mb-6'>
            <Percent className='w-6 h-6 text-emerald-400' />
            <h3 className='text-2xl font-bold text-white'>Tax Settings</h3>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Tax Rate (%)
              </label>
              <input
                type='number'
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-400'
                placeholder='15.00'
                step='0.01'
              />
              <p className='text-xs text-gray-400 mt-2'>Applied globally to all orders</p>
            </div>

            <Button
              onClick={handleUpdateTax}
              className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition'
            >
              Update Tax Rate
            </Button>
          </div>
        </motion.div>
      </div>

      {/* USPS Shipping Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'
      >
        <div className='flex items-center gap-3 mb-6'>
          <Truck className='w-6 h-6 text-violet-400' />
          <h3 className='text-2xl font-bold text-white'>USPS Shipping Calculator</h3>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Weight (lbs)
            </label>
            <input
              type='number'
              value={uspsCalculator.weight}
              onChange={(e) =>
                setUSPSCalculator({ ...uspsCalculator, weight: e.target.value })
              }
              className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-violet-400'
              placeholder='1.0'
              step='0.1'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Origin ZIP
            </label>
            <input
              type='text'
              value={uspsCalculator.originZip}
              onChange={(e) =>
                setUSPSCalculator({ ...uspsCalculator, originZip: e.target.value })
              }
              className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-violet-400'
              placeholder='90210'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Destination ZIP
            </label>
            <input
              type='text'
              value={uspsCalculator.destZip}
              onChange={(e) =>
                setUSPSCalculator({ ...uspsCalculator, destZip: e.target.value })
              }
              className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-violet-400'
              placeholder='10001'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-2'>
              Service
            </label>
            <select
              value={uspsCalculator.serviceType}
              onChange={(e) =>
                setUSPSCalculator({ ...uspsCalculator, serviceType: e.target.value })
              }
              className='w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-violet-400'
            >
              <option value='PRIORITY'>Priority</option>
              <option value='EXPRESS'>Express</option>
              <option value='GROUND'>Ground</option>
            </select>
          </div>

          <div className='flex items-end'>
            <Button
              onClick={handleCalculateShipping}
              className='w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-lg transition'
            >
              Calculate
            </Button>
          </div>
        </div>

        {uspsCalculator.result !== null && (
          <div className='mt-4 p-4 bg-white/10 border border-white/20 rounded-lg'>
            <p className='text-gray-300'>
              Calculated Rate:{' '}
              <span className='text-emerald-400 font-bold'>
                ${uspsCalculator.result.toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </motion.div>

      {/* Coupons Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'
      >
        <div className='flex items-center gap-3 mb-6'>
          <Tag className='w-6 h-6 text-orange-400' />
          <h3 className='text-2xl font-bold text-white'>Coupons</h3>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pb-6 border-b border-white/10'>
            <input
              type='text'
              placeholder='Coupon Code'
              value={couponForm.code}
              onChange={(e) =>
                setCouponForm({ ...couponForm, code: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400'
            />
            <input
              type='text'
              placeholder='Description'
              value={couponForm.description}
              onChange={(e) =>
                setCouponForm({ ...couponForm, description: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400'
            />
            <select
              value={couponForm.discountType}
              onChange={(e) =>
                setCouponForm({ ...couponForm, discountType: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-orange-400'
            >
              <option value='percentage'>Percentage (%)</option>
              <option value='fixed'>Fixed Amount ($)</option>
            </select>
            <input
              type='number'
              placeholder='Discount Value'
              value={couponForm.discountValue}
              onChange={(e) =>
                setCouponForm({ ...couponForm, discountValue: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400'
              step='0.01'
            />
            <input
              type='number'
              placeholder='Max Uses'
              value={couponForm.maxUses}
              onChange={(e) =>
                setCouponForm({ ...couponForm, maxUses: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400'
            />
            <Button
              onClick={handleAddCoupon}
              className='w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2'
            >
              <Plus className='w-4 h-4' /> Add
            </Button>
          </div>

          {coupons.length > 0 ? (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-white/10 hover:bg-white/5'>
                    <TableHead className='text-gray-300'>CODE</TableHead>
                    <TableHead className='text-gray-300'>DISCOUNT</TableHead>
                    <TableHead className='text-gray-300'>USED</TableHead>
                    <TableHead className='text-gray-300'>STATUS</TableHead>
                    <TableHead className='text-gray-300'>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id} className='border-white/10 hover:bg-white/5 transition-colors'>
                      <TableCell className='text-gray-300 font-medium'>
                        {coupon.code}
                      </TableCell>
                      <TableCell className='text-gray-400'>
                        {coupon.discountValue}
                        {coupon.discountType === 'percentage' ? '%' : '$'}
                      </TableCell>
                      <TableCell className='text-gray-400'>
                        {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ''}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            coupon.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className='text-red-400 hover:text-red-300'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className='text-gray-400 text-center py-4'>No coupons yet</p>
          )}
        </div>
      </motion.div>

      {/* Promo Codes Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'
      >
        <div className='flex items-center gap-3 mb-6'>
          <Gift className='w-6 h-6 text-pink-400' />
          <h3 className='text-2xl font-bold text-white'>Promo Codes</h3>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pb-6 border-b border-white/10'>
            <input
              type='text'
              placeholder='Promo Code'
              value={promoForm.code}
              onChange={(e) =>
                setPromoForm({ ...promoForm, code: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-pink-400'
            />
            <input
              type='text'
              placeholder='Description'
              value={promoForm.description}
              onChange={(e) =>
                setPromoForm({ ...promoForm, description: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-pink-400'
            />
            <select
              value={promoForm.discountType}
              onChange={(e) =>
                setPromoForm({ ...promoForm, discountType: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-pink-400'
            >
              <option value='percentage'>Percentage (%)</option>
              <option value='fixed'>Fixed Amount ($)</option>
            </select>
            <input
              type='number'
              placeholder='Discount Value'
              value={promoForm.discountValue}
              onChange={(e) =>
                setPromoForm({ ...promoForm, discountValue: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-pink-400'
              step='0.01'
            />
            <input
              type='number'
              placeholder='Max Uses'
              value={promoForm.maxUses}
              onChange={(e) =>
                setPromoForm({ ...promoForm, maxUses: e.target.value })
              }
              className='px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-pink-400'
            />
            <Button
              onClick={handleAddPromoCode}
              className='w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2'
            >
              <Plus className='w-4 h-4' /> Add
            </Button>
          </div>

          {promoCodes.length > 0 ? (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-white/10 hover:bg-white/5'>
                    <TableHead className='text-gray-300'>CODE</TableHead>
                    <TableHead className='text-gray-300'>DISCOUNT</TableHead>
                    <TableHead className='text-gray-300'>USED</TableHead>
                    <TableHead className='text-gray-300'>STATUS</TableHead>
                    <TableHead className='text-gray-300'>ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((promo) => (
                    <TableRow key={promo.id} className='border-white/10 hover:bg-white/5 transition-colors'>
                      <TableCell className='text-gray-300 font-medium'>
                        {promo.code}
                      </TableCell>
                      <TableCell className='text-gray-400'>
                        {promo.discountValue}
                        {promo.discountType === 'percentage' ? '%' : '$'}
                      </TableCell>
                      <TableCell className='text-gray-400'>
                        {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            promo.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDeletePromoCode(promo.id)}
                          className='text-red-400 hover:text-red-300'
                        >
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className='text-gray-400 text-center py-4'>No promo codes yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsOverview;
