import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import '@radix-ui/themes/styles.css'
import { Button, Card, TextField } from '@radix-ui/themes'

const API = 'http://localhost:8080'

type Exercise = { infinitive: string; sentence: string; translation: string }
type RoundState = { roundId: string; index: number; score: number; total: number; exercise: Exercise | null }

function useToken() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  return { token, setToken: (v: string) => { localStorage.setItem('token', v); setToken(v) } }
}

function Auth({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test')
  async function login(path: string) {
    const res = await fetch(`${API}/api/auth/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const body = await res.json()
    if (body.data?.token) localStorage.setItem('token', body.data.token)
    onAuth()
  }
  return <Card><h2>Auth</h2><TextField.Root value={email} onChange={e => setEmail(e.target.value)} placeholder="email" /><TextField.Root value={password} onChange={e => setPassword(e.target.value)} placeholder="password" /><Button onClick={() => login('register')}>Register</Button><Button onClick={() => login('login')}>Login</Button><Button onClick={() => login('test-login')}>Test Login</Button></Card>
}

function Protected({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/auth" />
}

function Practice() {
  const [presets, setPresets] = useState<string[]>([])
  const [selected, setSelected] = useState('basic')
  const [round, setRound] = useState<RoundState | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => { fetch(`${API}/api/presets`).then(r => r.json()).then(b => setPresets(b.data)) }, [])
  async function startRound() {
    const r = await fetch(`${API}/api/round/start`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ presetId: selected }) })
    const b = await r.json(); setRound(b.data); setFeedback('')
  }
  async function submit() {
    const r = await fetch(`${API}/api/round/submit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roundId: round?.roundId, answer }) })
    const b = await r.json(); setFeedback(b.data.correct ? 'success' : `expected: ${b.data.expected}`); setRound({ ...round!, score: b.data.score })
  }
  async function next() {
    const r = await fetch(`${API}/api/round/next`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roundId: round?.roundId }) })
    const b = await r.json(); setRound(b.data); setAnswer(''); setFeedback('')
  }

  return <Card><h2>Conjugation</h2><div>Knowledge score: {round?.score ?? 0}</div><select value={selected} onChange={e => setSelected(e.target.value)}>{presets.map(p => <option key={p}>{p}</option>)}</select><Button onClick={startRound}>Start round</Button>{round?.exercise && <div><div>{round.exercise.infinitive}</div><div>{round.exercise.sentence}</div><div>{round.exercise.translation}</div><TextField.Root value={answer} onChange={e => setAnswer(e.target.value)} /><Button onClick={submit}>Submit</Button><Button onClick={next}>Next</Button><div>{feedback}</div></div>}{round && !round.exercise && <div><h3>Round complete</h3><Button onClick={startRound}>Start next round</Button></div>}</Card>
}

function Categories() {
  const [items, setItems] = useState<string[]>([])
  useEffect(() => { fetch(`${API}/api/categories`).then(r => r.json()).then(b => setItems(b.data)) }, [])
  return <Card><h2>Categories</h2>{items.map(i => <div key={i}>{i}</div>)}<Link to="/practice">Go to practice</Link></Card>
}

function App() {
  const { token, setToken } = useToken()
  return <BrowserRouter><nav><Link to="/categories">Categories</Link> | <Link to="/practice">Practice</Link> | <Button onClick={async () => { await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) }); setToken('') }}>Logout</Button></nav><Routes><Route path="/auth" element={<Auth onAuth={() => location.href = '/categories'} />} /><Route path="/categories" element={<Protected><Categories /></Protected>} /><Route path="/practice" element={<Protected><Practice /></Protected>} /><Route path="*" element={<Navigate to="/categories" />} /></Routes></BrowserRouter>
}

createRoot(document.getElementById('root')!).render(<App />)
