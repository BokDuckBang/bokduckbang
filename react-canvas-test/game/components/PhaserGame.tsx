import { useEffect } from 'react';
import Phaser from 'phaser';

export const PhaserGame = () => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-game',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    const game = new Phaser.Game(config);

    let cats: Phaser.GameObjects.Sprite[] = [];
    let backgrounds: Phaser.GameObjects.Image[] = [];
    let trackBgs: Phaser.GameObjects.Image[] = [];
    let tracks: Phaser.GameObjects.Image[] = [];
    let gameWidth: number;
    let gameHeight: number;

    function preload(this: Phaser.Scene) {
      for (let i = 1; i <= 7; i++) {
        this.load.spritesheet(`cat${i}`, `/cat${i}-sprite.png`, { 
          frameWidth: 32,
          frameHeight: 32
        });
      }
      this.load.image('background', '/bg.png');
      this.load.image('track-bg', '/track-bg.png');
      this.load.image('track', '/track.png');
    }

    function create(this: Phaser.Scene) {
      gameWidth = this.scale.width;
      gameHeight = this.scale.height;
      const backgroundHeight = gameHeight * 0.3;
      const trackBgHeight = gameHeight * 0.1;
      const trackHeight = gameHeight * 0.6;

      // 배경 이미지 생성
      for (let i = 0; i < 2; i++) {
        const bg = this.add.image(i * gameWidth, 0, 'background');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(gameWidth + 1, backgroundHeight);
        backgrounds.push(bg);
      }

      // track-bg 이미지 생성
      for (let i = 0; i < 2; i++) {
        const trackBg = this.add.image(i * gameWidth, backgroundHeight, 'track-bg');
        trackBg.setOrigin(0, 0);
        trackBg.setDisplaySize(gameWidth + 4, trackBgHeight);
        trackBgs.push(trackBg);
      }

      // 트랙 이미지 생성
      for (let i = 0; i < 2; i++) {
        const track = this.add.image(i * gameWidth, backgroundHeight + trackBgHeight, 'track');
        track.setOrigin(0, 0);
        track.setDisplaySize(gameWidth + 4, trackHeight);
        tracks.push(track);
      }

      // 7개의 고양이 애니메이션 생성
      for (let i = 1; i <= 7; i++) {
        this.anims.create({
          key: `walk${i}`,
          frames: this.anims.generateFrameNumbers(`cat${i}`, { 
            start: 0,
            end: 3
          }),
          frameRate: 8,
          repeat: -1
        });
      }

      const remainingHeight = gameHeight - backgroundHeight - trackBgHeight;
      const trackArea = gameHeight * 0.6; // 트랙 영역 (전체 높이의 60%)
      const catSpacing = trackArea / 10; // 각 고양이당 공간 (트랙 영역의 1/10)
      const startY = backgroundHeight + trackBgHeight; // 고양이 시작 Y 위치

      // 10마리의 고양이 생성
      for (let i = 0; i < 10; i++) {
        let spriteKey = 'cat1';
        let animKey = 'walk1';
        
        if (i < 7) {
          // 1~7번 고양이는 각각의 스프라이트 사용
          spriteKey = `cat${i + 1}`;
          animKey = `walk${i + 1}`;
        }
        // 8~10번 고양이는 cat1 사용 (기본값 유지)
        
        const cat = this.add.sprite(0, startY + (catSpacing * i) + (catSpacing / 2), spriteKey);
        cat.setScale(1.3);
        cat.play(animKey);
        cats.push(cat);
      }

      this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        gameWidth = gameSize.width;
        gameHeight = gameSize.height;
        const newBackgroundHeight = gameHeight * 0.3;
        const newTrackBgHeight = gameHeight * 0.1;
        const newTrackHeight = gameHeight * 0.6;
        
        backgrounds.forEach((bg, index) => {
          bg.setDisplaySize(gameWidth + 1, newBackgroundHeight);
          bg.x = index * gameWidth;
        });

        trackBgs.forEach((trackBg, index) => {
          trackBg.setDisplaySize(gameWidth + 4, newTrackBgHeight);
          trackBg.x = index * gameWidth;
          trackBg.y = newBackgroundHeight;
        });

        tracks.forEach((track, index) => {
          track.setDisplaySize(gameWidth + 4, newTrackHeight);
          track.x = index * gameWidth;
          track.y = newBackgroundHeight + newTrackBgHeight;
        });

        const newTrackArea = gameHeight * 0.6;
        const newCatSpacing = newTrackArea / 10;
        const newStartY = newBackgroundHeight + newTrackBgHeight;

        cats.forEach((cat, index) => {
          cat.y = newStartY + (newCatSpacing * index) + (newCatSpacing / 2);
        });
      });
    }

    function update(this: Phaser.Scene) {
      backgrounds.forEach(bg => {
        bg.x -= 1;

        if (bg.x <= -gameWidth) {
          const otherBg = backgrounds.find(b => b !== bg);
          if (otherBg) {
            bg.x = otherBg.x + gameWidth - 1;
          }
        }
      });

      trackBgs.forEach(trackBg => {
        trackBg.x -= 2;

        if (trackBg.x <= -gameWidth) {
          const otherTrackBg = trackBgs.find(t => t !== trackBg);
          if (otherTrackBg) {
            trackBg.x = otherTrackBg.x + gameWidth - 4;
          }
        }
      });

      tracks.forEach(track => {
        track.x -= 2;

        if (track.x <= -gameWidth) {
          const otherTrack = tracks.find(t => t !== track);
          if (otherTrack) {
            track.x = otherTrack.x + gameWidth - 4;
          }
        }
      });

      cats.forEach(cat => {
        if (cat.x < gameWidth) {
          cat.x += 2;
        } else {
          cat.x = 0;
        }
      });
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div 
      id="phaser-game" 
      style={{ 
        width: '100vw', 
        height: '100vh'
      }} 
    />
  );
}; 
