// import { PhaserGame } from '../components/PhaserGame';

import { useEffect } from "react";
import { useDevvitListener } from "../hooks/useDevvitListener";
import { sendToDevvit } from "../utils";

interface WaitingPageProps {
  // deadline: number;
}

export const WaitingPage = ({ }: WaitingPageProps) => {
  const data = useDevvitListener('RESPONSE_WAITING_DATA');

  useEffect(() => {
    sendToDevvit({ type: 'REQUEST_WAITING_DATA' });
  }, [])

  if (!data?.deadline) {
    return <div>Loading.....</div>;
  }
  const deadlineDate = new Date(data?.deadline);

  return (
    <div className="w-full h-full">
      {deadlineDate.toLocaleTimeString()}
    </div>
  );
};
