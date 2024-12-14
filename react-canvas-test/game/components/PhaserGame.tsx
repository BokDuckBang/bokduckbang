import { useEffect } from 'react';
import Phaser from 'phaser';

// 각 고양이의 초당 이동 거리 (정규화된 값)
const normalizedDistances = [
  [0.05, 0.08, 0.07, 0.09, 0.11, 0.10, 0.12, 0.13, 0.15, 0.10], // 1등
  [0.12, 0.11, 0.10, 0.09, 0.08, 0.09, 0.10, 0.11, 0.08, 0.07],
  [0.08, 0.10, 0.12, 0.11, 0.09, 0.08, 0.09, 0.08, 0.08, 0.07],
  [0.10, 0.09, 0.08, 0.07, 0.11, 0.10, 0.08, 0.09, 0.07, 0.06],
  [0.07, 0.08, 0.09, 0.10, 0.08, 0.09, 0.08, 0.08, 0.08, 0.07],
  [0.09, 0.08, 0.07, 0.08, 0.09, 0.08, 0.08, 0.08, 0.08, 0.07],
  [0.08, 0.09, 0.08, 0.07, 0.08, 0.08, 0.08, 0.08, 0.07, 0.07],
  [0.08, 0.07, 0.08, 0.08, 0.07, 0.08, 0.08, 0.07, 0.07, 0.07],
  [0.07, 0.08, 0.07, 0.07, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07],
  [0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07]
];

const NUMBER_OF_CATS = 2; // 1~10 사이의 값으로 설정 가능

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
    let startImage: Phaser.GameObjects.Image;

    function preload(this: Phaser.Scene) {
      // 10개의 고양이 스프라이트 로드
      for (let i = 1; i <= 10; i++) {
        this.load.spritesheet(`cat${i}`, `/cat${i}-sprite.png`, { 
          frameWidth: 32,
          frameHeight: 32
        });
      }
      this.load.image('background', '/bg.png');
      this.load.image('track-bg', '/track-bg.png');
      this.load.image('track', '/track.png');
      this.load.image('start', '/start.png');
      this.load.image('finish', '/finish.png');
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

      // 단일 start 이미지 생성
      startImage = this.add.image(
        0, 
        backgroundHeight + trackBgHeight,
        'start'
      );
      startImage.setOrigin(0, 0);
      startImage.setDisplaySize(startImage.width, trackHeight);

      // 10개의 고양이 애니메이션 생성
      for (let i = 1; i <= 10; i++) {
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

      const trackArea = gameHeight * 0.6;  // 트랙의 전체 높이 (화면의 60%)
      const catHeight = trackArea / 10;    // 각 고양이가 차지하는 높이
      
      // 전체 고양이들이 차지하는 총 높이
      const totalCatsHeight = NUMBER_OF_CATS * catHeight;
      
      // 남은 공간을 고양이들 사이의 간격으로 균등 분배
      const totalSpacing = trackArea - totalCatsHeight;
      const spacing = totalSpacing / (NUMBER_OF_CATS + 1);  // 위아래 여백까지 고려하여 간격 계산
      
      const startY = backgroundHeight + trackBgHeight;

      // 게임 시작 시간을 3초 뒤로 설정
      const gameStartTime = this.time.now + 3000;

      // NUMBER_OF_CATS 만큼의 고양이 생성
      for (let i = 0; i < NUMBER_OF_CATS; i++) {
        const spriteKey = `cat${i + 1}`;
        const animKey = `walk${i + 1}`;
        
        // 각 고양이의 y 위치 계산
        // spacing으로 간격을 주고, catHeight/2를 더해 고양이를 간격 중앙에 위치시킴
        const catY = startY + spacing * (i + 1) + (catHeight * i) + (catHeight/2);
        
        const cat = this.add.sprite(0, catY, spriteKey);
        cat.setScale(1.3);
        cat.play(animKey);
        
        cat.setData('raceStartTime', gameStartTime);
        cat.setData('finished', false);
        
        cats.push(cat);
      }

      // start 이미지에도 시작 시간 설정
      startImage.setData('startTime', gameStartTime);

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

        // start 이미지 크기 조정
        if (startImage) {
          startImage.setDisplaySize(startImage.width, newTrackHeight + 2);
          startImage.y = newBackgroundHeight + newTrackBgHeight - 1;
        }

        const newTrackArea = gameHeight * 0.6;
        const newCatHeight = newTrackArea / 10;
        const newTotalCatsHeight = NUMBER_OF_CATS * newCatHeight;
        const newTotalSpacing = newTrackArea - newTotalCatsHeight;
        const newSpacing = newTotalSpacing / (NUMBER_OF_CATS + 1);
        const newStartY = newBackgroundHeight + newTrackBgHeight;

        cats.forEach((cat, index) => {
          cat.y = newStartY + newSpacing * (index + 1) + (newCatHeight * index) + (newCatHeight/2);
        });
      });
    }

    function update(this: Phaser.Scene) {
        const currentTime = this.time.now;
        const gameStarted = currentTime >= cats[0].getData('raceStartTime');
      
        // 1등 고양이의 진행 상태 확인
        const firstCat = cats[0];
        const firstCatStartTime = firstCat.getData('raceStartTime');
        const firstCatElapsedSeconds = (currentTime - firstCatStartTime) / 1000;
        
        // 감속 시작 시점 (1등 도착 2초 전 = 8초)과 정지 시점 (10초) 설정
        const slowdownStart = 8;
        const stopTime = 10;
        
        // 감속 계수 계산 (1 -> 0)
        let speedFactor = 1;
        if (gameStarted && firstCatElapsedSeconds > slowdownStart) {
          speedFactor = Math.max(0, 1 - (firstCatElapsedSeconds - slowdownStart) / (stopTime - slowdownStart));
        }
      
        // 게임 시작 후에만 모든 배경 요소들이 움직임
        if (gameStarted) {
          // 배경 이미지 업데이트
          backgrounds.forEach(bg => {
            bg.x -= 1 * speedFactor;
            if (bg.x <= -gameWidth) {
              const otherBg = backgrounds.find(b => b !== bg);
              if (otherBg) {
                bg.x = otherBg.x + gameWidth - 1;
              }
            }
          });
      
          // track-bg 이미지 업데이트
          trackBgs.forEach(trackBg => {
            trackBg.x -= 2 * speedFactor;
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
      
          // start 이미지 업데이트
          if (startImage) {
            startImage.x -= 0.4;
          }
      
          cats.forEach((cat, index) => {
            if (!cat.getData('finished')) {
              const startTime = cat.getData('raceStartTime');
              const elapsedSeconds = (currentTime - startTime) / 1000;
              
              if (elapsedSeconds <= 10) {
                const second = Math.floor(elapsedSeconds);
                const fraction = elapsedSeconds - second;
                
                if (second < 10) {
                  let totalDistance = 0;
                  for (let i = 0; i < second; i++) {
                    totalDistance += normalizedDistances[index][i];
                  }
                  totalDistance += normalizedDistances[index][second] * fraction;
                  
                  cat.x = totalDistance * gameWidth;
                }
              } else if (elapsedSeconds <= 11) {
                const exitProgress = elapsedSeconds - 10;
                cat.x += (gameWidth * 0.5) * exitProgress;
              }
            }
          });
        }
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
