import { Devvit, useState, useForm } from '@devvit/public-api';
import { sendMessageToWebview } from './utils/utils.js';
import { WebviewToBlockMessage } from '../game/shared.js';
import { WEBVIEW_ID } from './constants.js';
import { Preview } from './components/Preview.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

const CAT_INDEXES = Array.from({ length: 10 }).map((_, i) => i);

function getRacingData(size: number) {
  const data = Array.from({ length: size }).map((_, i) => {
    return Array.from({ length: 10 }).map((_, j) => {
      return Math.round(Math.random() * 1000);
    });
  })
  const sum = data.map(d => {
      return d.reduce((acc, c) => acc + c, 0)
  })

  const max = Math.max(...sum);
  const result = data.map(d => d.map(n => Math.round(n * 1000 / max) / 1000))
  return result;
}

function randomItems<T>(arr: T[], count: number) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const createRaceForm = Devvit.createForm(
  {
    fields: [
      {
        type: 'string',
        name: 'title',
        label: 'Title',
        placeholder: 'Cat Racing Game',
      },
      {
        required: true,
        type: 'number',
        name: 'minutes',
        label: 'start after (minutes)',
      },
      {
        type: 'string',
        name: 'options',
        label: 'Options (comma separated)',
        required: true,
      },
    ],
  },
  async (event, context) => {
    const { reddit, redis, ui } = context;

    const options = (event.values.options ?? '').split(',').map(o => o.trim());
    if (options.length < 2) {
      ui.showToast({ text: 'Please provide at least two options' });
      return;
    }

    const min = event.values.minutes ?? 10;
    const title = event.values.title ?? 'Cat Racing Game';
    const startTime = Date.now() + min * 60 * 1000;

    ui.showToast({ text: 'Creating a cat racing game...' });

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: title,
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading...</text>
        </vstack>
      ),
    });



    redis.set(`deadline:${post.id}`, String(startTime));
    redis.set(`options:${post.id}`, JSON.stringify(options));
    redis.set(`racing:${post.id}`, JSON.stringify(getRacingData(options.length)));
    redis.set(`catindexes:${post.id}`, JSON.stringify(randomItems(CAT_INDEXES, options.length) ));
    ui.navigateTo(post);
  }
);


Devvit.addMenuItem({
  // Please update as you work on your idea!
  label: '[Cat Racing] Make cat racing game - ami test',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { ui } = context;
    ui.showForm(createRaceForm);
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render: (context) => {
    const { redis } = context;
    const [{ startTime, racing, options, catIndexes }] = useState<{ 
      startTime: number,
      racing: number[][],
      options: string[],
      catIndexes: number[],
   }>(async () => {
      const [
        startTime,
        racing,
        options,
        catIndexes,
      ] = await Promise.all([
        redis.get(`deadline:${context.postId}`),
        redis.get(`racing:${context.postId}`),
        redis.get(`options:${context.postId}`),
        redis.get(`catindexes:${context.postId}`),
      ]);
      return {
        startTime: Number(startTime),
        racing: JSON.parse(racing ?? '[]'),
        options: JSON.parse(options ?? '[]'),
        catIndexes: JSON.parse(catIndexes ?? '[]'),
      };
    });

    const [{ votes }] = useState<{ votes: number[] }>(async () => {
      const votes = await Promise.all(options.map(async (_, i) => {
        const count = await redis.zCard(`vote:${context.postId}:${i}`) ?? 0;
        return count;
      }));

      return { votes };
    })

    // console.log(
    //   'Racing data',
    //   startTime,
    //   racing,
    //   options,
    //   catIndexes,
    //   votes,
    // )

    const racingWinnerIndex = Object.entries(racing.map((r) => r.reduce((acc, c) => acc + c, 0))).toSorted((a, b) => b[1] - a[1])[0][0];
  
    const [{ winUsername }] = useState<{ winUsername: string | null }>(async () => {
      const winUserIds = await redis.zRange(`vote:${context.postId}:${racingWinnerIndex}`, 0, 1, { by: 'rank' }); 
      const winUserId = winUserIds[0]?.member;

      if (!winUserId) {
        return { winUsername: null };
      }

      const user = await context.reddit.getUserById(winUserId);

      return { winUsername: user?.username ?? null };
    });

    const vote = async (optionIndex: number) => {
      const userId = context.userId;
      if (!userId) {
        return;
      }

      if (Date.now() > startTime) {
        return { success: false, message: 'Voting is closed' };
      }

      const prevVoted = await redis.get(`uservoted:${context.postId}:${userId}`);
      if (prevVoted) {
        await redis.zRem(`vote:${context.postId}:${prevVoted}`, [userId]);
      }

      await redis.set(`uservoted:${context.postId}:${userId}`, String(optionIndex));
      await redis.zAdd(`vote:${context.postId}:${optionIndex}`, { 
        member: userId,
        score: Math.random(),
      });

      return { success: true };
    }

    const betForm = useForm({
      title: 'Which cat will you bet on?',
      acceptLabel: 'Bet',
      fields: [
        {
          type: 'select',
          name: 'option',
          label: 'Select a cat',
          options: options.map((o, i) => ({ label: o, value: String(i) })),
        },
        {
          type: 'boolean',
          name: 'share',
          label: 'Share your bet',
          defaultValue: false,
        },
      ],
    }, async (values) => {
      if (!values.option) {
        context.ui.showToast({ text: 'Please select a cat' });
        return;
      }

      const option = Number(values.option);
      const optionTitle = options[option];
      const user = await context.reddit.getUserById(context.userId ?? '');
      
      const result = await vote(option);
      if (!result?.success) {
        context.ui.showToast({ text: result?.message ?? 'Failed to vote' });
        return;
      }
      if (values.share) {
        context.reddit.submitComment({
          id: context.postId!,
          text: `Cat Racing:\n@u/${user?.username} bet on ${optionTitle}!`,
        });
      }
      context.ui.showToast({ text: `You bet on ${optionTitle}` });
    })


    // 정해진 시간 이전에는 대기화면, 이후에는 홈화면
    const page = startTime > Date.now() ? 'waiting' : 'home';
    // const page = 'waiting';
    

    return (
      <vstack height="100%" width="100%" alignment="center middle">
        <webview
          id={WEBVIEW_ID}
          url="index.html"
          width={'100%'}
          height={'100%'}
          onMessage={async (event) => {
            console.log('Received message', event);
            const data = event as unknown as WebviewToBlockMessage;

            switch (data.type) {
              case 'INIT':
                sendMessageToWebview(context, {
                  type: 'INIT_RESPONSE',
                  payload: {
                    page: page,
                    postId: context.postId!,
                    racing: racing,
                    startTime: startTime,
                    catIndexes: catIndexes,
                    votes,
                    options,
                    currentWinner: winUsername,
                  },
                });
                break;
              case 'REQUEST_WAITING_DATA':
                sendMessageToWebview(context, {
                  type: 'RESPONSE_WAITING_DATA',
                  payload: {
                    deadline: startTime,
                  },
                });
                break;

              case 'REQUEST_CREATE_BET':                 
                if (Date.now() > startTime) {
                  context.ui.showToast({ text: 'Voting is closed' });
                  return;
                }
                context.ui.showForm(betForm);
                break;
              
              // case 'GET_POKEMON_REQUEST':
              //   context.ui.showToast({ text: `Received message: ${JSON.stringify(data)}` });
              //   const pokemon = await getPokemonByName(data.payload.name);

              //   sendMessageToWebview(context, {
              //     type: 'GET_POKEMON_RESPONSE',
              //     payload: {
              //       name: pokemon.name,
              //       number: pokemon.id,
              //       // Note that we don't allow outside images on Reddit if
              //       // wanted to get the sprite. Please reach out to support
              //       // if you need this for your app!
              //     },
              //   });
              //   break;

              default:
                console.error('Unknown message type', data satisfies never);
                break;
            }
          }}
        />
      
      </vstack>
    );
  },
});

export default Devvit;
