import { PhaserGame } from '../components/PhaserGame';

interface HomePageProps {
  postId: string;
  racing: number[][];
}

export const HomePage = ({ postId, racing }: HomePageProps) => {
  return (
    <div className="w-full h-full">
      <PhaserGame normalizedDistances={racing} />
    </div>
  );
};
