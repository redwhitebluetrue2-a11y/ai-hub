
import React, {useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PROVIDERS, routeTask } from './src/router';
import { askProvider } from './src/realApi';
import * as SecureStore from 'expo-secure-store';
import { saveKey, getKey } from './src/ApiKeys';

const MOCK = {
  meta: (t)=>`I'll coordinate: breaking "${t.slice(0,60)}..." into steps and merging best outputs.`,
  copilot: (t)=>`Code solution ready. I generated repo structure, tests, and can push to GitHub.`,
  gemini: (t)=>`Analyzed with long context + multimodal. Found patterns and sources for this task.`,
  claude: (t)=>`Drafted polished, nuanced version with clear structure and tone tuned for delivery.`,
  perplexity: (t)=>`Live search: 5 current sources (2026) with citations relevant to your task.`,
  deepseek: (t)=>`Optimized logic O(n log n). Efficient implementation + edge cases covered.`,
  chatgpt: (t)=>`Creative + general solution ready. Can expand to images, plugins, full plan.`,
  grok: (t)=>`Trending angle: Real-time sentiment on X shows this is hot right now. Unfiltered take inside.`
};

export default function App(){
  const [task, setTask] = useState('');
  const [mode, setMode] = useState('auto');
  const [manual, setManual] = useState(new Set(['meta','chatgpt']));
  const [result, setResult] = useState(null);
  const [coord, setCoord] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState('');

  React.useEffect(()=>{ (async()=>{ const k = await getKey('openai'); if(k) setKeyStatus('✓ OpenAI key saved'); })(); },[]);

  const toggleManual = (id)=>{
    const n = new Set(manual);
    if(n.has(id)) n.delete(id); else n.add(id);
    setManual(n);
  };

  const saveOpenAIKey = async ()=>{
    if(!keyInput.trim()) return;
    await saveKey('openai', keyInput.trim());
    setKeyStatus('✓ OpenAI key saved securely!');
    setKeyInput('');
    Alert.alert('Saved','OpenAI key saved securely on device');
  };

  const onRoute = async ()=>{
    if(!task.trim()){ Alert.alert('Type a task first'); return; }
    const r = routeTask(task, mode, manual);
    setResult({ ...r, tasks: r.assigns.map(id=>({id, progress:5, text:'Routing to '+id+'...', isReal:false})) });
    r.assigns.forEach(async (id,i)=>{
      let p=5;
      const iv = setInterval(()=>{ p+= Math.random()*15; if(p>85) p=85; setResult(prev=> prev ? {...prev, tasks: prev.tasks.map(t=> t.id===id ? {...t, progress:p} : t)} : prev); }, 400);
      try{
        let real = null;
        try{ real = await askProvider(id, task); }catch(e){ 
          if(e.message.includes('No OpenAI') || e.message.includes('No key')) real = null;
          else real = null;
        }
        clearInterval(iv);
        const finalText = real || MOCK[id](task);
        setResult(prev=> prev ? {...prev, tasks: prev.tasks.map(t=> t.id===id ? {...t, progress:100, text:finalText, isReal: !!real} : t)} : prev);
      }catch(err){
        clearInterval(iv);
        setResult(prev=> prev ? {...prev, tasks: prev.tasks.map(t=> t.id===id ? {...t, progress:100, text:`Error: ${err.message}`} : t)} : prev);
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ALL AI • ROUTER v2</Text>
          <TouchableOpacity onPress={()=>setShowKeys(!showKeys)}><Text style={styles.headerSub}>{keyStatus||'Add API Key'}</Text></TouchableOpacity>
        </View>

        {showKeys && (
          <View style={styles.keyBox}>
            <Text style={styles.keyTitle}>🔑 Where is your OpenAI key & where to put it:</Text>
            <Text style={styles.keyHelp}>1. You got it from platform.openai.com → API Keys → it starts with sk-proj-...{"\n"}2. Paste it below → Save. It is stored encrypted on your phone, never sent to me.{"\n"}3. Then route any task to ChatGPT/Copilot and you'll get REAL answers.</Text>
            <TextInput value={keyInput} onChangeText={setKeyInput} placeholder="sk-proj-..." placeholderTextColor="#6b7280" style={styles.keyInput} secureTextEntry />
            <TouchableOpacity onPress={saveOpenAIKey} style={styles.keySave}><Text style={styles.keySaveText}>Save OpenAI Key Securely</Text></TouchableOpacity>
            <Text style={styles.keyStatus}>{keyStatus}</Text>
          </View>
        )}

        <View style={styles.board}>
          <View style={styles.boardTop}>
            <Text style={styles.boardLabel}>Main Task Board</Text>
            <TouchableOpacity onPress={()=>setCoord(!coord)}><Text style={styles.toggle}>{coord?'✓ Meta coordinates':'○ Meta coordinates'}</Text></TouchableOpacity>
          </View>
          <TextInput value={task} onChangeText={setTask} placeholder="Describe any task - I'll route it to specialists... e.g. Build a Python script to scrape NBA scores" placeholderTextColor="#6b7280" style={styles.input} multiline />
          <View style={styles.modes}>
            {['auto','swarm','manual'].map(m=>(
              <TouchableOpacity key={m} onPress={()=>setMode(m)} style={[styles.modeBtn, mode===m && styles.modeActive]}><Text style={[styles.modeText, mode===m && styles.modeTextActive]}>{m==='auto'?'Auto Route': m==='swarm'?'Swarm All':'Manual'}</Text></TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={onRoute} style={styles.routeBtn}><Text style={styles.routeText}>⚡ Smart Route Task</Text></TouchableOpacity>
          {result && <View style={styles.intents}>{result.intents.map(i=><View key={i} style={styles.chip}><Text style={styles.chipText}>{i}</Text></View>)}</View>}
        </View>

        <Text style={styles.section}>SPECIALISTS</Text>
        <View style={styles.grid}>
          {PROVIDERS.map(p=>{
            const active = result?.assigns.includes(p.id);
            const isReal = p.id==='chatgpt' || p.id==='copilot';
            return (
              <TouchableOpacity key={p.id} onPress={()=> mode==='manual' && toggleManual(p.id)} style={[styles.card, active && styles.cardActive, mode==='manual' && manual.has(p.id) && styles.cardSelected]}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={styles.cardIcon}>{p.name[0]}</Text>{isReal && keyStatus.includes('✓') && <Text style={{fontSize:9, color:'#22c55e'}}>● LIVE</Text>}</View>
                <Text style={styles.cardName}>{p.name}</Text>
                <Text style={styles.cardRole}>{p.role}</Text>
                {p.badge && <Text style={styles.badge}>{p.badge}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {result && (
          <View style={{marginTop:24}}>
            <Text style={styles.section}>Workload Assigned {result.tasks.filter(t=>t.isReal).length>0 ? '(Real API)' : '(Mock until key added)'}</Text>
            {result.tasks.map(t=>{
              const prov = PROVIDERS.find(p=>p.id===t.id);
              return (
                <View key={t.id} style={[styles.taskCard, t.isReal && {borderColor:'#22c55e'}]}>
                  <View style={styles.taskHeader}><Text style={styles.taskName}>{prov.name} {t.isReal?'• REAL':''}</Text><Text style={styles.taskRole}>{prov.role}</Text></View>
                  <View style={styles.progressBg}><View style={[styles.progressFill,{width:`${t.progress}%`, backgroundColor: t.isReal?'#22c55e':'#3b82f6'}]}/></View>
                  <Text style={styles.taskText}>{t.text}</Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={{height:80}}/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#0a0a0f'},
  scroll:{padding:16, paddingTop: Platform.OS==='ios'?60:40},
  header:{flexDirection:'row', justifyContent:'space-between', marginBottom:16},
  headerTitle:{color:'#fff', fontWeight:'800', fontSize:16},
  headerSub:{color:'#22c55e', fontSize:12, fontWeight:'600'},
  keyBox:{backgroundColor:'rgba(34,197,94,0.1)', borderWidth:1, borderColor:'rgba(34,197,94,0.3)', borderRadius:16, padding:12, marginBottom:16},
  keyTitle:{color:'#86efac', fontWeight:'700', fontSize:13, marginBottom:6},
  keyHelp:{color:'#d1fae5', fontSize:11, lineHeight:15, marginBottom:10},
  keyInput:{backgroundColor:'rgba(0,0,0,0.5)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:10, padding:10, color:'#fff', fontSize:12},
  keySave:{marginTop:10, backgroundColor:'#22c55e', paddingVertical:10, borderRadius:10, alignItems:'center'},
  keySaveText:{color:'#000', fontWeight:'700', fontSize:12},
  keyStatus:{color:'#86efac', fontSize:11, marginTop:6},
  board:{backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:20, padding:14},
  boardTop:{flexDirection:'row', justifyContent:'space-between', marginBottom:10},
  boardLabel:{color:'#fff', fontWeight:'600'},
  toggle:{color:'#60a5fa', fontSize:11},
  input:{backgroundColor:'rgba(0,0,0,0.5)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:12, padding:12, color:'#fff', minHeight:90, textAlignVertical:'top'},
  modes:{flexDirection:'row', gap:8, marginTop:12},
  modeBtn:{flex:1, paddingVertical:8, borderRadius:20, backgroundColor:'rgba(255,255,255,0.08)', alignItems:'center'},
  modeActive:{backgroundColor:'#2563eb'},
  modeText:{color:'#9ca3af', fontSize:11, fontWeight:'600'},
  modeTextActive:{color:'#fff'},
  routeBtn:{marginTop:12, backgroundColor:'#2563eb', paddingVertical:14, borderRadius:24, alignItems:'center'},
  routeText:{color:'#fff', fontWeight:'700'},
  intents:{flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:12},
  chip:{paddingHorizontal:10, paddingVertical:4, borderRadius:12, backgroundColor:'rgba(37,99,235,0.2)', borderWidth:1, borderColor:'rgba(37,99,235,0.3)'},
  chipText:{color:'#93c5fd', fontSize:11},
  section:{color:'rgba(255,255,255,0.5)', fontSize:11, letterSpacing:1, marginTop:24, marginBottom:10, fontWeight:'700'},
  grid:{flexDirection:'row', flexWrap:'wrap', gap:10},
  card:{width:'48%', backgroundColor:'rgba(255,255,255,0.03)', borderWidth:1, borderColor:'rgba(255,255,255,0.08)', borderRadius:16, padding:12},
  cardActive:{borderColor:'#3b82f6'},
  cardSelected:{borderColor:'#3b82f6'},
  cardIcon:{width:28, height:28, borderRadius:8, backgroundColor:'#1f2937', textAlign:'center', lineHeight:28, color:'#fff', fontWeight:'800', marginBottom:6},
  cardName:{color:'#fff', fontWeight:'700', fontSize:13},
  cardRole:{color:'#6b7280', fontSize:10, marginTop:2},
  badge:{color:'#60a5fa', fontSize:9, marginTop:6, letterSpacing:1},
  taskCard:{backgroundColor:'rgba(255,255,255,0.04)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:16, padding:12, marginBottom:10},
  taskHeader:{flexDirection:'row', justifyContent:'space-between', marginBottom:8},
  taskName:{color:'#fff', fontWeight:'600', fontSize:13},
  taskRole:{color:'#6b7280', fontSize:10},
  progressBg:{height:4, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:2, overflow:'hidden', marginBottom:8},
  progressFill:{height:4, backgroundColor:'#3b82f6'},
  taskText:{color:'rgba(255,255,255,0.85)', fontSize:12, lineHeight:16},
});
