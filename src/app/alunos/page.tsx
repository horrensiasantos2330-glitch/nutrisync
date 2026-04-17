'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/sb'
import Link from 'next/link'
import { ArrowLeft, Plus, Search } from 'lucide-react'

export default function Alunos() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
    async function load() {
      const s = sb()
      const {data:{user}} = await s.auth.getUser()
      if (!user) { router.push('/login'); return }
      const {data:p} = await s.from('profissionais').select('id').eq('user_id',user.id).single()
      if (!p) return
      const {data} = await s.from('alunos').select('*').eq('profissional_id',p.id).order('nome')
      setAlunos(data||[])
      setLoading(false)
    }
    load()
  },[])

  const filtrados = alunos.filter(a=>a.nome.toLowerCase().includes(busca.toLowerCase()))
  const ativos = filtrados.filter(a=>a.ativo)
  const inativos = filtrados.filter(a=>!a.ativo)

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Carregando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard"><ArrowLeft size={18} className="text-gray-400"/></Link>
          <h1 className="font-semibold text-sm">Alunos ({alunos.filter(a=>a.ativo).length} ativos)</h1>
        </div>
        <Link href="/alunos/novo" className="flex items-center gap-1 bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-600">
          <Plus size={12}/> Novo
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar aluno..."
            className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {ativos.map(a=>(
            <Link key={a.id} href={`/aluno/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 text-sm font-medium">{a.nome[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{a.nome}</p>
                  <p className="text-xs text-gray-400 capitalize">{a.objetivo} · {a.nivel}</p>
                </div>
              </div>
              <div className="text-right">
                {a.peso_atual && <p className="text-xs text-gray-400">{a.peso_atual}kg</p>}
                {a.valor_mensalidade && <p className="text-xs font-medium text-emerald-600">R${a.valor_mensalidade}</p>}
              </div>
            </Link>
          ))}
          {ativos.length===0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum aluno encontrado</p>}
        </div>
        {inativos.length>0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Inativos ({inativos.length})</p>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 opacity-60">
              {inativos.map(a=>(
                <Link key={a.id} href={`/aluno/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{a.nome[0]}</span>
                  </div>
                  <p className="text-sm text-gray-500">{a.nome}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
