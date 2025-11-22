import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrderSummary } from '@/lib/actions/order-actions';
import { formatCurrency, formatDateTime, convertToPlainObject } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdmin } from '@/lib/auth-guard';
import DashboardOverview from './dashboard-overview';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

const AdminOverviewPage = async () => {
  await requireAdmin();

  const summary = await getOrderSummary();
  const serializedSummary = convertToPlainObject(summary);

  return (
    <div className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <div>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-2'>Dashboard</h1>
          <p className='text-gray-300'>Monitor your store performance and recent activity</p>
        </div>

        <DashboardOverview summary={serializedSummary} />

        <div className='grid gap-8 lg:grid-cols-7'>
          <div className='lg:col-span-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
            <div className='flex items-center justify-between mb-8'>
              <div>
                <h3 className='text-2xl font-bold text-white'>Sales Overview</h3>
                <p className='text-sm text-gray-400 mt-1'>Monthly revenue trend</p>
              </div>
              <TrendingUp className='w-6 h-6 text-violet-400' />
            </div>
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
          </div>

          <div className='lg:col-span-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
            <div className='flex items-center justify-between mb-8'>
              <div>
                <h3 className='text-2xl font-bold text-white'>Recent Sales</h3>
                <p className='text-sm text-gray-400 mt-1'>Latest transactions</p>
              </div>
            </div>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-white/10 hover:bg-white/5'>
                    <TableHead className='text-gray-300'>BUYER</TableHead>
                    <TableHead className='text-gray-300'>DATE</TableHead>
                    <TableHead className='text-gray-300'>TOTAL</TableHead>
                    <TableHead className='text-gray-300'>ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.latestSales.slice(0, 8).map((order) => (
                    <TableRow key={order.id} className='border-white/10 hover:bg-white/5 transition-colors'>
                      <TableCell className='text-gray-300 font-medium'>
                        {order?.user?.name ? order.user.name : 'Deleted User'}
                      </TableCell>
                      <TableCell className='text-gray-400 text-sm'>
                        {formatDateTime(order.createdAt).dateOnly}
                      </TableCell>
                      <TableCell className='text-white font-semibold'>
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/order/${order.id}`}>
                          <span className='text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors'>View</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Link href='/admin/orders'>
              <button className='w-full mt-6 py-2 px-4 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors'>
                View All Sales
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
