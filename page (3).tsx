'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/sb'
import Link from 'next/link'
import { Users, DollarSign, TrendingUp, LogOut, Plus } from 'lucide-react'

export default function Dashboard() {
  const [prof, setProf] = useState<any>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const s = sb()
      const { data: { user } } = await s.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await s.from('profissionais').select('*').eq('user_id', user.id).single()
      setProf(p)
      if (!p) { setLoading(false); return }
      const { data: al } = await s.from('alunos').select('*').eq('profissional_id', p.id).eq('ativo', true).order('nome')
      setAlunos(al || [])
      const { data: pg } = await s.from('pagamentos').select('*, alunos(nome)').eq('profissional_id', p.id).order('data_vencimento', { ascending: false }).limit(20)
      setPagamentos(pg || [])
      setLoading(false)
    }
    load()
  }, [])

  async function sair() { await sb().auth.signOut(); router.push('/login') }

  const receitaMes = pagamentos.filter(p => p.status === 'pago' && new Date(p.data_pagamento).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.valor, 0)
  const pendentes = pagamentos.filter(p => p.status === 'pendente').length
  const atrasados = pagamentos.filter(p => p.status === 'atrasado').length

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Carregando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="font-semibold text-sm">NutriSync Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{prof?.nome}</span>
          <button onClick={sair}><LogOut size={16} className="text-gray-400" /></button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Alunos ativos</p>
            <p className="text-2xl font-semibold">{alunos.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Receita mês</p>
            <p className="text-2xl font-semibold text-emerald-600">R${receitaMes.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Pendentes</p>
            <p className="text-2xl font-semibold text-amber-500">{pendentes}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Atrasados</p>
            <p className="text-2xl font-semibold text-red-500">{atrasados}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link href="/alunos" className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-emerald-200 transition-colors">
            <Users size={20} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-600">Alunos</span>
          </Link>
          <Link href="/financeiro" className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-emerald-200 transition-colors">
            <DollarSign size={20} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-600">Financeiro</span>
          </Link>
          <Link href="/evolucao" className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-emerald-200 transition-colors">
            <TrendingUp size={20} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-600">Evolução</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h2 className="font-medium text-sm">Alunos</h2>
            <Link href="/alunos/novo" className="flex items-center gap-1 bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-600">
              <Plus size={12} /> Novo
            </Link>
          </div>
          {alunos.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum aluno cadastrado</p>
              <Link href="/alunos/novo" className="text-emerald-600 text-sm hover:underline mt-1 inline-block">Adicionar primeiro aluno</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alunos.map(a => {
                const pg = pagamentos.find(p => p.aluno_id === a.id)
                const statusColor = pg?.status === 'atrasado' ? 'bg-red-100 text-red-700' : pg?.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                return (
                  <Link key={a.id} href={`/aluno/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 text-sm font-medium">{a.nome[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.nome}</p>
                        <p className="text-xs text-gray-400 capitalize">{a.objetivo} · {a.nivel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.valor_mensalidade && <span className="text-xs text-gray-400">R${a.valor_mensalidade}</span>}
                      {pg && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{pg.status}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
