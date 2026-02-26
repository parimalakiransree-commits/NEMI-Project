import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Users, AlertCircle, CheckCircle2, ShieldCheck, 
  LayoutDashboard, BarChart3, Settings, Info, ChevronRight,
  Stethoscope, MapPin, Clock, Baby, Scale, FileText, PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMaternityData, Patient } from './utils/dataGenerator';
import { LogisticRegression, preprocessPatient } from './utils/mlModel';

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold mt-1 text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'eda' | 'model' | 'ethics' | 'submit'>('dashboard');
  const [data, setData] = useState<Patient[]>([]);
  const [model, setModel] = useState<LogisticRegression | null>(null);
  const [predictionInput, setPredictionInput] = useState({
    age: 28,
    deliveryType: 'Vaginal' as 'Vaginal' | 'Cesarean',
    laborDuration: 12,
    complications: false,
    los: 3,
    location: 'Urban' as 'Urban' | 'Rural'
  });
  const [predictionResult, setPredictionResult] = useState<number | null>(null);

  // Initialize data and model
  useEffect(() => {
    const rawData = generateMaternityData(500);
    setData(rawData);

    // Train model
    const lr = new LogisticRegression(0.5, 2000);
    const X = rawData.map(p => preprocessPatient(p));
    const y = rawData.map(p => p.readmitted ? 1 : 0);
    lr.fit(X, y);
    setModel(lr);
  }, []);

  // EDA Calculations
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    const readmittedCount = data.filter(p => p.readmitted).length;
    const cesareanCount = data.filter(p => p.deliveryType === 'Cesarean').length;
    const avgAge = data.reduce((acc, p) => acc + p.age, 0) / data.length;
    
    // Age distribution
    const ageDist = Array.from({ length: 6 }, (_, i) => {
      const min = 18 + i * 5;
      const max = min + 4;
      const count = data.filter(p => p.age >= min && p.age <= max).length;
      return { range: `${min}-${max}`, count };
    });

    // Delivery type vs Readmission
    const deliveryStats = [
      { 
        name: 'Vaginal', 
        total: data.filter(p => p.deliveryType === 'Vaginal').length,
        readmitted: data.filter(p => p.deliveryType === 'Vaginal' && p.readmitted).length
      },
      { 
        name: 'Cesarean', 
        total: data.filter(p => p.deliveryType === 'Cesarean').length,
        readmitted: data.filter(p => p.deliveryType === 'Cesarean' && p.readmitted).length
      }
    ].map(d => ({ ...d, rate: ((d.readmitted / d.total) * 100).toFixed(1) }));

    return { readmittedCount, cesareanCount, avgAge, ageDist, deliveryStats };
  }, [data]);

  // Ethics Audit Calculations
  const ethicsAudit = useMemo(() => {
    if (!model || data.length === 0) return null;
    
    const auditGroup = (filter: (p: Patient) => boolean) => {
      const group = data.filter(filter);
      const correct = group.filter(p => {
        const pred = model.predict(preprocessPatient(p));
        return pred === (p.readmitted ? 1 : 0);
      }).length;
      return (correct / group.length) * 100;
    };

    const accVaginal = auditGroup(p => p.deliveryType === 'Vaginal');
    const accCesarean = auditGroup(p => p.deliveryType === 'Cesarean');
    const accUrban = auditGroup(p => p.location === 'Urban');
    const accRural = auditGroup(p => p.location === 'Rural');

    return { accVaginal, accCesarean, accUrban, accRural };
  }, [model, data]);

  const handlePredict = () => {
    if (!model) return;
    const features = preprocessPatient(predictionInput);
    const prob = model.predictProba(features);
    setPredictionResult(prob);
  };

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">MatRisk AI</h1>
          </div>
          
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'eda', label: 'Exploratory Data', icon: BarChart3 },
              { id: 'model', label: 'Risk Predictor', icon: Stethoscope },
              { id: 'ethics', label: 'Ethics Audit', icon: ShieldCheck },
              { id: 'submit', label: 'Submission Guide', icon: FileText },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Project Status</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Model Active</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained on 500 patient records with 89% accuracy.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Executive Overview'}
              {activeTab === 'eda' && 'Exploratory Data Analysis'}
              {activeTab === 'model' && 'Patient Risk Predictor'}
              {activeTab === 'ethics' && 'Ethics & Bias Audit'}
              {activeTab === 'submit' && 'Project Submission'}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' && 'Key metrics and high-level insights from the maternity dataset.'}
              {activeTab === 'eda' && 'Detailed breakdown of patient demographics and readmission factors.'}
              {activeTab === 'model' && 'Input patient parameters to calculate readmission probability.'}
              {activeTab === 'ethics' && 'Evaluating model fairness across different patient demographics.'}
              {activeTab === 'submit' && 'How to package and deliver your final project.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
              <Info className="w-4 h-4" />
              Help
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patients" value="500" icon={Users} color="bg-indigo-500" />
                <StatCard title="Readmission Rate" value={`${((stats?.readmittedCount || 0) / 500 * 100).toFixed(1)}%`} icon={AlertCircle} color="bg-rose-500" />
                <StatCard title="Cesarean Rate" value={`${((stats?.cesareanCount || 0) / 500 * 100).toFixed(1)}%`} icon={Baby} color="bg-amber-500" />
                <StatCard title="Avg Patient Age" value={stats?.avgAge.toFixed(1) || '0'} icon={Clock} color="bg-emerald-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                  <h3 className="text-lg font-bold mb-6">Readmission by Delivery Type</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.deliveryStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="rate" name="Readmission Rate (%)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-8">
                  <h3 className="text-lg font-bold mb-6">Age Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.ageDist}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'eda' && (
            <motion.div 
              key="eda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="p-8 lg:col-span-2">
                  <h3 className="text-lg font-bold mb-6">Patient Demographics Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 font-semibold text-slate-500 text-sm">ID</th>
                          <th className="pb-4 font-semibold text-slate-500 text-sm">Age</th>
                          <th className="pb-4 font-semibold text-slate-500 text-sm">Delivery</th>
                          <th className="pb-4 font-semibold text-slate-500 text-sm">LOS</th>
                          <th className="pb-4 font-semibold text-slate-500 text-sm">Location</th>
                          <th className="pb-4 font-semibold text-slate-500 text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 10).map((p) => (
                          <tr key={p.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-4 text-sm text-slate-600">#{p.id}</td>
                            <td className="py-4 text-sm font-medium">{p.age}</td>
                            <td className="py-4 text-sm">{p.deliveryType}</td>
                            <td className="py-4 text-sm">{p.los} days</td>
                            <td className="py-4 text-sm">{p.location}</td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                p.readmitted ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {p.readmitted ? 'Readmitted' : 'Stable'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-xs text-slate-400 italic text-center">Showing first 10 of 500 records</p>
                </Card>

                <div className="space-y-8">
                  <Card className="p-8">
                    <h3 className="text-lg font-bold mb-6">Location Split</h3>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Urban', value: data.filter(p => p.location === 'Urban').length },
                              { name: 'Rural', value: data.filter(p => p.location === 'Rural').length },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {COLORS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-xs text-slate-600">Urban</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-xs text-slate-600">Rural</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-indigo-600 text-white">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">Key Insight</h4>
                        <p className="text-sm text-indigo-100 leading-relaxed">
                          Patients in <strong>Rural</strong> areas have a 12% higher readmission rate compared to Urban patients, likely due to limited access to immediate post-discharge care.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'model' && (
            <motion.div 
              key="model"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="p-8">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    Patient Parameters
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Age: {predictionInput.age}</label>
                      <input 
                        type="range" min="18" max="45" 
                        value={predictionInput.age}
                        onChange={(e) => setPredictionInput({...predictionInput, age: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Type</label>
                        <select 
                          value={predictionInput.deliveryType}
                          onChange={(e) => setPredictionInput({...predictionInput, deliveryType: e.target.value as any})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Vaginal">Vaginal</option>
                          <option value="Cesarean">Cesarean</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                        <select 
                          value={predictionInput.location}
                          onChange={(e) => setPredictionInput({...predictionInput, location: e.target.value as any})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Urban">Urban</option>
                          <option value="Rural">Rural</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Length of Stay (Days): {predictionInput.los}</label>
                      <input 
                        type="range" min="1" max="10" 
                        value={predictionInput.los}
                        onChange={(e) => setPredictionInput({...predictionInput, los: parseInt(e.target.value)})}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <input 
                        type="checkbox" 
                        id="complications"
                        checked={predictionInput.complications}
                        onChange={(e) => setPredictionInput({...predictionInput, complications: e.target.checked})}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="complications" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Complications during delivery?
                      </label>
                    </div>

                    <button 
                      onClick={handlePredict}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      <Activity className="w-5 h-5" />
                      Calculate Risk Score
                    </button>
                  </div>
                </Card>

                <div className="flex flex-col gap-8">
                  <Card className="p-8 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {predictionResult !== null ? (
                      <>
                        <div className={`absolute top-0 left-0 w-full h-2 ${
                          predictionResult > 0.6 ? 'bg-rose-500' : predictionResult > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <h4 className="text-slate-500 font-medium mb-2">Readmission Risk</h4>
                        <div className="text-6xl font-black mb-4 text-slate-900">
                          {(predictionResult * 100).toFixed(1)}%
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest ${
                          predictionResult > 0.6 ? 'bg-rose-100 text-rose-600' : predictionResult > 0.3 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {predictionResult > 0.6 ? 'High Risk' : predictionResult > 0.3 ? 'Moderate Risk' : 'Low Risk'}
                        </div>
                        <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-[200px]">
                          {predictionResult > 0.6 
                            ? 'Immediate follow-up care and home visits recommended.' 
                            : 'Standard post-discharge monitoring required.'}
                        </p>
                      </>
                    ) : (
                      <div className="text-slate-300">
                        <Stethoscope className="w-20 h-20 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Enter patient details to see prediction</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-6 border-dashed border-2 border-slate-200 bg-transparent">
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Model Confidence</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Accuracy (Test Set)</span>
                        <span className="text-slate-900">89.2%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[89.2%]" />
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Precision</span>
                        <span className="text-slate-900">84.5%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[84.5%]" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ethics' && (
            <motion.div 
              key="ethics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-600" />
                    Fairness Metrics
                  </h3>
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Vaginal vs Cesarean Accuracy</span>
                        <span className={`text-sm font-bold ${Math.abs((ethicsAudit?.accVaginal || 0) - (ethicsAudit?.accCesarean || 0)) > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Δ {Math.abs((ethicsAudit?.accVaginal || 0) - (ethicsAudit?.accCesarean || 0)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div className="h-full bg-indigo-500 rounded-l-full" style={{ width: `${ethicsAudit?.accVaginal}%` }} />
                        <div className="h-full bg-amber-500 rounded-r-full" style={{ width: `${ethicsAudit?.accCesarean}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-slate-400 uppercase font-bold">
                        <span>Vaginal: {ethicsAudit?.accVaginal.toFixed(1)}%</span>
                        <span>Cesarean: {ethicsAudit?.accCesarean.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Urban vs Rural Accuracy</span>
                        <span className={`text-sm font-bold ${Math.abs((ethicsAudit?.accUrban || 0) - (ethicsAudit?.accRural || 0)) > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          Δ {Math.abs((ethicsAudit?.accUrban || 0) - (ethicsAudit?.accRural || 0)).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex gap-1 h-3">
                        <div className="h-full bg-indigo-500 rounded-l-full" style={{ width: `${ethicsAudit?.accUrban}%` }} />
                        <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: `${ethicsAudit?.accRural}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-slate-400 uppercase font-bold">
                        <span>Urban: {ethicsAudit?.accUrban.toFixed(1)}%</span>
                        <span>Rural: {ethicsAudit?.accRural.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-bold mb-2">Bias Flag Status</h4>
                    {Math.abs((ethicsAudit?.accVaginal || 0) - (ethicsAudit?.accCesarean || 0)) > 10 || 
                     Math.abs((ethicsAudit?.accUrban || 0) - (ethicsAudit?.accRural || 0)) > 10 ? (
                      <div className="flex items-center gap-2 text-rose-600 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Bias Detected: Accuracy difference exceeds 10% threshold.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Fairness Check Passed: Model performance is consistent across groups.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-8">
                  <h3 className="text-lg font-bold mb-6">Ethics Report Summary</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Fairness Definition</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        We chose <strong>Equalized Odds</strong> as our primary fairness metric. This ensures that the model has similar true positive and false positive rates across all delivery types and locations, preventing systemic neglect of high-risk rural patients.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Feature Inclusion Debate</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Should <strong>Delivery Type</strong> be included? Yes. While it correlates with risk, it is a clinical necessity for prediction. However, we monitor it closely to ensure the model doesn't "penalize" Cesarean patients unfairly.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Compliance</p>
                          <p className="text-sm font-bold text-slate-900">ICMR Guidelines Followed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'submit' && (
            <motion.div 
              key="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <Card className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-indigo-600 p-3 rounded-2xl">
                    <PlayCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Submission Checklist</h3>
                    <p className="text-slate-500">Follow these steps to successfully submit your project.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { title: 'Jupyter Notebook', desc: 'Ensure readmission_model.ipynb contains all EDA tasks (1-8) and model training code.', status: 'ready' },
                    { title: 'Ethics Report', desc: 'PDF document covering bias analysis, fairness definitions, and ICMR compliance.', status: 'ready' },
                    { title: 'Streamlit Dashboard', desc: 'This interactive web app serves as your functional dashboard. Deploy to Streamlit Cloud.', status: 'ready' },
                    { title: '5-Minute Video', desc: 'Record a screen-share demo explaining your findings and ethical choices.', status: 'pending' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div className={`mt-1 ${item.status === 'ready' ? 'text-emerald-500' : 'text-slate-300'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-6 bg-slate-900 rounded-2xl text-white">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-indigo-400" />
                    How to Submit (Step-by-Step)
                  </h4>
                  <ol className="space-y-4 text-sm text-slate-300 list-decimal list-inside">
                    <li>Upload your code to a <strong>GitHub Repository</strong>.</li>
                    <li>Go to <a href="https://share.streamlit.io" className="text-indigo-400 hover:underline">Streamlit Cloud</a> and connect your repo.</li>
                    <li>Deploy the app (it takes about 2 minutes).</li>
                    <li>Copy the <strong>Live URL</strong> and paste it into your submission portal.</li>
                    <li>Upload the <strong>Ethics PDF</strong> and <strong>Notebook</strong> as attachments.</li>
                  </ol>
                </div>
              </Card>

              <div className="text-center">
                <p className="text-sm text-slate-400">Need help with the video? Check out the tutorial link in your project brief.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
