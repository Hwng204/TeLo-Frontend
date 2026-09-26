import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/tokens.css'

if (import.meta.env.DEV) {
  void import('./utils/matrixGrid.selfcheck').then((m) => m.selfCheck())
  void import('./utils/academicContext.selfcheck').then((m) => m.academicContextSelfCheck())
  void import('./utils/formatters.selfcheck').then((m) => m.formattersSelfCheck())
  void import('./utils/matrixImport.selfcheck').then((m) => m.matrixImportSelfCheck())
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />,
)
