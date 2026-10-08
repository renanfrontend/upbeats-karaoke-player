
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { PlayerProvider } from './context/PlayerContext';
import Index from "./pages/Index";

// Páginas fora da inicial carregam sob demanda: a primeira tela baixa menos JavaScript.
const Search = lazy(() => import("./pages/Search"));
const Library = lazy(() => import("./pages/Library"));
const Karaoke = lazy(() => import("./pages/Karaoke"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PlayerProvider>
          <HashRouter>
            <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/karaoke" element={<Karaoke />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </HashRouter>
        </PlayerProvider>
      </TooltipProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;
