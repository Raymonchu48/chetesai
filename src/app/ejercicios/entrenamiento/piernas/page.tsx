"use client";

import { useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import LegExerciseVisual from "@/components/exercises/LegExerciseVisual";
import { Search, SlidersHorizontal, Star, Plus, Play, Info, CircleCheck, CircleX, ChevronLeft, ChevronRight, Dumbbell, Target } from "lucide-react";

type Exercise={
  _id:string; codigo_interno?:string|null; nombre:string; grupo_muscular:string; grupo_secundario?:string|null;
  dificultad:string; material?:string|null; descripcion?:string|null; tecnica?:string|null; errores_frecuentes?:string|null;
  consejos?:string|null; progresion?:string|null; regresion?:string|null; variante_facil?:string|null; variante_avanzada?:string|null;
  video_url?:string|null; objetivos?:string[]; etiquetas?:string[];
};

type ApiResponse={data?:Exercise[]};

type Category="todos"|"cuadriceps"|"isquios"|"gluteos"|"gemelos"|"aductores";

const filters:{id:Category;label:string}[]=[
  {id:"todos",label:"Todos"},{id:"cuadriceps",label:"Cuádriceps"},{id:"isquios",label:"Isquios"},
  {id:"gluteos",label:"Glúteos"},{id:"gemelos",label:"Gemelos"},{id:"aductores",label:"Aductores"}
];

function textList(v?:string|null){return String(v||"").split(/;|\n/).map(x=>x.trim()).filter(Boolean)}
function categoryOf(x:Exercise):Category{
  const t=`${x.nombre} ${x.grupo_secundario||""} ${(x.etiquetas||[]).join(" ")}`.toLowerCase();
  if(/gemelo|soleo|sóleo|pantorrilla/.test(t)) return "gemelos";
  if(/aductor|sumo/.test(t)) return "aductores";
  if(/isquio|femoral|rumano|peso muerto|curl/.test(t)) return "isquios";
  if(/glúte|glute|hip thrust|puente/.test(t)) return "gluteos";
  return "cuadriceps";
}
function levelLabel(v:string){return v==="principiante"?"BÁSICO":v==="avanzado"?"AVANZADO":"INTERMEDIO"}
function levelClass(v:string){return v==="avanzado"?"text-red-600":v==="principiante"?"text-green-700":"text-green-700"}
function publicCode(item:Exercise,index:number){return item.codigo_interno?.replace("CHE-PIE-","PER-")||`PER-${String(index+1).padStart(3,"0")}`}

export default function PiernasVisualPage(){
  const[items,setItems]=useState<Exercise[]>([]); const[selected,setSelected]=useState<Exercise|null>(null); const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState(""); const[filter,setFilter]=useState<Category>("todos"); const[favorites,setFavorites]=useState<Set<string>>(new Set());
  useEffect(()=>{(async()=>{try{const r=await fetch("/api/ejercicios?activo=true");const d=(await r.json()) as ApiResponse;const legs=(d.data||[]).filter(x=>x.grupo_muscular==="piernas"||x.grupo_muscular==="gluteos");setItems(legs);setSelected(legs[0]||null)}finally{setLoading(false)}})()},[]);
  const counts=useMemo(()=>Object.fromEntries(filters.map(f=>[f.id,items.filter(x=>f.id==="todos"||categoryOf(x)===f.id).length])),[items]);
  const visible=useMemo(()=>{const q=search.trim().toLowerCase();return items.filter(x=>(filter==="todos"||categoryOf(x)===filter)&&(!q||`${x.nombre} ${x.material||""} ${x.descripcion||""}`.toLowerCase().includes(q)))},[items,filter,search]);
  const toggleFav=(id:string)=>setFavorites(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n});

  return <AppSidebar><div className="min-h-screen bg-[#fbfbfa] text-slate-950">
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"><div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
      <div><h1 className="text-3xl font-black tracking-tight">Ejercicios</h1><div className="mt-1 flex items-center gap-2 text-sm font-semibold text-green-700"><span>Biblioteca</span><ChevronRight className="h-4 w-4"/><span>Piernas</span></div></div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3"><div className="relative min-w-[280px] max-w-md flex-1 xl:max-w-sm"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ejercicio..." className="h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm outline-none ring-green-600 focus:ring-2"/></div><button className="flex h-12 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-bold"><SlidersHorizontal className="h-4 w-4"/>Filtros</button><button className="flex h-12 items-center gap-2 rounded-xl border bg-white px-5 text-sm font-bold"><Star className="h-4 w-4"/>Favoritos</button><button className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-green-700 to-lime-600 px-6 text-sm font-bold text-white shadow-sm"><Plus className="h-5 w-5"/>Nuevo ejercicio</button></div>
    </div></header>

    <div className="grid gap-5 p-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-w-0">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-lime-400 to-green-800 text-white shadow"><Dumbbell className="h-8 w-8"/></div><div><h2 className="text-2xl font-black text-green-800">PIERNAS</h2><p className="text-sm font-semibold">Fuerza, estabilidad y potencia.</p><p className="text-sm text-green-700">La base de cada movimiento que haces.</p></div></div>
          <div className="flex flex-wrap gap-2">{filters.map(f=><button key={f.id} onClick={()=>setFilter(f.id)} className={`min-w-[84px] rounded-xl border px-3 py-3 text-xs font-bold transition ${filter===f.id?"border-lime-300 bg-lime-50 text-green-800":"bg-white hover:border-green-300"}`}><span className="block">{f.label}</span><span className="mt-1 block text-[10px] font-semibold text-slate-500">({counts[f.id]||0})</span></button>)}<button className="rounded-xl border bg-white px-4 py-3 text-xs font-bold"><Star className="mx-auto mb-1 h-5 w-5 text-green-700"/>Fav.<span className="ml-1 text-slate-500">({favorites.size})</span></button></div>
        </div>

        {loading?<div className="py-24 text-center text-slate-500">Cargando ejercicios...</div>:<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{visible.map((item,index)=><article key={item._id} onClick={()=>setSelected(item)} className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selected?._id===item._id?"ring-2 ring-green-600":""}`}>
          <div className="flex items-start justify-between p-3 pb-0"><div><p className="text-[10px] font-black text-green-700">{publicCode(item,index)}</p><h3 className="mt-1 min-h-10 text-sm font-black leading-5">{item.nombre}</h3><p className={`mt-1 text-[10px] font-black ${levelClass(item.dificultad)}`}>{levelLabel(item.dificultad)}</p></div><button onClick={e=>{e.stopPropagation();toggleFav(item._id)}} className="rounded-full p-1 text-slate-400 hover:text-green-700"><Star className={`h-4 w-4 ${favorites.has(item._id)?"fill-green-600 text-green-600":""}`}/></button></div>
          <div className="h-36 px-2"><LegExerciseVisual code={item.codigo_interno} name={item.nombre}/></div><div className="flex items-center justify-between border-t px-3 py-2 text-slate-600"><Play className="h-4 w-4"/><Info className="h-4 w-4"/><Star className="h-4 w-4"/></div>
        </article>)}</div>}
        <div className="mt-5 flex items-center justify-center gap-3"><button className="grid h-8 w-8 place-items-center rounded-lg border bg-white"><ChevronLeft className="h-4 w-4"/></button><span className="grid h-8 w-8 place-items-center rounded-lg bg-green-700 text-sm font-bold text-white">1</span><button className="grid h-8 w-8 place-items-center rounded-lg border bg-white"><ChevronRight className="h-4 w-4"/></button></div>
      </section>

      <aside className="2xl:sticky 2xl:top-24 2xl:self-start">{selected?<Detail item={selected} index={Math.max(0,items.findIndex(x=>x._id===selected._id))} favorite={favorites.has(selected._id)} onFavorite={()=>toggleFav(selected._id)}/>:<div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Selecciona un ejercicio.</div>}</aside>
    </div>

    <footer className="border-t bg-[#07111f] px-6 py-4 text-center text-sm text-white/80">Chetesaí Fitness+ <span className="mx-2 text-lime-400">•</span> Tu entrenamiento, tu energía, tu mejor versión.</footer>
  </div></AppSidebar>
}

function Detail({item,index,favorite,onFavorite}:{item:Exercise;index:number;favorite:boolean;onFavorite:()=>void}){
 const keys=textList(item.tecnica); const errors=textList(item.errores_frecuentes); const tips=textList(item.consejos);
 const muscle=categoryOf(item);
 return <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="flex items-start justify-between p-5 pb-3"><div><p className="text-xs font-black text-green-700">{publicCode(item,index)}</p><h2 className="mt-1 text-2xl font-black">{item.nombre}</h2><p className={`mt-1 text-xs font-black ${levelClass(item.dificultad)}`}>{levelLabel(item.dificultad)}</p></div><div className="flex gap-2"><button onClick={onFavorite} className="p-2"><Star className={`h-5 w-5 ${favorite?"fill-green-600 text-green-600":"text-green-700"}`}/></button><button className="p-2 text-slate-600">×</button></div></div>
   <div className="relative mx-4 h-48 overflow-hidden rounded-xl bg-[#f7f5ef]"><LegExerciseVisual code={item.codigo_interno} name={item.nombre}/><button className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-green-700 text-white shadow-lg"><Play className="ml-1 h-6 w-6 fill-current"/></button></div>
   <div className="m-4 grid grid-cols-3 divide-x rounded-xl border"><Meta label="Grupo muscular" value={muscle==="cuadriceps"?"Cuádriceps / Glúteos":muscle==="isquios"?"Isquios / Glúteos":muscle.charAt(0).toUpperCase()+muscle.slice(1)} icon={<Target className="h-5 w-5"/>}/><Meta label="Material" value={item.material||"Sin material"} icon={<Dumbbell className="h-5 w-5"/>}/><Meta label="Nivel" value={levelLabel(item.dificultad)} icon={<Info className="h-5 w-5"/>}/></div>
   <div className="grid gap-5 border-t p-5 md:grid-cols-2 2xl:grid-cols-2"><InfoList title="CLAVES TÉCNICAS" items={keys.length?keys:[item.descripcion||"Controla el movimiento y mantén una técnica estable."]} good/><InfoList title="ERRORES FRECUENTES" items={errors.length?errors:["Perder la alineación durante el movimiento.","Usar una carga que impide controlar la técnica."]}/></div>
   <div className="border-t p-5"><h3 className="text-xs font-black text-green-700">CONSEJOS DEL ENTRENADOR</h3><ul className="mt-3 space-y-2 text-sm text-slate-700">{(tips.length?tips:["Activa el core antes de cada repetición.","Trabaja con rango completo y controlado.","Incrementa la carga de forma progresiva."]).map(x=><li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600"/>{x}</li>)}</ul></div>
   <div className="grid gap-4 border-t p-5 sm:grid-cols-2"><div><h3 className="text-xs font-black text-green-700">MÚSCULOS TRABAJADOS</h3><div className="mt-3 flex items-center gap-2 text-xs text-slate-600"><div className="grid h-14 w-14 place-items-center rounded-xl bg-lime-50 text-green-700"><Target className="h-7 w-7"/></div><span>{muscle==="cuadriceps"?"Cuádriceps · Glúteos · Core":muscle==="isquios"?"Isquios · Glúteos · Core":muscle}</span></div></div><div><h3 className="text-xs font-black text-green-700">VÍDEO EXPLICATIVO</h3><button className="mt-3 flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Play className="h-5 w-5 fill-current"/>Ver demostración</button></div></div>
  </div>
}
function Meta({label,value,icon}:{label:string;value:string;icon:React.ReactNode}){return <div className="p-3"><div className="flex items-center gap-2 text-green-700">{icon}<span className="text-[10px] font-black">{label}</span></div><p className="mt-1 text-xs font-semibold text-slate-700">{value}</p></div>}
function InfoList({title,items,good=false}:{title:string;items:string[];good?:boolean}){return <div><h3 className={`text-xs font-black ${good?"text-green-700":"text-red-600"}`}>{title}</h3><ul className="mt-3 space-y-2 text-xs text-slate-700">{items.map(x=><li key={x} className="flex gap-2">{good?<CircleCheck className="h-4 w-4 shrink-0 text-green-600"/>:<CircleX className="h-4 w-4 shrink-0 text-red-500"/>}<span>{x}</span></li>)}</ul></div>}
