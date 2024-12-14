import { Page } from './shared';
import { PokemonPage } from './pages/PokemonPage';
import { HomePage } from './pages/HomePage';
import { usePage } from './hooks/usePage';
import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';
import { WaitingPage } from './pages/WaitingPage';

const getPage = (page: Page, { postId, racing }: { postId: string, racing: number[][] }) => {
  switch (page) {
    case 'home':
      return <HomePage postId={postId} racing={racing} />;
    case 'pokemon':
      return <PokemonPage />;
    case 'waiting':
      return <WaitingPage />;
    default:
      throw new Error(`Unknown page: ${page satisfies never}`);
  }
};

export const App = () => {
  const [postId, setPostId] = useState('');
  // const page = usePage();
  const initData = useDevvitListener('INIT_RESPONSE');
  useEffect(() => {
    sendToDevvit({ type: 'INIT' });
  }, []);

  useEffect(() => {
    if (initData) {
      setPostId(initData.postId);
    }
  }, [initData, setPostId]);

  if (initData?.page === undefined) {
    return <div>Loading...</div>;
  }

  return <div className="h-full">{getPage(initData?.page, { postId, racing: initData.racing })}</div>;
};
