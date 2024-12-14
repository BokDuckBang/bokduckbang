import { Devvit, useState } from '@devvit/public-api';
import { sendMessageToWebview } from './utils/utils.js';
import { WebviewToBlockMessage } from '../game/shared.js';
import { WEBVIEW_ID } from './constants.js';
import { Preview } from './components/Preview.js';

Devvit.configure({
  redditAPI: true,
  redis: true,
});


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

    // const page = until > Date.now() ? 'waiting' : 'home';
    const page = 'waiting';

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
