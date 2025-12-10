import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { TaskLog } from './types';
import { analyzeProductivityData } from './geminiClient';
import { Bot, RefreshCw, TrendingUp, Users, FileSpreadsheet, List, ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCw, Trash2, Calendar } from 'lucide-react';

interface DashboardProps {
  data: TaskLog[];
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

const COLORS = ['#991b1b', '#b91c1c', '#ea580c', '#d97706', '#65a30d', '#0891b2', '#4f46e5'];

export const Dashboard: React.FC<DashboardProps> = ({ data, onRefresh, onDelete }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
  
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today'>('all');

  const getLocalTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateAdjusted = (dateStr: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  const getShortDate = (dateStr: string) => {
     const parts = dateStr.split('-');
     if (parts.length === 3) {
       return `${parts[2]}/${parts[1]}`;
     }
     return dateStr;
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      onRefresh();
      setIsRefreshing(false);
    }, 600);
  };

  const filteredData = filterPeriod === 'today' 
    ? data.filter(d => d.date === getLocalTodayDate())
    : data;

  const tasksByRole = filteredData.reduce((acc, curr) => {
    acc[curr.role] = (acc[curr.role] || 0) + curr.tasks.length;
    return acc;
  }, {} as Record<string, number>);
  
  const pieData = Object.keys(tasksByRole).map(role => ({
    name: role,
    value: tasksByRole[role]
  }));

  const tasksByDate = filteredData.reduce((acc, curr) => {
    acc[curr.date] = (acc[curr.date] || 0) + curr.tasks.length;
    return acc;
  }, {} as Record<string, number>);

  const lineData = Object.keys(tasksByDate).sort().map(date => ({
    date: getShortDate(date),
    tarefas: tasksByDate[date]
  }));

  const tasksByUser = filteredData.reduce((acc, curr) => {
    acc[curr.user] = (acc[curr.user] || 0) + curr.tasks.length;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.keys(tasksByUser).map(user => ({
    name: user,
    tarefas: tasksByUser[user]
  })).sort((a,b) => b.tarefas - a.tarefas);

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeProductivityData(filteredData);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const sortedData = [...filteredData].sort((a, b) => {
    if (a.date !== b.date) {
      return sortOrder === 'desc' 
        ? b.date.localeCompare(a.date) 
        : a.date.localeCompare(b.date);
    }
    return sortOrder === 'desc' 
      ? Number(b.id) - Number(a.id) 
      : Number(a.id) - Number(b.id);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Painel de Controle Estratégico</h2>
           <div className="flex items-center gap-2 mt-1">
             <button onClick={() => setFilterPeriod('all')} className={`text-xs px-2 py-1 rounded border ${filterPeriod === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>Todo o Período</button>
             <button onClick={() => setFilterPeriod('today')} className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${filterPeriod === 'today' ? 'bg-red-800 text-white border-red-800' : 'bg-white text-gray-500 border-gray-200'}`}><Calendar className="w-3 h-3" /> Hoje</button>
           </div>
        </div>
        <div className="flex flex-wrap gap-2">
           <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
              <button onClick={() => setViewMode('charts')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${viewMode === 'charts' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}><TrendingUp className="w-4 h-4" /> Gráficos</button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${viewMode === 'table' ? 'bg-red-50 text-red-700' : 'text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /> Planilha Mestre</button>
           </div>
           <button onClick={handleManualRefresh} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium" title="Atualizar dados manualmente"><RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} /></button>
           <button onClick={handleAiAnalysis} disabled={loadingAi} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg transition-colors shadow-md text-sm font-medium">
            {loadingAi ? <RefreshCw className="animate-spin w-4 h-4" /> : <Bot className="w-4 h-4" />} {loadingAi ? "Analisando..." : "Análise IA"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-800 flex items-center justify-between"><div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total de Entregas</p><p className="text-3xl font-bold text-gray-800 mt-1">{filteredData.reduce((acc, curr) => acc + curr.tasks.length, 0)}</p></div><div className="p-3 bg-red-50 rounded-full text-red-800"><FileSpreadsheet className="w-6 h-6" /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500 flex items-center justify-between"><div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Média Diária</p><p className="text-3xl font-bold text-gray-800 mt-1">{lineData.length > 0 ? (filteredData.reduce((acc, curr) => acc + curr.tasks.length, 0) / lineData.length).toFixed(1) : 0}</p></div><div className="p-3 bg-yellow-50 rounded-full text-yellow-600"><TrendingUp className="w-6 h-6" /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between"><div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Colaboradores Ativos</p><p className="text-3xl font-bold text-gray-800 mt-1">{Object.keys(tasksByUser).length}</p></div><div className="p-3 bg-blue-50 rounded-full text-blue-600"><Users className="w-6 h-6" /></div></div>
      </div>
      {aiAnalysis && (<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden"><div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-600"></div><div className="flex items-center gap-2 mb-3 text-gray-800 font-bold"><Bot className="w-5 h-5 text-purple-600" /><h3>Relatório de Inteligência (Consultor Virtual)</h3></div><div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div></div>)}
      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-sm font-bold text-gray-700 uppercase mb-6 border-b pb-2">Evolução Diária</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={lineData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Line type="monotone" dataKey="tarefas" stroke="#991b1b" strokeWidth={3} activeDot={{ r: 6 }} dot={{fill: '#991b1b'}} /></LineChart></ResponsiveContainer></div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"><h3 className="text-sm font-bold text-gray-700 uppercase mb-6 border-b pb-2">Distribuição por Setor</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Legend verticalAlign="bottom" height={36} iconType="circle" /></PieChart></ResponsiveContainer></div></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2"><h3 className="text-sm font-bold text-gray-700 uppercase mb-6 border-b pb-2">Produtividade Individual</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} layout="vertical" margin={{ left: 40, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={100} tick={{fontSize: 13, fontWeight: 500}} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Bar dataKey="tarefas" fill="#b91c1c" radius={[0, 4, 4, 0]} barSize={24}>{barData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer></div></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-3"><h3 className="font-bold text-gray-700 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Registros Detalhados</h3><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span></div>
             <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors cursor-pointer border border-gray-200">{sortOrder === 'desc' ? <ArrowDownWideNarrow className="w-3 h-3" /> : <ArrowUpNarrowWide className="w-3 h-3" />} {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigos'}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarefas</th><th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDateAdjusted(log.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{log.user}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{log.role}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-500"><div className="flex flex-col gap-1"><span className="text-xs font-bold text-gray-700">{log.tasks.length} Entregas:</span><ul className="list-disc pl-4 space-y-0.5">{log.tasks.slice(0, 3).map((t, i) => (<li key={i} className="text-xs">{t}</li>))}{log.tasks.length > 3 && <li className="text-xs text-gray-400 italic">+{log.tasks.length - 3} outras</li>}</ul></div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => onDelete(log.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50" title="Excluir este registro permanentemente"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};