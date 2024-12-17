import { PhaserGame } from '../components/PhaserGame';

interface HomePageProps {
  postId: string;
  racing: number[][];
  options: string[],
  catIndexes: number[],
  votes: number[],
  currentWinner: string | null,
}

export const HomePage = (props: HomePageProps) => {
  return (
    <div className="w-full h-full">
      <PhaserGame {...props} />
    </div>
  );
};
