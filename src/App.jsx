import React, { useState, useEffect } from 'react';
import { TrendingUp, Trash2, Copy, Check, Users, FileSpreadsheet, X, ArrowRight, BadgeCheck, Info, Calculator } from 'lucide-react';

const App = () => {
  // --- STATE PENGATURAN ---
  const [targetMin, setTargetMin] = useState(75);     // Batas Bawah Baru (KKM)
  const [targetMax, setTargetMax] = useState(100);    // Batas Atas Baru
  const [studentCount, setStudentCount] = useState(5);

  // --- STATE DATA ---
  // structure: { id, original: '', boosted: null }
  const [data, setData] = useState([]);
  
  // Statistik Data Asli
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });

  // --- STATE IMPORT ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [copiedCol, setCopiedCol] = useState(null);

  // --- INIT DATA ---
  useEffect(() => {
    setData(prev => {
      const adjusted = [...prev];
      if (studentCount > prev.length) {
        for (let i = prev.length; i < studentCount; i++) {
          adjusted.push({ id: i + 1, original: '', boosted: null });
        }
      } else {
        if (prev.length > studentCount) adjusted.length = studentCount;
      }
      return adjusted;
    });
  }, [studentCount]);

  // --- LOGIKA UTAMA: KATROL NILAI ---
  const calculateBoost = () => {
    // 1. Ambil semua nilai valid
    const validValues = data
      .map(d => parseFloat(d.original))
      .filter(v => !isNaN(v));

    if (validValues.length === 0) return;

    // 2. Cari Min & Max Asli dari data
    const minOld = Math.min(...validValues);
    const maxOld = Math.max(...validValues);
    const avgOld = validValues.reduce((a, b) => a + b, 0) / validValues.length;

    setStats({ min: minOld, max: maxOld, avg: avgOld.toFixed(1) });

    // 3. Rumus Linear Transformation
    // New = MinNew + ( (Val - MinOld) * (MaxNew - MinNew) / (MaxOld - MinOld) )
    
    const newData = data.map(item => {
      const val = parseFloat(item.original);
      if (isNaN(val)) return { ...item, boosted: null };

      let result;
      
      if (maxOld === minOld) {
        // Edge case: Jika semua nilai siswa sama, naikkan semua ke targetMax
        result = parseFloat(targetMax); 
      } else {
        const rangeOld = maxOld - minOld;
        const rangeNew = parseFloat(targetMax) - parseFloat(targetMin);
        
        result = parseFloat(targetMin) + ((val - minOld) * rangeNew / rangeOld);
      }

      // Pembulatan (Round) agar rapi, maksimal 2 desimal atau bulat
      // Biasanya nilai rapor bulat
      return { ...item, boosted: Math.round(result) };
    });

    setData(newData);
  };

  const handleValueChange = (index, val) => {
    const newData = [...data];
    newData[index].original = val;
    newData[index].boosted = null; // Reset hasil jika input berubah
    setData(newData);
  };

  const clearAll = () => {
    const newData = data.map(item => ({ ...item, original: '', boosted: null }));
    setData(newData);
    setStats({ min: 0, max: 0, avg: 0 });
  };

  // --- IMPORT & COPY (Sama seperti sebelumnya) ---
  const handleImport = () => {
    const lines = importText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) { setIsImportModalOpen(false); return; }
    
    const importedData = lines.map((val, i) => ({
      id: i + 1,
      original: val, 
      boosted: null 
    }));

    setData(importedData);
    setStudentCount(lines.length);
    setImportText('');
    setIsImportModalOpen(false);
  };

  const copyColumn = (type) => {
    const textToCopy = data.map(item => item[type] !== null ? item[type] : '').join('\n');
    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopiedCol(type);
      setTimeout(() => setCopiedCol(null), 2000);
    } catch (err) { console.error(err); }
    document.body.removeChild(textarea);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-4 font-sans text-slate-800 flex flex-col items-center">
      
      {/* MODAL IMPORT */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400"/> Import Nilai Asli
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 flex flex-col flex-1 overflow-hidden">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg mb-4 text-sm text-indigo-800">
                Paste (Tempel) kolom nilai asli dari Excel di sini.
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full flex-1 p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm resize-none"
                placeholder={`80\n65\n90\n...`}
                autoFocus
              />
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              <button onClick={() => setIsImportModalOpen(false)} className="flex-1 px-4 py-3 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Batal</button>
              <button onClick={handleImport} disabled={!importText.trim()} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg">Proses</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 mb-6">
        
        {/* HEADER */}
        <div className="bg-indigo-900 p-6 text-white text-center md:text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-10 -translate-y-4">
            <TrendingUp className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold flex flex-col md:flex-row items-center md:items-start gap-2">
              <span className="flex items-center gap-2">
                <Calculator className="w-7 h-7 text-indigo-400" />
                Katrol Nilai
              </span>
              <span className="text-sm font-normal text-slate-300 bg-indigo-800 px-3 py-1 rounded-full border border-indigo-700 mt-1 md:mt-0">Linear Scaler</span>
            </h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-lg">
              Dongkrak nilai siswa secara adil. Nilai terendah naik ke Target Min (KKM), nilai tertinggi ke Target Max.
            </p>
          </div>
        </div>

        {/* SETTINGS BAR */}
        <div className="bg-indigo-800 border-t border-indigo-700 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Input Target Min */}
            <div className="bg-indigo-700/50 p-3 rounded-xl border border-indigo-600/50 flex flex-col relative group hover:bg-indigo-700 transition-colors">
              <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">Target Min (KKM)</label>
              <input 
                type="number" 
                value={targetMin}
                onChange={(e) => setTargetMin(e.target.value)}
                className="bg-transparent border-b border-indigo-400 w-full text-xl font-mono font-bold focus:outline-none text-white placeholder-indigo-500"
              />
              <div className="absolute right-2 top-2">
                <ArrowRight className="w-4 h-4 text-indigo-400 rotate-90 md:rotate-0" />
              </div>
            </div>

            {/* Input Target Max */}
            <div className="bg-indigo-700/50 p-3 rounded-xl border border-indigo-600/50 flex flex-col group hover:bg-indigo-700 transition-colors">
              <label className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1">Target Max</label>
              <input 
                type="number" 
                value={targetMax}
                onChange={(e) => setTargetMax(e.target.value)}
                className="bg-transparent border-b border-indigo-400 w-full text-xl font-mono font-bold focus:outline-none text-white placeholder-indigo-500"
              />
            </div>

            {/* Stats View Min */}
            <div className="bg-slate-900/30 p-3 rounded-xl border border-white/10 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Min Asli</label>
              <div className="text-lg font-mono font-bold text-slate-300">{stats.min || '-'}</div>
            </div>

             {/* Stats View Max */}
             <div className="bg-slate-900/30 p-3 rounded-xl border border-white/10 flex flex-col">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Max Asli</label>
              <div className="text-lg font-mono font-bold text-slate-300">{stats.max || '-'}</div>
            </div>

          </div>
        </div>

        {/* CONTROLS */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button onClick={() => setIsImportModalOpen(true)} className="flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:border-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Import
          </button>
          
          <div className="hidden sm:block h-6 w-px bg-slate-300 mx-1"></div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-sm">
            <Users className="w-4 h-4 text-slate-500" />
            <input 
              type="number" min="1" max="500"
              value={studentCount}
              onChange={(e) => setStudentCount(parseInt(e.target.value) || 0)}
              className="w-14 bg-transparent text-center font-bold focus:outline-none text-sm"
            />
            <span className="text-xs font-semibold text-slate-500">Siswa</span>
          </div>

          <div className="flex-1 hidden sm:block"></div>

          <div className="flex gap-2 w-full sm:w-auto">
             <button onClick={clearAll} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" /> Reset
            </button>
            <button onClick={calculateBoost} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 active:scale-95 transition-all">
              <TrendingUp className="w-4 h-4" /> Hitung Katrol
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto p-4 md:p-8 bg-white min-h-[400px]">
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm min-w-[500px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                  <th className="py-3 px-4 text-center w-14 bg-slate-100">No</th>
                  <th className="py-3 px-4 text-left w-1/3">Nilai Asli</th>
                  <th className="py-3 px-4 text-center w-10"></th>
                  <th className="py-3 px-4 text-left w-1/3 bg-indigo-50/50 relative group">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-700">Nilai Katrol</span>
                      {stats.avg > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-normal normal-case">Target: {targetMin}-{targetMax}</span>}
                    </div>
                    <button onClick={() => copyColumn('boosted')} className="absolute top-2 right-2 p-1 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-100 rounded transition-colors" title="Copy Hasil">
                      {copiedCol === 'boosted' ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 text-center font-mono text-slate-400 bg-slate-50/50">{row.id}</td>
                    <td className="py-2 px-4">
                      <input
                        type="number"
                        value={row.original}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-md outline-none font-bold text-slate-700 placeholder-slate-200"
                        placeholder="0"
                      />
                    </td>
                    <td className="py-2 px-0 text-center text-slate-300">
                      <ArrowRight className="w-4 h-4 inline" />
                    </td>
                    <td className="py-2 px-4 bg-indigo-50/20">
                      {row.boosted !== null ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                          <span className="font-mono font-bold text-indigo-600 text-xl">{row.boosted}</span>
                          <span className="text-xs text-green-500 font-bold bg-green-50 px-1.5 rounded">+{ (row.boosted - row.original).toFixed(0) }</span>
                        </div>
                      ) : (
                        <span className="text-slate-200 text-xl">·</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && <div className="p-8 text-center text-slate-400">Belum ada data siswa.</div>}
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs sm:text-sm font-medium">
                <span>&copy; {new Date().getFullYear()}</span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-slate-700">Genesis</span>
                <span>(Grade Booster) by Mas Alfy</span>
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-50" />
            </div>
        </div>

      </div>
    </div>
  );
};

export default App;
