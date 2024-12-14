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
    let tracks: Phaser.GameObjects.Image[] = [];
    let gameWidth: number;
    let gameHeight: number;

    function preload(this: Phaser.Scene) {
      this.load.spritesheet('cat1', '/cat1-sprite.png', { 
        frameWidth: 32,
        frameHeight: 32
      });
      this.load.spritesheet('cat2', '/cat2-sprite.png', { 
        frameWidth: 32,
        frameHeight: 32
      });
      this.load.spritesheet('cat3', '/cat3-sprite.png', { 
        frameWidth: 32,
        frameHeight: 32
      });
      this.load.image('background', '/bg.png');
      this.load.image('track', '/track.png');
    }

    function create(this: Phaser.Scene) {
      gameWidth = this.scale.width;
      gameHeight = this.scale.height;
      const backgroundHeight = gameHeight * 0.3;
      const trackHeight = gameHeight * 0.7;

      for (let i = 0; i < 2; i++) {
        const bg = this.add.image(i * gameWidth, 0, 'background');
        bg.setOrigin(0, 0);
        bg.setDisplaySize(gameWidth + 1, backgroundHeight);
        backgrounds.push(bg);
      }

      for (let i = 0; i < 2; i++) {
        const track = this.add.image(i * gameWidth, backgroundHeight, 'track');
        track.setOrigin(0, 0);
        track.setDisplaySize(gameWidth + 4, trackHeight);
        tracks.push(track);
      }

      this.anims.create({
        key: 'walk1',
        frames: this.anims.generateFrameNumbers('cat1', { 
          start: 0,
          end: 3
        }),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: 'walk2',
        frames: this.anims.generateFrameNumbers('cat2', { 
          start: 0,
          end: 3
        }),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: 'walk3',
        frames: this.anims.generateFrameNumbers('cat3', { 
          start: 0,
          end: 3
        }),
        frameRate: 8,
        repeat: -1
      });

      const remainingHeight = gameHeight - backgroundHeight;
      const catSpacing = remainingHeight / 6;
      
      for (let i = 0; i < 5; i++) {
        const spriteKey = i === 1 ? 'cat2' : 'cat1';
        const animKey = i === 1 ? 'walk2' : 'walk1';
        
        const cat = this.add.sprite(0, backgroundHeight + catSpacing + (i * catSpacing), spriteKey);
        cat.setScale(1.3);
        cat.play(animKey);
        cats.push(cat);
      }

      this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
        gameWidth = gameSize.width;
        gameHeight = gameSize.height;
        const newBackgroundHeight = gameHeight * 0.3;
        const newTrackHeight = gameHeight * 0.7;
        
        backgrounds.forEach((bg, index) => {
          bg.setDisplaySize(gameWidth + 1, newBackgroundHeight);
          bg.x = index * gameWidth;
        });

        tracks.forEach((track, index) => {
          track.setDisplaySize(gameWidth + 4, newTrackHeight);
          track.x = index * gameWidth;
          track.y = newBackgroundHeight;
        });

        const newRemainingHeight = gameHeight - newBackgroundHeight;
        const newCatSpacing = newRemainingHeight / 6;
        cats.forEach((cat, index) => {
          cat.y = newBackgroundHeight + newCatSpacing + (index * newCatSpacing);
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
