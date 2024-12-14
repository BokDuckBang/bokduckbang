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

      const trackArea = gameHeight * 0.6; // 트랙 영역 (전체 높이의 60%)
      const catSpacing = trackArea / 10; // 각 고양이당 공간
      const startY = backgroundHeight + trackBgHeight; // 고양이 시작 Y 위치

      // 고양이별 도착 시간 설정 (초 단위)
      const arrivalTimes = [
        10,  // 1등: 10초
        13,  // 2등: 13초
        15,  // 3등: 15초
        17,  // 4등: 17초
        17,  // 5등: 17초
        18,  // 6등: 18초
        18,  // 7등: 18초
        19,  // 8등: 19초
        19,  // 9등: 19초
        20   // 10등: 20초
      ];

      // 10마리의 고양이 생성
      for (let i = 0; i < 10; i++) {
        let spriteKey = 'cat1';
        let animKey = 'walk1';
        
        if (i < 7) {
          spriteKey = `cat${i + 1}`;
          animKey = `walk${i + 1}`;
        }
        
        const cat = this.add.sprite(0, startY + (catSpacing * i) + (catSpacing / 2), spriteKey);
        cat.setScale(1.3);
        cat.play(animKey);
        
        const baseSpeed = gameWidth / (arrivalTimes[i] * 60);
        
        cat.setData('baseSpeed', baseSpeed);
        cat.setData('phase', Math.random() * Math.PI * 2);
        cat.setData('finished', false);
        
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

      cats.forEach((cat, index) => {
        if (!cat.getData('finished')) {
          const baseSpeed = cat.getData('baseSpeed');
          const phase = cat.getData('phase');
          const time = this.time.now * 0.001; // 현재 시간을 초 단위로 변환
          
          let speedVariation;
          const progress = cat.x / gameWidth; // 진행률 (0~1)
          
          if (index === 0) { // 1등 고양이는 특별한 패턴
            // 초반에는 느리게, 후반에 급격히 가속
            const speedCurve = Math.pow(progress, 0.3); // 진행률에 따른 속도 커브
            const lateSpurt = Math.max(0, (progress - 0.7) * 3); // 후반 스퍼트
            
            // 기본적인 사인 변동 + 후반 가속
            speedVariation = (Math.sin(time * 3 + phase) * 0.5 - 0.3) * (1 - lateSpurt) +
                            lateSpurt * 0.8; // 마지막 스퍼트는 80% 빠르게
          } else {
            // 다른 고양이들은 더 큰 변동폭을 가짐
            const variationScale = 0.6; // 60%까지 변동
            speedVariation = Math.sin(time * 2 + phase) * variationScale;
            
            // 진행률에 따라 변동폭 조절 (후반에는 변동 감소)
            speedVariation *= (1 - Math.pow(progress, 2));
          }
          
          const currentSpeed = baseSpeed * (1 + speedVariation);
          cat.x += currentSpeed;

          if (cat.x >= gameWidth) {
            cat.x = gameWidth - (cat.width * cat.scale);
            cat.setData('finished', true);
          }
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
