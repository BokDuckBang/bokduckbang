import { useEffect } from 'react';
import Phaser from 'phaser';

export const PhaserGame = () => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'phaser-game',
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

    function preload(this: Phaser.Scene) {
      this.load.spritesheet('cat', '/cat1-sprite.png', { 
        frameWidth: 32,
        frameHeight: 32
      });
    }

    function create(this: Phaser.Scene) {
      this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('cat', { 
          start: 0,
          end: 3
        }),
        frameRate: 8,
        repeat: -1
      });

      for (let i = 0; i < 5; i++) {
        const cat = this.add.sprite(0, 100 + (i * 100), 'cat');
        cat.setScale(1);
        cat.play('walk');
        cats.push(cat);
      }
    }

    function update(this: Phaser.Scene) {
      cats.forEach(cat => {
        if (cat.x < 800) {
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

  return <div id="phaser-game" />;
}; 
