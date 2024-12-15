import { Page } from './shared';
import { PokemonPage } from './pages/PokemonPage';
import { HomePage } from './pages/HomePage';
import { usePage } from './hooks/usePage';
import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';
import { WaitingPage } from './pages/WaitingPage';

const getPage = (page: Page, { postId, racing, startTime, votes, options, catIndexes, currentWinner }: { 
  postId: string,
  racing: number[][],
  startTime: Date,
  votes: number[],
  options: string[],
  catIndexes: number[],
  currentWinner: string | null,
}) => {
  switch (page) {
    case 'home':
      return <HomePage 
        postId={postId}
        racing={racing} 
        options={options}
        votes={votes}
        // startTime={startTime}
        catIndexes={catIndexes}
        currentWinner={currentWinner}
      />;
    case 'pokemon':
      return <PokemonPage />;
    case 'waiting':
      return <WaitingPage 
        startTime={new Date(Date.now() + 60 * 1000 * 60 * 5)} 
        options={options}
        votes={votes}
        catIndexes={catIndexes}
      />;
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

  return <div className="h-full">{getPage(initData?.page, { 
    postId, 
    racing: initData.racing, 
    startTime: new Date(initData.startTime),
    votes: initData.votes,
    options: initData.options,
    catIndexes: initData.catIndexes,
    currentWinner: initData.currentWinner,
  })}</div>;
};
