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
      gameWidth = this.scale.width;
      gameHeight = this.scale.height;
      const backgroundHeight = gameHeight * 0.3;

      // 배경 이미지 두 개 생성
      for (let i = 0; i < 2; i++) {
        const bg = this.add.image(i * gameWidth, 0, 'background');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(gameWidth + 1, backgroundHeight);
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

      const remainingHeight = gameHeight - backgroundHeight;
      const catSpacing = remainingHeight / 6;
      for (let i = 0; i < 5; i++) {
        const cat = this.add.sprite(0, backgroundHeight + catSpacing + (i * catSpacing), 'cat');
        cat.setScale(2);
        cat.play('walk');
        cats.push(cat);
      }

      this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        gameWidth = gameSize.width;
        gameHeight = gameSize.height;
        const newBackgroundHeight = gameHeight * 0.3;
        
        backgrounds.forEach((bg, index) => {
          bg.setDisplaySize(gameWidth + 1, newBackgroundHeight);
          bg.x = index * gameWidth;
        });

        const newRemainingHeight = gameHeight - newBackgroundHeight;
        const newCatSpacing = newRemainingHeight / 6;
        cats.forEach((cat, index) => {
          cat.y = newBackgroundHeight + newCatSpacing + (index * newCatSpacing);
        });
      });
    }

    function update(this: Phaser.Scene) {
      // 배경 스크롤링
      backgrounds.forEach(bg => {
        bg.x -= 1;

        // 배경이 완전히 왼쪽으로 벗어나기 전에 재배치
        if (bg.x <= -gameWidth) {
          const otherBg = backgrounds.find(b => b !== bg);
          if (otherBg) {
            bg.x = otherBg.x + gameWidth - 1;
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
