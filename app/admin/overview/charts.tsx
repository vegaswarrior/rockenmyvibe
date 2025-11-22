'use client';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Charts = ({
  data: { salesData },
}: {
  data: { salesData: { month: string; totalSales: number }[] };
}) => {
  return (
    <div className='w-full h-full'>
      <ResponsiveContainer width='100%' height={350}>
        <LineChart data={salesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id='colorSales' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8} />
              <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='#ffffff1a'
            vertical={false}
          />
          <XAxis
            dataKey='month'
            stroke='#9ca3af'
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#ffffff1a' }}
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis
            stroke='#9ca3af'
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#ffffff1a' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            style={{ fontSize: '0.875rem' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => `${label}`}
            cursor={{ stroke: '#8b5cf6', strokeWidth: 2 }}
          />
          <Line
            type='monotone'
            dataKey='totalSales'
            stroke='#8b5cf6'
            strokeWidth={3}
            dot={{
              fill: '#8b5cf6',
              r: 5,
              strokeWidth: 2,
              stroke: '#fff',
            }}
            activeDot={{
              r: 7,
              fill: '#a78bfa',
              stroke: '#fff',
              strokeWidth: 2,
            }}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing='ease-in-out'
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;
