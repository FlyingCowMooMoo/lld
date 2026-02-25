import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import '@radix-ui/themes/styles.css'
import { Button, Card, TextField } from '@radix-ui/themes'

const API = 'http://localhost:8080'

type Exercise = { infinitive: string; sentence: string; translation: string }
type RoundState = { roundId: string; index: number; score: number; total: number; exercise: Exercise | null }

type FormInput = {
  infinitive: string
  sentence: string
  translation: string
  expected: string
  separablePrefix?: string
  tense: 'PRESENT'
  mood: 'INDICATIVE'
  person: 'ICH'
}

function useToken() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  return {
    token,
    setToken: (v: string) => {
      localStorage.setItem('token', v)
      setToken(v)
    },
  }
}

function Auth({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test')
  async function login(path: string) {
    const res = await fetch(`${API}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await res.json()
    if (body.data?.token) localStorage.setItem('token', body.data.token)
    onAuth()
  }
  return (
    <Card>
      <h2>Auth</h2>
      <TextField.Root value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
      <TextField.Root value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />
      <Button onClick={() => login('register')}>Register</Button>
      <Button onClick={() => login('login')}>Login</Button>
      <Button onClick={() => login('test-login')}>Test Login</Button>
    </Card>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/auth" />
}

function Practice() {
  const token = localStorage.getItem('token') || ''
  const [presets, setPresets] = useState<string[]>([])
  const [selected, setSelected] = useState('basic')
  const [round, setRound] = useState<RoundState | null>(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')

  const [presetName, setPresetName] = useState('custom-a1')
  const [form, setForm] = useState<FormInput>({
    infinitive: 'lernen',
    sentence: 'Ich ____ Deutsch jeden Tag.',
    translation: 'I learn German every day.',
    expected: 'lerne',
    separablePrefix: '',
    tense: 'PRESENT',
    mood: 'INDICATIVE',
    person: 'ICH',
  })

  async function loadPresets() {
    const response = await fetch(`${API}/api/presets`)
    const payload = await response.json()
    setPresets(payload.data)
  }

  useEffect(() => {
    loadPresets()
  }, [])

  async function createPreset() {
    await fetch(`${API}/api/presets`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: presetName,
        forms: [form],
      }),
    })
    await loadPresets()
    setSelected(presetName)
  }

  async function startRound() {
    const response = await fetch(`${API}/api/round/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ presetId: selected, token }),
    })
    const payload = await response.json()
    setRound(payload.data)
    setFeedback('')
  }

  async function submit() {
    const response = await fetch(`${API}/api/round/submit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundId: round?.roundId, answer }),
    })
    const payload = await response.json()
    setFeedback(payload.data.correct ? 'success' : `expected: ${payload.data.expected}`)
    setRound({ ...round!, score: payload.data.score })
  }

  async function next() {
    const response = await fetch(`${API}/api/round/next`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ roundId: round?.roundId }),
    })
    const payload = await response.json()
    setRound(payload.data)
    setAnswer('')
    setFeedback('')
  }

  return (
    <Card>
      <h2>Conjugation</h2>
      <div>Knowledge score: {round?.score ?? 0}</div>
      <div>
        <h3>Preset</h3>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {presets.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Button onClick={startRound}>Start round</Button>
      </div>

      <div>
        <h3>Create custom preset</h3>
        <TextField.Root value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="preset name" />
        <TextField.Root value={form.infinitive} onChange={e => setForm({ ...form, infinitive: e.target.value })} placeholder="infinitive" />
        <TextField.Root value={form.sentence} onChange={e => setForm({ ...form, sentence: e.target.value })} placeholder="sentence" />
        <TextField.Root value={form.translation} onChange={e => setForm({ ...form, translation: e.target.value })} placeholder="translation" />
        <TextField.Root value={form.expected} onChange={e => setForm({ ...form, expected: e.target.value })} placeholder="expected" />
        <Button onClick={createPreset}>Create preset</Button>
      </div>

      {round?.exercise && (
        <div>
          <div>{round.exercise.infinitive}</div>
          <div>{round.exercise.sentence}</div>
          <div>{round.exercise.translation}</div>
          <TextField.Root value={answer} onChange={e => setAnswer(e.target.value)} />
          <Button onClick={submit}>Submit</Button>
          <Button onClick={next}>Next</Button>
          <div>{feedback}</div>
        </div>
      )}

      {round && !round.exercise && (
        <div>
          <h3>Round complete</h3>
          <Button onClick={startRound}>Start next round</Button>
        </div>
      )}
    </Card>
  )
}

function Categories() {
  const [items, setItems] = useState<string[]>([])
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(body => setItems(body.data))
  }, [])
  return (
    <Card>
      <h2>Categories</h2>
      {items.map(item => (
        <div key={item}>{item}</div>
      ))}
      <Link to="/practice">Go to practice</Link>
    </Card>
  )
}

function App() {
  const { token, setToken } = useToken()
  return (
    <BrowserRouter>
      <nav>
        <Link to="/categories">Categories</Link> | <Link to="/practice">Practice</Link> |
        <Button
          onClick={async () => {
            await fetch(`${API}/api/auth/logout`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ token }),
            })
            setToken('')
          }}
        >
          Logout
        </Button>
      </nav>
      <Routes>
        <Route path="/auth" element={<Auth onAuth={() => (location.href = '/categories')} />} />
        <Route
          path="/categories"
          element={
            <Protected>
              <Categories />
            </Protected>
          }
        />
        <Route
          path="/practice"
          element={
            <Protected>
              <Practice />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/categories" />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
