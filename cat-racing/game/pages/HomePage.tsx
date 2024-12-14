import { PhaserGame } from '../components/PhaserGame';

interface HomePageProps {
  postId: string;
  racingData: number[][];
}

export const HomePage = ({ postId }: HomePageProps) => {
  return (
    <div className="w-full h-full">
      <PhaserGame />
    </div>
  );
};
