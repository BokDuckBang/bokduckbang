export type Page =
  | "home"
  | "waiting"
  | "pokemon";

export type WebviewToBlockMessage = 
 | { type: "INIT" }
 | { type: "REQUEST_WAITING_DATA" }
 | { type: "REQUEST_CREATE_BET" }
;

export type BlocksToWebviewMessage = 
  | {
    type: "INIT_RESPONSE";
    payload: {
      postId: string;
      page: Page;
      racing: number[][];
      startTime: number;
      votes: number[];
      options: string[];
      catIndexes: number[];
      currentWinner: string | null;
    };
  }
  | {
    type: "RESPONSE_WAITING_DATA";
    payload: {
      deadline: number;
    }
  }
  | {
    type: 'UPDATE_DATA';
    payload: {
      racing?: number[][];
      deadline?: number;
      votes?: number[];
    }
  }
  ; 

export type DevvitMessage = {
  type: "devvit-message";
  data: { message: BlocksToWebviewMessage };
};
