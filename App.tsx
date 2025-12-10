import React, { useState, useEffect } from 'react';
import { UserRole, JobTitle, TaskLog, TASKS_BY_ROLE } from './types';
import { Dashboard } from './components/Dashboard';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  ClipboardList, 
  LogOut, 
  CheckCircle,
  User,
  Lock,
  X,
  AlertCircle,
  ChevronDown,
  Database,
  Calendar as CalendarIcon,
  RefreshCw,
  KeyRound,
  Terminal,
  Copy,
  Wrench,
  ArrowRight,
  Trash2
} from 'lucide-react';

// --- SQL DE CORREÇÃO (MANTIDO PARA SEGURANÇA) ---
const REPAIR_SQL = `
-- 1. Cria a tabela se não existir (básico)
create table if not exists task_logs (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. FORÇA a criação das colunas se elas estiverem faltando
alter table task_logs add column if not exists date date;
alter table task_logs add column if not exists "user" text;
alter table task_logs add column if not exists role text;
alter table task_logs add column if not exists tasks jsonb;
alter table task_logs add column if not exists "productivityScore" numeric default 100;

-- 3. Habilita segurança (RLS)
alter table task_logs enable row level security;

-- 4. Libera permissões públicas
drop policy if exists "Permitir Leitura Anonima" on task_logs;
drop policy if exists "Permitir Insercao Anonima" on task_logs;
drop policy if exists "Permitir Exclusao Anonima" on task_logs;

create policy "Permitir Leitura Anonima"
on task_logs for select
to anon
using (true);

create policy "Permitir Insercao Anonima"
on task_logs for insert
to anon
with check (true);

create policy "Permitir Exclusao Anonima"
on task_logs for delete
to anon
using (true);
`;

// --- Helper para data local ---
const getLocalTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: UserRole; job: JobTitle } | null>(null);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Estados de erro específicos para Setup
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlCopySuccess, setSqlCopySuccess] = useState(false);

  // State para Login de Gestor
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // State para Login de Colaborador (Dropdown)
  const [selectedCollaboratorName, setSelectedCollaboratorName] = useState("");

  // Form State
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reportDate, setReportDate] = useState<string>(getLocalTodayDate());

  // Lista de Colaboradores
  const COLLABORATORS = [
    { name: 'Leonardo', role: JobTitle.MKT_MANAGER },
    { name: 'Brena', role: JobTitle.TRAFFIC_MANAGER },
    { name: 'Renato', role: JobTitle.WEB_DESIGNER },
    { name: 'Everson', role: JobTitle.DESIGNER },
    { name: 'Jéssyca', role: JobTitle.DESIGNER },
    { name: 'Thainá', role: JobTitle.DESIGNER },
    { name: 'Nayanne', role: JobTitle.JOURNALIST },
    { name: 'Hariel', role: JobTitle.VIDEO_EDITOR },
  ];

  // --- Função para buscar dados do Supabase ---
  const fetchLogs = async () => {
    if (!isSupabaseConfigured()) {
       setDbError("Banco de dados não configurado corretamente.");
       return;
    }

    try {
      const { data, error } = await supabase
        .from('task_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedLogs: TaskLog[] = data.map((item: any) => ({
          id: item.id,
          date: item.date,
          user: item.user,
          role: item.role as JobTitle,
          tasks: item.tasks, 
          productivityScore: item.productivityScore || 100
        }));
        setLogs(formattedLogs);
        setDbError(null);
      }
    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      if (err.message && err.message.includes("does not exist")) {
         setDbError("A tabela 'task_logs' ainda não foi criada no Supabase.");
      }
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('profluxo_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error(e);
      }
    }
    
    if (isSupabaseConfigured()) {
        fetchLogs();
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('profluxo_user', JSON.stringify(currentUser));
      if (currentUser.role === UserRole.MANAGER) {
        fetchLogs();
      }
    } else {
      localStorage.removeItem('profluxo_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (submitSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [submitSuccess]);

  const handleLogin = (role: UserRole, name: string, job: JobTitle) => {
    setSubmitSuccess(false);
    setSelectedTasks([]);
    setReportDate(getLocalTodayDate());
    setCurrentUser({ name, role, job });
  };

  const handleCollaboratorLogin = () => {
    const collaborator = COLLABORATORS.find(c => c.name === selectedCollaboratorName);
    if (collaborator) {
      handleLogin(UserRole.COLLABORATOR, collaborator.name, collaborator.role);
    }
  };

  const initiateManagerLogin = () => {
    setShowPasswordModal(true);
    setPasswordInput("");
    setLoginError("");
  };

  const verifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin123") {
      handleLogin(UserRole.MANAGER, 'Diretoria Executiva', JobTitle.MKT_MANAGER);
      setShowPasswordModal(false);
    } else {
      setLoginError("Senha incorreta. Tente novamente.");
    }
  };

  const toggleTask = (task: string) => {
    setSelectedTasks(prev => 
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(REPAIR_SQL);
    setSqlCopySuccess(true);
    setTimeout(() => setSqlCopySuccess(false), 2000);
  };

  const handleNewRecord = () => {
    setSubmitSuccess(false);
    setSelectedTasks([]);
  };

  // --- DELETE FUNCTION ---
  const handleDeleteLog = async (id: string) => {
    // 1. Confirmação visual
    if (!window.confirm("ATENÇÃO: Tem certeza que deseja excluir este registro permanentemente?")) {
      return;
    }

    // 2. Tenta excluir
    try {
      const { error } = await supabase
        .from('task_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 3. Atualiza estado local (otimista)
      setLogs(prev => prev.filter(l => l.id !== id));
      
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      // Se der erro de permissão (policy), avisa para atualizar o banco
      if (err.code === "42501" || err.message?.includes("policy")) {
         alert("Permissão negada. Seu banco de dados precisa ser atualizado para permitir exclusão. Abrindo código de reparo...");
         setShowSqlModal(true);
      } else {
         alert(`Erro ao excluir: ${err.message}`);
      }
    }
  };

  // --- FUNÇÃO DE ENVIO OFICIAL ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTasks.length === 0) {
        alert("Por favor, selecione ao menos uma tarefa.");
        return;
    }
    
    if (!currentUser || !isSupabaseConfigured()) {
        alert("Erro de configuração ou usuário.");
        return;
    }

    setIsLoading(true);

    try {
        const payload = {
            date: reportDate,
            user: currentUser.name,
            role: currentUser.job,
            tasks: selectedTasks,
            productivityScore: 100
        };

        const { error } = await supabase
            .from('task_logs')
            .insert([payload]);

        if (error) throw error;

        // Tenta atualizar a lista local
        try { await fetchLogs(); } catch (e) {}
        
        setSubmitSuccess(true);
        
    } catch (err: any) {
        console.error("Erro ao salvar:", err);
        
        if (err.message && (
             err.message.includes("relation") || 
             err.message.includes("does not exist") || 
             err.message.includes("column") || 
             err.code === "42P01"
        )) {
             alert("O sistema detectou um problema estrutural no banco de dados. A janela de reparo será aberta.");
             setTimeout(() => setShowSqlModal(true), 500); 
        } else {
             alert(`Erro ao salvar: ${err.message}`);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const refreshLogs = () => {
    fetchLogs();
  };

  const availableTasks = currentUser?.job ? TASKS_BY_ROLE[currentUser.job] : [];

  // --- Modal SQL Repair ---
  const SqlRepairModal = () => (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-red-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Database className="w-5 h-5" /> Atualização de Permissões
          </h3>
          <button onClick={() => setShowSqlModal(false)} className="hover:bg-red-700 p-1 rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 text-sm">
            <p className="font-bold mb-1">Nova Função Detectada:</p>
            <p>Para usar a função de <strong>Excluir</strong>, precisamos atualizar as regras de segurança do seu banco de dados. Copie o código abaixo e execute no SQL Editor.</p>
          </div>

          <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Código SQL de Atualização:
          </h4>

          <div className="relative">
            <div className="absolute top-2 right-2">
              <button 
                onClick={handleCopySql}
                className="bg-gray-800 hover:bg-black text-white text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all"
              >
                {sqlCopySuccess ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {sqlCopySuccess ? "Copiado!" : "Copiar SQL"}
              </button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-gray-700 leading-relaxed">
              {REPAIR_SQL}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
          <button 
            onClick={() => setShowSqlModal(false)}
            className="px-6 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg font-medium"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );

  // --- Aviso de Configuração do DB (Chave) ---
  if (!isSupabaseConfigured() && !currentUser) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
              <div className="bg-white p-8 rounded-xl shadow-lg max-w-xl w-full border-t-4 border-red-600">
                  <div className="text-center mb-6">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <KeyRound className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Ajuste de Segurança Necessário</h1>
                    <p className="text-gray-600">
                        A chave de conexão inserida parece incorreta.
                    </p>
                  </div>
                  <div className="mt-8 text-center">
                    <button onClick={() => window.location.reload()} className="bg-red-800 text-white px-8 py-3 rounded-lg hover:bg-red-900 transition font-medium shadow-md">
                        Tentar novamente
                    </button>
                  </div>
              </div>
          </div>
      )
  }

  // --- Login Screen ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative">
        
        {showSqlModal && <SqlRepairModal />}

        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl text-center border-t-8 border-red-800 my-8">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-50 p-4 rounded-full">
              <ClipboardList className="w-12 h-12 text-red-800" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Marketing EaD - UNINTA</h1>
          <h2 className="text-xl font-medium text-red-800 mb-8">Sistema de Gestão de Produtividade 2.0</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Coluna Administrativa */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Área Administrativa</p>
              <button 
                onClick={initiateManagerLogin}
                className="w-full p-4 bg-gray-900 hover:bg-black text-white rounded-xl transition-all flex items-center gap-3 shadow-lg group"
              >
                <div className="bg-gray-700 p-2 rounded-lg group-hover:bg-gray-600">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold">Diretoria / Gestão</div>
                  <div className="text-xs text-gray-400">Acesso Restrito (Senha)</div>
                </div>
              </button>
            </div>

            {/* Coluna Colaboradores */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Acesso do Colaborador</p>
              
              <div className="bg-white rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quem é você?</label>
                <div className="relative">
                  <select
                    value={selectedCollaboratorName}
                    onChange={(e) => setSelectedCollaboratorName(e.target.value)}
                    className="appearance-none w-full bg-white border border-gray-300 hover:border-red-500 text-gray-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Escolher...</option>
                    {COLLABORATORS.map((collab) => (
                      <option key={collab.name} value={collab.name}>
                        {collab.name} ({collab.role})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <button 
                  onClick={handleCollaboratorLogin}
                  disabled={!selectedCollaboratorName}
                  className={`
                    w-full mt-4 p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                    ${selectedCollaboratorName 
                      ? 'bg-red-800 hover:bg-red-900 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                >
                  <User className="w-5 h-5" />
                  Entrar
                </button>
              </div>

            </div>
          </div>
          <p className="mt-8 text-xs text-gray-400">Baseado na Iniciativa de Inovação Técnico-Administrativa 2025</p>
          
          <div className="mt-6 border-t pt-4">
             {/* Botão discreto para manutenção apenas se houver erro ou necessidade futura */}
             {dbError && (
                 <button 
                   onClick={() => setShowSqlModal(true)}
                   className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center justify-center gap-1 mx-auto"
                 >
                   <Wrench className="w-3 h-3" />
                   Manutenção do Banco de Dados
                 </button>
             )}
          </div>
        </div>

        {/* Modal de Senha */}
        {showPasswordModal && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Acesso Restrito
                </h3>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={verifyPassword} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                  <input 
                    type="password"
                    autoFocus
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    placeholder="Digite a senha..."
                  />
                </div>
                
                {loginError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2 mb-4 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {loginError}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                  >
                    Acessar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Main App Screen ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Setup Modal */}
      {showSqlModal && <SqlRepairModal />}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="bg-red-800 text-white p-1.5 rounded-lg">
               <ClipboardList className="w-5 h-5" />
             </div>
             <div>
               <h1 className="text-lg font-bold text-gray-800 leading-none">ProFluxo <span className="text-red-600">UNINTA</span></h1>
               <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Gestão de Produtividade</p>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                 <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
                 <p className="text-xs text-gray-500">{currentUser.role === UserRole.MANAGER ? 'Diretoria' : currentUser.job}</p>
              </div>
              <button 
                onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem('profluxo_user');
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
           </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Warning if DB error */}
        {dbError && (
           <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
             <Database className="w-5 h-5 shrink-0 mt-0.5" />
             <div>
               <p className="font-bold">Erro de Conexão com Banco de Dados</p>
               <p className="text-sm">{dbError}</p>
               {dbError.includes("tabela") && (
                 <button onClick={() => setShowSqlModal(true)} className="mt-2 text-xs bg-white border border-red-300 px-2 py-1 rounded hover:bg-red-50 font-bold">
                   Ver Código de Correção
                 </button>
               )}
             </div>
           </div>
        )}

        {/* Manager View */}
        {currentUser.role === UserRole.MANAGER ? (
          <Dashboard 
            data={logs} 
            onRefresh={refreshLogs} 
            onDelete={handleDeleteLog} 
          />
        ) : (
          /* Collaborator View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Form Section OR Success Message */}
            <div className="lg:col-span-1 space-y-6">
              
              {submitSuccess ? (
                // --- TELA FINAL DE SUCESSO ---
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-green-500 animate-fade-in text-center h-full flex flex-col justify-center items-center">
                  <div className="bg-green-100 p-4 rounded-full mb-6">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Registro Recebido!</h2>
                  <p className="text-gray-600 mb-8">
                    Suas {selectedTasks.length} atividades foram salvas com segurança no banco de dados.
                  </p>
                  
                  <div className="space-y-3 w-full">
                    <button 
                      onClick={handleNewRecord}
                      className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Fazer Novo Registro
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentUser(null);
                        localStorage.removeItem('profluxo_user');
                      }}
                      className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair do Sistema
                    </button>
                  </div>
                </div>
              ) : (
                // --- FORMULÁRIO ---
                <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-800">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Registro Diário</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      <CalendarIcon className="w-4 h-4" />
                      <input 
                        type="date" 
                        value={reportDate} 
                        onChange={(e) => setReportDate(e.target.value)}
                        className="bg-transparent outline-none w-28 cursor-pointer"
                        max={getLocalTodayDate()}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Task List */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Selecione as atividades realizadas:</p>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {availableTasks.length > 0 ? availableTasks.map((task) => (
                          <label 
                            key={task} 
                            className={`
                              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm
                              ${selectedTasks.includes(task) 
                                ? 'bg-red-50 border-red-200' 
                                : 'bg-white border-gray-100 hover:border-gray-300'}
                            `}
                          >
                            <div className={`
                              mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors
                              ${selectedTasks.includes(task) ? 'bg-red-600 border-red-600' : 'border-gray-300 bg-white'}
                            `}>
                              {selectedTasks.includes(task) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={selectedTasks.includes(task)}
                              onChange={() => toggleTask(task)}
                            />
                            <span className={`text-sm ${selectedTasks.includes(task) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                              {task}
                            </span>
                          </label>
                        )) : (
                          <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-lg">
                            Nenhuma tarefa pré-definida para este cargo.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="submit" 
                      disabled={isLoading || selectedTasks.length === 0}
                      className={`
                        w-full py-3 px-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all
                        ${isLoading || selectedTasks.length === 0
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-gray-900 hover:bg-black hover:shadow-lg transform active:scale-95'}
                      `}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Confirmar Registro
                        </>
                      )}
                    </button>
                    
                  </form>
                </div>
                </div>
              )}
            </div>
            
            {/* History Section */}
            <div className="lg:col-span-2">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <h3 className="font-bold text-gray-800">Meus Registros Recentes</h3>
                     <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Últimos 7 dias</span>
                  </div>
                  
                  {logs.filter(l => l.user === currentUser.name).length > 0 ? (
                    <div className="space-y-4">
                       {logs
                         .filter(l => l.user === currentUser.name)
                         .slice(0, 5) // Show only last 5
                         .map(log => (
                           <div key={log.id} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50 group relative">
                              
                              {/* Botão de Excluir para o próprio usuário */}
                              <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                title="Excluir este registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700 text-sm">
                                      {log.date.split('-').reverse().join('/')}
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{log.tasks.length} atividades</span>
                                 </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {log.tasks.slice(0, 3).map((t, i) => (
                                  <span key={i} className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-600">
                                    {t}
                                  </span>
                                ))}
                                {log.tasks.length > 3 && (
                                  <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 italic">
                                    +{log.tasks.length - 3} mais
                                  </span>
                                )}
                              </div>
                           </div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                       <ClipboardList className="w-12 h-12 mb-2 opacity-20" />
                       <p className="text-sm">Nenhum registro encontrado.</p>
                       <p className="text-xs text-gray-400 mt-2 max-w-xs text-center">
                          {dbError ? "Aguardando configuração do banco." : "Seus envios recentes aparecerão aqui."}
                       </p>
                    </div>
                  )}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;