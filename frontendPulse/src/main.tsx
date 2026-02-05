import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GraphqlProvider } from './components/providers/GraphqlProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GraphqlProvider>
      <App />
    </GraphqlProvider>
  </StrictMode>,
)
