import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tokens.css'

if (import.meta.env.DEV) {
  void import('./utils/matrixGrid.selfcheck').then((m) => m.selfCheck())
  void import('./utils/academicContext.selfcheck').then((m) => m.academicContextSelfCheck())
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
