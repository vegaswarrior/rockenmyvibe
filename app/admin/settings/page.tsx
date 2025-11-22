import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import SettingsOverview from './settings-overview';
import { getSettings, getCoupons, getPromoCodes } from '@/lib/actions/settings.actions';

export const metadata: Metadata = {
  title: 'Admin Settings',
};

const AdminSettingsPage = async () => {
  await requireAdmin();

  const settingsResult = await getSettings();
  const couponsResult = await getCoupons();
  const promoCodesResult = await getPromoCodes();

  const settings = settingsResult.success ? settingsResult.data : {
    shipping: {
      baseShippingCost: '10',
      freeShippingThreshold: '100',
      uspsIntegrationEnabled: false,
    },
    tax: { taxRate: '15' },
  };
  const coupons = couponsResult.success ? couponsResult.data : [];
  const promoCodes = promoCodesResult.success ? promoCodesResult.data : [];

  return (
    <div className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <div>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-2'>Settings</h1>
          <p className='text-gray-300'>Manage shipping, taxes, coupons, and promo codes</p>
        </div>

        <SettingsOverview
          initialSettings={settings}
          initialCoupons={coupons}
          initialPromoCodes={promoCodes}
        />
      </div>
    </div>
  );
};

export default AdminSettingsPage;
