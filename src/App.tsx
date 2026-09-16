import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { AppShell } from './components/layout/AppShell';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { RiskControl } from './components/risk/RiskControl';
import { TodayTradePlan } from './components/plan/TodayTradePlan';
import { CapitalCompoundingPlan } from './components/plan/CapitalCompoundingPlan';
import { TradingTerminal } from './components/terminal/TradingTerminal';
import { MarketWatch } from './components/market/MarketWatch';
import { TradingViewSection } from './components/chart/TradingViewSection';
import { TradeJournal } from './components/journal/TradeJournal';
import { Statistics } from './components/stats/Statistics';
import { MyRules } from './components/rules/MyRules';
import { AiMarketAssistant } from './components/ai/AiMarketAssistant';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AuthModal } from './components/auth/AuthModal';
import { WelcomeModal } from './components/setup/WelcomeModal';
import { TradingProfileSetup } from './components/setup/TradingProfileSetup';
import { PremiumUpgradeModal } from './components/payment/PremiumUpgradeModal';

const AppContent: React.FC = () => {
  const { currentView } = useApp();
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <MainDashboard />;
      case 'terminal': return <TradingTerminal />;
      case 'risk-control': return <RiskControl />;
      case 'trade-plan': return <TodayTradePlan />;
      case 'compounding-plan': return <CapitalCompoundingPlan />;
      case 'market-watch': return <MarketWatch />;
      case 'tradingview': return <TradingViewSection />;
      case 'trade-journal': return <TradeJournal />;
      case 'statistics': return <Statistics />;
      case 'my-rules': return <MyRules />;
      case 'ai-assistant': return <AiMarketAssistant />;
      case 'profile': return <ProfileSettings />;
      default: return <MainDashboard />;
    }
  };
  return <>{currentView === 'landing' ? <LandingPage /> : <AppShell>{renderView()}</AppShell>}<AuthModal /><WelcomeModal /><TradingProfileSetup /><PremiumUpgradeModal /></>;
};
export default function App(){ return <AppProvider><AppContent /></AppProvider>; }
