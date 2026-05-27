import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { GameStateProvider } from './context/GameStateContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GameStateProvider>
        <App />
      </GameStateProvider>
    </ErrorBoundary>
  </StrictMode>,
)
