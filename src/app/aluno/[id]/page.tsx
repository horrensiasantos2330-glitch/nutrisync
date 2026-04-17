'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { sb } from '@/lib/sb'
import { ArrowLeft, Plus, Trash2, CheckCircle, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'

type Tab = 'treino'|'nutricao'|'evolucao'|'financeiro'|'perfil'

function Inp({ value, onChange, ...props }: any) {
  return <input value={value} onChange={onChange} {...props}
    className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
}

export default function Aluno() {
  const [tab, setTab] = useState<Tab>('treino')
  const [aluno, setAluno] = useState<any>(null)
  const [profId, setProfId] = useState('')
  const [programas, setProgramas] = useState<any[]>([])
  const [treinos, setTreinos] = useState<any[]>([])
  const [exercicios, setExercicios] = useState<{[k:string]:any[]}>({})
  const [execucoes, setExecucoes] = useState<any[]>([])
  const [planos, setPlanos] = useState<any[]>([])
  const [refeicoes, setRefeicoes] = useState<{[k:string]:any[]}>({})
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [pagamentos, setPagamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [novoProgNome, setNovoProgNome] = useState('')
  const [novoTreNome, setNovoTreNome] = useState('')
  const [progSel, setProgSel] = useState('')
  const [treinoSel, setTreinoSel] = useState('')
  const [novoEx, setNovoEx] = useState({nome:'',grupo:'',series:'3',reps:'12',carga:'',obs:''})
  const [novoPlanNome, setNovoPlanNome] = useState('')
  const [planoSel, setPlanoSel] = useState('')
  const [novaRef, setNovaRef] = useState({nome:'',horario:'',alimentos:'',cal:'',prot:'',carbo:'',gord:''})
  const [novaAv, setNovaAv] = useState({peso:'',gordura:'',cintura:'',quadril:'',braco_d:'',coxa_d:'',obs:''})
  const [novoPag, setNovoPag] = useState({valor:'',venc:'',status:'pendente'})

  const [editProgId, setEditProgId] = useState<string|null>(null)
  const [editProgNome, setEditProgNome] = useState('')
  const [editTreId, setEditTreId] = useState<string|null>(null)
  const [editTreNome, setEditTreNome] = useState('')
  const [editExId, setEditExId] = useState<string|null>(null)
  const [editEx, setEditEx] = useState({nome:'',grupo:'',series:'',reps:'',carga:'',obs:''})
  const [editPlanoId, setEditPlanoId] = useState<string|null>(null)
  const [editPlanoNome, setEditPlanoNome] = useState('')
  const [editRefId, setEditRefId] = useState<string|null>(null)
  const [editRef, setEditRef] = useState({nome:'',horario:'',alimentos:'',cal:'',prot:'',carbo:'',gord:''})
  const [editAvId, setEditAvId] = useState<string|null>(null)
  const [editAv, setEditAv] = useState({peso:'',gordura:'',cintura:'',quadril:'',braco_d:'',coxa_d:'',obs:''})
  const [editPagId, setEditPagId] = useState<string|null>(null)
  const [editPag, setEditPag] = useState({valor:'',venc:'',status:'pendente'})
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [editAluno, setEditAluno] = useState<any>({})

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    async function load() {
      const s = sb()
      const { data: { user } } = await s.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await s.from('profissionais').select('id').eq('user_id', user.id).single()
      if (!p) return
      setProfId(p.id)
      const { data: al } = await s.from('alunos').select('*').eq('id', id).single()
      setAluno(al); setEditAluno(al || {})
      const { data: progs } = await s.from('programas').select('*').eq('aluno_id', id).order('created_at')
      setProgramas(progs || [])
      if (progs?.length) {
        setProgSel(progs[0].id)
        const { data: trs } = await s.from('treinos').select('*').eq('programa_id', progs[0].id).order('ordem')
        setTreinos(trs || [])
        if (trs?.length) {
          setTreinoSel(trs[0].id)
          for (const t of trs) {
            const { data: exs } = await s.from('exercicios').select('*').eq('treino_id', t.id).order('ordem')
            setExercicios(prev => ({ ...prev, [t.id]: exs || [] }))
          }
        }
      }
      const { data: exec } = await s.from('execucoes').select('*, treinos(nome)').eq('aluno_id', id).order('data', { ascending: false }).limit(20)
      setExecucoes(exec || [])
      const { data: pls } = await s.from('planos_dieta').select('*').eq('aluno_id', id)
      setPlanos(pls || [])
      if (pls?.length) {
        setPlanoSel(pls[0].id)
        for (const pl of pls) {
          const { data: refs } = await s.from('refeicoes').select('*').eq('plano_id', pl.id).order('ordem')
          setRefeicoes(prev => ({ ...prev, [pl.id]: refs || [] }))
        }
      }
      const { data: avs } = await s.from('avaliacoes').select('*').eq('aluno_id', id).order('data', { ascending: false })
      setAvaliacoes(avs || [])
      const { data: pgs } = await s.from('pagamentos').select('*').eq('aluno_id', id).order('data_vencimento', { ascending: false })
      setPagamentos(pgs || [])
      setLoading(false)
    }
    load()
  }, [id])

  const s = sb()

  // PROGRAMAS
  async function criarPrograma() {
    if (!novoProgNome) return
    const { data } = await s.from('programas').insert({ aluno_id: id, profissional_id: profId, nome: novoProgNome }).select().single()
    if (data) { setProgramas(p => [...p, data]); setProgSel(data.id); setNovoProgNome('') }
  }
  async function salvarPrograma(pgId: string) {
    await s.from('programas').update({ nome: editProgNome }).eq('id', pgId)
    setProgramas(p => p.map(x => x.id === pgId ? { ...x, nome: editProgNome } : x))
    setEditProgId(null)
  }
  async function excluirPrograma(pgId: string) {
    if (!confirm('Excluir programa e todos os treinos?')) return
    await s.from('programas').delete().eq('id', pgId)
    setProgramas(p => p.filter(x => x.id !== pgId))
    if (progSel === pgId) { setProgSel(''); setTreinos([]) }
  }

  // TREINOS
  async function criarTreino() {
    if (!novoTreNome || !progSel) return
    const { data } = await s.from('treinos').insert({ programa_id: progSel, nome: novoTreNome, ordem: treinos.length }).select().single()
    if (data) { setTreinos(t => [...t, data]); setTreinoSel(data.id); setNovoTreNome('') }
  }
  async function salvarTreino(trId: string) {
    await s.from('treinos').update({ nome: editTreNome }).eq('id', trId)
    setTreinos(t => t.map(x => x.id === trId ? { ...x, nome: editTreNome } : x))
    setEditTreId(null)
  }
  async function excluirTreino(trId: string) {
    if (!confirm('Excluir treino e todos os exercícios?')) return
    await s.from('treinos').delete().eq('id', trId)
    setTreinos(t => t.filter(x => x.id !== trId))
    if (treinoSel === trId) setTreinoSel('')
  }

  // EXERCICIOS
  async function adicionarEx() {
    if (!novoEx.nome || !treinoSel) return
    const { data } = await s.from('exercicios').insert({
      treino_id: treinoSel, nome: novoEx.nome, grupo_muscular: novoEx.grupo || null,
      series: parseInt(novoEx.series), repeticoes: novoEx.reps,
      carga: novoEx.carga ? parseFloat(novoEx.carga) : null,
      observacao: novoEx.obs || null, ordem: (exercicios[treinoSel] || []).length
    }).select().single()
    if (data) { setExercicios(prev => ({ ...prev, [treinoSel]: [...(prev[treinoSel] || []), data] })); setNovoEx({ nome: '', grupo: '', series: '3', reps: '12', carga: '', obs: '' }) }
  }
  async function salvarEx(trId: string, exId: string) {
    await s.from('exercicios').update({
      nome: editEx.nome, grupo_muscular: editEx.grupo || null,
      series: parseInt(editEx.series), repeticoes: editEx.reps,
      carga: editEx.carga ? parseFloat(editEx.carga) : null, observacao: editEx.obs || null
    }).eq('id', exId)
    setExercicios(prev => ({ ...prev, [trId]: (prev[trId] || []).map(x => x.id === exId ? { ...x, nome: editEx.nome, grupo_muscular: editEx.grupo, series: parseInt(editEx.series), repeticoes: editEx.reps, carga: editEx.carga ? parseFloat(editEx.carga) : null, observacao: editEx.obs } : x) }))
    setEditExId(null)
  }
  async function removerEx(trId: string, exId: string) {
    if (!confirm('Excluir exercício?')) return
    await s.from('exercicios').delete().eq('id', exId)
    setExercicios(prev => ({ ...prev, [trId]: (prev[trId] || []).filter(x => x.id !== exId) }))
  }
  async function confirmarTreino(trId: string) {
    const { data } = await s.from('execucoes').insert({ aluno_id: id, treino_id: trId, data: new Date().toISOString().split('T')[0], concluido: true }).select('*, treinos(nome)').single()
    if (data) setExecucoes(e => [data, ...e])
  }
  async function excluirExecucao(execId: string) {
    await s.from('execucoes').delete().eq('id', execId)
    setExecucoes(e => e.filter(x => x.id !== execId))
  }

  // PLANOS
  async function criarPlano() {
    if (!novoPlanNome) return
    const { data } = await s.from('planos_dieta').insert({ aluno_id: id, profissional_id: profId, nome: novoPlanNome }).select().single()
    if (data) { setPlanos(p => [...p, data]); setPlanoSel(data.id); setNovoPlanNome('') }
  }
  async function salvarPlano(plId: string) {
    await s.from('planos_dieta').update({ nome: editPlanoNome }).eq('id', plId)
    setPlanos(p => p.map(x => x.id === plId ? { ...x, nome: editPlanoNome } : x))
    setEditPlanoId(null)
  }
  async function excluirPlano(plId: string) {
    if (!confirm('Excluir plano e todas as refeições?')) return
    await s.from('planos_dieta').delete().eq('id', plId)
    setPlanos(p => p.filter(x => x.id !== plId))
    if (planoSel === plId) setPlanoSel('')
  }

  // REFEIÇÕES
  async function adicionarRef() {
    if (!novaRef.nome || !planoSel) return
    const { data } = await s.from('refeicoes').insert({
      plano_id: planoSel, nome: novaRef.nome, horario: novaRef.horario || null,
      alimentos: novaRef.alimentos || null,
      calorias: novaRef.cal ? parseInt(novaRef.cal) : null,
      proteina: novaRef.prot ? parseInt(novaRef.prot) : null,
      carbo: novaRef.carbo ? parseInt(novaRef.carbo) : null,
      gordura: novaRef.gord ? parseInt(novaRef.gord) : null,
      ordem: (refeicoes[planoSel] || []).length
    }).select().single()
    if (data) { setRefeicoes(prev => ({ ...prev, [planoSel]: [...(prev[planoSel] || []), data] })); setNovaRef({ nome: '', horario: '', alimentos: '', cal: '', prot: '', carbo: '', gord: '' }) }
  }
  async function salvarRef(plId: string, refId: string) {
    await s.from('refeicoes').update({
      nome: editRef.nome, horario: editRef.horario || null, alimentos: editRef.alimentos || null,
      calorias: editRef.cal ? parseInt(editRef.cal) : null,
      proteina: editRef.prot ? parseInt(editRef.prot) : null,
      carbo: editRef.carbo ? parseInt(editRef.carbo) : null,
      gordura: editRef.gord ? parseInt(editRef.gord) : null
    }).eq('id', refId)
    setRefeicoes(prev => ({ ...prev, [plId]: (prev[plId] || []).map(r => r.id === refId ? { ...r, nome: editRef.nome, horario: editRef.horario, alimentos: editRef.alimentos, calorias: editRef.cal ? parseInt(editRef.cal) : null, proteina: editRef.prot ? parseInt(editRef.prot) : null, carbo: editRef.carbo ? parseInt(editRef.carbo) : null, gordura: editRef.gord ? parseInt(editRef.gord) : null } : r) }))
    setEditRefId(null)
  }
  async function removerRef(plId: string, refId: string) {
    if (!confirm('Excluir refeição?')) return
    await s.from('refeicoes').delete().eq('id', refId)
    setRefeicoes(prev => ({ ...prev, [plId]: (prev[plId] || []).filter(r => r.id !== refId) }))
  }

  // AVALIAÇÕES
  async function salvarAvaliacao() {
    if (!novaAv.peso) return
    const { data } = await s.from('avaliacoes').insert({
      aluno_id: id, peso: parseFloat(novaAv.peso),
      gordura: novaAv.gordura ? parseFloat(novaAv.gordura) : null,
      cintura: novaAv.cintura ? parseFloat(novaAv.cintura) : null,
      quadril: novaAv.quadril ? parseFloat(novaAv.quadril) : null,
      braco_d: novaAv.braco_d ? parseFloat(novaAv.braco_d) : null,
      coxa_d: novaAv.coxa_d ? parseFloat(novaAv.coxa_d) : null,
      observacoes: novaAv.obs || null
    }).select().single()
    if (data) { setAvaliacoes(a => [data, ...a]); setNovaAv({ peso: '', gordura: '', cintura: '', quadril: '', braco_d: '', coxa_d: '', obs: '' }) }
  }
  async function salvarAv(avId: string) {
    await s.from('avaliacoes').update({
      peso: parseFloat(editAv.peso),
      gordura: editAv.gordura ? parseFloat(editAv.gordura) : null,
      cintura: editAv.cintura ? parseFloat(editAv.cintura) : null,
      quadril: editAv.quadril ? parseFloat(editAv.quadril) : null,
      braco_d: editAv.braco_d ? parseFloat(editAv.braco_d) : null,
      coxa_d: editAv.coxa_d ? parseFloat(editAv.coxa_d) : null,
      observacoes: editAv.obs || null
    }).eq('id', avId)
    setAvaliacoes(a => a.map(x => x.id === avId ? { ...x, peso: parseFloat(editAv.peso), gordura: editAv.gordura ? parseFloat(editAv.gordura) : null, cintura: editAv.cintura ? parseFloat(editAv.cintura) : null, quadril: editAv.quadril ? parseFloat(editAv.quadril) : null, braco_d: editAv.braco_d ? parseFloat(editAv.braco_d) : null, coxa_d: editAv.coxa_d ? parseFloat(editAv.coxa_d) : null, observacoes: editAv.obs } : x))
    setEditAvId(null)
  }
  async function excluirAv(avId: string) {
    if (!confirm('Excluir avaliação?')) return
    await s.from('avaliacoes').delete().eq('id', avId)
    setAvaliacoes(a => a.filter(x => x.id !== avId))
  }

  // PAGAMENTOS
  async function adicionarPag() {
    if (!novoPag.valor || !novoPag.venc) return
    const { data } = await s.from('pagamentos').insert({
      aluno_id: id, profissional_id: profId,
      valor: parseFloat(novoPag.valor), data_vencimento: novoPag.venc, status: novoPag.status
    }).select().single()
    if (data) { setPagamentos(p => [data, ...p]); setNovoPag({ valor: '', venc: '', status: 'pendente' }) }
  }
  async function marcarPago(pgId: string) {
    await s.from('pagamentos').update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] }).eq('id', pgId)
    setPagamentos(pgs => pgs.map(p => p.id === pgId ? { ...p, status: 'pago' } : p))
  }
  async function salvarPag(pgId: string) {
    await s.from('pagamentos').update({ valor: parseFloat(editPag.valor), data_vencimento: editPag.venc, status: editPag.status }).eq('id', pgId)
    setPagamentos(p => p.map(x => x.id === pgId ? { ...x, valor: parseFloat(editPag.valor), data_vencimento: editPag.venc, status: editPag.status } : x))
    setEditPagId(null)
  }
  async function excluirPag(pgId: string) {
    if (!confirm('Excluir pagamento?')) return
    await s.from('pagamentos').delete().eq('id', pgId)
    setPagamentos(p => p.filter(x => x.id !== pgId))
  }

  // PERFIL
  async function salvarPerfil() {
    await s.from('alunos').update({
      nome: editAluno.nome, email: editAluno.email || null, telefone: editAluno.telefone || null,
      data_nascimento: editAluno.data_nascimento || null, sexo: editAluno.sexo || null,
      objetivo: editAluno.objetivo, nivel: editAluno.nivel,
      peso_atual: editAluno.peso_atual ? parseFloat(editAluno.peso_atual) : null,
      altura: editAluno.altura ? parseFloat(editAluno.altura) : null,
      lesoes: editAluno.lesoes || null, alergias: editAluno.alergias || null,
      medicamentos: editAluno.medicamentos || null, observacoes: editAluno.observacoes || null,
      valor_mensalidade: editAluno.valor_mensalidade ? parseFloat(editAluno.valor_mensalidade) : null,
      dia_vencimento: editAluno.dia_vencimento ? parseInt(editAluno.dia_vencimento) : 10
    }).eq('id', id)
    setAluno(editAluno); setEditandoPerfil(false)
  }
  async function excluirAluno() {
    if (!confirm(`Excluir ${aluno.nome} permanentemente? Isso apaga todos os dados.`)) return
    await s.from('alunos').delete().eq('id', id)
    router.push('/dashboard')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Carregando...</p></div>

  const tabs: { id: Tab, label: string }[] = [
    { id: 'treino', label: 'Treino' }, { id: 'nutricao', label: 'Nutrição' },
    { id: 'evolucao', label: 'Evolução' }, { id: 'financeiro', label: 'Financeiro' }, { id: 'perfil', label: 'Perfil' }
  ]
  const sc = (st: string) => st === 'pago' ? 'bg-emerald-100 text-emerald-700' : st === 'atrasado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard"><ArrowLeft size={18} className="text-gray-400" /></Link>
          <div>
            <h1 className="font-semibold text-sm">{aluno?.nome}</h1>
            <p className="text-xs text-gray-400 capitalize">{aluno?.objetivo} · {aluno?.nivel}{aluno?.peso_atual ? ` · ${aluno.peso_atual}kg` : ''}</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5">

        {/* TREINO */}
        {tab === 'treino' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Programas</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {programas.map(pg => (
                  <div key={pg.id} className="flex items-center gap-1">
                    {editProgId === pg.id ? (
                      <>
                        <input value={editProgNome} onChange={e => setEditProgNome(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button onClick={() => salvarPrograma(pg.id)} className="text-emerald-600"><Check size={14} /></button>
                        <button onClick={() => setEditProgId(null)} className="text-gray-400"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => {
                          setProgSel(pg.id)
                          s.from('treinos').select('*').eq('programa_id', pg.id).order('ordem').then(({ data }) => {
                            setTreinos(data || [])
                            if (data?.length) { setTreinoSel(data[0].id); data.forEach(t => s.from('exercicios').select('*').eq('treino_id', t.id).order('ordem').then(({ data: exs }) => setExercicios(prev => ({ ...prev, [t.id]: exs || [] })))) }
                          })
                        }} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${progSel === pg.id ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600'}`}>
                          {pg.nome}
                        </button>
                        <button onClick={() => { setEditProgId(pg.id); setEditProgNome(pg.nome) }}><Pencil size={12} className="text-gray-300 hover:text-emerald-500" /></button>
                        <button onClick={() => excluirPrograma(pg.id)}><Trash2 size={12} className="text-gray-300 hover:text-red-400" /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Inp value={novoProgNome} onChange={(e: any) => setNovoProgNome(e.target.value)} placeholder="Nome do programa (ex: Hipertrofia Jan)" />
                <button onClick={criarPrograma} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16} /></button>
              </div>
            </div>

            {progSel && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Treinos</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {treinos.map(t => (
                    <div key={t.id} className="flex items-center gap-1">
                      {editTreId === t.id ? (
                        <>
                          <input value={editTreNome} onChange={e => setEditTreNome(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <button onClick={() => salvarTreino(t.id)} className="text-emerald-600"><Check size={14} /></button>
                          <button onClick={() => setEditTreId(null)} className="text-gray-400"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setTreinoSel(t.id)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${treinoSel === t.id ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600'}`}>{t.nome}</button>
                          <button onClick={() => { setEditTreId(t.id); setEditTreNome(t.nome) }}><Pencil size={12} className="text-gray-300 hover:text-emerald-500" /></button>
                          <button onClick={() => excluirTreino(t.id)}><Trash2 size={12} className="text-gray-300 hover:text-red-400" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Inp value={novoTreNome} onChange={(e: any) => setNovoTreNome(e.target.value)} placeholder="Ex: Treino A - Peito/Tríceps" />
                  <button onClick={criarTreino} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16} /></button>
                </div>
              </div>
            )}

            {treinoSel && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Exercícios</p>
                  <button onClick={() => confirmarTreino(treinoSel)} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100">
                    <CheckCircle size={14} /> Confirmar hoje
                  </button>
                </div>
                <div className="divide-y divide-gray-50 mb-4">
                  {(exercicios[treinoSel] || []).map(ex => (
                    <div key={ex.id} className="py-2.5">
                      {editExId === ex.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Inp value={editEx.nome} onChange={(e: any) => setEditEx(n => ({ ...n, nome: e.target.value }))} placeholder="Nome" />
                            <Inp value={editEx.grupo} onChange={(e: any) => setEditEx(n => ({ ...n, grupo: e.target.value }))} placeholder="Grupo muscular" />
                          </div>
                          <div className="flex gap-2">
                            <Inp value={editEx.series} onChange={(e: any) => setEditEx(n => ({ ...n, series: e.target.value }))} placeholder="Séries" type="number" />
                            <Inp value={editEx.reps} onChange={(e: any) => setEditEx(n => ({ ...n, reps: e.target.value }))} placeholder="Reps" />
                            <Inp value={editEx.carga} onChange={(e: any) => setEditEx(n => ({ ...n, carga: e.target.value }))} placeholder="Carga kg" type="number" />
                          </div>
                          <Inp value={editEx.obs} onChange={(e: any) => setEditEx(n => ({ ...n, obs: e.target.value }))} placeholder="Observação" />
                          <div className="flex gap-2">
                            <button onClick={() => salvarEx(treinoSel, ex.id)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
                            <button onClick={() => setEditExId(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{ex.nome}</p>
                            <p className="text-xs text-gray-400">{ex.series}x{ex.repeticoes}{ex.carga ? ` · ${ex.carga}kg` : ''}{ex.grupo_muscular ? ` · ${ex.grupo_muscular}` : ''}</p>
                            {ex.observacao && <p className="text-xs text-gray-400 italic">{ex.observacao}</p>}
                          </div>
                          <div className="flex gap-2 ml-3">
                            <button onClick={() => { setEditExId(ex.id); setEditEx({ nome: ex.nome, grupo: ex.grupo_muscular || '', series: String(ex.series), reps: ex.repeticoes, carga: ex.carga ? String(ex.carga) : '', obs: ex.observacao || '' }) }}><Pencil size={14} className="text-gray-300 hover:text-emerald-500" /></button>
                            <button onClick={() => removerEx(treinoSel, ex.id)}><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <p className="text-xs text-gray-400">Adicionar exercício</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Inp value={novoEx.nome} onChange={(e: any) => setNovoEx(n => ({ ...n, nome: e.target.value }))} placeholder="Nome do exercício" />
                    <Inp value={novoEx.grupo} onChange={(e: any) => setNovoEx(n => ({ ...n, grupo: e.target.value }))} placeholder="Grupo muscular" />
                  </div>
                  <div className="flex gap-2">
                    <Inp value={novoEx.series} onChange={(e: any) => setNovoEx(n => ({ ...n, series: e.target.value }))} placeholder="Séries" type="number" />
                    <Inp value={novoEx.reps} onChange={(e: any) => setNovoEx(n => ({ ...n, reps: e.target.value }))} placeholder="Reps" />
                    <Inp value={novoEx.carga} onChange={(e: any) => setNovoEx(n => ({ ...n, carga: e.target.value }))} placeholder="Carga kg" type="number" />
                    <button onClick={adicionarEx} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16} /></button>
                  </div>
                  <Inp value={novoEx.obs} onChange={(e: any) => setNovoEx(n => ({ ...n, obs: e.target.value }))} placeholder="Observação (opcional)" />
                </div>
              </div>
            )}

            {execucoes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</p>
                <div className="divide-y divide-gray-50">
                  {execucoes.slice(0, 10).map(ex => (
                    <div key={ex.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500" />
                        <span className="text-sm">{ex.treinos?.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(ex.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <button onClick={() => excluirExecucao(ex.id)}><Trash2 size={12} className="text-gray-300 hover:text-red-400" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NUTRIÇÃO */}
        {tab === 'nutricao' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Planos alimentares</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {planos.map(pl => (
                  <div key={pl.id} className="flex items-center gap-1">
                    {editPlanoId === pl.id ? (
                      <>
                        <input value={editPlanoNome} onChange={e => setEditPlanoNome(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button onClick={() => salvarPlano(pl.id)} className="text-emerald-600"><Check size={14} /></button>
                        <button onClick={() => setEditPlanoId(null)} className="text-gray-400"><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setPlanoSel(pl.id)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${planoSel === pl.id ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600'}`}>{pl.nome}</button>
                        <button onClick={() => { setEditPlanoId(pl.id); setEditPlanoNome(pl.nome) }}><Pencil size={12} className="text-gray-300 hover:text-emerald-500" /></button>
                        <button onClick={() => excluirPlano(pl.id)}><Trash2 size={12} className="text-gray-300 hover:text-red-400" /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Inp value={novoPlanNome} onChange={(e: any) => setNovoPlanNome(e.target.value)} placeholder="Nome do plano" />
                <button onClick={criarPlano} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16} /></button>
              </div>
            </div>
            {planoSel && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Refeições</p>
                <div className="divide-y divide-gray-50 mb-4">
                  {(refeicoes[planoSel] || []).map(ref => (
                    <div key={ref.id} className="py-2.5">
                      {editRefId === ref.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Inp value={editRef.nome} onChange={(e: any) => setEditRef(n => ({ ...n, nome: e.target.value }))} placeholder="Refeição" />
                            <Inp value={editRef.horario} onChange={(e: any) => setEditRef(n => ({ ...n, horario: e.target.value }))} type="time" style={{ width: '110px' }} />
                          </div>
                          <Inp value={editRef.alimentos} onChange={(e: any) => setEditRef(n => ({ ...n, alimentos: e.target.value }))} placeholder="Alimentos" />
                          <div className="flex gap-2">
                            <Inp value={editRef.cal} onChange={(e: any) => setEditRef(n => ({ ...n, cal: e.target.value }))} placeholder="kcal" type="number" />
                            <Inp value={editRef.prot} onChange={(e: any) => setEditRef(n => ({ ...n, prot: e.target.value }))} placeholder="Prot g" type="number" />
                            <Inp value={editRef.carbo} onChange={(e: any) => setEditRef(n => ({ ...n, carbo: e.target.value }))} placeholder="Carbo g" type="number" />
                            <Inp value={editRef.gord} onChange={(e: any) => setEditRef(n => ({ ...n, gord: e.target.value }))} placeholder="Gord g" type="number" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => salvarRef(planoSel, ref.id)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
                            <button onClick={() => setEditRefId(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{ref.nome}{ref.horario ? ` · ${ref.horario}` : ''}</p>
                            {ref.alimentos && <p className="text-xs text-gray-500 mt-0.5">{ref.alimentos}</p>}
                            <p className="text-xs text-gray-400">{ref.calorias ? `${ref.calorias}kcal` : ''}{ref.proteina ? ` P:${ref.proteina}g` : ''}{ref.carbo ? ` C:${ref.carbo}g` : ''}{ref.gordura ? ` G:${ref.gordura}g` : ''}</p>
                          </div>
                          <div className="flex gap-2 ml-3">
                            <button onClick={() => { setEditRefId(ref.id); setEditRef({ nome: ref.nome, horario: ref.horario || '', alimentos: ref.alimentos || '', cal: ref.calorias ? String(ref.calorias) : '', prot: ref.proteina ? String(ref.proteina) : '', carbo: ref.carbo ? String(ref.carbo) : '', gord: ref.gordura ? String(ref.gordura) : '' }) }}><Pencil size={14} className="text-gray-300 hover:text-emerald-500" /></button>
                            <button onClick={() => removerRef(planoSel, ref.id)}><Trash2 size={14} className="text-gray-300 hover:text-red-400" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <div className="flex gap-2">
                    <Inp value={novaRef.nome} onChange={(e: any) => setNovaRef(n => ({ ...n, nome: e.target.value }))} placeholder="Refeição (ex: Almoço)" />
                    <Inp value={novaRef.horario} onChange={(e: any) => setNovaRef(n => ({ ...n, horario: e.target.value }))} type="time" style={{ width: '110px' }} />
                  </div>
                  <Inp value={novaRef.alimentos} onChange={(e: any) => setNovaRef(n => ({ ...n, alimentos: e.target.value }))} placeholder="Alimentos (ex: 150g frango, 100g arroz)" />
                  <div className="flex gap-2">
                    <Inp value={novaRef.cal} onChange={(e: any) => setNovaRef(n => ({ ...n, cal: e.target.value }))} placeholder="kcal" type="number" />
                    <Inp value={novaRef.prot} onChange={(e: any) => setNovaRef(n => ({ ...n, prot: e.target.value }))} placeholder="Prot g" type="number" />
                    <Inp value={novaRef.carbo} onChange={(e: any) => setNovaRef(n => ({ ...n, carbo: e.target.value }))} placeholder="Carbo g" type="number" />
                    <Inp value={novaRef.gord} onChange={(e: any) => setNovaRef(n => ({ ...n, gord: e.target.value }))} placeholder="Gord g" type="number" />
                    <button onClick={adicionarRef} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVOLUÇÃO */}
        {tab === 'evolucao' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Nova avaliação</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Inp value={novaAv.peso} onChange={(e: any) => setNovaAv(n => ({ ...n, peso: e.target.value }))} placeholder="Peso kg" type="number" step="0.1" />
                <Inp value={novaAv.gordura} onChange={(e: any) => setNovaAv(n => ({ ...n, gordura: e.target.value }))} placeholder="% Gordura" type="number" step="0.1" />
                <Inp value={novaAv.cintura} onChange={(e: any) => setNovaAv(n => ({ ...n, cintura: e.target.value }))} placeholder="Cintura cm" type="number" />
                <Inp value={novaAv.quadril} onChange={(e: any) => setNovaAv(n => ({ ...n, quadril: e.target.value }))} placeholder="Quadril cm" type="number" />
                <Inp value={novaAv.braco_d} onChange={(e: any) => setNovaAv(n => ({ ...n, braco_d: e.target.value }))} placeholder="Braço cm" type="number" />
                <Inp value={novaAv.coxa_d} onChange={(e: any) => setNovaAv(n => ({ ...n, coxa_d: e.target.value }))} placeholder="Coxa cm" type="number" />
              </div>
              <Inp value={novaAv.obs} onChange={(e: any) => setNovaAv(n => ({ ...n, obs: e.target.value }))} placeholder="Observações" />
              <button onClick={salvarAvaliacao} className="mt-2 w-full bg-emerald-500 text-white py-2 rounded-lg text-sm hover:bg-emerald-600">Salvar avaliação</button>
            </div>
            {avaliacoes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</p>
                <div className="space-y-3">
                  {avaliacoes.map((av, i) => {
                    const prev = avaliacoes[i + 1]
                    const diff = prev && av.peso && prev.peso ? av.peso - prev.peso : null
                    return (
                      <div key={av.id} className="border border-gray-100 rounded-lg p-3">
                        {editAvId === av.id ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Inp value={editAv.peso} onChange={(e: any) => setEditAv(n => ({ ...n, peso: e.target.value }))} placeholder="Peso kg" type="number" step="0.1" />
                              <Inp value={editAv.gordura} onChange={(e: any) => setEditAv(n => ({ ...n, gordura: e.target.value }))} placeholder="% Gordura" type="number" />
                              <Inp value={editAv.cintura} onChange={(e: any) => setEditAv(n => ({ ...n, cintura: e.target.value }))} placeholder="Cintura" type="number" />
                              <Inp value={editAv.quadril} onChange={(e: any) => setEditAv(n => ({ ...n, quadril: e.target.value }))} placeholder="Quadril" type="number" />
                              <Inp value={editAv.braco_d} onChange={(e: any) => setEditAv(n => ({ ...n, braco_d: e.target.value }))} placeholder="Braço" type="number" />
                              <Inp value={editAv.coxa_d} onChange={(e: any) => setEditAv(n => ({ ...n, coxa_d: e.target.value }))} placeholder="Coxa" type="number" />
                            </div>
                            <Inp value={editAv.obs} onChange={(e: any) => setEditAv(n => ({ ...n, obs: e.target.value }))} placeholder="Observações" />
                            <div className="flex gap-2">
                              <button onClick={() => salvarAv(av.id)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
                              <button onClick={() => setEditAvId(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{new Date(av.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              <div className="flex items-center gap-2">
                                {diff !== null && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}kg</span>}
                                <button onClick={() => { setEditAvId(av.id); setEditAv({ peso: String(av.peso || ''), gordura: String(av.gordura || ''), cintura: String(av.cintura || ''), quadril: String(av.quadril || ''), braco_d: String(av.braco_d || ''), coxa_d: String(av.coxa_d || ''), obs: av.observacoes || '' }) }}><Pencil size={13} className="text-gray-300 hover:text-emerald-500" /></button>
                                <button onClick={() => excluirAv(av.id)}><Trash2 size={13} className="text-gray-300 hover:text-red-400" /></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-xs text-gray-500">
                              {av.peso && <span>Peso: <strong className="text-gray-800">{av.peso}kg</strong></span>}
                              {av.gordura && <span>Gord: <strong className="text-gray-800">{av.gordura}%</strong></span>}
                              {av.cintura && <span>Cintura: <strong className="text-gray-800">{av.cintura}cm</strong></span>}
                              {av.quadril && <span>Quadril: <strong className="text-gray-800">{av.quadril}cm</strong></span>}
                              {av.braco_d && <span>Braço: <strong className="text-gray-800">{av.braco_d}cm</strong></span>}
                              {av.coxa_d && <span>Coxa: <strong className="text-gray-800">{av.coxa_d}cm</strong></span>}
                            </div>
                            {av.observacoes && <p className="text-xs text-gray-400 mt-1 italic">{av.observacoes}</p>}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINANCEIRO */}
        {tab === 'financeiro' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Adicionar pagamento</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <Inp value={novoPag.valor} onChange={(e: any) => setNovoPag(n => ({ ...n, valor: e.target.value }))} placeholder="Valor R$" type="number" />
                <Inp value={novoPag.venc} onChange={(e: any) => setNovoPag(n => ({ ...n, venc: e.target.value }))} type="date" />
                <select value={novoPag.status} onChange={e => setNovoPag(n => ({ ...n, status: e.target.value }))} className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option>
                </select>
              </div>
              <button onClick={adicionarPag} className="w-full bg-emerald-500 text-white py-2 rounded-lg text-sm hover:bg-emerald-600">Adicionar</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</p>
              <div className="divide-y divide-gray-50">
                {pagamentos.map(pg => (
                  <div key={pg.id} className="py-2.5">
                    {editPagId === pg.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Inp value={editPag.valor} onChange={(e: any) => setEditPag(n => ({ ...n, valor: e.target.value }))} placeholder="Valor" type="number" />
                          <Inp value={editPag.venc} onChange={(e: any) => setEditPag(n => ({ ...n, venc: e.target.value }))} type="date" />
                          <select value={editPag.status} onChange={e => setEditPag(n => ({ ...n, status: e.target.value }))} className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => salvarPag(pg.id)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg"><Check size={12} /> Salvar</button>
                          <button onClick={() => setEditPagId(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">R$ {pg.valor.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Venc: {new Date(pg.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sc(pg.status)}`}>{pg.status}</span>
                          {pg.status !== 'pago' && <button onClick={() => marcarPago(pg.id)} className="text-xs text-emerald-600 hover:underline">Pago</button>}
                          <button onClick={() => { setEditPagId(pg.id); setEditPag({ valor: String(pg.valor), venc: pg.data_vencimento, status: pg.status }) }}><Pencil size={13} className="text-gray-300 hover:text-emerald-500" /></button>
                          <button onClick={() => excluirPag(pg.id)}><Trash2 size={13} className="text-gray-300 hover:text-red-400" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {pagamentos.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Nenhum pagamento</p>}
              </div>
            </div>
          </div>
        )}

        {/* PERFIL */}
        {tab === 'perfil' && aluno && (
          <div className="space-y-4">
            {editandoPerfil ? (
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Editar perfil</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Nome','nome'],['E-mail','email'],['WhatsApp','telefone'],['Mensalidade R$','valor_mensalidade'],['Dia vencimento','dia_vencimento'],['Peso kg','peso_atual'],['Altura cm','altura']].map(([label, key]) => (
                    <div key={key}><label className="text-xs text-gray-500 mb-1 block">{label}</label>
                      <Inp value={editAluno[key] || ''} onChange={(e: any) => setEditAluno((a: any) => ({ ...a, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div><label className="text-xs text-gray-500 mb-1 block">Nascimento</label>
                    <Inp value={editAluno.data_nascimento || ''} onChange={(e: any) => setEditAluno((a: any) => ({ ...a, data_nascimento: e.target.value }))} type="date" />
                  </div>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">Objetivo</label>
                  <select value={editAluno.objetivo || ''} onChange={e => setEditAluno((a: any) => ({ ...a, objetivo: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="emagrecimento">Emagrecimento</option><option value="hipertrofia">Hipertrofia</option><option value="performance">Performance</option><option value="saude">Saúde geral</option><option value="outro">Outro</option>
                  </select>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">Nível</label>
                  <select value={editAluno.nivel || ''} onChange={e => setEditAluno((a: any) => ({ ...a, nivel: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="iniciante">Iniciante</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option>
                  </select>
                </div>
                {[['Lesões','lesoes'],['Alergias','alergias'],['Medicamentos','medicamentos'],['Observações','observacoes']].map(([label, key]) => (
                  <div key={key}><label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <textarea value={editAluno[key] || ''} onChange={e => setEditAluno((a: any) => ({ ...a, [key]: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button onClick={salvarPerfil} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg text-sm hover:bg-emerald-600">Salvar</button>
                  <button onClick={() => setEditandoPerfil(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Dados do aluno</p>
                  <button onClick={() => setEditandoPerfil(true)} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"><Pencil size={12} /> Editar</button>
                </div>
                {([
                  ['Nome', aluno.nome], ['E-mail', aluno.email], ['WhatsApp', aluno.telefone],
                  ['Objetivo', aluno.objetivo], ['Nível', aluno.nivel],
                  ['Peso', aluno.peso_atual ? `${aluno.peso_atual}kg` : null],
                  ['Altura', aluno.altura ? `${aluno.altura}cm` : null],
                  ['Mensalidade', aluno.valor_mensalidade ? `R$${aluno.valor_mensalidade}` : null],
                  ['Lesões', aluno.lesoes], ['Alergias', aluno.alergias],
                  ['Medicamentos', aluno.medicamentos], ['Observações', aluno.observacoes],
                ] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className="text-xs font-medium text-gray-700 capitalize max-w-xs text-right">{v}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={excluirAluno} className="w-full border border-red-200 text-red-500 py-2.5 rounded-xl text-sm hover:bg-red-50 transition-colors">
              Excluir aluno permanentemente
            </button>
          </div>
        )}

      </main>
    </div>
  )
}
