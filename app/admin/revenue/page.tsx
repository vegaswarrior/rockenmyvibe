'use client';

import { useState, useEffect } from 'react';
import { getRevenueByPeriod } from '@/lib/actions/order-actions';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import RevenueChart from './revenue-chart';
import RevenueTable from './revenue-table';

type Period = 'year' | 'month' | 'day';

interface RevenueData {
  data: Array<{
    date: string;
    displayDate: string;
    totalRevenue: number;
    orderCount: number;
  }>;
  totalRevenue: number;
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<Period>('year');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<{
    year?: number;
    month?: number;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getRevenueByPeriod(period, filterDate);
        setRevenueData(result as RevenueData);
      } catch (error) {
        console.error('Failed to fetch revenue data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, filterDate]);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setFilterDate({});
  };

  const handleDateClick = (date: string) => {
    if (period === 'year') {
      setFilterDate({ year: parseInt(date) });
      setPeriod('month');
    } else if (period === 'month' && filterDate.year) {
      const [, month] = date.split('-');
      setFilterDate({ year: filterDate.year, month: parseInt(month) });
      setPeriod('day');
    }
  };

  const handleBackClick = () => {
    if (period === 'day' && filterDate.year && filterDate.month) {
      setFilterDate({ year: filterDate.year });
      setPeriod('month');
    } else if (period === 'month' && filterDate.year) {
      setFilterDate({});
      setPeriod('year');
    }
  };

  const canGoBack = (period === 'day' && filterDate.year && filterDate.month) || (period === 'month' && filterDate.year);

  return (
    <div className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href='/admin/overview'>
              <button className='p-2 hover:bg-white/10 rounded-lg transition-colors'>
                <ArrowLeft className='w-6 h-6 text-gray-300' />
              </button>
            </Link>
            <div>
              <h1 className='text-4xl md:text-5xl font-bold text-white mb-2'>Revenue Analytics</h1>
              <p className='text-gray-300'>Detailed breakdown of your revenue</p>
            </div>
          </div>
          <TrendingUp className='w-12 h-12 text-emerald-400' />
        </div>

        <div className='backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-8 shadow-lg'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8'>
            <div>
              <p className='text-sm text-gray-400 mb-2'>Total Revenue</p>
              <motion.h2
                key={revenueData?.totalRevenue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-4xl font-bold text-white'
              >
                {revenueData ? formatCurrency(revenueData.totalRevenue) : '—'}
              </motion.h2>
            </div>

            <div className='flex gap-2'>
              {canGoBack && (
                <button
                  onClick={handleBackClick}
                  className='px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors text-gray-300 text-sm font-medium'
                >
                  ← Back
                </button>
              )}
              <button
                onClick={() => handlePeriodChange('year')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === 'year'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                Years
              </button>
              <button
                onClick={() => handlePeriodChange('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === 'month'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                Months
              </button>
              <button
                onClick={() => handlePeriodChange('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  period === 'day'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                Days
              </button>
            </div>
          </div>

          {loading ? (
            <div className='h-96 flex items-center justify-center'>
              <div className='text-gray-400'>Loading data...</div>
            </div>
          ) : (
            <div className='space-y-8'>
              {revenueData && <RevenueChart data={revenueData.data} period={period} />}
              {revenueData && (
                <RevenueTable data={revenueData.data} period={period} onDateClick={handleDateClick} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
