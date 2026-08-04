import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/responsive.css';
import './styles/citywork.css';
import './styles/citywork-v4.css';
import './styles/active-operations.css';
import './styles/mission-hud.css';
import './styles/visual-overhaul.css';
import './styles/overhaul-core-ui.css';
import './styles/overhaul-build-ux.css';
import './styles/overhaul-shell.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
