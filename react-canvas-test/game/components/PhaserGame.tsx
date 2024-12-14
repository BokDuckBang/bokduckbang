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
    let gameWidth: number;
    let gameHeight: number;

    function preload(this: Phaser.Scene) {
      this.load.spritesheet('cat', '/cat1-sprite.png', { 
        frameWidth: 32,
        frameHeight: 32
      });
      this.load.image('background', '/space3.png');
    }

    function create(this: Phaser.Scene) {
      // 현재 게임 캔버스의 크기 가져오기
      gameWidth = this.scale.width;
      gameHeight = this.scale.height;

      // 배경 이미지 두 개 생성
      for (let i = 0; i < 2; i++) {
        const bg = this.add.image(i * gameWidth, 0, 'background');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(gameWidth, gameHeight);
        backgrounds.push(bg);
      }

      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('cat', { 
          start: 0,
          end: 3
        }),
        frameRate: 8,
        repeat: -1
      });

      // 화면 높이에 맞춰 고양이들 배치
      const catSpacing = gameHeight / 6; // 6등분하여 5마리 배치
      for (let i = 0; i < 5; i++) {
        const cat = this.add.sprite(0, catSpacing + (i * catSpacing), 'cat');
        cat.setScale(1.3);
        cat.play('walk');
        cats.push(cat);
      }

      // 화면 크기 변경 이벤트 리스너
      this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        gameWidth = gameSize.width;
        gameHeight = gameSize.height;
        
        // 배경 크기 업데이트
        backgrounds.forEach((bg, index) => {
          bg.setDisplaySize(gameWidth, gameHeight);
          if (index === 1) bg.x = gameWidth;
        });

        // 고양이 위치 업데이트
        const newCatSpacing = gameHeight / 6;
        cats.forEach((cat, index) => {
          cat.y = newCatSpacing + (index * newCatSpacing);
        });
      });
    }

    function update(this: Phaser.Scene) {
      // 배경 스크롤링
      backgrounds.forEach(bg => {
        bg.x -= 1;

        if (bg.x <= -gameWidth) {
          bg.x = gameWidth;
        }
      });

      // 고양이 이동
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

  // 컨테이너 스타일 추가
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
