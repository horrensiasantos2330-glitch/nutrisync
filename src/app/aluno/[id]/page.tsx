'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { sb } from '@/lib/sb'
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Tab = 'treino'|'nutricao'|'evolucao'|'financeiro'|'perfil'

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
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(()=>{
    async function load() {
      const s = sb()
      const {data:{user}} = await s.auth.getUser()
      if (!user) { router.push('/login'); return }
      const {data:p} = await s.from('profissionais').select('id').eq('user_id',user.id).single()
      if (!p) return
      setProfId(p.id)
      const {data:al} = await s.from('alunos').select('*').eq('id',id).single()
      setAluno(al)
      const {data:progs} = await s.from('programas').select('*').eq('aluno_id',id).order('created_at')
      setProgramas(progs||[])
      if (progs?.length) {
        setProgSel(progs[0].id)
        const {data:trs} = await s.from('treinos').select('*').eq('programa_id',progs[0].id).order('ordem')
        setTreinos(trs||[])
        if (trs?.length) {
          setTreinoSel(trs[0].id)
          for (const t of trs) {
            const {data:exs} = await s.from('exercicios').select('*').eq('treino_id',t.id).order('ordem')
            setExercicios(prev=>({...prev,[t.id]:exs||[]}))
          }
        }
      }
      const {data:exec} = await s.from('execucoes').select('*, treinos(nome)').eq('aluno_id',id).order('data',{ascending:false}).limit(20)
      setExecucoes(exec||[])
      const {data:pls} = await s.from('planos_dieta').select('*').eq('aluno_id',id)
      setPlanos(pls||[])
      if (pls?.length) {
        setPlanoSel(pls[0].id)
        for (const pl of pls) {
          const {data:refs} = await s.from('refeicoes').select('*').eq('plano_id',pl.id).order('ordem')
          setRefeicoes(prev=>({...prev,[pl.id]:refs||[]}))
        }
      }
      const {data:avs} = await s.from('avaliacoes').select('*').eq('aluno_id',id).order('data',{ascending:false})
      setAvaliacoes(avs||[])
      const {data:pgs} = await s.from('pagamentos').select('*').eq('aluno_id',id).order('data_vencimento',{ascending:false})
      setPagamentos(pgs||[])
      setLoading(false)
    }
    load()
  },[id])

  const s = sb()

  async function criarPrograma() {
    if (!novoProgNome) return
    const {data} = await s.from('programas').insert({aluno_id:id,profissional_id:profId,nome:novoProgNome}).select().single()
    if (data) { setProgramas(p=>[...p,data]); setProgSel(data.id); setNovoProgNome('') }
  }

  async function criarTreino() {
    if (!novoTreNome||!progSel) return
    const {data} = await s.from('treinos').insert({programa_id:progSel,nome:novoTreNome,ordem:treinos.length}).select().single()
    if (data) { setTreinos(t=>[...t,data]); setTreinoSel(data.id); setNovoTreNome('') }
  }

  async function adicionarEx() {
    if (!novoEx.nome||!treinoSel) return
    const {data} = await s.from('exercicios').insert({
      treino_id:treinoSel,nome:novoEx.nome,grupo_muscular:novoEx.grupo||null,
      series:parseInt(novoEx.series),repeticoes:novoEx.reps,
      carga:novoEx.carga?parseFloat(novoEx.carga):null,
      observacao:novoEx.obs||null,ordem:(exercicios[treinoSel]||[]).length
    }).select().single()
    if (data) { setExercicios(prev=>({...prev,[treinoSel]:[...(prev[treinoSel]||[]),data]})); setNovoEx({nome:'',grupo:'',series:'3',reps:'12',carga:'',obs:''}) }
  }

  async function removerEx(trId:string,exId:string) {
    await s.from('exercicios').delete().eq('id',exId)
    setExercicios(prev=>({...prev,[trId]:(prev[trId]||[]).filter(x=>x.id!==exId)}))
  }

  async function confirmarTreino(trId:string) {
    const {data} = await s.from('execucoes').insert({
      aluno_id:id,treino_id:trId,
      data:new Date().toISOString().split('T')[0],concluido:true
    }).select('*, treinos(nome)').single()
    if (data) setExecucoes(e=>[data,...e])
  }

  async function criarPlano() {
    if (!novoPlanNome) return
    const {data} = await s.from('planos_dieta').insert({aluno_id:id,profissional_id:profId,nome:novoPlanNome}).select().single()
    if (data) { setPlanos(p=>[...p,data]); setPlanoSel(data.id); setNovoPlanNome('') }
  }

  async function adicionarRef() {
    if (!novaRef.nome||!planoSel) return
    const {data} = await s.from('refeicoes').insert({
      plano_id:planoSel,nome:novaRef.nome,horario:novaRef.horario||null,
      alimentos:novaRef.alimentos||null,
      calorias:novaRef.cal?parseInt(novaRef.cal):null,
      proteina:novaRef.prot?parseInt(novaRef.prot):null,
      carbo:novaRef.carbo?parseInt(novaRef.carbo):null,
      gordura:novaRef.gord?parseInt(novaRef.gord):null,
      ordem:(refeicoes[planoSel]||[]).length
    }).select().single()
    if (data) { setRefeicoes(prev=>({...prev,[planoSel]:[...(prev[planoSel]||[]),data]})); setNovaRef({nome:'',horario:'',alimentos:'',cal:'',prot:'',carbo:'',gord:''}) }
  }

  async function removerRef(plId:string,refId:string) {
    await s.from('refeicoes').delete().eq('id',refId)
    setRefeicoes(prev=>({...prev,[plId]:(prev[plId]||[]).filter(r=>r.id!==refId)}))
  }

  async function salvarAvaliacao() {
    if (!novaAv.peso) return
    const {data} = await s.from('avaliacoes').insert({
      aluno_id:id,peso:parseFloat(novaAv.peso),
      gordura:novaAv.gordura?parseFloat(novaAv.gordura):null,
      cintura:novaAv.cintura?parseFloat(novaAv.cintura):null,
      quadril:novaAv.quadril?parseFloat(novaAv.quadril):null,
      braco_d:novaAv.braco_d?parseFloat(novaAv.braco_d):null,
      coxa_d:novaAv.coxa_d?parseFloat(novaAv.coxa_d):null,
      observacoes:novaAv.obs||null
    }).select().single()
    if (data) { setAvaliacoes(a=>[data,...a]); setNovaAv({peso:'',gordura:'',cintura:'',quadril:'',braco_d:'',coxa_d:'',obs:''}) }
  }

  async function adicionarPag() {
    if (!novoPag.valor||!novoPag.venc) return
    const {data} = await s.from('pagamentos').insert({
      aluno_id:id,profissional_id:profId,
      valor:parseFloat(novoPag.valor),
      data_vencimento:novoPag.venc,status:novoPag.status
    }).select().single()
    if (data) { setPagamentos(p=>[data,...p]); setNovoPag({valor:'',venc:'',status:'pendente'}) }
  }

  async function marcarPago(pgId:string) {
    await s.from('pagamentos').update({status:'pago',data_pagamento:new Date().toISOString().split('T')[0]}).eq('id',pgId)
    setPagamentos(pgs=>pgs.map(p=>p.id===pgId?{...p,status:'pago'}:p))
  }

  const inp = (props:any) => <input {...props} className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">Carregando...</p></div>

  const tabs: {id:Tab,label:string}[] = [
    {id:'treino',label:'Treino'},{id:'nutricao',label:'Nutrição'},
    {id:'evolucao',label:'Evolução'},{id:'financeiro',label:'Financeiro'},{id:'perfil',label:'Perfil'}
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard"><ArrowLeft size={18} className="text-gray-400" /></Link>
          <div>
            <h1 className="font-semibold text-sm">{aluno?.nome}</h1>
            <p className="text-xs text-gray-400 capitalize">{aluno?.objetivo} · {aluno?.nivel}{aluno?.peso_atual?` · ${aluno.peso_atual}kg`:''}</p>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab===t.id?'text-emerald-600 border-b-2 border-emerald-500':'text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5">

        {tab==='treino' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Programas</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {programas.map(pg=>(
                  <button key={pg.id} onClick={()=>{
                    setProgSel(pg.id)
                    s.from('treinos').select('*').eq('programa_id',pg.id).order('ordem').then(({data})=>{
                      setTreinos(data||[])
                      if(data?.length){
                        setTreinoSel(data[0].id)
                        data.forEach(t=>s.from('exercicios').select('*').eq('treino_id',t.id).order('ordem').then(({data:exs})=>setExercicios(prev=>({...prev,[t.id]:exs||[]}))))
                      }
                    })
                  }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${progSel===pg.id?'bg-emerald-500 text-white border-emerald-500':'border-gray-200 text-gray-600'}`}>
                    {pg.nome}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {inp({value:novoProgNome,onChange:(e:any)=>setNovoProgNome(e.target.value),placeholder:'Nome do programa (ex: Hipertrofia Jan)'})}
                <button onClick={criarPrograma} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16}/></button>
              </div>
            </div>

            {progSel && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Treinos</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {treinos.map(t=>(
                    <button key={t.id} onClick={()=>setTreinoSel(t.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${treinoSel===t.id?'bg-emerald-500 text-white border-emerald-500':'border-gray-200 text-gray-600'}`}>
                      {t.nome}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {inp({value:novoTreNome,onChange:(e:any)=>setNovoTreNome(e.target.value),placeholder:'Ex: Treino A - Peito/Tríceps'})}
                  <button onClick={criarTreino} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16}/></button>
                </div>
              </div>
            )}

            {treinoSel && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Exercícios</p>
                  <button onClick={()=>confirmarTreino(treinoSel)} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100">
                    <CheckCircle size={14}/> Confirmar hoje
                  </button>
                </div>
                <div className="divide-y divide-gray-50 mb-4">
                  {(exercicios[treinoSel]||[]).map(ex=>(
                    <div key={ex.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">{ex.nome}</p>
                        <p className="text-xs text-gray-400">{ex.series}x{ex.repeticoes}{ex.carga?` · ${ex.carga}kg`:''}{ex.grupo_muscular?` · ${ex.grupo_muscular}`:''}</p>
                        {ex.observacao&&<p className="text-xs text-gray-400 italic">{ex.observacao}</p>}
                      </div>
                      <button onClick={()=>removerEx(treinoSel,ex.id)} className="text-gray-300 hover:text-red-400 ml-3"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <p className="text-xs text-gray-400">Adicionar exercício</p>
                  <div className="grid grid-cols-2 gap-2">
                    {inp({value:novoEx.nome,onChange:(e:any)=>setNovoEx(n=>({...n,nome:e.target.value})),placeholder:'Nome do exercício'})}
                    {inp({value:novoEx.grupo,onChange:(e:any)=>setNovoEx(n=>({...n,grupo:e.target.value})),placeholder:'Grupo muscular'})}
                  </div>
                  <div className="flex gap-2">
                    {inp({value:novoEx.series,onChange:(e:any)=>setNovoEx(n=>({...n,series:e.target.value})),placeholder:'Séries',type:'number'})}
                    {inp({value:novoEx.reps,onChange:(e:any)=>setNovoEx(n=>({...n,reps:e.target.value})),placeholder:'Reps'})}
                    {inp({value:novoEx.carga,onChange:(e:any)=>setNovoEx(n=>({...n,carga:e.target.value})),placeholder:'Carga kg',type:'number'})}
                    <button onClick={adicionarEx} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16}/></button>
                  </div>
                  {inp({value:novoEx.obs,onChange:(e:any)=>setNovoEx(n=>({...n,obs:e.target.value})),placeholder:'Observação (opcional)'})}
                </div>
              </div>
            )}

            {execucoes.length>0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</p>
                <div className="divide-y divide-gray-50">
                  {execucoes.slice(0,10).map(ex=>(
                    <div key={ex.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-500"/>
                        <span className="text-sm">{ex.treinos?.nome}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(ex.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='nutricao' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Planos alimentares</p>
              <div className="flex gap-2 flex-wrap mb-3">
                {planos.map(pl=>(
                  <button key={pl.id} onClick={()=>setPlanoSel(pl.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${planoSel===pl.id?'bg-emerald-500 text-white border-emerald-500':'border-gray-200 text-gray-600'}`}>
                    {pl.nome}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {inp({value:novoPlanNome,onChange:(e:any)=>setNovoPlanNome(e.target.value),placeholder:'Nome do plano'})}
                <button onClick={criarPlano} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16}/></button>
              </div>
            </div>
            {planoSel && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Refeições</p>
                <div className="divide-y divide-gray-50 mb-4">
                  {(refeicoes[planoSel]||[]).map(ref=>(
                    <div key={ref.id} className="flex items-start justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium">{ref.nome}{ref.horario?` · ${ref.horario}`:''}</p>
                        {ref.alimentos&&<p className="text-xs text-gray-500 mt-0.5">{ref.alimentos}</p>}
                        <p className="text-xs text-gray-400">{ref.calorias?`${ref.calorias}kcal`:''}{ref.proteina?` P:${ref.proteina}g`:''}{ref.carbo?` C:${ref.carbo}g`:''}{ref.gordura?` G:${ref.gordura}g`:''}</p>
                      </div>
                      <button onClick={()=>removerRef(planoSel,ref.id)} className="text-gray-300 hover:text-red-400 ml-3"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <div className="flex gap-2">
                    {inp({value:novaRef.nome,onChange:(e:any)=>setNovaRef(n=>({...n,nome:e.target.value})),placeholder:'Refeição (ex: Almoço)'})}
                    {inp({value:novaRef.horario,onChange:(e:any)=>setNovaRef(n=>({...n,horario:e.target.value})),type:'time',style:{width:'110px'}})}
                  </div>
                  {inp({value:novaRef.alimentos,onChange:(e:any)=>setNovaRef(n=>({...n,alimentos:e.target.value})),placeholder:'Alimentos (ex: 150g frango, 100g arroz)'})}
                  <div className="flex gap-2">
                    {inp({value:novaRef.cal,onChange:(e:any)=>setNovaRef(n=>({...n,cal:e.target.value})),placeholder:'kcal',type:'number'})}
                    {inp({value:novaRef.prot,onChange:(e:any)=>setNovaRef(n=>({...n,prot:e.target.value})),placeholder:'Prot g',type:'number'})}
                    {inp({value:novaRef.carbo,onChange:(e:any)=>setNovaRef(n=>({...n,carbo:e.target.value})),placeholder:'Carbo g',type:'number'})}
                    {inp({value:novaRef.gord,onChange:(e:any)=>setNovaRef(n=>({...n,gord:e.target.value})),placeholder:'Gord g',type:'number'})}
                    <button onClick={adicionarRef} className="bg-emerald-500 text-white px-3 rounded-lg hover:bg-emerald-600 flex-shrink-0"><Plus size={16}/></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='evolucao' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Nova avaliação</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {inp({value:novaAv.peso,onChange:(e:any)=>setNovaAv(n=>({...n,peso:e.target.value})),placeholder:'Peso kg',type:'number',step:'0.1'})}
                {inp({value:novaAv.gordura,onChange:(e:any)=>setNovaAv(n=>({...n,gordura:e.target.value})),placeholder:'% Gordura',type:'number',step:'0.1'})}
                {inp({value:novaAv.cintura,onChange:(e:any)=>setNovaAv(n=>({...n,cintura:e.target.value})),placeholder:'Cintura cm',type:'number'})}
                {inp({value:novaAv.quadril,onChange:(e:any)=>setNovaAv(n=>({...n,quadril:e.target.value})),placeholder:'Quadril cm',type:'number'})}
                {inp({value:novaAv.braco_d,onChange:(e:any)=>setNovaAv(n=>({...n,braco_d:e.target.value})),placeholder:'Braço cm',type:'number'})}
                {inp({value:novaAv.coxa_d,onChange:(e:any)=>setNovaAv(n=>({...n,coxa_d:e.target.value})),placeholder:'Coxa cm',type:'number'})}
              </div>
              {inp({value:novaAv.obs,onChange:(e:any)=>setNovaAv(n=>({...n,obs:e.target.value})),placeholder:'Observações'})}
              <button onClick={salvarAvaliacao} className="mt-2 w-full bg-emerald-500 text-white py-2 rounded-lg text-sm hover:bg-emerald-600">Salvar avaliação</button>
            </div>
            {avaliacoes.length>0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</p>
                <div className="space-y-3">
                  {avaliacoes.map((av,i)=>{
                    const prev = avaliacoes[i+1]
                    const diff = prev&&av.peso&&prev.peso ? av.peso-prev.peso : null
                    return (
                      <div key={av.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{new Date(av.data+'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          {diff!==null&&<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff<0?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}`}>{diff>0?'+':''}{diff.toFixed(1)}kg</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs text-gray-500">
                          {av.peso&&<span>Peso: <strong className="text-gray-800">{av.peso}kg</strong></span>}
                          {av.gordura&&<span>Gord: <strong className="text-gray-800">{av.gordura}%</strong></span>}
                          {av.cintura&&<span>Cintura: <strong className="text-gray-800">{av.cintura}cm</strong></span>}
                          {av.quadril&&<span>Quadril: <strong className="text-gray-800">{av.quadril}cm</strong></span>}
                          {av.braco_d&&<span>Braço: <strong className="text-gray-800">{av.braco_d}cm</strong></span>}
                          {av.coxa_d&&<span>Coxa: <strong className="text-gray-800">{av.coxa_d}cm</strong></span>}
                        </div>
                        {av.observacoes&&<p className="text-xs text-gray-400 mt-1 italic">{av.observacoes}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='financeiro' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Adicionar pagamento</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {inp({value:novoPag.valor,onChange:(e:any)=>setNovoPag(n=>({...n,valor:e.target.value})),placeholder:'Valor R$',type:'number'})}
                {inp({value:novoPag.venc,onChange:(e:any)=>setNovoPag(n=>({...n,venc:e.target.value})),type:'date'})}
                <select value={novoPag.status} onChange={e=>setNovoPag(n=>({...n,status:e.target.value}))} className="border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>
              <button onClick={adicionarPag} className="w-full bg-emerald-500 text-white py-2 rounded-lg text-sm hover:bg-emerald-600">Adicionar</button>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Histórico</p>
              <div className="divide-y divide-gray-50">
                {pagamentos.map(pg=>(
                  <div key={pg.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">R$ {pg.valor.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Venc: {new Date(pg.data_vencimento+'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pg.status==='pago'?'bg-emerald-100 text-emerald-700':pg.status==='atrasado'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}`}>{pg.status}</span>
                      {pg.status!=='pago'&&<button onClick={()=>marcarPago(pg.id)} className="text-xs text-emerald-600 hover:underline">Marcar pago</button>}
                    </div>
                  </div>
                ))}
                {pagamentos.length===0&&<p className="text-center text-gray-400 text-sm py-4">Nenhum pagamento</p>}
              </div>
            </div>
          </div>
        )}

        {tab==='perfil' && aluno && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-1">
            {([
              ['Nome',aluno.nome],['E-mail',aluno.email],['WhatsApp',aluno.telefone],
              ['Objetivo',aluno.objetivo],['Nível',aluno.nivel],
              ['Peso',aluno.peso_atual?`${aluno.peso_atual}kg`:null],
              ['Altura',aluno.altura?`${aluno.altura}cm`:null],
              ['Lesões',aluno.lesoes],['Alergias',aluno.alergias],
              ['Medicamentos',aluno.medicamentos],['Observações',aluno.observacoes],
              ['Mensalidade',aluno.valor_mensalidade?`R$${aluno.valor_mensalidade}`:null],
            ] as [string,string|null][]).filter(([,v])=>v).map(([k,v])=>(
              <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{k}</span>
                <span className="text-xs font-medium text-gray-700 capitalize max-w-xs text-right">{v}</span>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
