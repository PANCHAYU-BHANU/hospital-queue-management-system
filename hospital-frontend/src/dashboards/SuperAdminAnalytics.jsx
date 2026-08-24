import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0d9488', '#e11d48', '#0284c7', '#ca8a04', '#16a34a', '#7c3aed'];

function SuperAdminAnalytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState('month'); // today, month, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Set default dates based on selection
    const now = new Date();
    let start = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (dateRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (dateRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (dateRange === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    }

    if (dateRange !== 'custom') {
      setStartDate(start.toISOString().substring(0, 10));
      setEndDate(end.toISOString().substring(0, 10));
      fetchAnalytics(start.toISOString(), end.toISOString());
    } else if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0,0,0,0);
      const e = new Date(endDate);
      e.setHours(23,59,59,999);
      fetchAnalytics(s.toISOString(), e.toISOString());
    }
  }, [dateRange]);

  const fetchAnalytics = async (start, end) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/analytics/super-admin?startDate=${start}&endDate=${end}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSearch = () => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0,0,0,0);
      const e = new Date(endDate);
      e.setHours(23,59,59,999);
      fetchAnalytics(s.toISOString(), e.toISOString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div className="flex space-x-2">
          <button onClick={() => setDateRange('today')} className={`px-4 py-2 font-bold rounded-xl transition ${dateRange === 'today' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('super_admin_dashboard.today', 'Today')}</button>
          <button onClick={() => setDateRange('month')} className={`px-4 py-2 font-bold rounded-xl transition ${dateRange === 'month' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('super_admin_dashboard.this_month', 'This Month')}</button>
          <button onClick={() => setDateRange('year')} className={`px-4 py-2 font-bold rounded-xl transition ${dateRange === 'year' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('super_admin_dashboard.this_year', 'This Year')}</button>
          <button onClick={() => setDateRange('custom')} className={`px-4 py-2 font-bold rounded-xl transition ${dateRange === 'custom' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t('super_admin_dashboard.custom', 'Custom')}</button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center space-x-2">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
            <span className="text-slate-400 font-bold">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500" />
            <button onClick={handleCustomDateSearch} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition">{t('super_admin_dashboard.apply', 'Apply')}</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-bold">Loading analytics data...</div>
      ) : !stats ? (
        <div className="p-12 text-center text-slate-500 font-bold">Failed to load analytics data.</div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl text-3xl">👥</div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">{t('super_admin_dashboard.total_patients', 'Total Unique Patients')}</p>
                <h4 className="text-3xl font-black text-slate-800">{stats.totalPatients}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl text-3xl">🩺</div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">{t('super_admin_dashboard.total_opd_visits', 'Total OPD Visits')}</p>
                <h4 className="text-3xl font-black text-slate-800">{stats.totalOpdVisits}</h4>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-3xl">💊</div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase">{t('super_admin_dashboard.total_medicines', 'Medicines Dispensed')}</p>
                <h4 className="text-3xl font-black text-slate-800">{stats.totalMedicinesDispensed}</h4>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Visits Line Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
              <h3 className="text-lg font-black text-slate-800 mb-6">{t('super_admin_dashboard.visits_over_time', 'OPD Visits Over Time')}</h3>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={stats.dailyVisits}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="count" name={t('super_admin_dashboard.visits', 'Visits')} stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Medicines Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
              <h3 className="text-lg font-black text-slate-800 mb-6">{t('super_admin_dashboard.top_medicines', 'Top 10 Dispensed Medicines')}</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={stats.topMedicines} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="quantity" name={t('super_admin_dashboard.quantity', 'Quantity')} fill="#e11d48" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hospital Pie Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px]">
              <h3 className="text-lg font-black text-slate-800 mb-6">{t('super_admin_dashboard.visits_by_hospital', 'Visits By Hospital')}</h3>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={stats.hospitalStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="hospitalName"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.hospitalStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SuperAdminAnalytics;
