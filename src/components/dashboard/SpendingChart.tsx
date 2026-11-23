import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonthYear, getRelativeYearMonth } from '../../utils/formatters';
import { ChevronDown } from 'lucide-react';

export const SpendingChart: React.FC = () => {
  const { transactions, selectedMonth, setSelectedMonth } = useFinance();

  // Aggregate daily expenses for the selected month
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    // Number of days in month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Map day numbers 1..daysInMonth
    const dailyExpenses = new Map<number, number>();
    for (let d = 1; d <= daysInMonth; d++) {
      dailyExpenses.set(d, 0);
    }

    // Filter paid expenses in selected month
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.status === 'paid' && tx.date.startsWith(selectedMonth)) {
        const day = parseInt(tx.date.split('-')[2], 10);
        const current = dailyExpenses.get(day) || 0;
        dailyExpenses.set(day, current + tx.amount);
      }
    }

    return Array.from(dailyExpenses.entries()).map(([day, amountCents]) => {
      return {
        day: `${day}`,
        amount: amountCents / 100, // Reals for chart y-axis
        amountCents,
      };
    });
  }, [transactions, selectedMonth]);

  const totalSpent = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amountCents, 0);
  }, [chartData]);

  const availableMonths = useMemo(() => {
    const list = [];
    for (let i = 0; i >= -3; i--) {
      list.push(getRelativeYearMonth(i));
    }
    return list;
  }, []);

  return (
    <div className="px-5 py-3">
      <div className="bg-[#151515] border border-[#262626] rounded-3xl p-5 shadow-xl">
        {/* Header with Title and Month Selector */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-[#A1A1A1] uppercase">
              Fluxo de Gastos
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Total: {formatCurrency(totalSpent)}
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-[#202020] border border-[#292929] text-xs font-medium text-white px-3 py-1.5 pr-7 rounded-xl focus:outline-none focus:border-[#B7FF35] cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#151515] text-white">
                  {formatMonthYear(m, true)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#A1A1A1] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Chart Area */}
        <div className="w-full h-44">
          {totalSpent === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
              <span className="text-xs text-[#666]">Nenhum gasto registrado neste mês</span>
              <span className="text-[10px] text-[#444] mt-1">Toque em "Despesa" para adicionar</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B7FF35" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#B7FF35" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#444"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  tickFormatter={(val) => `D${val}`}
                />
                <YAxis
                  stroke="#444"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#202020] border border-[#292929] rounded-xl px-2.5 py-1.5 shadow-xl text-center">
                          <div className="text-[10px] text-[#A1A1A1]">Dia {data.day}</div>
                          <div className="text-xs font-bold text-[#B7FF35]">
                            {formatCurrency(data.amountCents)}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#B7FF35"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#spendingGradient)"
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, fill: '#B7FF35', stroke: '#080808', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
