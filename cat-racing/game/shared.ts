export type Page =
  | "home"
  | "waiting"
  | "pokemon";

export type WebviewToBlockMessage = 
 | { type: "INIT" }
 | { type: "REQUEST_WAITING_DATA" }
;

export type BlocksToWebviewMessage = 
  | {
    type: "INIT_RESPONSE";
    payload: {
      postId: string;
      page: Page;
      racing: number[][];
    };
  }
  | {
    type: "RESPONSE_WAITING_DATA";
    payload: {
      deadline: number;
    }
  }
  ; 

export type DevvitMessage = {
  type: "devvit-message";
  data: { message: BlocksToWebviewMessage };
};
