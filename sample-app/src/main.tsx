// Learn more at developers.reddit.com/docs
import { Comment, Devvit, Listing, useAsync, useInterval, useState } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

const myForm = Devvit.createForm(
  {
    fields: [
      {
        type: 'number',
        name: 'minutes',
        label: 'roulette after (minutes)',
      },
    ],
  },
  async (event, context) => {
    const { reddit, redis, ui } = context;
    const min = event.values.minutes ?? 10;
    const now = new Date();
    const until = new Date(now.getTime() + min * 60 * 1000);
    ui.showToast({ text: 'Creating roulette...' });

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'Roulette',
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    redis.set(`deadline:${post.id}`, String(until.getTime()));
    ui.navigateTo(post);
  }
);


// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: 'Make roulette',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { ui } = context;
    ui.showForm(myForm);
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'regular',
  render: (context) => {
    
    const [{ until }] = useState<{ until: number }>(async () => {
      const stored = await context.redis.get(`deadline:${context.postId}`);
      return {
        until: Number(stored),
      };
    });

    // const [showResult, setShowResult] = useState(false);

    // if (until > Date.now()) {
    return <WaitingPage appVersion={context.appVersion} until={until} context={context} />;
    // }

    // if (showResult) {
    //   return <ResultPage appVersion={context.appVersion} context={context} />;
    // }

    // return <GamePage onFinished={() => setShowResult(true)} appVersion={context.appVersion}/>;
  },
});

function ResultPage({ appVersion, context }: { appVersion: string, context: Devvit.Context }) {
  const [{ until }] = useState<{ until: number }>(async () => {
    const stored = await context.redis.get(`deadline:${context.postId}`);
    return {
      until: Number(stored),
    };
  });

  const commentsCtx = context.reddit.getComments({ postId: context.postId ?? '' })
  const [users] = useState<Array<string>>(async () => await commentsCtx.all().then(data => {    
    return data.filter(c => c.createdAt.getTime() < until).map((comment: Comment) => comment.authorName);
  }));

  

  return (
    <vstack height="100%" width="100%" gap="medium" alignment="center middle">
      <text>Result! ${appVersion}</text>
      <vstack>
        {users.map((user) => (
          <text>{user}</text>
        ))}
      </vstack>
    </vstack>
  )
}

function WaitingPage({ appVersion, until, context }: { appVersion: string, until: number, context: Devvit.Context }) { 
  const untilDate = new Date(until);

  console.log('version', appVersion);

  return (
    <vstack height="100%" width="100%" alignment="center middle">
      <webview
        width={'100%'}
        height={'100%'}
        id={'waiting'}
        url="waiting.html"
        onMessage={(msg) => {
          console.log('Received from webview:', msg);
          if (msg.type === 'ready') {
            console.log('ready!', msg)
            context.ui.webView.postMessage('waiting', {
              type: 'init-data',
              payload: {
                until: until
              }
            });
          }
        
        }}
        // onMessage={(message: any) => {
        //   console.log('message!', message);
        //   // if (message.type === 'ready') {
        //   //   context.ui.webView.postMessage({
        //   //     type: 'init-data',
        //   //     payload: {
        //   //       until: untilDate.toLocaleTimeString()
        //   //     }
        //   //   });
        //   // }
        // }}
      ></webview>
    </vstack>

    // <vstack height="100%" width="100%" gap="medium" alignment="center middle">
    //   <text>Waiting... ${appVersion}</text>
    //   <text size='large'>{untilDate.toLocaleTimeString()}</text>
    // </vstack>
  );
}

type GamePageProps = {
  onFinished: () => void;
  appVersion: string;
}

function GamePage(props: GamePageProps) {

  const [time, setTime] = useState(0);
  useInterval(() => {
    setTime((time) => time + 1);
  }, 1000).start();

  if (time >= 10) {
    props.onFinished();
  }

  return (
    <vstack height="100%" width="100%" gap="medium" alignment="center middle">
      <text>{props.appVersion}</text>
      <text>Game! {time}</text>
    </vstack>
  )
}

export default Devvit;
