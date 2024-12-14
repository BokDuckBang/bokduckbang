import { Devvit, useState } from '@devvit/public-api';
import { sendMessageToWebview } from './utils/utils.js';
import { WebviewToBlockMessage } from '../game/shared.js';
import { WEBVIEW_ID } from './constants.js';
import { Preview } from './components/Preview.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

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

const myForm = Devvit.createForm(
  {
    fields: [
      {
        type: 'string',
        name: 'title',
        label: 'Title',
      },
      {
        type: 'number',
        name: 'minutes',
        label: 'start after (minutes)',
      },
      {
        type: 'string',
        name: 'options',
        label: 'Options (comma separated)',
      },
    ],
  },
  async (event, context) => {
    const { reddit, redis, ui } = context;
    const min = event.values.minutes ?? 10;
    const title = event.values.title ?? 'Cat Racing Game';
    const until = new Date(Date.now() + min * 60 * 1000);
    const options = event.values.options ?? '';
    const size = options.split(',').length ?? 0;
    ui.showToast({ text: 'Creating a cat racing game...' });

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: title,
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });



    redis.set(`deadline:${post.id}`, String(until.getTime()));
    redis.set(`options:${post.id}`, options);
    redis.set(`racing:${post.id}`, JSON.stringify(getRacingData(size)));
    ui.navigateTo(post);
  }
);


Devvit.addMenuItem({
  // Please update as you work on your idea!
  label: 'Make cat racing game',
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
  height: 'tall',
  render: (context) => {
    const [{ until }] = useState<{ until: number }>(async () => {
      const stored = await context.redis.get(`deadline:${context.postId}`);
      return {
        until: Number(stored),
      };
    });
    const [{ racing }] = useState<{ racing: number[][] }>(async () => {
      const stored = await context.redis.get(`racing:${context.postId}`);
      return {
        racing: JSON.parse(stored ?? '[]'),
      };
    });

    // const page = until > Date.now() ? 'waiting' : 'home';
    // const page = 'waiting';
    const page = 'home';

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
                  },
                });
                break;
              case 'REQUEST_WAITING_DATA':
                sendMessageToWebview(context, {
                  type: 'RESPONSE_WAITING_DATA',
                  payload: {
                    deadline: until,
                  },
                });
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
