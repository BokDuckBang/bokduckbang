import { useEffect } from 'react';
import Phaser from 'phaser';

// const NUMBER_OF_CATS = 10; // 1~10 사이의 값으로 설정 가능

// const CAT_TEXTS = [
//   "Classic Margherita",
//   "Pepperoni overload",
//   "Hawaiian",
//   "Meat lovers",
//   "Veggie supreme",
//   "Four cheese",
//   "BBQ chicken",
//   "Potato",
//   "Seafood",
//   "Korean Bulgogi"
// ];

export const PhaserGame = ({ 
  racing,
  options,
  catIndexes,
  votes,
  currentWinner,
}: { 
  racing: number[][],
  options: string[],
  catIndexes: number[],
  votes: number[],
  currentWinner: string | null,
}) => {
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
      input: {
        mouse: {
          preventDefaultWheel: false,
        },
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
    let catTexts: Phaser.GameObjects.Text[] = [];
    let rankingPopup: Phaser.GameObjects.Container;
    let allCatsExited = false;
    let countdownText: Phaser.GameObjects.Text;

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
      for (let i = 0; i < Math.min(options.length, 10); i++) {
        const spriteKey = `cat${catIndexes[i] + 1}`;
        this.anims.create({
          key: `walk${i + 1}`,
          frames: this.anims.generateFrameNumbers(spriteKey, { 
            start: 0,
            end: 3
          }),
          frameRate: 8,
          repeat: -1
        });
      }

      const trackArea = gameHeight * 0.6;  // 트랙의 전체 높이 (화면의 60%)
      const catHeight = trackArea / 10;    // 각 고양이가 차지하는 높이
      const startY = backgroundHeight + trackBgHeight;

      // 중앙 트랙 위치 계산 (5번째 트랙부터 시작)
      const centerTrackIndex = 5 - Math.floor(options.length / 2);

      // 게임 시작 시간을 3초 뒤로 설정
      const gameStartTime = this.time.now + 3000;

      // Options 수 만큼의 고양이 생성
      for (let i = 0; i < options.length; i++) {
        const spriteKey = `cat${catIndexes[i] + 1}`;
        const animKey = `walk${i + 1}`;
        
        // 각 고양이의 y 위치 계산 (중앙 트랙부터 순서대로)
        const trackIndex = centerTrackIndex + i;
        const catY = startY + (trackIndex * catHeight) + (catHeight/2) - (catHeight * 0.2);
        
        const cat = this.add.sprite(0, catY, spriteKey);
        cat.setScale(1.3);
        cat.play(animKey);
        
        cat.setData('raceStartTime', gameStartTime);
        cat.setData('finished', false);
        
        cats.push(cat);

        // 텍스트는 기존 위치 그대로 유지
        const text = this.add.text(20, startY + (trackIndex * catHeight) + (catHeight/4), options[i], {
            fontSize: `${catHeight * 0.5}px`,
            color: '#ffffff',
            align: 'left', 
            wordWrap: { width: gameWidth * 0.3 }
        });
        text.setOrigin(0, 0);
        text.setVisible(false); // 초기에는 숨김 상태로 설정
        catTexts.push(text);
      }

      // start 이미지에도 시작 시간 설정
      startImage.setData('startTime', gameStartTime);

      // 카운트다운 텍스트 생성
      countdownText = this.add.text(
        gameWidth / 2,
        gameHeight / 2,
        '3',
        {
          fontSize: '120px',
          color: '#ffffff',
          fontWeight: 'bold',
          stroke: '#000000',
          strokeThickness: 8,
          shadow: { blur: 10, color: '#000000', fill: true }
        }
      );
      countdownText.setOrigin(0.5);
      countdownText.setDepth(1000); // 다른 요소들 위에 표시되도록

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
        const newStartY = newBackgroundHeight + newTrackBgHeight;
        const newCenterTrackIndex = 5 - Math.floor(options.length / 2);

        cats.forEach((cat, index) => {
          const trackIndex = newCenterTrackIndex + index;
          const newY = newStartY + (trackIndex * newCatHeight) + (newCatHeight/2) - (newCatHeight * 0.2);
          cat.y = newY;
          
          // 텍스트 위치는 기존대로 유지
          if (catTexts[index]) {
            const fixedGapToCat = 50; // 텍스트 끝과 고양이 사이의 고정 여백
            const textWidth = catTexts[index].width; // 텍스트의 실제 너비
            const desiredTextX = cat.x - (textWidth + fixedGapToCat); // 고양이 위치에서 (텍스트 너비 + 여백)만큼 뺀 위치
            catTexts[index].x = desiredTextX;
          }
        });

        // 카운트다운 텍스트 위치 조정
        if (countdownText) {
          countdownText.setPosition(gameWidth / 2, gameHeight / 2);
        }
      });
    }

    function update(this: Phaser.Scene) {
        const currentTime = this.time.now;
        const gameStartTime = cats[0].getData('raceStartTime');
        const timeUntilStart = gameStartTime - currentTime;
        
        // 카운트다운 업데이트
        if (timeUntilStart > -500) {  // -500ms까지 텍스트를 보여줌
            const secondsLeft = Math.ceil(timeUntilStart / 1000);
            countdownText.setVisible(true);
            
            if (secondsLeft <= 0) {
                countdownText.setText('Start!');
                countdownText.setFontSize('80px');
            } else if (secondsLeft <= 3) {
                countdownText.setText(secondsLeft.toString());
                countdownText.setFontSize('120px');
            } else {
                countdownText.setVisible(false);
            }
        } else {
            countdownText.setVisible(false);
        }

        const gameStarted = currentTime >= gameStartTime;
      
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
          // 게임이 시작되면 모든 텍스트를 보이게 함
          catTexts.forEach(text => {
            if (!text.visible) {
              text.setVisible(true);
            }
          });
          
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
                            totalDistance += racing[index][i];
                        }
                        totalDistance += racing[index][second] * fraction;
                        
                        cat.x = Math.min(totalDistance * gameWidth, gameWidth * 0.98);
                    }
                } else if (elapsedSeconds <= 12) {
                    // 1초 대기 후 이동 시작
                    if (elapsedSeconds > 11) {
                        const exitProgress = (elapsedSeconds - 11) * 0.3;
                        const newX = cat.x + (gameWidth * 0.5) * exitProgress;
                        cat.x = Math.min(newX, gameWidth * 1.2);
                        
                        // 고양이가 화면을 완전히 벗어났을 때 finished 상태로 변경
                        if (cat.x >= gameWidth * 1.2) {
                            cat.setData('finished', true);
                        }
                    }
                }
        
                // 텍스트는 고양이의 x 좌표를 따라가되, 항상 고양이의 왼쪽에 위치
                if (catTexts[index]) {
                    const fixedGapToCat = 50; // 텍스트 끝과 고양이 사이의 고정 여백
                    const textWidth = catTexts[index].width; // 텍스트의 실제 너비
                    const desiredTextX = cat.x - (textWidth + fixedGapToCat); // 고양이 위치에서 (텍스트 너비 + 여백)만큼 뺀 위치
                    catTexts[index].x = desiredTextX;
                }
            }
        });
        }

        // 모든 고양이가 finished 상태인지 확인하고 순위표 표시
        if (!allCatsExited && cats.every(cat => cat.getData('finished'))) {
            allCatsExited = true;
            showRankingPopup(this);
        }
    }

    function showRankingPopup(scene: Phaser.Scene) {
        // 반투명한 검정색 배경
        const dimBg = scene.add.rectangle(
            0, 
            0, 
            gameWidth, 
            gameHeight, 
            0x000000, 
            0.7
        );
        dimBg.setOrigin(0);

        // 순위 결정 (racing 합산이 큰 순위)
        const rankingIndexes = Object.entries(racing.map(data => data.reduce((acc, cur) => acc + cur, 0))).sort((a, b) => b[1] - a[1]).map(([index]) => Number(index));
        console.log('ranking', rankingIndexes)

        // const sortedCats = [...cats].sort((a, b) => b.x - a.x);

        // 팝업 크기 계산 (동적)
        const popupWidth = gameWidth * 0.8;
        const itemHeight = 40; // 각 순위 항목의 높이
        
        // 고양이 수에 따라 titleHeight와 padding 조정
        const titleHeight = rankingIndexes.length > 8 ? 50 : 80; // 8등 초과시 titleHeight 축소
        const padding = rankingIndexes.length > 8 ? 20 : 40; // 8등 초과시 padding 축소
        
        const totalContentHeight = (rankingIndexes.length * itemHeight) + titleHeight;
        const popupHeight = totalContentHeight + (padding * 2);

        // 흰색 팝업 배경
        const popup = scene.add.rectangle(
            gameWidth/2,
            gameHeight/2,
            popupWidth,
            popupHeight,
            0xeaeaea,
            0.8
        );

        // 컨테이너 생성
        rankingPopup = scene.add.container(0, 0);
        rankingPopup.add(dimBg);
        rankingPopup.add(popup);

        // 제목 텍스트
        const titleText = scene.add.text(
            gameWidth/2,
            gameHeight/2 - popupHeight/2 + padding,
            '🏆 Final Ranking 🏆',
            {
                fontSize: '24px',
                color: '#000000',
                fontWeight: 'bold'
            }
        );
        titleText.setOrigin(0.5);
        rankingPopup.add(titleText);

        // 1등 닉네임 (제목과 순위 목록 이)
        const nicknameText = scene.add.text(
            gameWidth/2,
            gameHeight/2 - popupHeight/2 + padding + titleHeight/2,
            currentWinner ?? 'No user win.',
            {
                fontSize: '18px',
                color: '#000000',
                fontStyle: 'italic'
            }
        );
        nicknameText.setOrigin(0.5);
        rankingPopup.add(nicknameText);

        // 각 순위별 고양이와 텍스트 표시
        rankingIndexes.forEach((catIndex, index) => {
            const yPos = gameHeight/2 - popupHeight/2 + titleHeight + (index * itemHeight) + padding;
            const centerX = gameWidth/2;  // 팝업의 중앙 X 좌표

            // 순위 텍스트 (왼쪽)
            const rankText = scene.add.text(
                centerX - 120,  // 중앙에서 왼쪽으로 120px
                yPos,
                `${index + 1}`,
                {
                    fontSize: '18px',
                    color: '#000000'
                }
            );
            rankText.setOrigin(0.5);

            // 고양이 스프라이트 (중앙 왼쪽)
            const rankCat = scene.add.sprite(
                centerX - 60,   // 중앙에서 왼쪽으로 60px
                yPos,
                `cat${catIndex + 1}`
            );
            rankCat.setScale(1.2);
            rankCat.play(`walk${catIndex + 1}`);

            // 고양이 이름 텍스트 (중앙 오른쪽)
            const nameText = scene.add.text(
                centerX + 20,   // 중앙에서 오른쪽으로 20px
                yPos,
                options[catIndex],
                {
                    fontSize: '18px',
                    color: '#000000',
                    wordWrap: { width: popupWidth * 0.4 }
                }
            );
            nameText.setOrigin(0, 0.5);

            rankingPopup.add(rankText);
            rankingPopup.add(rankCat);
            rankingPopup.add(nameText);
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
