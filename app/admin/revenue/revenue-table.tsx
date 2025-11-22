'use client';

import { formatCurrency } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface RevenueData {
  date: string;
  displayDate: string;
  totalRevenue: number;
  orderCount: number;
}

interface RevenueTableProps {
  data: RevenueData[];
  period: 'day' | 'month' | 'year';
  onDateClick: (date: string) => void;
}

export default function RevenueTable({
  data,
  period,
  onDateClick,
}: RevenueTableProps) {
  const isClickable = period !== 'day';

  return (
    <div className='overflow-x-auto'>
      <table className='w-full'>
        <thead>
          <tr className='border-b border-white/10'>
            <th className='text-left px-6 py-4 text-sm font-semibold text-gray-300'>
              {period === 'year' ? 'Year' : period === 'month' ? 'Month' : 'Date'}
            </th>
            <th className='text-right px-6 py-4 text-sm font-semibold text-gray-300'>
              Revenue
            </th>
            <th className='text-right px-6 py-4 text-sm font-semibold text-gray-300'>
              Orders
            </th>
            <th className='text-right px-6 py-4 text-sm font-semibold text-gray-300'>
              Avg Order Value
            </th>
            {isClickable && (
              <th className='text-right px-6 py-4 text-sm font-semibold text-gray-300'>
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={item.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className='border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group'
              onClick={() => isClickable && onDateClick(item.date)}
            >
              <td className='px-6 py-4 text-sm text-gray-300 font-medium group-hover:text-white'>
                {item.displayDate}
              </td>
              <td className='px-6 py-4 text-sm text-right text-emerald-400 font-semibold'>
                {formatCurrency(item.totalRevenue)}
              </td>
              <td className='px-6 py-4 text-sm text-right text-gray-300'>
                {item.orderCount.toLocaleString()}
              </td>
              <td className='px-6 py-4 text-sm text-right text-gray-400'>
                {formatCurrency(item.totalRevenue / Math.max(item.orderCount, 1))}
              </td>
              {isClickable && (
                <td className='px-6 py-4 text-sm text-right'>
                  <ChevronRight className='w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors inline' />
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className='text-center py-12 text-gray-400'>
          No revenue data available for this period
        </div>
      )}
    </div>
  );
}
