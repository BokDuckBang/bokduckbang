import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { sendToDevvit } from '../utils';

type WaitingPageProps = {
  startTime: Date;
  catIndexes: number[];
  votes: number[];
  options: string[];
};

export function WaitingPage({ startTime, votes, options, catIndexes }: WaitingPageProps) {
  console.log(catIndexes)
  const phaserRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: '100%',
      height: '100%',
      parent: phaserRef.current!,
      backgroundColor: '#2d2d2d',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        mouse: {
          preventDefaultWheel: false,
        },
      },
      scene: {
        preload,
        create,
        update,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [startTime]);

  function preload(this: Phaser.Scene) {
    for (let i = 0; i < 10; i++) {
      this.load.spritesheet(`cat${i + 1}`, `/cat${i + 1}-sprite.png`, {
        frameWidth: 32,
        frameHeight: 32,
      });
    }
    this.load.image('background', '/bg.png');
    this.load.image('track-bg', '/track-bg.png');
    this.load.image('track', '/track.png');
  }

  function create(this: Phaser.Scene) {
    const { width, height } = this.scale;

    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    const backgroundHeight = gameHeight * 0.3;
    const trackBgHeight = gameHeight * 0.1;
    const trackHeight = gameHeight * 0.6;

    // 배경 이미지 생성
    for (let i = 0; i < 2; i++) {
      const bg = this.add.image(i * gameWidth, 0, 'background');
      bg.setOrigin(0, 0);
      bg.setDisplaySize(gameWidth + 1, backgroundHeight);
    }

    // track-bg 이미지 생성
    for (let i = 0; i < 2; i++) {
      const trackBg = this.add.image(i * gameWidth, backgroundHeight, 'track-bg');
      trackBg.setOrigin(0, 0);
      trackBg.setDisplaySize(gameWidth + 4, trackBgHeight);
    }

    // 트랙 이미지 생성
    for (let i = 0; i < 2; i++) {
      const track = this.add.image(i * gameWidth, backgroundHeight + trackBgHeight, 'track');
      track.setOrigin(0, 0);
      track.setDisplaySize(gameWidth + 4, trackHeight);
    }
  
    const overlay = this.add.rectangle(0, 0, width, height, 0x2d2d2d, 0.8);
    overlay.setOrigin(0, 0);

    // Countdown timer
    const countdownText = this.add.text(width / 2, 70, '00:00:00:00', {
      font: '32px Arial',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);
  
    const rows = 5;
    const columns = 2;
    const paddingTop = 120;
    const paddingBottom = 160;
    const availableHeight = height - paddingTop - paddingBottom;
  
    const spriteSize = Math.min(70, availableHeight / (rows + 1));
    const gapY = spriteSize + 20;
    const textOffsetX = spriteSize / 2 + 50;
    const columnGap = 280;
    const startY = paddingTop + spriteSize / 2;
  
    const cats: Phaser.GameObjects.Sprite[] = [];
    const titles: Phaser.GameObjects.Text[] = [];
    const voteTexts: Phaser.GameObjects.Text[] = [];
  
    // Define the animation for cats
    for (let i = 0; i < Math.min(options.length, 10); i++) {
      const animKey = `catAnimation${i + 1}`;
      const catName = `cat${catIndexes[i] + 1}`
    
      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(catName, { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1, // 반복 애니메이션
      });
  
      const row = Math.floor(i / columns); // 순서대로 가로 출력
      const column = i % columns;
  
      const xPosition = width / 2 - columnGap / 2 + column * columnGap;
      const yPosition = startY + row * gapY;
  
      const catSprite = this.add.sprite(xPosition - textOffsetX, yPosition, catName)
        .setDisplaySize(spriteSize, spriteSize)
        .setOrigin(0, 0.5)
        .play(animKey); // 애니메이션 재생
  
      const titleText = this.add.text(xPosition, yPosition - 10, `${options[i]}`, {
        font: `${spriteSize / 2}px Arial`,
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      const voteText = this.add.text(xPosition, yPosition + 10, `Vote: ${votes[i]}`, {
        font: `${spriteSize / 4}px Arial`,
        color: '#ffffff',
      }).setOrigin(0, 0.5);
  
      cats.push(catSprite);
      titles.push(titleText);
      voteTexts.push(voteText);
    }

    // Resize handler
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
  
      overlay.setSize(width, height);
      countdownText.setPosition(width / 2, 70);
  
      const startY = paddingTop + spriteSize / 2;
  
      for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / columns);
        const column = i % columns;
  
        const xPosition = width / 2 - columnGap / 2 + column * columnGap;
        const yPosition = startY + row * gapY;
  
        cats[i].setPosition(xPosition - textOffsetX, yPosition);
        titles[i].setPosition(xPosition, yPosition - 10);
        voteTexts[i].setPosition(xPosition, yPosition + 10);
      }
    });

    // Countdown Timer Logic
    const targetTime = new Date(startTime).getTime();

    this.time.addEvent({
      delay: 500, // 1초마다 갱신
      loop: true,
      callback: () => {
        const now = new Date().getTime();
        const remainingTime = Math.max(targetTime - now, 0);

        const days = String(Math.floor(remainingTime / (1000 * 60 * 60 * 24))).padStart(2, '0');
        const hours = String(Math.floor((remainingTime / (1000 * 60 * 60)) % 24)).padStart(2, '0');
        const minutes = String(Math.floor((remainingTime / (1000 * 60)) % 60)).padStart(2, '0');
        const seconds = String(Math.floor((remainingTime / 1000) % 60)).padStart(2, '0');

        countdownText.setText(`${days}:${hours}:${minutes}:${seconds}`);

        // 타이머 종료 시 동작
        if (remainingTime <= 0) {
          countdownText.setText('00:00:00:00');
          console.log('Countdown Finished!');
          // 여기에 추가 동작을 넣을 수 있습니다.
        }
      },
    });
  }

  function update(this: Phaser.Scene) {
    // Timer logic or animations can be added here
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={phaserRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
      <button
        id='bet-button'
        onClick={() => {
          sendToDevvit({ type: 'REQUEST_CREATE_BET' });
        }}
      >Bet Now!</button>
    </div>
  );
}
