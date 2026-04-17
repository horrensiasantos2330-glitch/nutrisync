'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '@/lib/sb'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoAluno() {
  const [f, setF] = useState({
    nome:'',email:'',telefone:'',data_nascimento:'',sexo:'',objetivo:'saude',nivel:'iniciante',
    peso_atual:'',altura:'',lesoes:'',restricoes:'',alergias:'',medicamentos:'',observacoes:'',
    valor_mensalidade:'',dia_vencimento:'10'
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()
  const set = (k: string, v: string) => setF(prev => ({...prev, [k]: v}))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErro('')
    const s = sb()
    const { data: { user } } = await s.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: prof } = await s.from('profissionais').select('id').eq('user_id', user.id).single()
    if (!prof) { setErro('Perfil não encontrado'); setLoading(false); return }
    const { data: aluno, error } = await s.from('alunos').insert({
      profissional_id: prof.id,
      nome: f.nome, email: f.email||null, telefone: f.telefone||null,
      data_nascimento: f.data_nascimento||null, sexo: f.sexo||null,
      objetivo: f.objetivo, nivel: f.nivel,
      peso_atual: f.peso_atual ? parseFloat(f.peso_atual) : null,
      altura: f.altura ? parseFloat(f.altura) : null,
      lesoes: f.lesoes||null, restricoes: f.restricoes||null,
      alergias: f.alergias||null, medicamentos: f.medicamentos||null,
      observacoes: f.observacoes||null,
      valor_mensalidade: f.valor_mensalidade ? parseFloat(f.valor_mensalidade) : null,
      dia_vencimento: f.dia_vencimento ? parseInt(f.dia_vencimento) : 10
    }).select().single()
    if (error) { setErro(error.message); setLoading(false); return }
    if (f.valor_mensalidade && aluno) {
      const venc = new Date(); venc.setDate(parseInt(f.dia_vencimento)||10)
      await s.from('pagamentos').insert({
        aluno_id: aluno.id, profissional_id: prof.id,
        valor: parseFloat(f.valor_mensalidade),
        data_vencimento: venc.toISOString().split('T')[0],
        status: 'pendente'
      })
    }
    router.push('/dashboard')
  }

  const inp = (k: string, props?: any) => (
    <input value={(f as any)[k]} onChange={e=>set(k,e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      {...props} />
  )
  const sel = (k: string, children: React.ReactNode) => (
    <select value={(f as any)[k]} onChange={e=>set(k,e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
      {children}
    </select>
  )
  const lbl = (label: string, el: React.ReactNode) => (
    <div><label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>{el}</div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard"><ArrowLeft size={18} className="text-gray-400" /></Link>
        <h1 className="font-semibold text-sm">Novo aluno</h1>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Dados básicos</p>
            {lbl('Nome *', inp('nome', {placeholder:'Maria Silva', required:true}))}
            <div className="grid grid-cols-2 gap-3">
              {lbl('E-mail', inp('email', {type:'email'}))}
              {lbl('WhatsApp', inp('telefone', {placeholder:'(11) 99999-9999'}))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {lbl('Nascimento', inp('data_nascimento', {type:'date'}))}
              {lbl('Sexo', sel('sexo', <><option value="">-</option><option value="F">Feminino</option><option value="M">Masculino</option></>))}
              {lbl('Nível', sel('nivel', <><option value="iniciante">Iniciante</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option></>))}
            </div>
            {lbl('Objetivo', sel('objetivo', <><option value="emagrecimento">Emagrecimento</option><option value="hipertrofia">Hipertrofia</option><option value="performance">Performance</option><option value="saude">Saúde geral</option><option value="outro">Outro</option></>))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Dados físicos</p>
            <div className="grid grid-cols-2 gap-3">
              {lbl('Peso (kg)', inp('peso_atual', {type:'number', step:'0.1', placeholder:'68.5'}))}
              {lbl('Altura (cm)', inp('altura', {type:'number', step:'0.1', placeholder:'165'}))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Saúde</p>
            {lbl('Lesões', <textarea value={f.lesoes} onChange={e=>set('lesoes',e.target.value)} rows={2} placeholder="Ex: tendinite no joelho" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />)}
            {lbl('Alergias / Intolerâncias', <textarea value={f.alergias} onChange={e=>set('alergias',e.target.value)} rows={2} placeholder="Ex: lactose, glúten" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />)}
            {lbl('Medicamentos', inp('medicamentos'))}
            {lbl('Observações', <textarea value={f.observacoes} onChange={e=>set('observacoes',e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />)}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Financeiro</p>
            <div className="grid grid-cols-2 gap-3">
              {lbl('Mensalidade (R$)', inp('valor_mensalidade', {type:'number', step:'0.01', placeholder:'150.00'}))}
              {lbl('Dia vencimento', inp('dia_vencimento', {type:'number', min:'1', max:'28'}))}
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          <div className="flex gap-3">
            <Link href="/dashboard" className="flex-1 text-center border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar aluno'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
