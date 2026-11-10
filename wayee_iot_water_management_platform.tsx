import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Code,
  Copy,
  Cpu,
  Database,
  Droplets,
  Eye,
  EyeOff,
  Filter,
  Gauge,
  HelpCircle,
  Key,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Play,
  Pause,
  Power,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Sliders,
  Sun,
  Trash2,
  User,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Zap
} from 'lucide-react';

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  // Global Theme State
  const [darkMode, setDarkMode] = useState(true);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [user, setUser] = useState({
    name: 'Alex Mercer',
    email: 'alex.mercer@aquasentinel.io',
    role: 'Lead Systems Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hardware Simulation & Telemetry State
  const [espStatus, setEspStatus] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE'
  const [rssi, setRssi] = useState(-62);
  const [isFlowActive, setIsFlowActive] = useState(true);
  const [inletFlow, setInletFlow] = useState(14.5);
  const [outletFlow, setOutletFlow] = useState(14.3);
  const [totalVolume, setTotalVolume] = useState(4850.2);
  const [tankLevel, setTankLevel] = useState(78); // Percentage
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [lastPing, setLastPing] = useState(new Date().toLocaleTimeString());

  // Moisture Sensors (Sections A, B, C)
  const [moistureSensors, setMoistureSensors] = useState({
    sectionA: false,
    sectionB: false,
    sectionC: false
  });

  // Historical Telemetry Data for Chart (Last 15 readings)
  const [history, setHistory] = useState([
    { time: '12:00', inlet: 12.1, outlet: 12.0 },
    { time: '12:01', inlet: 13.5, outlet: 13.4 },
    { time: '12:02', inlet: 14.0, outlet: 13.9 },
    { time: '12:03', inlet: 14.2, outlet: 14.1 },
    { time: '12:04', inlet: 14.5, outlet: 14.3 },
  ]);

  // Alert History Log
  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-1092',
      timestamp: '10:42 AM',
      type: 'LEAK_DETECTED',
      severity: 'CRITICAL',
      location: 'Section B (Mid-Pipeline)',
      message: 'Moisture detected & 2.4 L/min flow drop observed.',
      status: 'ACTIVE'
    },
    {
      id: 'ALT-1088',
      timestamp: '08:15 AM',
      type: 'LOW_TANK',
      severity: 'WARNING',
      location: 'Overhead Reservoir',
      message: 'Water level fell below 20% threshold.',
      status: 'RESOLVED'
    },
    {
      id: 'ALT-1074',
      timestamp: 'Yesterday',
      type: 'ESP32_OFFLINE',
      severity: 'HIGH',
      location: 'Gateway Node #1',
      message: 'Wi-Fi telemetry heartbeat interrupted for > 60s.',
      status: 'RESOLVED'
    }
  ]);

  // Notifications Toast State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // --- DERIVED METRICS & LOGIC ---
  const flowMismatch = useMemo(() => {
    if (!isFlowActive || espStatus === 'OFFLINE') return 0;
    const diff = inletFlow - outletFlow;
    return diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
  }, [inletFlow, outletFlow, isFlowActive, espStatus]);

  const leakLocation = useMemo(() => {
    if (moistureSensors.sectionA) return 'Section A';
    if (moistureSensors.sectionB) return 'Section B';
    if (moistureSensors.sectionC) return 'Section C';
    if (flowMismatch > 1.2) return 'Unknown Mismatch';
    return null;
  }, [moistureSensors, flowMismatch]);

  const pipelineHealth = useMemo(() => {
    if (leakLocation) return 'LEAK';
    if (flowMismatch > 0.4) return 'WARNING';
    return 'NORMAL';
  }, [leakLocation, flowMismatch]);

  // --- TELEMETRY SIMULATION LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (espStatus === 'OFFLINE') return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastPing(timeStr);

      if (isFlowActive) {
        // Base flow calculation with subtle jitter
        const baseInlet = 14.0 + (Math.random() * 1.5 - 0.75);
        let baseOutlet = baseInlet - 0.2;

        // Apply drop if leak active
        if (moistureSensors.sectionA) baseOutlet -= 3.2;
        else if (moistureSensors.sectionB) baseOutlet -= 2.5;
        else if (moistureSensors.sectionC) baseOutlet -= 1.8;

        const currentInlet = Math.max(0, parseFloat(baseInlet.toFixed(1)));
        const currentOutlet = Math.max(0, parseFloat(baseOutlet.toFixed(1)));

        setInletFlow(currentInlet);
        setOutletFlow(currentOutlet);

        // Accumulate volume
        setTotalVolume(prev => parseFloat((prev + currentInlet / 60).toFixed(2)));

        // History update
        setHistory(prev => {
          const newHist = [...prev, { time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), inlet: currentInlet, outlet: currentOutlet }];
          return newHist.slice(-12);
        });

        // RSSI jitter
        setRssi(-60 + Math.floor(Math.random() * 8 - 4));
      } else {
        setInletFlow(0);
        setOutletFlow(0);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [espStatus, isFlowActive, moistureSensors]);

  // Auto Buzzer trigger on Critical Leak
  useEffect(() => {
    if (pipelineHealth === 'LEAK') {
      setBuzzerActive(true);
    }
  }, [pipelineHealth]);

  // --- HANDLERS FOR SIMULATION CONTROLS ---
  const toggleLeak = (section) => {
    setMoistureSensors(prev => {
      const nextState = { ...prev, [section]: !prev[section] };
      const isNowLeaking = nextState[section];
      
      if (isNowLeaking) {
        showToast(`Moisture detected at ${section.toUpperCase()}! Leak alert triggered.`, 'danger');
        // Add alert log
        setAlerts(old => [
          {
            id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'LEAK_DETECTED',
            severity: 'CRITICAL',
            location: `Section ${section.slice(-1).toUpperCase()}`,
            message: 'Physical moisture contact detected by IoT sensor.',
            status: 'ACTIVE'
          },
          ...old
        ]);
      } else {
        showToast(`Leak resolved at ${section.toUpperCase()}.`, 'success');
      }
      return nextState;
    });
  };

  const handleResolveAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
    showToast(`Alert ${id} marked as resolved.`, 'success');
  };

  // --- RENDER CONDITIONAL FOR AUTHENTICATION ---
  if (!isAuthenticated) {
    return (
      <AuthContainer 
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        authView={authView}
        setAuthView={setAuthView}
        onLogin={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-[#0B132B] text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Popup */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 border ${
          toast.type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-400 backdrop-blur-md' :
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 backdrop-blur-md' :
          'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 backdrop-blur-md'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Main Layout Wrap */}
      <div className="flex h-screen overflow-hidden">

        {/* Sidebar Desktop */}
        <aside className={`hidden md:flex flex-col justify-between border-r transition-all duration-300 ${
          darkMode ? 'bg-[#1C2541]/70 border-slate-800' : 'bg-white border-slate-200'
        } ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50">
              <div className="flex items-center gap-3 overflow-hidden">
                <WayeeLogo className="w-9 h-9 text-[#00B4D8] shrink-0" />
                {isSidebarOpen && (
                  <div>
                    <h1 className="font-bold text-lg tracking-wider bg-gradient-to-r from-[#00B4D8] to-[#90E0EF] bg-clip-text text-transparent">
                      WAYEE
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">AquaSentinel 2.0</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition ${!isSidebarOpen && 'mx-auto'}`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Nav List */}
            <nav className="p-3 space-y-1">
              <NavItem icon={<LayoutDashboard />} label="Dashboard" id="dashboard" active={activeTab} setActive={setActiveTab} collapsed={!isSidebarOpen} />
              <NavItem icon={<Activity />} label="Pipeline Monitoring" id="pipeline" active={activeTab} setActive={setActiveTab} collapsed={!isSidebarOpen} badge={pipelineHealth === 'LEAK' ? 'ALERT' : null} />
              <NavItem icon={<Gauge />} label="Tank Status" id="tank" active={activeTab} setActive={setActiveTab} collapsed={!isSidebarOpen} />
              <NavItem icon={<Cpu />} label="ESP32 & API Docs" id="hardware" active={activeTab} setActive={setActiveTab} collapsed={!isSidebarOpen} />
              <NavItem icon={<Bell />} label="Alert History" id="alerts" active={activeTab} setActive={setActiveTab} collapsed={!isSidebarOpen} badge={alerts.filter(a => a.status === 'ACTIVE').length || null} />
              <NavItem icon={<Settings />} label="System Settings" id="settings" active={activeTab} setActive={setActiveTab} collapsed={!isSidebarOpen} />
            </nav>
          </div>

          {/* User Profile & Theme Toggle Footer */}
          <div className="p-3 border-t border-slate-800/50 space-y-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400 shrink-0" /> : <Moon className="w-5 h-5 text-indigo-600 shrink-0" />}
              {isSidebarOpen && <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>}
            </button>

            <div className={`flex items-center gap-3 p-2 rounded-xl ${darkMode ? 'bg-slate-900/60' : 'bg-slate-100'}`}>
              <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00B4D8]" />
              {isSidebarOpen && (
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
                </div>
              )}
              {isSidebarOpen && (
                <button 
                  onClick={() => setIsAuthenticated(false)}
                  title="Logout"
                  className="text-slate-400 hover:text-red-400 p-1 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Header Sidebar Drawer */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className={`flex items-center justify-between px-4 py-3 border-b md:hidden ${
            darkMode ? 'bg-[#1C2541] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg text-slate-300">
                <Menu className="w-6 h-6" />
              </button>
              <WayeeLogo className="w-7 h-7 text-[#00B4D8]" />
              <span className="font-bold tracking-wider bg-gradient-to-r from-[#00B4D8] to-[#90E0EF] bg-clip-text text-transparent">
                WAYEE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-400">
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => setIsAuthenticated(false)} className="p-2 text-slate-400 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Mobile Drawer */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
              <div className={`w-72 h-full p-4 space-y-4 ${darkMode ? 'bg-[#0B132B]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <WayeeLogo className="w-8 h-8 text-[#00B4D8]" />
                    <span className="font-bold text-lg text-slate-100">WAYEE</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
                </div>
                <nav className="space-y-1">
                  <NavItem icon={<LayoutDashboard />} label="Dashboard" id="dashboard" active={activeTab} setActive={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                  <NavItem icon={<Activity />} label="Pipeline Monitoring" id="pipeline" active={activeTab} setActive={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                  <NavItem icon={<Gauge />} label="Tank Status" id="tank" active={activeTab} setActive={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                  <NavItem icon={<Cpu />} label="ESP32 & API Docs" id="hardware" active={activeTab} setActive={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                  <NavItem icon={<Bell />} label="Alert History" id="alerts" active={activeTab} setActive={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                  <NavItem icon={<Settings />} label="Settings" id="settings" active={activeTab} setActive={(id) => { setActiveTab(id); setIsMobileMenuOpen(false); }} />
                </nav>
              </div>
            </div>
          )}

          {/* Main Dynamic Workspace Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            
            {/* Top Toolbar / System Banner */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border ${
              darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${espStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {espStatus === 'ONLINE' ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">Node #1 ESP32 DevKit</h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      espStatus === 'ONLINE' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                    }`}>
                      {espStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Signal: {espStatus === 'ONLINE' ? `${rssi} dBm (Good)` : 'Disconnected'}</span>
                    <span>•</span>
                    <span>Last Ping: {lastPing}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setBuzzerActive(!buzzerActive)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                    buzzerActive 
                      ? 'bg-red-500/20 border-red-500 text-red-400 animate-bounce' 
                      : darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {buzzerActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {buzzerActive ? 'Buzzer Mute' : 'Buzzer Silent'}
                </button>
                <button
                  onClick={() => {
                    const next = espStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
                    setEspStatus(next);
                    showToast(`ESP32 state manually set to ${next}`, 'info');
                  }}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition ${
                    espStatus === 'ONLINE' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {espStatus === 'ONLINE' ? 'Simulate Disconnect' : 'Reconnect Hardware'}
                </button>
              </div>
            </div>

            {/* TAB CONTENT VIEWS */}
            {activeTab === 'dashboard' && (
              <DashboardView 
                darkMode={darkMode}
                inletFlow={inletFlow}
                outletFlow={outletFlow}
                flowMismatch={flowMismatch}
                totalVolume={totalVolume}
                tankLevel={tankLevel}
                pipelineHealth={pipelineHealth}
                espStatus={espStatus}
                history={history}
                alerts={alerts}
                leakLocation={leakLocation}
                onSimulateLeak={() => toggleLeak('sectionB')}
              />
            )}

            {activeTab === 'pipeline' && (
              <PipelineMonitoringView 
                darkMode={darkMode}
                inletFlow={inletFlow}
                outletFlow={outletFlow}
                flowMismatch={flowMismatch}
                moistureSensors={moistureSensors}
                toggleLeak={toggleLeak}
                isFlowActive={isFlowActive}
                setIsFlowActive={setIsFlowActive}
                pipelineHealth={pipelineHealth}
                leakLocation={leakLocation}
              />
            )}

            {activeTab === 'tank' && (
              <TankStatusView 
                darkMode={darkMode}
                tankLevel={tankLevel}
                setTankLevel={setTankLevel}
              />
            )}

            {activeTab === 'hardware' && (
              <HardwareApiView 
                darkMode={darkMode}
                inletFlow={inletFlow}
                outletFlow={outletFlow}
                moistureSensors={moistureSensors}
                tankLevel={tankLevel}
                buzzerActive={buzzerActive}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertHistoryView 
                darkMode={darkMode}
                alerts={alerts}
                onResolve={handleResolveAlert}
                onClearAll={() => { setAlerts([]); showToast('Alert logs cleared.', 'info'); }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView darkMode={darkMode} user={user} setUser={setUser} />
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

// --- SUB-VIEWS COMPONENTS ---

// 1. DASHBOARD VIEW
function DashboardView({ darkMode, inletFlow, outletFlow, flowMismatch, totalVolume, tankLevel, pipelineHealth, espStatus, history, alerts, leakLocation, onSimulateLeak }) {
  return (
    <div className="space-y-6">
      
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Inlet Flow */}
        <MetricCard
          darkMode={darkMode}
          title="Inlet Flow Rate"
          value={`${inletFlow} L/min`}
          subtext="Sensor YF-S201 #1"
          icon={<Droplets className="w-6 h-6 text-cyan-400" />}
          accentColor="border-cyan-500/30"
          statusTag="Active Stream"
          statusColor="bg-cyan-500/10 text-cyan-400"
        />

        {/* Metric 2: Outlet Flow */}
        <MetricCard
          darkMode={darkMode}
          title="Outlet Flow Rate"
          value={`${outletFlow} L/min`}
          subtext="Sensor YF-S201 #2"
          icon={<Activity className="w-6 h-6 text-blue-400" />}
          accentColor="border-blue-500/30"
          statusTag={flowMismatch > 0.5 ? `-${flowMismatch} L/min Mismatch` : 'Optimal Flow'}
          statusColor={flowMismatch > 0.5 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}
        />

        {/* Metric 3: Total Consumption */}
        <MetricCard
          darkMode={darkMode}
          title="Total Volume Passed"
          value={`${totalVolume.toLocaleString()} L`}
          subtext="Cumulative Meter Count"
          icon={<Database className="w-6 h-6 text-indigo-400" />}
          accentColor="border-indigo-500/30"
          statusTag="Live Metering"
          statusColor="bg-indigo-500/10 text-indigo-400"
        />

        {/* Metric 4: Pipeline Health */}
        <MetricCard
          darkMode={darkMode}
          title="Pipeline Status"
          value={pipelineHealth}
          subtext={leakLocation ? `Incident at ${leakLocation}` : 'No anomalies detected'}
          icon={<ShieldAlert className={`w-6 h-6 ${pipelineHealth === 'LEAK' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />}
          accentColor={pipelineHealth === 'LEAK' ? 'border-red-500/50' : 'border-emerald-500/30'}
          statusTag={pipelineHealth === 'LEAK' ? 'ACTION REQUIRED' : 'SECURE'}
          statusColor={pipelineHealth === 'LEAK' ? 'bg-red-500/20 text-red-400 font-bold' : 'bg-emerald-500/10 text-emerald-400'}
        />
      </div>

      {/* Main Visuals Grid: Chart + Tank Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Inlet vs Outlet Line Chart Visualizer */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border flex flex-col justify-between ${
          darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#00B4D8]" />
                Real-Time Flow Rates (YF-S201 Sensors)
              </h3>
              <p className="text-xs text-slate-400">Comparing inlet vs outlet sensor telemetry over time</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-400"></span> Inlet</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Outlet</span>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="w-full h-64 relative mt-2">
            <FlowChartSVG history={history} darkMode={darkMode} />
          </div>
        </div>

        {/* Quick Tank Gauge Widget */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Reservoir Level
              </h3>
              <span className="text-xs text-slate-400">HC-SR04 Sensor</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Live distance measurement to water surface</p>

            {/* Tank Vertical Graphic */}
            <div className="relative w-full h-48 bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden flex flex-col justify-end">
              <div 
                className="w-full bg-gradient-to-t from-[#00B4D8] to-[#90E0EF]/80 transition-all duration-700 relative"
                style={{ height: `${tankLevel}%` }}
              >
                {/* Wave Animation Overlay */}
                <div className="absolute top-0 left-0 w-full h-2 bg-white/30 animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none drop-shadow-md">
                <span className="text-3xl font-extrabold text-white tracking-wider">{tankLevel}%</span>
                <span className="text-xs font-medium text-slate-200">
                  {tankLevel > 80 ? 'Full' : tankLevel > 30 ? 'Adequate' : 'Low Level Warning'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Estimated Volume: {(tankLevel * 10).toFixed(0)} L</span>
            <span>Max Tank Height: 200 cm</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Incidents Banner */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base">Quick System Actions</h3>
            <p className="text-xs text-slate-400">Trigger test conditions or manage IoT pipeline states</p>
          </div>
          <button 
            onClick={onSimulateLeak}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Simulate Section B Leak
          </button>
        </div>

        {/* Recent Alerts List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Alert Type</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {alerts.slice(0, 3).map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition">
                  <td className="py-2.5 px-3 font-mono text-slate-400">{item.id}</td>
                  <td className="py-2.5 px-3">{item.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold">{item.type}</td>
                  <td className="py-2.5 px-3">{item.location}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// 2. PIPELINE MONITORING PAGE (Interactive Diagram View)
function PipelineMonitoringView({ darkMode, inletFlow, outletFlow, flowMismatch, moistureSensors, toggleLeak, isFlowActive, setIsFlowActive, pipelineHealth, leakLocation }) {
  return (
    <div className="space-y-6">
      
      {/* Header & Controls Bar */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00B4D8]" />
            Pipeline Network & Moisture Diagnostics
          </h2>
          <p className="text-xs text-slate-400">Interactive live schematic showing sensors YF-S201 #1, YF-S201 #2 and Moisture Nodes A, B, C</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFlowActive(!isFlowActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
              isFlowActive 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isFlowActive ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            {isFlowActive ? 'Flow Active' : 'Flow Stopped'}
          </button>
        </div>
      </div>

      {/* Dynamic Schematic Pipeline Canvas Box */}
      <div className={`p-6 sm:p-10 rounded-2xl border overflow-x-auto ${
        darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="min-w-[700px] flex flex-col items-center justify-center space-y-8 py-6">
          
          {/* Section State Status Banner */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Overall System Health:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${
              pipelineHealth === 'LEAK' ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' :
              pipelineHealth === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              {pipelineHealth === 'LEAK' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {pipelineHealth === 'LEAK' ? `CRITICAL LEAK DETECTED AT ${leakLocation.toUpperCase()}` :
               pipelineHealth === 'WARNING' ? 'UNEXPLAINED FLOW MISMATCH DETECTED' : 'ALL SECTIONS OPERATING NORMALLY'}
            </span>
          </div>

          {/* Interactive Pipeline Diagram */}
          <div className="w-full flex items-center justify-between relative px-6">
            
            {/* Background Pipe Line */}
            <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
              {isFlowActive && (
                <div className={`w-full h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 ${
                  pipelineHealth === 'LEAK' ? 'animate-pulse opacity-70' : ''
                }`}>
                  <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] bg-[length:30px_100%] animate-[shimmer_1.5s_infinite]"></div>
                </div>
              )}
            </div>

            {/* 1. Inlet Water Source */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-cyan-300/30">
                <Droplets className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold mt-2 text-slate-200">Main Inlet</span>
              <span className="text-[10px] text-slate-400">Pressure: 2.4 Bar</span>
            </div>

            {/* 2. Inlet Flow Sensor YF-S201 #1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-cyan-400 flex flex-col items-center justify-center text-cyan-400 shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold mt-2 text-slate-200">Sensor #1 (Inlet)</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{inletFlow} L/min</span>
            </div>

            {/* 3. SECTION A */}
            <PipelineSectionNode
              title="Section A"
              subtitle="Entry Section"
              isMoistureDetected={moistureSensors.sectionA}
              onToggle={() => toggleLeak('sectionA')}
            />

            {/* 4. SECTION B */}
            <PipelineSectionNode
              title="Section B"
              subtitle="Mid Pipeline"
              isMoistureDetected={moistureSensors.sectionB}
              onToggle={() => toggleLeak('sectionB')}
            />

            {/* 5. SECTION C */}
            <PipelineSectionNode
              title="Section C"
              subtitle="Outlet Section"
              isMoistureDetected={moistureSensors.sectionC}
              onToggle={() => toggleLeak('sectionC')}
            />

            {/* 6. Outlet Flow Sensor YF-S201 #2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className={`w-12 h-12 rounded-xl bg-slate-900 border-2 flex flex-col items-center justify-center shadow-md ${
                flowMismatch > 1.0 ? 'border-amber-400 text-amber-400' : 'border-indigo-400 text-indigo-400'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold mt-2 text-slate-200">Sensor #2 (Outlet)</span>
              <span className="text-xs font-mono font-bold text-indigo-400">{outletFlow} L/min</span>
            </div>

            {/* 7. Destination Tank */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-indigo-300/30">
                <Layers className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold mt-2 text-slate-200">Overhead Tank</span>
              <span className="text-[10px] text-slate-400">Ultrasonic Monitored</span>
            </div>

          </div>

          {/* Section Diagnostics Table & Sensor Toggles */}
          <div className="w-full pt-6 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <SectionControlCard
              sectionName="Section A (Entry)"
              moistureStatus={moistureSensors.sectionA}
              onToggle={() => toggleLeak('sectionA')}
            />

            <SectionControlCard
              sectionName="Section B (Mid Segment)"
              moistureStatus={moistureSensors.sectionB}
              onToggle={() => toggleLeak('sectionB')}
            />

            <SectionControlCard
              sectionName="Section C (Outlet Segment)"
              moistureStatus={moistureSensors.sectionC}
              onToggle={() => toggleLeak('sectionC')}
            />

          </div>
        </div>
      </div>

      {/* Logic Breakdown Explanation Box */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/30 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h4 className="font-bold text-sm mb-2 text-slate-300 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#00B4D8]" />
          AquaSentinel 2.0 Multi-Sensor Detection Logic
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          The system evaluates water flow in real-time by comparing impulse frequencies from YF-S201 Flow Sensor #1 (Inlet) and Sensor #2 (Outlet). If <code className="text-cyan-400">Inlet Flow &gt; Outlet Flow</code> by more than 0.5 L/min for 3 consecutive readings while any of the resistance moisture probes (Sections A, B, or C) register low impedance (water contact), WAYEE immediately pinpoints the exact physical leak segment, triggers the ESP32 piezo buzzer, and flags an urgent incident report.
        </p>
      </div>

    </div>
  );
}

// 3. TANK STATUS VIEW
function TankStatusView({ darkMode, tankLevel, setTankLevel }) {
  return (
    <div className="space-y-6">
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#00B4D8]" />
          Overhead Reservoir Analytics (HC-SR04 Sensor)
        </h2>
        <p className="text-xs text-slate-400">Ultrasonic depth telemetry & fill simulation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Large Tank Interactive Fill Graphic */}
        <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center ${
          darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-56 h-80 bg-slate-900/60 rounded-3xl border-4 border-slate-700 p-2 relative overflow-hidden flex flex-col justify-end shadow-2xl">
            {/* Liquid Fill */}
            <div 
              className="w-full bg-gradient-to-t from-cyan-600 via-blue-500 to-[#90E0EF] rounded-b-2xl transition-all duration-500 relative"
              style={{ height: `${tankLevel}%` }}
            >
              <div className="absolute top-0 inset-x-0 h-3 bg-white/40 animate-pulse"></div>
            </div>

            {/* Ultrasonic HC-SR04 Icon representation top */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-300">HC-SR04 Ping</span>
            </div>

            {/* Percentage Text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-lg">
              <span className="text-5xl font-black text-white">{tankLevel}%</span>
              <span className="text-xs uppercase font-bold text-slate-200 mt-1">
                {((200 * (100 - tankLevel)) / 100).toFixed(1)} cm Sensor Distance
              </span>
            </div>
          </div>
        </div>

        {/* Tank Level Controls & Metrics */}
        <div className={`p-6 rounded-2xl border space-y-6 flex flex-col justify-between ${
          darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className="font-bold text-lg mb-2">Simulate Level Adjustment</h3>
            <p className="text-xs text-slate-400 mb-6">Manually adjust ultrasonic sensor echo distance simulation</p>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-semibold">
                <span>Tank Level</span>
                <span className="text-cyan-400">{tankLevel}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={tankLevel}
                onChange={(e) => setTankLevel(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#00B4D8]"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Empty)</span>
                <span>50% (Half)</span>
                <span>100% (Full)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Calculated Capacity:</span>
              <span className="font-bold font-mono">2,000 Liters Total</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Liquid Volume:</span>
              <span className="font-bold font-mono text-cyan-400">{(tankLevel * 20).toFixed(0)} Liters</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Overflow Threshold:</span>
              <span className="font-bold font-mono text-emerald-400">95% (190 cm)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 4. ESP32 HARDWARE INTEGRATION & API CODE PAGE
function HardwareApiView({ darkMode, inletFlow, outletFlow, moistureSensors, tankLevel, buzzerActive }) {
  const [copied, setCopied] = useState(false);

  // Dynamic Live JSON Payload Preview
  const jsonPayload = JSON.stringify({
    device_id: "WAYEE-ESP32-NODE1",
    wifi_rssi_dbm: -64,
    sensors: {
      inlet_flow_lmin: inletFlow,
      outlet_flow_lmin: outletFlow,
      moisture_a: moistureSensors.sectionA ? 1 : 0,
      moisture_b: moistureSensors.sectionB ? 1 : 0,
      moisture_c: moistureSensors.sectionC ? 1 : 0,
      tank_ultrasonic_cm: Math.round(200 * (1 - tankLevel / 100))
    },
    actuators: {
      buzzer_active: buzzerActive ? 1 : 0
    },
    timestamp: new Date().toISOString()
  }, null, 2);

  // Starter C++ Firmware Snippet for ESP32
  const arduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* apiEndpoint = "https://api.wayee.io/v1/telemetry";

// Pin Definitions
#define INLET_FLOW_PIN 4
#define OUTLET_FLOW_PIN 16
#define MOISTURE_SECTION_A 32
#define MOISTURE_SECTION_B 33
#define MOISTURE_SECTION_C 34
#define TRIG_PIN 5
#define ECHO_PIN 18
#define BUZZER_PIN 19

void setup() {
  Serial.begin(115200);
  pinMode(MOISTURE_SECTION_A, INPUT);
  pinMode(MOISTURE_SECTION_B, INPUT);
  pinMode(MOISTURE_SECTION_C, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected to WAYEE Server!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiEndpoint);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<300> doc;
    doc["device_id"] = "WAYEE-ESP32-NODE1";
    doc["sensors"]["inlet_flow_lmin"] = 14.5;
    doc["sensors"]["outlet_flow_lmin"] = 14.3;
    doc["sensors"]["moisture_a"] = digitalRead(MOISTURE_SECTION_A);
    doc["sensors"]["moisture_b"] = digitalRead(MOISTURE_SECTION_B);

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.printf("HTTP Response Code: %d\\n", httpResponseCode);
    http.end();
  }
  delay(2500);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Cpu className="w-6 h-6 text-[#00B4D8]" />
          ESP32 DevKit Hardware Integration & API Docs
        </h2>
        <p className="text-xs text-slate-400">Live JSON Telemetry Schema, Endpoint Protocols & Firmware Code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live Payload Stream Viewer */}
        <div className={`p-5 rounded-2xl border flex flex-col ${darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              Live Output JSON Stream (`/api/v1/telemetry`)
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>

          <pre className="flex-1 bg-slate-950 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800">
            {jsonPayload}
          </pre>
        </div>

        {/* MQTT & API Configuration Info */}
        <div className={`p-5 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Communication Endpoints
          </h3>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">HTTP REST API (POST)</span>
              <p className="text-xs font-mono text-slate-200 mt-1">https://api.wayee.io/v1/telemetry</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">MQTT Broker Topic</span>
              <p className="text-xs font-mono text-slate-200 mt-1">wayee/aquasentinel/telemetry</p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Buzzer Override Command Topic</span>
              <p className="text-xs font-mono text-slate-200 mt-1">wayee/aquasentinel/actuators/buzzer</p>
            </div>
          </div>
        </div>
      </div>

      {/* C++ Arduino Code Block */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-400" />
              Arduino IDE C++ Starter Firmware (ESP32)
            </h3>
            <p className="text-xs text-slate-400">Copy & paste into your ESP32 AquaSentinel 2.0 sketch</p>
          </div>

          <button 
            onClick={copyCode}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Sketch'}
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800 max-h-80">
          {arduinoCode}
        </pre>
      </div>

    </div>
  );
}

// 5. ALERT HISTORY VIEW
function AlertHistoryView({ darkMode, alerts, onResolve, onClearAll }) {
  const [filter, setFilter] = useState('ALL');

  const filteredAlerts = useMemo(() => {
    if (filter === 'ALL') return alerts;
    return alerts.filter(a => a.severity === filter || a.status === filter);
  }, [alerts, filter]);

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Bar */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#00B4D8]" />
            Security & Incident Logs
          </h2>
          <p className="text-xs text-slate-400">Filter and resolve pipeline leak and hardware alert history</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <option value="ALL">All Alerts</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warnings</option>
            <option value="ACTIVE">Active Incidents</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <button
            onClick={onClearAll}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            title="Clear Logs"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">No alert logs match the current filter.</td>
                </tr>
              ) : (
                filteredAlerts.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">{item.id}</td>
                    <td className="py-3 px-4">{item.timestamp}</td>
                    <td className="py-3 px-4 font-semibold">{item.type}</td>
                    <td className="py-3 px-4">{item.location}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{item.message}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'ACTIVE' ? (
                        <button
                          onClick={() => onResolve(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold transition"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// 6. SYSTEM SETTINGS VIEW
function SettingsView({ darkMode, user, setUser }) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#00B4D8]" />
          System & User Configuration
        </h2>
        <p className="text-xs text-slate-400">Manage profile details, alerting thresholds, and hardware sensitivity</p>
      </div>

      {/* User Profile Form */}
      <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="font-bold text-base mb-4">Operator Profile</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
            <input 
              type="text" 
              value={user.name} 
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input 
              type="email" 
              value={user.email} 
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Threshold Configuration */}
      <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-[#1C2541]/40 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="font-bold text-base mb-2">Leak Detection Thresholds</h3>
        
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <div>
              <p className="font-semibold text-slate-200">Flow Mismatch Sensitivity</p>
              <p className="text-slate-400">Tolerance difference between inlet & outlet sensors before flagging warning</p>
            </div>
            <span className="font-mono text-cyan-400 font-bold">0.5 L/min</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <div>
              <p className="font-semibold text-slate-200">Low Tank Alert Level</p>
              <p className="text-slate-400">Minimum volume threshold to send email push alerts</p>
            </div>
            <span className="font-mono text-amber-400 font-bold">20% Capacity</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENT ATOMS ---

// Custom Brand Logo Icon (Water droplet + Connected Node)
function WayeeLogo({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Droplet Outline */}
      <path 
        d="M50 10C50 10 20 48 20 68C20 84.5685 33.4315 90 50 90C66.5685 90 80 84.5685 80 68C80 48 50 10 50 10Z" 
        fill="url(#dropletGrad)" 
      />
      {/* Network Node Connectivity Overlay */}
      <circle cx="50" cy="45" r="5" fill="#FFFFFF" />
      <circle cx="38" cy="65" r="4" fill="#90E0EF" />
      <circle cx="62" cy="65" r="4" fill="#90E0EF" />
      <line x1="50" y1="45" x2="38" y2="65" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="45" x2="62" y2="65" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="65" x2="62" y2="65" stroke="#90E0EF" strokeWidth="2" strokeDasharray="3 3" />
      
      <defs>
        <linearGradient id="dropletGrad" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00B4D8" />
          <stop offset="1" stopColor="#0077B6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Sidebar Navigation Item Link
function NavItem({ icon, label, id, active, setActive, collapsed, badge }) {
  const isSelected = active === id;
  return (
    <button
      onClick={() => setActive(id)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
        isSelected 
          ? 'bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-center gap-3">
        {React.cloneElement(icon, { className: 'w-5 h-5 shrink-0' })}
        {!collapsed && <span>{label}</span>}
      </div>
      {!collapsed && badge && (
        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
          isSelected ? 'bg-white text-[#00B4D8]' : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Single Metric Summary Card
function MetricCard({ darkMode, title, value, subtext, icon, accentColor, statusTag, statusColor }) {
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.01] ${
      darkMode ? 'bg-[#1C2541]/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    } ${accentColor}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        <div className="p-2 rounded-xl bg-slate-800/50">{icon}</div>
      </div>
      <div className="mb-2">
        <h4 className="text-2xl font-black tracking-tight">{value}</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">{subtext}</p>
      </div>
      <div className="pt-3 border-t border-slate-800/40 flex items-center justify-between">
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColor}`}>
          {statusTag}
        </span>
      </div>
    </div>
  );
}

// Pipeline Schematic Section Node Graphic Component
function PipelineSectionNode({ title, subtitle, isMoistureDetected, onToggle }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <button 
        onClick={onToggle}
        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
          isMoistureDetected 
            ? 'bg-red-500/20 border-red-500 text-red-400 animate-bounce' 
            : 'bg-slate-900 border-emerald-500/60 text-emerald-400 hover:border-emerald-400'
        }`}
      >
        <Droplets className="w-5 h-5" />
      </button>
      <span className="text-xs font-bold mt-2 text-slate-200">{title}</span>
      <span className={`text-[10px] font-bold ${isMoistureDetected ? 'text-red-400' : 'text-slate-400'}`}>
        {isMoistureDetected ? 'WET (LEAK)' : 'DRY (NORMAL)'}
      </span>
    </div>
  );
}

// Interactive Pipeline Diagnostic Control Card
function SectionControlCard({ sectionName, moistureStatus, onToggle }) {
  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
      <div>
        <p className="text-xs font-bold text-slate-200">{sectionName}</p>
        <p className={`text-[11px] font-semibold mt-0.5 ${moistureStatus ? 'text-red-400' : 'text-emerald-400'}`}>
          {moistureStatus ? 'Water Detected' : 'No Moisture'}
        </p>
      </div>
      <button 
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
          moistureStatus 
            ? 'bg-red-500/20 text-red-400 border-red-500/40' 
            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
        }`}
      >
        {moistureStatus ? 'Clear Leak' : 'Trigger Leak'}
      </button>
    </div>
  );
}

// SVG Line Chart Component for Dynamic Sensor Visualization
function FlowChartSVG({ history, darkMode }) {
  if (!history || history.length === 0) return null;

  const width = 600;
  const height = 200;
  const padding = 30;

  const maxVal = 20;
  const pointsInlet = history.map((d, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.inlet / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pointsOutlet = history.map((d, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.outlet / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Grid Lines */}
      {[0, 5, 10, 15, 20].map((val) => {
        const y = height - padding - (val / maxVal) * (height - padding * 2);
        return (
          <g key={val}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={darkMode ? '#334155' : '#e2e8f0'} strokeDasharray="4 4" strokeWidth="1" />
            <text x={padding - 10} y={y + 4} fill="#94a3b8" fontSize="10" textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Inlet Line (Cyan) */}
      <polyline
        fill="none"
        stroke="#00B4D8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsInlet}
      />

      {/* Outlet Line (Indigo) */}
      <polyline
        fill="none"
        stroke="#6366F1"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pointsOutlet}
      />

      {/* X Axis Time Labels */}
      {history.map((d, i) => {
        const x = padding + (i / (history.length - 1)) * (width - padding * 2);
        return (
          <text key={i} x={x} y={height - 5} fill="#94a3b8" fontSize="9" textAnchor="middle">{d.time}</text>
        );
      })}
    </svg>
  );
}

// 7. AUTHENTICATION CONTAINER VIEW
function AuthContainer({ darkMode, setDarkMode, authView, setAuthView, onLogin }) {
  const [email, setEmail] = useState('alex.mercer@aquasentinel.io');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 ${
      darkMode ? 'bg-[#0B132B] text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      
      {/* Theme Toggle Top Corner */}
      <div className="absolute top-5 right-5">
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl border border-slate-700">
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl space-y-6 ${
        darkMode ? 'bg-[#1C2541] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <WayeeLogo className="w-14 h-14 text-[#00B4D8]" />
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-[#00B4D8] to-[#90E0EF] bg-clip-text text-transparent">
            WAYEE
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            Intelligent Water Monitoring. Smarter Water Conservation.
          </p>
        </div>

        {/* Auth Forms */}
        {authView === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Operator Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs border outline-none transition ${
                  darkMode ? 'bg-slate-900 border-slate-700 focus:border-[#00B4D8]' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-400">Security Password</label>
                <button type="button" onClick={() => setAuthView('forgot')} className="text-[11px] text-[#00B4D8] hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs border outline-none transition ${
                    darkMode ? 'bg-slate-900 border-slate-700 focus:border-[#00B4D8]' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00B4D8] to-[#0077B6] hover:from-[#0096C7] hover:to-[#023E8A] text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 transition"
            >
              Sign In to Dashboard
            </button>
          </form>
        )}

        {authView === 'forgot' && (
          <div className="space-y-4 text-center">
            <h3 className="font-bold text-sm">Reset Security Password</h3>
            <p className="text-xs text-slate-400">Enter your operator email to receive access credentials link.</p>
            <input 
              type="email" 
              placeholder="operator@aquasentinel.io"
              className={`w-full px-4 py-2.5 rounded-xl text-xs border outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            />
            <button 
              onClick={() => setAuthView('login')}
              className="w-full py-2.5 rounded-xl bg-[#00B4D8] text-white font-bold text-xs"
            >
              Send Reset Link
            </button>
            <button 
              onClick={() => setAuthView('login')}
              className="text-xs text-slate-400 hover:underline block mx-auto"
            >
              Back to Login
            </button>
          </div>
        )}

        <div className="text-center pt-2 border-t border-slate-800/50">
          <p className="text-[11px] text-slate-400">
            AquaSentinel 2.0 Hardware Integrated • ESP32 Wireless Gateway
          </p>
        </div>

      </div>
    </div>
  );
}