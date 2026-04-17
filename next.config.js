'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/sb'

export default function Login() {
  const [modo, setModo] = useState<'login'|'cadastro'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErro('')
    const s = sb()
    if (modo === 'login') {
      const { error } = await s.auth.signInWithPassword({ email, password: senha })
      if (error) { setErro('E-mail ou senha incorretos'); setLoading(false); return }
      router.push('/dashboard')
    } else {
      const { error } = await s.auth.signUp({ email, password: senha, options: { data: { nome }, emailRedirectTo: `${location.origin}/dashboard` } })
      if (error) { setErro(error.message); setLoading(false); return }
      setOk(true)
    }
    setLoading(false)
  }

  if (ok) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-semibold mb-2">Verifique seu e-mail</h2>
        <p className="text-gray-500 text-sm">Enviamos um link para <strong>{email}</strong>. Clique para ativar sua conta.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">N</span>
          </div>
          <h1 className="text-xl font-semibold">NutriSync Pro</h1>
          <p className="text-gray-400 text-sm mt-1">{modo === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {modo === 'cadastro' && (
            <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome completo" required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          )}
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="Senha" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          {erro && <p className="text-red-500 text-xs">{erro}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-4">
          {modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={()=>setModo(modo==='login'?'cadastro':'login')} className="text-emerald-600 font-medium">
            {modo === 'login' ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}
