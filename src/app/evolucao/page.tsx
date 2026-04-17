'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/sb'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function Evolucao() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
    async function load() {
      const s = sb()
      const {data:{user}} = await s.auth.getUser()
      if (!user) { router.push('/login'); return }
      const {data:p} = await s.from('profissionais').select('id').eq('user_id',user.id).single()
      if (!p) return
      const {data:al} = await s.from('alunos').select('*').eq('profissional_id',p.id).eq('ativo',true).order('nome')
      if (al) {
        const s2 = sb()
        const com = await Promise.all(al.map(async a=>{
          const {data:avs} = await s2.from('avaliacoes').select('*').eq('aluno_id',a.id).order('data',{ascending:false}).limit(2)
          const {data:execs} = await s2.from('execucoes').select('*').eq('aluno_id',a.id).gte('data',new Date(Date.now()-7*24*60*60*1000).toISOString().split('T')[0])
          return {...a, avaliacoes:avs||[], execucoes_semana:execs?.length||0}
        }))
        setAlunos(com)
      }
      setLoading(false)
    }
    load()
  },[])

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Carregando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard"><ArrowLeft size={18} className="text-gray-400"/></Link>
        <h1 className="font-semibold text-sm">Evolução geral</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {alunos.map(a=>{
          const atual = a.avaliacoes[0]
          const anterior = a.avaliacoes[1]
          const diff = atual&&anterior&&atual.peso&&anterior.peso ? atual.peso-anterior.peso : null
          return (
            <Link key={a.id} href={`/aluno/${a.id}`} className="bg-white rounded-xl border border-gray-100 p-4 block hover:border-emerald-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 text-sm font-medium">{a.nome[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.nome}</p>
                    <p className="text-xs text-gray-400 capitalize">{a.objetivo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{a.execucoes_semana} treinos essa semana</p>
                  {a.execucoes_semana===0&&<p className="text-xs text-red-500 font-medium">⚠ Sem treinar</p>}
                </div>
              </div>
              {atual ? (
                <div className="flex gap-4 text-xs">
                  {atual.peso&&<span className="text-gray-500">Peso: <strong className="text-gray-800">{atual.peso}kg</strong>
                    {diff!==null&&<span className={`ml-1 font-medium ${diff<0?'text-emerald-600':'text-red-500'}`}>{diff>0?'+':''}{diff.toFixed(1)}</span>}
                  </span>}
                  {atual.gordura&&<span className="text-gray-500">Gordura: <strong className="text-gray-800">{atual.gordura}%</strong></span>}
                  {atual.cintura&&<span className="text-gray-500">Cintura: <strong className="text-gray-800">{atual.cintura}cm</strong></span>}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Sem avaliações registradas</p>
              )}
            </Link>
          )
        })}
        {alunos.length===0&&<p className="text-center text-gray-400 text-sm py-8">Nenhum aluno ativo</p>}
      </main>
    </div>
  )
}
