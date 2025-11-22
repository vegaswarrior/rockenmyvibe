import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface RevenueData {
  date: string;
  displayDate: string;
  totalRevenue: number;
  orderCount: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  period: 'day' | 'month' | 'year';
}

export default function RevenueChart({ data, period }: RevenueChartProps) {
  const commonProps = {
    dataKey: 'displayDate' as const,
    stroke: 'rgba(255,255,255,0.5)',
    tick: { fontSize: 12 },
  };

  const tooltipConfig = {
    contentStyle: {
      backgroundColor: 'rgba(20, 20, 30, 0.9)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      padding: '8px',
    },
    labelStyle: { color: '#fff' as const },
    formatter: (value: number) => `$${Number(value).toFixed(2)}`,
  };

  return (
    <div className='h-96'>
      <ResponsiveContainer width='100%' height='100%'>
        {period === 'day' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.1)' />
            <XAxis
              {...commonProps}
              angle={-45}
              textAnchor='end'
              height={80}
            />
            <YAxis {...commonProps} />
            <Tooltip {...tooltipConfig} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey='totalRevenue'
              fill='#10b981'
              name='Revenue'
            />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.1)' />
            <XAxis {...commonProps} />
            <YAxis {...commonProps} />
            <Tooltip {...tooltipConfig} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              type='monotone'
              dataKey='totalRevenue'
              stroke='#10b981'
              fill='#10b98133'
              name='Revenue'
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
