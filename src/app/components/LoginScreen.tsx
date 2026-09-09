import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Sprout, Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithCustomToken } from 'firebase/auth';

export function LoginScreen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // SSO Login via Firebase Custom Token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setIsLoading(true);
      signInWithCustomToken(auth, token)
        .then(() => {
          // Clean the URL without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
          toast.success("Autenticado automaticamente!");
          navigate("/cultures");
        })
        .catch(err => {
          setIsLoading(false);
          toast.error("Token de autenticação inválido ou expirado.");
          console.error("SSO Error:", err);
        });
    }
  }, [navigate]);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Forgot Password form
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return toast.error('Preencha todos os campos');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast.success('Bem-vindo de volta!');
      navigate('/cultures');
    } catch (err: any) { 
      toast.error('E-mail ou senha incorretos'); 
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) return toast.error('Preencha todos os campos');
    if (registerPassword !== registerConfirmPassword) return toast.error('As senhas não coincidem');
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      toast.success('Conta criada com sucesso!');
      navigate('/cultures');
    } catch (err: any) { 
      toast.error(err.message || 'Erro ao registrar'); 
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Preencha o e-mail');
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      toast.success('E-mail de redefinição enviado!');
      setMode('login');
      setLoginEmail(forgotEmail);
    } catch (err: any) { 
      toast.error(err.message || 'Erro ao recuperar senha'); 
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2d5a4a] to-[#1e4d5c] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <Droplets className="w-12 h-12 text-white" />
            <Sprout className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-white mb-4">Irrigação Inteligente</h1>
          <p className="text-white/80 text-lg">
            Gerencie suas culturas, válvulas e sensores de forma inteligente e segura
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white mb-1">Seguro e Confiável</h3>
              <p className="text-white/70">Seus dados protegidos com a infraestrutura Firebase</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white mb-1">Monitoramento em Tempo Real</h3>
              <p className="text-white/70">Controle total sobre seu sistema de irrigação via WebSocket</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          v2.0.0 - Cloud Enabled
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Droplets className="w-10 h-10 text-[#2d5a4a]" />
            <Sprout className="w-10 h-10 text-[#1e4d5c]" />
          </div>

          <div className="bg-white rounded-xl p-2 flex gap-2 mb-8 border-2 border-[#2d5a4a]/20">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                mode === 'login' ? 'bg-[#2d5a4a] text-white' : 'text-[#5a7368] hover:text-[#1a2e1a]'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                mode === 'register' ? 'bg-[#2d5a4a] text-white' : 'text-[#5a7368] hover:text-[#1a2e1a]'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h2 className="text-[#1a2e1a] mb-2">Bem-vindo de volta</h2>
                <p className="text-[#5a7368]">Entre na sua conta para continuar</p>
              </div>

              <div>
                <label className="block mb-2 text-[#1a2e1a]">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[#1a2e1a]">Senha</label>
                  <button type="button" onClick={() => setMode('forgot')} className="text-sm text-[#2d5a4a] hover:underline">
                    Esqueci a senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a7368] hover:text-[#1a2e1a]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2d5a4a] text-white py-4 rounded-xl hover:bg-[#1a3d2f] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Entrando...' : <>Entrar na Conta <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <h2 className="text-[#1a2e1a] mb-2">Criar nova conta</h2>
                <p className="text-[#5a7368]">Preencha os dados para começar</p>
              </div>

              <div>
                <label className="block mb-2 text-[#1a2e1a]">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-[#1a2e1a]">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-[#1a2e1a]">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-12 pr-12 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a7368] hover:text-[#1a2e1a]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-[#1a2e1a]">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="w-full pl-12 pr-12 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a7368] hover:text-[#1a2e1a]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2d5a4a] text-white py-4 rounded-xl hover:bg-[#1a3d2f] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Criando conta...' : <>Criar Conta <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-6">
              <div>
                <label className="block mb-2 text-[#1a2e1a]">E-mail de Cadastro</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7368]" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#2d5a4a]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d5a4a]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2d5a4a] text-white py-4 rounded-xl hover:bg-[#1a3d2f] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Enviando...' : <>Enviar Email <ArrowRight className="w-5 h-5" /></>}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setMode('login')} className="text-sm text-[#2d5a4a] hover:underline">
                  Voltar para o Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-[#5a7368] hover:text-[#1a2e1a] transition-colors text-sm"
            >
              ← Voltar para início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
