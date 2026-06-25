import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Search, 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  Sparkles, 
  History, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  Info,
  Edit2,
  X,
  Check
} from 'lucide-react';
import { PrayerRequest } from '../types';

interface PrayersTabProps {
  prayers: PrayerRequest[];
  onAddPrayer: (name: string, text: string) => void;
  onDeletePrayer: (id: string) => void;
  onReactivatePrayer: (id: string) => void;
  onUpdatePrayer: (id: string, name: string, text: string) => void;
  currentDateStr: string;
}

export default function PrayersTab({
  prayers,
  onAddPrayer,
  onDeletePrayer,
  onReactivatePrayer,
  onUpdatePrayer,
  currentDateStr
}: PrayersTabProps) {
  // Tabs within Prayer Requests
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [personName, setPersonName] = useState('');
  const [requestText, setRequestText] = useState('');

  // Edit inline States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRequest, setEditRequest] = useState('');

  // Split prayers into Active vs Expired dynamically
  const { activePrayers, expiredPrayers } = useMemo(() => {
    const active: PrayerRequest[] = [];
    const expired: PrayerRequest[] = [];

    prayers.forEach(p => {
      // If expiresAt is less than today, it is expired
      if (p.expiresAt < currentDateStr) {
        expired.push(p);
      } else {
        active.push(p);
      }
    });

    // Sort active by newest first, expired by expired date/newest first
    active.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    expired.sort((a, b) => b.expiresAt.localeCompare(a.expiresAt));

    return { activePrayers: active, expiredPrayers: expired };
  }, [prayers, currentDateStr]);

  // Filter lists based on Search Query (Case insensitive on name or text)
  const filteredActivePrayers = useMemo(() => {
    if (!searchQuery.trim()) return activePrayers;
    const query = searchQuery.toLowerCase();
    return activePrayers.filter(
      p => p.personName.toLowerCase().includes(query) || p.requestText.toLowerCase().includes(query)
    );
  }, [activePrayers, searchQuery]);

  const filteredExpiredPrayers = useMemo(() => {
    if (!searchQuery.trim()) return expiredPrayers;
    const query = searchQuery.toLowerCase();
    return expiredPrayers.filter(
      p => p.personName.toLowerCase().includes(query) || p.requestText.toLowerCase().includes(query)
    );
  }, [expiredPrayers, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const activeCount = activePrayers.length;
    const expiredCount = expiredPrayers.length;
    const totalCount = prayers.length;

    // Most prayed-for people
    const peopleCounts: { [name: string]: number } = {};
    prayers.forEach(p => {
      const nameKey = p.personName.trim();
      peopleCounts[nameKey] = (peopleCounts[nameKey] || 0) + 1;
    });

    const topPeople = Object.entries(peopleCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Top 3

    return {
      activeCount,
      expiredCount,
      totalCount,
      topPeople
    };
  }, [prayers, activePrayers, expiredPrayers]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !requestText.trim()) return;

    onAddPrayer(personName.trim(), requestText.trim());
    setPersonName('');
    setRequestText('');
    setShowAddForm(false);
  };

  const startEditing = (p: PrayerRequest) => {
    setEditingId(p.id);
    setEditName(p.personName);
    setEditRequest(p.requestText);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim() || !editRequest.trim()) return;
    onUpdatePrayer(id, editName.trim(), editRequest.trim());
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Safe formatting from YYYY-MM-DD to DD/MM/YYYY
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            <Heart className="text-sky-400 w-6 h-6 fill-sky-400/10" />
            Pedidos de Oração e Intercessão
          </h2>
          <p className="text-slate-400 text-sm">
            Adicione pedidos para você, seus irmãos de fé e familiares. Cada clamor permanece ativo por 7 dias no altar de vigília diária.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className="self-start sm:self-auto px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/10"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Novo Pedido
        </button>
      </div>

      {/* Statistics and Quick Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Prayers Card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Orações Ativas</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">{stats.activeCount}</span>
          </div>
        </div>

        {/* Expired / Archive Card */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-slate-400 rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Histórico total</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">{stats.expiredCount}</span>
          </div>
        </div>

        {/* Total prayers ever added */}
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Clamores Feitos</span>
            <span className="text-lg font-bold font-mono text-slate-200 mt-0.5 block">{stats.totalCount}</span>
          </div>
        </div>

        {/* Top people being prayed for */}
        <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl flex flex-col justify-center col-span-2 md:col-span-1">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Mais Intercedido(a)</span>
          <div className="mt-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-black text-slate-200 truncate">
              {stats.topPeople[0]?.name || 'Nenhum ainda'}
            </span>
            {stats.topPeople[0] && (
              <span className="text-[9px] text-slate-500 font-mono font-bold">({stats.topPeople[0].count}x)</span>
            )}
          </div>
        </div>
      </div>

      {/* Add New Prayer Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-900 border border-slate-800 p-5 rounded-2xl"
          >
            <h3 className="text-sm font-bold text-slate-200 mb-3.5 flex items-center gap-2">
              <Heart className="w-4 h-4 text-sky-400" /> Escrever Novo Pedido de Oração
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Nome da Pessoa / Propósito</label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="Ex: Irmã Maria de Fátima"
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vigência Ativa</label>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-450 flex items-center justify-between">
                    <span>Validade de intercessão padrão</span>
                    <strong className="text-sky-400">7 dias (Auto-Histórico)</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Motivo do Clamor / Necessidade</label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Escreva detalhadamente a necessidade de oração (ex: saúde física, restabelecimento espiritual, paz familiar...)"
                  value={requestText}
                  onChange={e => setRequestText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                >
                  Confirmar Pedido
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Filters & Search bar, List items */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-4">
        
        {/* Navigation Filters & Search input */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          
          {/* Active vs Expired selection */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 shrink-0">
            <button
              onClick={() => {
                setViewMode('active');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'active' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Altar Ativo ({activePrayers.length})
            </button>
            <button
              onClick={() => {
                setViewMode('history');
                setSearchQuery('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'history' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Orações Anteriores ({expiredPrayers.length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou palavra-chave..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-250 focus:outline-none focus:border-sky-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* List of Prayer Requests */}
        <div>
          {viewMode === 'active' ? (
            /* Active list */
            filteredActivePrayers.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                <p className="text-xs text-slate-500 italic">
                  {searchQuery ? 'Nenhum pedido ativo corresponde à busca.' : 'Não há pedidos ativos no Altar no momento.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-3 px-3.5 py-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                  >
                    Cadastrar Primeiro Pedido
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivePrayers.map(p => {
                  const isEditing = editingId === p.id;
                  
                  // Calculate days left
                  const parseDate = (dStr: string) => {
                    const parts = dStr.split('-');
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  };
                  const today = parseDate(currentDateStr);
                  const exp = parseDate(p.expiresAt);
                  const diffTime = exp.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  return (
                    <div 
                      key={p.id}
                      className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-slate-800 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        {isEditing ? (
                          /* Inline edit form */
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                              placeholder="Nome"
                            />
                            <textarea
                              value={editRequest}
                              onChange={e => setEditRequest(e.target.value)}
                              rows={2}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none resize-none"
                              placeholder="Pedido"
                            />
                          </div>
                        ) : (
                          /* Standard View */
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-sky-400" />
                                {p.personName}
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Ativo • {diffDays <= 0 ? 'Expira hoje' : `Faltam ${diffDays} dias`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed font-sans whitespace-pre-wrap">
                              {p.requestText}
                            </p>
                          </>
                        )}

                        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Criado: {formatDateBR(p.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Expira: {formatDateBR(p.expiresAt)}
                          </span>
                        </div>
                      </div>

                      {/* CRUD Actions */}
                      <div className="flex md:flex-col items-center justify-end md:justify-start gap-2 shrink-0 pt-1 md:pt-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(p.id)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
                              title="Salvar alterações"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors cursor-pointer border border-slate-800"
                              title="Cancelar edição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(p)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-800"
                              title="Editar pedido"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeletePrayer(p.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-500/20"
                              title="Remover pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Expired History list */
            filteredExpiredPrayers.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-slate-850/50">
                <p className="text-xs text-slate-500 italic">
                  {searchQuery ? 'Nenhum pedido do histórico corresponde à busca.' : 'O histórico de orações anteriores está vazio.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExpiredPrayers.map(p => (
                  <div 
                    key={p.id}
                    className="bg-slate-950/60 p-4 rounded-2xl border border-slate-900 flex flex-col md:flex-row md:items-start justify-between gap-4 opacity-75 hover:opacity-95 transition-opacity"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {p.personName}
                        </span>
                        <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-500">
                          Histórico (Expirado)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans italic">
                        "{p.requestText}"
                      </p>
                      <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Criado: {formatDateBR(p.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Concluído/Expirou: {formatDateBR(p.expiresAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center justify-end md:justify-start gap-2 shrink-0">
                      <button
                        onClick={() => onReactivatePrayer(p.id)}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-black rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reativar pedido por mais 7 dias"
                      >
                        <RotateCcw className="w-3 h-3" /> Orar Novamente
                      </button>
                      <button
                        onClick={() => onDeletePrayer(p.id)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 rounded-lg transition-colors cursor-pointer border border-slate-850"
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

      </div>

      {/* Info Advice Card */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/50 flex items-start gap-2 text-slate-550 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <span>
          O Altar de Intercessão organiza automaticamente seus clamores. Após 7 dias, cada pedido entra em repouso no histórico de preces anteriores, permitindo que você reative o foco do clamor clicando em "Orar Novamente" para reiniciar sua vigência.
        </span>
      </div>

    </motion.div>
  );
}
