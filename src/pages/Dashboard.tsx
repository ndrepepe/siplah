"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign, PieChart, Activity, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  transaction_amount: number;
  bm_percentage: number;
  created_at: string;
}

const Dashboard = () => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalBM: 0,
    count: 0,
    avgBM: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('transaction_amount, bm_percentage, created_at');

      if (error) throw error;

      if (transactions) {
        processData(transactions);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (transactions: Transaction[]) => {
    // Calculate overall stats
    let totalAmount = 0;
    let totalBM = 0;
    
    transactions.forEach(t => {
      const amount = Number(t.transaction_amount);
      const bm = amount * (Number(t.bm_percentage) / 100);
      totalAmount += amount;
      totalBM += bm;
    });

    setStats({
      totalAmount,
      totalBM,
      count: transactions.length,
      avgBM: transactions.length > 0 ? (totalBM / totalAmount) * 100 : 0
    });

    // Process chart data (last 6 months)
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now
    });

    const chartData = months.map(month => {
      const monthTransactions = transactions.filter(t => 
        isSameMonth(new Date(t.created_at), month)
      );

      let mAmount = 0;
      let mBM = 0;

      monthTransactions.forEach(t => {
        const amount = Number(t.transaction_amount);
        const bm = amount * (Number(t.bm_percentage) / 100);
        mAmount += amount;
        mBM += bm;
      });

      return {
        name: format(month, 'MMM yyyy', { locale: id }),
        total: mAmount,
        bm: mBM
      };
    });

    setData(chartData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">Total Transaksi</CardTitle>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{stats.count}</div>
            <p className="text-xs text-slate-500 mt-1">Data yang tercatat</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">Nilai Transaksi</CardTitle>
            <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-slate-500 mt-1">Akumulasi nilai PO</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">Total BM</CardTitle>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalBM)}</div>
            <p className="text-xs text-slate-500 mt-1">Bonus/Margin terkumpul</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">Rata-rata BM</CardTitle>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <PieChart className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{stats.avgBM.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">Persentase rata-rata</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-white/90 backdrop-blur-md border-primary/10 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-5 h-5 text-primary" />
              Tren Transaksi Bulanan
            </CardTitle>
            <CardDescription>Total nilai transaksi dalam 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#640D5F" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#640D5F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `Rp${value / 1000000}jt`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total Transaksi']}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#640D5F" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md border-primary/10 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Perolehan BM Bulanan
            </CardTitle>
            <CardDescription>Total Bonus/Margin dalam 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `Rp${value / 1000000}jt`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: number) => [formatCurrency(value), 'Total BM']}
                />
                <Bar 
                  dataKey="bm" 
                  fill="#B12C00" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;