import { Redirect, Route, Router, Switch } from 'wouter';
import { Shell } from '@/components/chrome';
import { StoreProvider, useStore } from '@/lib/store';
import { Achievements } from '@/pages/achievements';
import { Banks } from '@/pages/banks';
import { BattleLobby, BattleRoom } from '@/pages/battle';
import { BlogPage } from '@/pages/blog';
import { Dashboard } from '@/pages/dashboard';
import { Editor } from '@/pages/editor';
import { FriendsPage } from '@/pages/friends';
import { Leaderboard } from '@/pages/leaderboard';
import { MistakesPage } from '@/pages/mistakes';
import { Play } from '@/pages/play';
import { Profile } from '@/pages/profile';
import { Welcome } from '@/pages/welcome';
import type { ReactNode } from 'react';

function Guard({ children }: { children: ReactNode }) {
  const { me } = useStore();
  if (!me) return <Redirect to="/" />;
  return <Shell>{children}</Shell>;
}

function Pages() {
  const { me } = useStore();
  return (
    <Switch>
      <Route path="/">{me ? <Redirect to="/dashboard" /> : <Welcome />}</Route>
      <Route path="/dashboard"><Guard><Dashboard /></Guard></Route>
      <Route path="/blog"><Guard><BlogPage /></Guard></Route>
      <Route path="/banks/:id"><Guard><Editor /></Guard></Route>
      <Route path="/banks"><Guard><Banks /></Guard></Route>
      <Route path="/play/:id"><Guard><Play /></Guard></Route>
      <Route path="/battle/:code"><Guard><BattleRoom /></Guard></Route>
      <Route path="/battle"><Guard><BattleLobby /></Guard></Route>
      <Route path="/friends"><Guard><FriendsPage /></Guard></Route>
      <Route path="/mistakes"><Guard><MistakesPage /></Guard></Route>
      <Route path="/leaderboard"><Guard><Leaderboard /></Guard></Route>
      <Route path="/profile"><Guard><Profile /></Guard></Route>
      <Route path="/achievements"><Guard><Achievements /></Guard></Route>
      <Route>
        <div className="grid min-h-[100dvh] place-items-center px-6">
          <div className="text-center">
            <p className="text-3xl font-semibold">Sahifa topilmadi</p>
            <a href="/" className="mt-3 inline-flex text-sm font-semibold text-primary">Bosh sahifa</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <StoreProvider>
      <Router base={base}>
        <Pages />
      </Router>
    </StoreProvider>
  );
}
