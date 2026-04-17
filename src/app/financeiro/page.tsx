'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/sb'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function Financeiro() {
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'todos'|'pendente'|'pago'|'atrasado'>('todos')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(()=>{
    async function load() {
      const s = sb()
      const {data:{user}} = await s.auth.getUser()
      if (!user) { router.push('/login'); return }
      const {data:p} = await s.from('profissionais').select('id').eq('user_id',user.id).single()
      if (!p) return
      const {data} = await s.from('pagamentos').select('*, alunos(nome)').eq('profissional_id',p.id).order('data_vencimento',{ascending:false})
      setPagamentos(data||[])
      setLoading(false)
    }
    load()
  },[])

  async function marcarPago(id:string) {
    await sb().from('pagamentos').update({status:'pago',data_pagamento:new Date().toISOString().split('T')[0]}).eq('id',id)
    setPagamentos(pgs=>pgs.map(p=>p.id===id?{...p,status:'pago'}:p))
  }

  const filtrados = filtro==='todos' ? pagamentos : pagamentos.filter(p=>p.status===filtro)
  const totalMes = pagamentos.filter(p=>p.status==='pago'&&new Date(p.data_pagamento).getMonth()===new Date().getMonth()).reduce((s,p)=>s+p.valor,0)
  const totalPendente = pagamentos.filter(p=>p.status==='pendente').reduce((s,p)=>s+p.valor,0)
  const totalAtrasado = pagamentos.filter(p=>p.status==='atrasado').reduce((s,p)=>s+p.valor,0)

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Carregando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard"><ArrowLeft size={18} className="text-gray-400"/></Link>
        <h1 className="font-semibold text-sm">Financeiro</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400">Recebido mês</p>
            <p className="text-lg font-semibold text-emerald-600">R${totalMes.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400">Pendente</p>
            <p className="text-lg font-semibold text-amber-500">R${totalPendente.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400">Atrasado</p>
            <p className="text-lg font-semibold text-red-500">R${totalAtrasado.toFixed(0)}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          {(['todos','pendente','pago','atrasado'] as const).map(f=>(
            <button key={f} onClick={()=>setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filtro===f?'bg-emerald-500 text-white border-emerald-500':'border-gray-200 text-gray-500'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {filtrados.map(pg=>(
            <div key={pg.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{pg.alunos?.nome}</p>
                <p className="text-xs text-gray-400">Venc: {new Date(pg.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">R${pg.valor.toFixed(2)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${pg.status==='pago'?'bg-emerald-100 text-emerald-700':pg.status==='atrasado'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{pg.status}</span>
                {pg.status!=='pago'&&<button onClick={()=>marcarPago(pg.id)} className="text-xs text-emerald-600 hover:underline">Marcar pago</button>}
              </div>
            </div>
          ))}
          {filtrados.length===0&&<p className="text-center text-gray-400 text-sm py-8">Nenhum pagamento</p>}
        </div>
      </main>
    </div>
  )
}
