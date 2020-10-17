(function() {
  // USAGE:
  // 1. include this pen in your pen's javascript assets
  // 2. create a new instance with `var preview = new PreviewImage("path/to/your/image.jpg");
  // 3. kill it when you want it to go away `p.clear();`
  // var p = new PreviewImage("https://s3-us-west-2.amazonaws.com/s.cdpn.io/150586/angry-bossman-v2.png");
  //p.clear();
  var Bullet, Enemy, Player, PreviewImage, bulletEnemyHandler, bullet_time, bullets, bullets_count, checkInput, controls, create, currentHorizontalDirection, currentVerticalDirection, drawShape, enemies, enemies_bullets, enemies_count, game, gameOver, killEnemy, max_delay, min_delay, motion, motionUpdate, motion_timer, moveBullets, moveEnemies, movePlayer, nextLevel, player, playerEnemyHandler, preload, preview, render, resetGame, score, score_text, slowDownTime, spawnText, speed, speedUpTime, text, time, update, updateMotion, updateScore;

  PreviewImage = function(url) {
    var pi;
    pi = {
      setup: function() {
        pi.el = document.createElement('div');
        pi.el.style.background = 'url(' + url + ') no-repeat center center';
        pi.el.style.backgroundSize = 'cover';
        pi.el.style.zIndex = '1000';
        pi.el.style.width = '100%';
        pi.el.style.top = '0';
        pi.el.style.bottom = '0';
        pi.el.style.left = '0';
        pi.el.style.position = 'fixed';
        document.body.appendChild(pi.el);
      },
      clear: function() {
        pi.el.remove();
      }
    };
    pi.setup();
    return pi;
  };

  //---------------------------------------------------
  // VARIABLES
  //---------------------------------------------------
  player = null;

  bullets = null;

  bullets_count = 3;

  bullet_time = 0;

  enemies = null;

  enemies_count = 0;

  enemies_bullets = null;

  time = 0;

  speed = 10;

  motion = 0;

  motion_timer = null;

  max_delay = 60;

  min_delay = 1;

  text = null;

  score = 0;

  score_text = null;

  controls = [];

  currentVerticalDirection = false;

  currentHorizontalDirection = false;

  preview = new PreviewImage("https://s3-us-west-2.amazonaws.com/s.cdpn.io/150586/superhot2d.png"); //PREVIEW IMAGE

  
  //---------------------------------------------------
  // GAME CLASS
  //---------------------------------------------------

  //PRELOAD STATE
  preload = function() {};

  // nothing to preload ¯\_(ツ)_/¯

  //CREATE STATE
  create = function() {
    
    //remove preview image
    preview.clear();
    
    //set scale mode
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignVertically = true;
    game.scale.pageAlignHorizontally = true;
    
    //background color
    game.stage.backgroundColor = '#CCCCCC';
    
    //start physics engine
    game.physics.startSystem(Phaser.Physics.ARCADE);
    //input
    this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);
    this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
    this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
    this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.LEFT);
    this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.RIGHT);
    controls = {
      "up": game.input.keyboard.addKey(Phaser.Keyboard.UP),
      "down": game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
      "left": game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
      "right": game.input.keyboard.addKey(Phaser.Keyboard.RIGHT)
    };
    //start the game
    return nextLevel();
  };

  //RESET THE GAME
  resetGame = function() {
    var bullet, enemy, i;
    
    //nuke everything
    game.world.removeAll();
    //score text
    score_text = game.add.text(game.world.width - 60, 10, score);
    score_text.align = 'right';
    score_text.font = 'Orbitron';
    score_text.fontSize = 40;
    score_text.fill = '#ff0000';
    
    //add player  
    player = new Player(game, game.rnd.integerInRange(100, game.world.width - 100), 500, drawShape(32, 32, '#FFFFFF'));
    
    //ada player's bullet group
    bullets = game.add.group();
    
    //add bullets to memory so we can throttle the shot 
    i = 0;
    while (i < bullets_count) {
      bullet = new Bullet(game, 0, 0, drawShape(10, 10, '#000000'));
      bullets.add(bullet);
      bullet.events.onOutOfBounds.add(bullet.kill, bullet);
      i++;
    }
    
    //add enemies and enemy bullets
    enemies = game.add.group();
    enemies_bullets = game.add.group();
    i = 0;
    while (i < enemies_count) {
      enemy = new Enemy(game, game.rnd.integerInRange(100, game.world.width - 100), game.rnd.integerInRange(50, 150), drawShape());
      enemies.add(enemy);
      i++;
    }
    
    //create a new timer. this timer will act as our motion timer that we'll use to update time and motion instead of the main game update loop
    return motion_timer = game.time.events.loop(60, motionUpdate, this);
  };

  
  //DRAW SHAPES
  drawShape = function(width = 64, height = 64, color = '#ff0000') {
    var bmd;
    bmd = game.add.bitmapData(width, height);
    bmd.ctx.beginPath();
    bmd.ctx.rect(0, 0, width, height);
    bmd.ctx.fillStyle = color;
    bmd.ctx.fill();
    return bmd;
  };

  
  //CHECK INPUT
  checkInput = function() {
    // change time on input
    if (controls.up.isDown || controls.down.isDown || controls.left.isDown || controls.right.isDown) {
      speedUpTime();
    } else {
      slowDownTime();
    }
    
    // determine what direction the player is moving
    if (controls.left.isDown) {
      currentHorizontalDirection = "left";
    } else if (controls.right.isDown) {
      currentHorizontalDirection = "right";
    } else {
      currentHorizontalDirection = false;
    }
    if (controls.up.isDown) {
      currentVerticalDirection = "up";
    } else if (controls.down.isDown) {
      currentVerticalDirection = "down";
    } else if (!currentHorizontalDirection) { // if nothing assume up
      currentVerticalDirection = "up";
    } else {
      currentVerticalDirection = false;
    }
    // fire!
    if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      return player.fireBullet(currentHorizontalDirection, currentVerticalDirection);
    }
  };

  //MOVEMENT
  movePlayer = function() {
    return player.motionUpdate();
  };

  moveEnemies = function() {
    // Move the enemies towards the player at the rate of the game motion
    return enemies.forEachAlive(function(enemy) {
      return enemy.motionUpdate();
    });
  };

  moveBullets = function() {
    // player bullets
    bullets.forEachAlive(function(bullet) {
      return bullet.motionUpdate();
    });
    // enemy bullets
    return enemies_bullets.forEachAlive(function(bullet) {
      return bullet.motionUpdate();
    });
  };

  
  //COLLISION HANDLERS
  playerEnemyHandler = function(player, enemy) {
    //you dead. tint the player for a moment and then reset the game
    if (enemy.can_kill) {
      enemy.can_kill = false;
      player.tint = 0xff0000;
      return game.time.events.add(Phaser.Timer.SECOND * 0.2, function() {
        return gameOver();
      }, this);
    }
  };

  bulletEnemyHandler = function(bullet, enemy) {
    enemy.tint = 0x000000;
    bullet.kill();
    enemy.can_kill = false;
    updateScore(score += 1);
    return game.time.events.add(Phaser.Timer.SECOND * 0.2, function() {
      return killEnemy(enemy);
    }, this);
  };

  killEnemy = function(enemy) {
    enemy.kill();
    if (!enemies.getFirstAlive()) {
      return nextLevel();
    }
  };

  
  //MANIPULATE TIME
  speedUpTime = function() {
    if (motion_timer.delay > min_delay) {
      motion_timer.delay -= 2;
    } else {
      motion_timer.delay = min_delay;
    }
    return time = motion_timer.delay + speed;
  };

  slowDownTime = function() {
    if (motion_timer.delay < max_delay) {
      motion_timer.delay += 2;
    } else {
      motion_timer.delay = max_delay;
    }
    return time = motion_timer.delay - speed;
  };

  
  //UPDATE MOTION
  updateMotion = function() {
    // always keep some motion and factor it by the time
    return motion = (100 - (time * 2)) + speed;
  };

  
  //GAME OVER
  gameOver = function() {
    enemies_count = 1;
    updateScore(0);
    resetGame();
    spawnText("GAME");
    return game.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
      return spawnText("OVER");
    }, this);
  };

  
  //NEXT LEVEL  
  nextLevel = function() {
    // increase enemies and reset the game
    enemies_count++;
    resetGame();
    spawnText("SUPER");
    return game.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
      return spawnText("HOT");
    }, this);
  };

  
  //SPAWN TEXT
  spawnText = function(text = false, lifespan = 0.5) {
    if (text) {
      text = game.add.text(game.world.centerX, game.world.centerY, text);
      text.anchor.set(0.5);
      text.align = 'center';
      text.font = 'Orbitron';
      text.fontSize = 150;
      text.fill = '#ff0000';
      return game.time.events.add(Phaser.Timer.SECOND * lifespan, function() {
        return text.kill();
      }, this);
    }
  };

  //MANAGE SCORE
  updateScore = function(points) {
    score = points;
    return score_text.text = score;
  };

  
  //MOTION UPDATE LOOP
  motionUpdate = function() {
    updateMotion();
    movePlayer();
    moveEnemies();
    return moveBullets();
  };

  
  //MAIN GAME UPDATE LOOP
  update = function() {
    checkInput();
    
    // player vs enemies
    game.physics.arcade.overlap(player, enemies, playerEnemyHandler, null, this);
    // enemy fire vs player
    game.physics.arcade.overlap(player, enemies_bullets, playerEnemyHandler, null, this);
    // bullets vs enemies
    game.physics.arcade.overlap(bullets, enemies, bulletEnemyHandler, null, this);
    // bullets vs bullets
    return game.physics.arcade.collide(bullets, enemies_bullets);
  };

  // enemies vs enemies
  // game.physics.arcade.collide(enemies)

  //RENDER / DEBUG
  render = function() {};

  //game.debug.text "Move with arrow keys. Shoot with spacebar.", 30, 40
  // game.debug.text "Clock Delay " + motion_timer.delay + " / Time " + time + " / Motion " + motion, 30, 65

  //---------------------------------------------------
  // Player CLASS
  //---------------------------------------------------
  Player = function(game, x, y, sprite) {
    Phaser.Sprite.call(this, game, x, y, sprite);
    game.physics.arcade.enable(this);
    this.game = game;
    this.anchor.set(0.5);
    this.checkWorldBounds = true;
    this.events.onOutOfBounds.add(this.reposition, this);
    this.body.drag.x = 1;
    this.body.drag.y = 1;
    return game.add.existing(this);
  };

  //EXTENDS SPRITE CLASS
  Player.prototype = Object.create(Phaser.Sprite.prototype);

  Player.prototype.constructor = Player;

  //PLAYER MOTION UPDATE LOOP
  Player.prototype.motionUpdate = function() {
    var speed_modifier;
    //player should move slightly faster than enemies
    speed_modifier = speed / 6;
    if (controls.up.isDown) {
      this.body.velocity.y = -motion * speed_modifier;
    } else if (controls.down.isDown) {
      this.body.velocity.y = motion * speed_modifier;
    }
    if (controls.left.isDown) {
      this.body.velocity.x = -motion * speed_modifier;
    } else if (controls.right.isDown) {
      this.body.velocity.x = motion * speed_modifier;
    }
    if (!controls.up.isDown && !controls.down.isDown && !controls.left.isDown && !controls.right.isDown) {
      if (this.body.velocity.x > 0) {
        this.body.velocity.x -= motion / 2;
      } else if (this.body.velocity.x < 0) {
        this.body.velocity.x += motion / 2;
      }
      if (this.body.velocity.y > 0) {
        return this.body.velocity.y -= motion / 2;
      } else if (this.body.velocity.y < 0) {
        return this.body.velocity.y += motion / 2;
      }
    }
  };

  Player.prototype.reposition = function() {
    if (this.x < 0) {
      return this.x = game.world.width;
    } else if (this.x > game.world.width) {
      return this.x = 0;
    } else if (this.y < 0) {
      return this.y = game.world.height;
    } else if (this.y > game.world.height) {
      return this.y = 0;
    }
  };

  Player.prototype.fireBullet = function(h = false, v = false) {
    var bullet;
    if (game.time.now > bullet_time) {
      bullet = bullets.getFirstExists(false);
      if (bullet) {
        bullet.reset(this.x, this.y);
        bullet.h = h;
        bullet.v = v;
        bullet.mass = 1;
        return bullet_time = game.time.now + 150;
      }
    }
  };

  
  //---------------------------------------------------
  // BULLET CLASS
  //---------------------------------------------------
  Bullet = function(game, x, y, sprite, h = false, v = "up") {
    Phaser.Sprite.call(this, game, x, y, sprite);
    game.physics.arcade.enable(this);
    this.game = game;
    this.exists = false;
    this.visible = false;
    this.checkWorldBounds = true;
    this.angle = 45;
    this.anchor.set(0.5);
    this.mass = 0.2;
    this.can_kill = true;
    this.h = h;
    return this.v = v;
  };

  //EXTENDS SPRITE CLASS
  Bullet.prototype = Object.create(Phaser.Sprite.prototype);

  Bullet.prototype.constructor = Bullet;

  //BULLET MOTION UPDATE LOOP
  Bullet.prototype.motionUpdate = function() {
    var speed_modifier;
    
    //bullets should move faster than characters
    speed_modifier = speed / 2;
    switch (this.h) {
      case "left":
        this.body.velocity.x = -motion * speed_modifier;
        break;
      case "right":
        this.body.velocity.x = motion * speed_modifier;
    }
    switch (this.v) {
      case "up":
        return this.body.velocity.y = -motion * speed_modifier;
      case "down":
        return this.body.velocity.y = motion * speed_modifier;
    }
  };

  
  //---------------------------------------------------
  // ENEMY CLASS
  //---------------------------------------------------
  Enemy = function(game, x, y, sprite) {
    Phaser.Sprite.call(this, game, x, y, sprite);
    game.physics.arcade.enable(this);
    this.game = game;
    this.anchor.set(0.5);
    this.checkWorldBounds = true;
    this.events.onOutOfBounds.add(this.reposition, this);
    this.body.bounce.x = 1;
    this.body.bounce.y = 1;
    this.body.drag.x = 1;
    this.body.drag.y = 1;
    this.type = _.sample([1, 2, 3, 4, 5]);
    this.can_kill = true;
    return this.can_shoot = true;
  };

  //EXTENDS SPRITE CLASS
  Enemy.prototype = Object.create(Phaser.Sprite.prototype);

  Enemy.prototype.constructor = Enemy;

  //ENEMY MOTION UPDATE LOOP
  Enemy.prototype.motionUpdate = function() {
    
    // move enemy based on type
    switch (this.type) {
      case 1:
        // just move down
        this.body.velocity.y = motion;
        break;
      case 2:
        // just move left
        this.body.velocity.x = -motion;
        break;
      case 3:
        // just move right
        this.body.velocity.x = motion;
        break;
      default:
        //follow the player
        this.game.physics.arcade.moveToObject(this, player, motion);
    }
    
    // shoot to kill!
    if (this.can_shoot) {
      this.fireBullet();
      this.can_shoot = false;
      
      // randomly throttle firing
      return this.game.time.events.add(Phaser.Timer.SECOND * this.game.rnd.integerInRange(3, 10), function() {
        return this.can_shoot = true;
      }, this);
    }
  };

  Enemy.prototype.reposition = function() {
    if (this.x < 0) {
      return this.x = game.world.width;
    } else if (this.x > game.world.width) {
      return this.x = 0;
    } else if (this.y < 0) {
      return this.y = game.world.height;
    } else if (this.y > game.world.height) {
      return this.y = 0;
    }
  };

  Enemy.prototype.fireBullet = function() {
    var buffer, bullet, h, v;
    bullet = new Bullet(game, 0, 0, drawShape(10, 10, '#ff0000'));
    enemies_bullets.add(bullet);
    bullet.reset(this.x, this.y);
    // shoot towards the player
    buffer = 100;
    if (player.x < this.x - buffer) {
      h = "left";
    } else if (player.x > this.x + buffer) {
      h = "right";
    } else {
      h = false;
    }
    if (player.y < this.y - buffer) {
      v = "up";
    } else if (player.y > this.y + buffer) {
      v = "down";
    } else {
      v = false;
    }
    bullet.h = h;
    return bullet.v = v;
  };

  
  //---------------------------------------------------
  // INIT
  //---------------------------------------------------
  game = new Phaser.Game(900, 600, Phaser.AUTO, "game", {
    preload: preload,
    create: create,
    update: update,
    render: render
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiPGFub255bW91cz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQTs7Ozs7O0FBQUEsTUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsa0JBQUEsRUFBQSxXQUFBLEVBQUEsT0FBQSxFQUFBLGFBQUEsRUFBQSxVQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSwwQkFBQSxFQUFBLHdCQUFBLEVBQUEsU0FBQSxFQUFBLE9BQUEsRUFBQSxlQUFBLEVBQUEsYUFBQSxFQUFBLElBQUEsRUFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLFNBQUEsRUFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxrQkFBQSxFQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFdBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUE7O0VBT0EsWUFBQSxHQUFlLFFBQUEsQ0FBQyxHQUFELENBQUE7QUFDYixRQUFBO0lBQUEsRUFBQSxHQUNFO01BQUEsS0FBQSxFQUFPLFFBQUEsQ0FBQSxDQUFBO1FBQ0wsRUFBRSxDQUFDLEVBQUgsR0FBUSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtRQUNSLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFVBQVosR0FBeUIsTUFBQSxHQUFTLEdBQVQsR0FBZTtRQUN4QyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxjQUFaLEdBQTZCO1FBQzdCLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQVosR0FBcUI7UUFDckIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFL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amRQIiwic291cmNlc0NvbnRlbnQiOlsiIyBVU0FHRTpcbiMgMS4gaW5jbHVkZSB0aGlzIHBlbiBpbiB5b3VyIHBlbidzIGphdmFzY3JpcHQgYXNzZXRzXG4jIDIuIGNyZWF0ZSBhIG5ldyBpbnN0YW5jZSB3aXRoIGB2YXIgcHJldmlldyA9IG5ldyBQcmV2aWV3SW1hZ2UoXCJwYXRoL3RvL3lvdXIvaW1hZ2UuanBnXCIpO1xuIyAzLiBraWxsIGl0IHdoZW4geW91IHdhbnQgaXQgdG8gZ28gYXdheSBgcC5jbGVhcigpO2BcbiMgdmFyIHAgPSBuZXcgUHJldmlld0ltYWdlKFwiaHR0cHM6Ly9zMy11cy13ZXN0LTIuYW1hem9uYXdzLmNvbS9zLmNkcG4uaW8vMTUwNTg2L2FuZ3J5LWJvc3NtYW4tdjIucG5nXCIpO1xuI3AuY2xlYXIoKTtcblxuUHJldmlld0ltYWdlID0gKHVybCkgLT5cbiAgcGkgPSBcbiAgICBzZXR1cDogLT5cbiAgICAgIHBpLmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JylcbiAgICAgIHBpLmVsLnN0eWxlLmJhY2tncm91bmQgPSAndXJsKCcgKyB1cmwgKyAnKSBuby1yZXBlYXQgY2VudGVyIGNlbnRlcidcbiAgICAgIHBpLmVsLnN0eWxlLmJhY2tncm91bmRTaXplID0gJ2NvdmVyJ1xuICAgICAgcGkuZWwuc3R5bGUuekluZGV4ID0gJzEwMDAnXG4gICAgICBwaS5lbC5zdHlsZS53aWR0aCA9ICcxMDAlJ1xuICAgICAgcGkuZWwuc3R5bGUudG9wID0gJzAnXG4gICAgICBwaS5lbC5zdHlsZS5ib3R0b20gPSAnMCdcbiAgICAgIHBpLmVsLnN0eWxlLmxlZnQgPSAnMCdcbiAgICAgIHBpLmVsLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJ1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBwaS5lbFxuICAgICAgcmV0dXJuXG4gICAgY2xlYXI6IC0+XG4gICAgICBwaS5lbC5yZW1vdmUoKVxuICAgICAgcmV0dXJuXG4gIHBpLnNldHVwKClcbiAgcGlcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBWQVJJQUJMRVNcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnBsYXllciA9IG51bGxcbmJ1bGxldHMgPSBudWxsXG5idWxsZXRzX2NvdW50ID0gM1xuYnVsbGV0X3RpbWUgPSAwXG5lbmVtaWVzID0gbnVsbFxuZW5lbWllc19jb3VudCA9IDBcbmVuZW1pZXNfYnVsbGV0cyA9IG51bGxcbnRpbWUgPSAwXG5zcGVlZCA9IDEwXG5tb3Rpb24gPSAwXG5tb3Rpb25fdGltZXIgPSBudWxsXG5tYXhfZGVsYXkgPSA2MFxubWluX2RlbGF5ID0gMVxudGV4dCA9IG51bGxcbnNjb3JlID0gMFxuc2NvcmVfdGV4dCA9IG51bGxcbmNvbnRyb2xzID0gW11cbmN1cnJlbnRWZXJ0aWNhbERpcmVjdGlvbiA9IGZhbHNlXG5jdXJyZW50SG9yaXpvbnRhbERpcmVjdGlvbiA9IGZhbHNlXG5wcmV2aWV3ID0gbmV3IFByZXZpZXdJbWFnZShcImh0dHBzOi8vczMtdXMtd2VzdC0yLmFtYXpvbmF3cy5jb20vcy5jZHBuLmlvLzE1MDU4Ni9zdXBlcmhvdDJkLnBuZ1wiKSAjUFJFVklFVyBJTUFHRVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEdBTUUgQ0xBU1NcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuI1BSRUxPQUQgU1RBVEVcbnByZWxvYWQgPSAtPlxuICAjIG5vdGhpbmcgdG8gcHJlbG9hZCDCr1xcXyjjg4QpXy/Cr1xuICBcbiNDUkVBVEUgU1RBVEVcbmNyZWF0ZSA9IC0+XG4gIFxuICAjcmVtb3ZlIHByZXZpZXcgaW1hZ2VcbiAgcHJldmlldy5jbGVhcigpXG4gIFxuICAjc2V0IHNjYWxlIG1vZGVcbiAgZ2FtZS5zY2FsZS5zY2FsZU1vZGUgPSBQaGFzZXIuU2NhbGVNYW5hZ2VyLlNIT1dfQUxMXG4gIGdhbWUuc2NhbGUucGFnZUFsaWduVmVydGljYWxseSA9IHRydWVcbiAgZ2FtZS5zY2FsZS5wYWdlQWxpZ25Ib3Jpem9udGFsbHkgPSB0cnVlXG4gIFxuICAjYmFja2dyb3VuZCBjb2xvclxuICBnYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9ICcjQ0NDQ0NDJ1xuICBcbiAgI3N0YXJ0IHBoeXNpY3MgZW5naW5lXG4gIGdhbWUucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpXG5cbiAgI2lucHV0XG4gIHRoaXMuZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFBoYXNlci5LZXlib2FyZC5TUEFDRUJBUilcbiAgdGhpcy5nYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleUNhcHR1cmUoUGhhc2VyLktleWJvYXJkLlVQKVxuICB0aGlzLmdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShQaGFzZXIuS2V5Ym9hcmQuRE9XTilcbiAgdGhpcy5nYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleUNhcHR1cmUoUGhhc2VyLktleWJvYXJkLkxFRlQpXG4gIHRoaXMuZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFBoYXNlci5LZXlib2FyZC5SSUdIVClcbiAgXG4gIGNvbnRyb2xzID0gXG4gICAgXCJ1cFwiOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuVVApXG4gICAgXCJkb3duXCI6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5ET1dOKVxuICAgIFwibGVmdFwiOiBnYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleShQaGFzZXIuS2V5Ym9hcmQuTEVGVClcbiAgICBcInJpZ2h0XCI6IGdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5KFBoYXNlci5LZXlib2FyZC5SSUdIVClcblxuICAjc3RhcnQgdGhlIGdhbWVcbiAgbmV4dExldmVsKClcblxuI1JFU0VUIFRIRSBHQU1FXG5yZXNldEdhbWUgPSAtPlxuICBcbiAgI251a2UgZXZlcnl0aGluZ1xuICBnYW1lLndvcmxkLnJlbW92ZUFsbCgpXG5cbiAgI3Njb3JlIHRleHRcbiAgc2NvcmVfdGV4dCA9IGdhbWUuYWRkLnRleHQoZ2FtZS53b3JsZC53aWR0aCAtIDYwLCAxMCwgc2NvcmUpXG4gIHNjb3JlX3RleHQuYWxpZ24gPSAncmlnaHQnXG4gIHNjb3JlX3RleHQuZm9udCA9ICdPcmJpdHJvbidcbiAgc2NvcmVfdGV4dC5mb250U2l6ZSA9IDQwXG4gIHNjb3JlX3RleHQuZmlsbCA9ICcjZmYwMDAwJ1xuICBcbiAgI2FkZCBwbGF5ZXIgIFxuICBwbGF5ZXIgPSBuZXcgUGxheWVyIGdhbWUsIGdhbWUucm5kLmludGVnZXJJblJhbmdlKDEwMCwgZ2FtZS53b3JsZC53aWR0aCAtIDEwMCksIDUwMCwgZHJhd1NoYXBlKDMyLDMyLCcjRkZGRkZGJylcbiAgXG4gICNhZGEgcGxheWVyJ3MgYnVsbGV0IGdyb3VwXG4gIGJ1bGxldHMgPSBnYW1lLmFkZC5ncm91cCgpXG4gIFxuICAjYWRkIGJ1bGxldHMgdG8gbWVtb3J5IHNvIHdlIGNhbiB0aHJvdHRsZSB0aGUgc2hvdCBcbiAgaSA9IDBcbiAgd2hpbGUgaSA8IGJ1bGxldHNfY291bnRcbiAgICBidWxsZXQgPSBuZXcgQnVsbGV0IGdhbWUsIDAsIDAsIGRyYXdTaGFwZSgxMCwgMTAsICcjMDAwMDAwJylcbiAgICBidWxsZXRzLmFkZCBidWxsZXQgXG4gICAgYnVsbGV0LmV2ZW50cy5vbk91dE9mQm91bmRzLmFkZCBidWxsZXQua2lsbCwgYnVsbGV0XG4gICAgaSsrXG4gXG4gICNhZGQgZW5lbWllcyBhbmQgZW5lbXkgYnVsbGV0c1xuICBlbmVtaWVzID0gZ2FtZS5hZGQuZ3JvdXAoKVxuICBlbmVtaWVzX2J1bGxldHMgPSBnYW1lLmFkZC5ncm91cCgpXG4gIFxuICBpID0gMFxuICB3aGlsZSBpIDwgZW5lbWllc19jb3VudFxuICAgIGVuZW15ID0gbmV3IEVuZW15IGdhbWUsIGdhbWUucm5kLmludGVnZXJJblJhbmdlKDEwMCwgZ2FtZS53b3JsZC53aWR0aCAtIDEwMCksIGdhbWUucm5kLmludGVnZXJJblJhbmdlKDUwLCAxNTApLCBkcmF3U2hhcGUoKVxuICAgIGVuZW1pZXMuYWRkIGVuZW15XG4gICAgaSsrXG4gICAgXG4gICNjcmVhdGUgYSBuZXcgdGltZXIuIHRoaXMgdGltZXIgd2lsbCBhY3QgYXMgb3VyIG1vdGlvbiB0aW1lciB0aGF0IHdlJ2xsIHVzZSB0byB1cGRhdGUgdGltZSBhbmQgbW90aW9uIGluc3RlYWQgb2YgdGhlIG1haW4gZ2FtZSB1cGRhdGUgbG9vcFxuICBtb3Rpb25fdGltZXIgPSBnYW1lLnRpbWUuZXZlbnRzLmxvb3AoNjAsIG1vdGlvblVwZGF0ZSwgdGhpcylcbiAgXG4jRFJBVyBTSEFQRVNcbmRyYXdTaGFwZSA9ICh3aWR0aD02NCwgaGVpZ2h0PTY0LCBjb2xvcj0nI2ZmMDAwMCcpLT5cbiAgYm1kID0gZ2FtZS5hZGQuYml0bWFwRGF0YSh3aWR0aCwgaGVpZ2h0KVxuICBibWQuY3R4LmJlZ2luUGF0aCgpXG4gIGJtZC5jdHgucmVjdCAwLCAwLCB3aWR0aCwgaGVpZ2h0XG4gIGJtZC5jdHguZmlsbFN0eWxlID0gY29sb3JcbiAgYm1kLmN0eC5maWxsKClcbiAgcmV0dXJuIGJtZFxuICBcbiNDSEVDSyBJTlBVVFxuY2hlY2tJbnB1dCA9IC0+XG4gICMgY2hhbmdlIHRpbWUgb24gaW5wdXRcbiAgaWYgY29udHJvbHMudXAuaXNEb3duIG9yIGNvbnRyb2xzLmRvd24uaXNEb3duIG9yIGNvbnRyb2xzLmxlZnQuaXNEb3duIG9yIGNvbnRyb2xzLnJpZ2h0LmlzRG93blxuICAgIHNwZWVkVXBUaW1lKClcbiAgZWxzZVxuICAgIHNsb3dEb3duVGltZSgpXG4gICAgXG4gICMgZGV0ZXJtaW5lIHdoYXQgZGlyZWN0aW9uIHRoZSBwbGF5ZXIgaXMgbW92aW5nXG4gIGlmIGNvbnRyb2xzLmxlZnQuaXNEb3duXG4gICAgY3VycmVudEhvcml6b250YWxEaXJlY3Rpb24gPSBcImxlZnRcIlxuICBlbHNlIGlmIGNvbnRyb2xzLnJpZ2h0LmlzRG93blxuICAgIGN1cnJlbnRIb3Jpem9udGFsRGlyZWN0aW9uID0gXCJyaWdodFwiXG4gIGVsc2VcbiAgICBjdXJyZW50SG9yaXpvbnRhbERpcmVjdGlvbiA9IGZhbHNlXG4gICAgXG4gIGlmIGNvbnRyb2xzLnVwLmlzRG93blxuICAgIGN1cnJlbnRWZXJ0aWNhbERpcmVjdGlvbiA9IFwidXBcIlxuICBlbHNlIGlmIGNvbnRyb2xzLmRvd24uaXNEb3duXG4gICAgY3VycmVudFZlcnRpY2FsRGlyZWN0aW9uID0gXCJkb3duXCJcbiAgZWxzZSBpZiAhY3VycmVudEhvcml6b250YWxEaXJlY3Rpb24gIyBpZiBub3RoaW5nIGFzc3VtZSB1cFxuICAgIGN1cnJlbnRWZXJ0aWNhbERpcmVjdGlvbiA9IFwidXBcIlxuICBlbHNlXG4gICAgY3VycmVudFZlcnRpY2FsRGlyZWN0aW9uID0gZmFsc2VcblxuICAjIGZpcmUhXG4gIGlmIGdhbWUuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5TUEFDRUJBUilcbiAgICBwbGF5ZXIuZmlyZUJ1bGxldChjdXJyZW50SG9yaXpvbnRhbERpcmVjdGlvbiwgY3VycmVudFZlcnRpY2FsRGlyZWN0aW9uKVxuXG4jTU9WRU1FTlRcbm1vdmVQbGF5ZXIgPSAtPlxuICBwbGF5ZXIubW90aW9uVXBkYXRlKClcbiAgICBcbm1vdmVFbmVtaWVzID0gLT5cbiAgIyBNb3ZlIHRoZSBlbmVtaWVzIHRvd2FyZHMgdGhlIHBsYXllciBhdCB0aGUgcmF0ZSBvZiB0aGUgZ2FtZSBtb3Rpb25cbiAgZW5lbWllcy5mb3JFYWNoQWxpdmUgKGVuZW15KSAtPiAgXG4gICAgZW5lbXkubW90aW9uVXBkYXRlKClcbiAgICAgIFxubW92ZUJ1bGxldHMgPSAtPlxuICAjIHBsYXllciBidWxsZXRzXG4gIGJ1bGxldHMuZm9yRWFjaEFsaXZlIChidWxsZXQpIC0+XG4gICAgYnVsbGV0Lm1vdGlvblVwZGF0ZSgpXG5cbiAgIyBlbmVteSBidWxsZXRzXG4gIGVuZW1pZXNfYnVsbGV0cy5mb3JFYWNoQWxpdmUgKGJ1bGxldCkgLT5cbiAgICBidWxsZXQubW90aW9uVXBkYXRlKClcbiAgICBcbiNDT0xMSVNJT04gSEFORExFUlNcbnBsYXllckVuZW15SGFuZGxlciA9IChwbGF5ZXIsIGVuZW15KS0+XG4gICN5b3UgZGVhZC4gdGludCB0aGUgcGxheWVyIGZvciBhIG1vbWVudCBhbmQgdGhlbiByZXNldCB0aGUgZ2FtZVxuICBpZiBlbmVteS5jYW5fa2lsbFxuICAgIGVuZW15LmNhbl9raWxsID0gZmFsc2VcbiAgICBwbGF5ZXIudGludCA9IDB4ZmYwMDAwXG4gICAgZ2FtZS50aW1lLmV2ZW50cy5hZGQoUGhhc2VyLlRpbWVyLlNFQ09ORCAqIDAuMiwgLT5cbiAgICAgICAgZ2FtZU92ZXIoKVxuICAgICwgdGhpcylcblxuYnVsbGV0RW5lbXlIYW5kbGVyID0gKGJ1bGxldCwgZW5lbXkpLT5cbiAgZW5lbXkudGludCA9IDB4MDAwMDAwXG4gIGJ1bGxldC5raWxsKClcbiAgZW5lbXkuY2FuX2tpbGwgPSBmYWxzZVxuICB1cGRhdGVTY29yZSBzY29yZSs9MVxuICBnYW1lLnRpbWUuZXZlbnRzLmFkZChQaGFzZXIuVGltZXIuU0VDT05EICogMC4yLCAtPlxuICAgIGtpbGxFbmVteShlbmVteSlcbiAgLCB0aGlzKVxuICBcbmtpbGxFbmVteSA9IChlbmVteSktPlxuICBlbmVteS5raWxsKClcbiAgI2NoZWNrIGlmIGFsbCBlbmVtaWVzIGFyZSBkZWFkXG4gIGlmICFlbmVtaWVzLmdldEZpcnN0QWxpdmUoKVxuICAgIG5leHRMZXZlbCgpIFxuICBcbiNNQU5JUFVMQVRFIFRJTUVcbnNwZWVkVXBUaW1lID0gLT5cbiAgaWYgbW90aW9uX3RpbWVyLmRlbGF5ID4gbWluX2RlbGF5XG4gICAgbW90aW9uX3RpbWVyLmRlbGF5IC09IDJcbiAgZWxzZSBcbiAgICBtb3Rpb25fdGltZXIuZGVsYXkgPSBtaW5fZGVsYXlcbiAgdGltZSA9IG1vdGlvbl90aW1lci5kZWxheSArIHNwZWVkXG4gIFxuc2xvd0Rvd25UaW1lID0gLT5cbiAgaWYgbW90aW9uX3RpbWVyLmRlbGF5IDwgbWF4X2RlbGF5XG4gICAgbW90aW9uX3RpbWVyLmRlbGF5ICs9IDJcbiAgZWxzZSBcbiAgICBtb3Rpb25fdGltZXIuZGVsYXkgPSBtYXhfZGVsYXlcbiAgdGltZSA9IG1vdGlvbl90aW1lci5kZWxheSAtIHNwZWVkXG4gICBcbiNVUERBVEUgTU9USU9OXG51cGRhdGVNb3Rpb24gPSAtPlxuICAjIGFsd2F5cyBrZWVwIHNvbWUgbW90aW9uIGFuZCBmYWN0b3IgaXQgYnkgdGhlIHRpbWVcbiAgbW90aW9uID0gKDEwMCAtICh0aW1lICogMikpICsgc3BlZWRcbiAgXG4jR0FNRSBPVkVSXG5nYW1lT3ZlciA9IC0+XG4gIGVuZW1pZXNfY291bnQgPSAxXG4gIHVwZGF0ZVNjb3JlIDBcbiAgcmVzZXRHYW1lKClcbiAgc3Bhd25UZXh0IFwiR0FNRVwiXG4gIGdhbWUudGltZS5ldmVudHMuYWRkKFBoYXNlci5UaW1lci5TRUNPTkQgKiAwLjUsIC0+XG4gICAgc3Bhd25UZXh0IFwiT1ZFUlwiXG4gICwgdGhpcylcbiAgXG4jTkVYVCBMRVZFTCAgXG5uZXh0TGV2ZWwgPSAtPlxuICAjIGluY3JlYXNlIGVuZW1pZXMgYW5kIHJlc2V0IHRoZSBnYW1lXG4gIGVuZW1pZXNfY291bnQrK1xuICByZXNldEdhbWUoKVxuICBzcGF3blRleHQgXCJTVVBFUlwiXG4gIGdhbWUudGltZS5ldmVudHMuYWRkKFBoYXNlci5UaW1lci5TRUNPTkQgKiAwLjUsIC0+XG4gICAgc3Bhd25UZXh0IFwiSE9UXCJcbiAgLCB0aGlzKVxuICBcbiNTUEFXTiBURVhUXG5zcGF3blRleHQgPSAodGV4dD1mYWxzZSwgbGlmZXNwYW49MC41KS0+XG4gIGlmIHRleHRcbiAgICB0ZXh0ID0gZ2FtZS5hZGQudGV4dChnYW1lLndvcmxkLmNlbnRlclgsIGdhbWUud29ybGQuY2VudGVyWSwgdGV4dClcbiAgICB0ZXh0LmFuY2hvci5zZXQgMC41XG4gICAgdGV4dC5hbGlnbiA9ICdjZW50ZXInXG4gICAgdGV4dC5mb250ID0gJ09yYml0cm9uJ1xuICAgIHRleHQuZm9udFNpemUgPSAxNTBcbiAgICB0ZXh0LmZpbGwgPSAnI2ZmMDAwMCdcblxuICAgIGdhbWUudGltZS5ldmVudHMuYWRkKFBoYXNlci5UaW1lci5TRUNPTkQgKiBsaWZlc3BhbiwgLT5cbiAgICAgIHRleHQua2lsbCgpXG4gICAgLCB0aGlzKVxuXG4jTUFOQUdFIFNDT1JFXG51cGRhdGVTY29yZSA9IChwb2ludHMpLT5cbiAgc2NvcmUgPSBwb2ludHNcbiAgc2NvcmVfdGV4dC50ZXh0ID0gc2NvcmVcbiAgXG4jTU9USU9OIFVQREFURSBMT09QXG5tb3Rpb25VcGRhdGUgPSAtPlxuICB1cGRhdGVNb3Rpb24oKVxuICBtb3ZlUGxheWVyKClcbiAgbW92ZUVuZW1pZXMoKVxuICBtb3ZlQnVsbGV0cygpXG4gIFxuI01BSU4gR0FNRSBVUERBVEUgTE9PUFxudXBkYXRlID0gLT5cbiAgY2hlY2tJbnB1dCgpXG4gIFxuICAjIHBsYXllciB2cyBlbmVtaWVzXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcChwbGF5ZXIsIGVuZW1pZXMsIHBsYXllckVuZW15SGFuZGxlciwgbnVsbCwgdGhpcylcbiAgIyBlbmVteSBmaXJlIHZzIHBsYXllclxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAocGxheWVyLCBlbmVtaWVzX2J1bGxldHMsIHBsYXllckVuZW15SGFuZGxlciwgbnVsbCwgdGhpcylcbiAgIyBidWxsZXRzIHZzIGVuZW1pZXNcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKGJ1bGxldHMsIGVuZW1pZXMsIGJ1bGxldEVuZW15SGFuZGxlciwgbnVsbCwgdGhpcylcbiAgIyBidWxsZXRzIHZzIGJ1bGxldHNcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKGJ1bGxldHMsIGVuZW1pZXNfYnVsbGV0cylcbiAgIyBlbmVtaWVzIHZzIGVuZW1pZXNcbiAgIyBnYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUoZW5lbWllcylcblxuI1JFTkRFUiAvIERFQlVHXG5yZW5kZXIgPSAtPlxuICAjZ2FtZS5kZWJ1Zy50ZXh0IFwiTW92ZSB3aXRoIGFycm93IGtleXMuIFNob290IHdpdGggc3BhY2ViYXIuXCIsIDMwLCA0MFxuICAjIGdhbWUuZGVidWcudGV4dCBcIkNsb2NrIERlbGF5IFwiICsgbW90aW9uX3RpbWVyLmRlbGF5ICsgXCIgLyBUaW1lIFwiICsgdGltZSArIFwiIC8gTW90aW9uIFwiICsgbW90aW9uLCAzMCwgNjVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBQbGF5ZXIgQ0xBU1NcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblBsYXllciA9IChnYW1lLCB4LCB5LCBzcHJpdGUpLT5cbiAgUGhhc2VyLlNwcml0ZS5jYWxsIEAsIGdhbWUsIHgsIHksIHNwcml0ZVxuICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSBAXG4gIEBnYW1lID0gZ2FtZVxuICBAYW5jaG9yLnNldCAwLjVcbiAgQGNoZWNrV29ybGRCb3VuZHMgPSB0cnVlXG4gIEBldmVudHMub25PdXRPZkJvdW5kcy5hZGQgQHJlcG9zaXRpb24sIEBcbiAgQGJvZHkuZHJhZy54ID0gMVxuICBAYm9keS5kcmFnLnkgPSAxXG4gIGdhbWUuYWRkLmV4aXN0aW5nIEBcblxuI0VYVEVORFMgU1BSSVRFIENMQVNTXG5QbGF5ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSlcblBsYXllcjo6Y29uc3RydWN0b3IgPSBQbGF5ZXJcblxuI1BMQVlFUiBNT1RJT04gVVBEQVRFIExPT1BcblBsYXllcjo6bW90aW9uVXBkYXRlID0gLT5cbiAgI3BsYXllciBzaG91bGQgbW92ZSBzbGlnaHRseSBmYXN0ZXIgdGhhbiBlbmVtaWVzXG4gIHNwZWVkX21vZGlmaWVyID0gc3BlZWQgLyA2XG4gIGlmIGNvbnRyb2xzLnVwLmlzRG93blxuICAgIEBib2R5LnZlbG9jaXR5LnkgPSAtbW90aW9uICogc3BlZWRfbW9kaWZpZXJcbiAgZWxzZSBpZiBjb250cm9scy5kb3duLmlzRG93blxuICAgIEBib2R5LnZlbG9jaXR5LnkgPSBtb3Rpb24gKiBzcGVlZF9tb2RpZmllciBcbiAgaWYgY29udHJvbHMubGVmdC5pc0Rvd25cbiAgICBAYm9keS52ZWxvY2l0eS54ID0gLW1vdGlvbiAqIHNwZWVkX21vZGlmaWVyIFxuICBlbHNlIGlmIGNvbnRyb2xzLnJpZ2h0LmlzRG93blxuICAgIEBib2R5LnZlbG9jaXR5LnggPSBtb3Rpb24gKiBzcGVlZF9tb2RpZmllclxuICAgIFxuICAjIGxhY2sgb2YgbW92ZW1lbnRcbiAgaWYgIWNvbnRyb2xzLnVwLmlzRG93biBhbmQgIWNvbnRyb2xzLmRvd24uaXNEb3duIGFuZCAhY29udHJvbHMubGVmdC5pc0Rvd24gYW5kICFjb250cm9scy5yaWdodC5pc0Rvd25cbiAgICBpZiBAYm9keS52ZWxvY2l0eS54ID4gMCB0aGVuIEBib2R5LnZlbG9jaXR5LnggLT0gKG1vdGlvbiAvIDIpXG4gICAgZWxzZSBpZiBAYm9keS52ZWxvY2l0eS54IDwgMCB0aGVuIEBib2R5LnZlbG9jaXR5LnggKz0gKG1vdGlvbiAvIDIpXG4gICAgaWYgQGJvZHkudmVsb2NpdHkueSA+IDAgdGhlbiBAYm9keS52ZWxvY2l0eS55IC09IChtb3Rpb24gLyAyKVxuICAgIGVsc2UgaWYgQGJvZHkudmVsb2NpdHkueSA8IDAgdGhlbiBAYm9keS52ZWxvY2l0eS55ICs9IChtb3Rpb24gLyAyKVxuXG5QbGF5ZXI6OnJlcG9zaXRpb24gPSAtPlxuICBpZiBAeCA8IDAgdGhlbiBAeCA9IGdhbWUud29ybGQud2lkdGhcbiAgZWxzZSBpZiBAeCA+IGdhbWUud29ybGQud2lkdGggdGhlbiBAeCA9IDBcbiAgZWxzZSBpZiBAeSA8IDAgdGhlbiBAeSA9IGdhbWUud29ybGQuaGVpZ2h0XG4gIGVsc2UgaWYgQHkgPiBnYW1lLndvcmxkLmhlaWdodCB0aGVuIEB5ID0gMFxuICBcblBsYXllcjo6ZmlyZUJ1bGxldCA9IChoPWZhbHNlLCB2PWZhbHNlKS0+XG4gIGlmIGdhbWUudGltZS5ub3cgPiBidWxsZXRfdGltZVxuICAgIGJ1bGxldCA9IGJ1bGxldHMuZ2V0Rmlyc3RFeGlzdHMoZmFsc2UpXG4gICAgaWYgYnVsbGV0XG4gICAgICBidWxsZXQucmVzZXQgQHgsIEB5ICBcbiAgICAgIGJ1bGxldC5oID0gaFxuICAgICAgYnVsbGV0LnYgPSB2XG4gICAgICBidWxsZXQubWFzcyA9IDFcbiAgICAgIGJ1bGxldF90aW1lID0gZ2FtZS50aW1lLm5vdyArIDE1MFxuICBcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgQlVMTEVUIENMQVNTXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5CdWxsZXQgPSAoZ2FtZSwgeCwgeSwgc3ByaXRlLCBoPWZhbHNlLCB2PVwidXBcIiktPlxuICBQaGFzZXIuU3ByaXRlLmNhbGwgQCwgZ2FtZSwgeCwgeSwgc3ByaXRlXG4gIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlIEBcbiAgQGdhbWUgPSBnYW1lXG4gIEBleGlzdHMgPSBmYWxzZVxuICBAdmlzaWJsZSA9IGZhbHNlXG4gIEBjaGVja1dvcmxkQm91bmRzID0gdHJ1ZVxuICBAYW5nbGUgPSA0NVxuICBAYW5jaG9yLnNldCAwLjVcbiAgQG1hc3MgPSAwLjJcbiAgQGNhbl9raWxsID0gdHJ1ZVxuICBAaCA9IGhcbiAgQHYgPSB2XG5cbiNFWFRFTkRTIFNQUklURSBDTEFTU1xuQnVsbGV0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpXG5CdWxsZXQ6OmNvbnN0cnVjdG9yID0gQnVsbGV0XG5cbiNCVUxMRVQgTU9USU9OIFVQREFURSBMT09QXG5CdWxsZXQ6Om1vdGlvblVwZGF0ZSA9IC0+XG4gICAgIFxuICAgICNidWxsZXRzIHNob3VsZCBtb3ZlIGZhc3RlciB0aGFuIGNoYXJhY3RlcnNcbiAgICBzcGVlZF9tb2RpZmllciA9IHNwZWVkIC8gMlxuICAgIHN3aXRjaCBAaFxuICAgICAgd2hlbiBcImxlZnRcIlxuICAgICAgICBAYm9keS52ZWxvY2l0eS54ID0gLW1vdGlvbiAqIHNwZWVkX21vZGlmaWVyIFxuICAgICAgd2hlbiBcInJpZ2h0XCJcbiAgICAgICAgQGJvZHkudmVsb2NpdHkueCA9IG1vdGlvbiAqIHNwZWVkX21vZGlmaWVyXG4gICAgICAgIFxuICAgIHN3aXRjaCBAdlxuICAgICAgd2hlbiBcInVwXCJcbiAgICAgICAgQGJvZHkudmVsb2NpdHkueSA9IC1tb3Rpb24gKiBzcGVlZF9tb2RpZmllciBcbiAgICAgIHdoZW4gXCJkb3duXCJcbiAgICAgICAgQGJvZHkudmVsb2NpdHkueSA9IG1vdGlvbiAqIHNwZWVkX21vZGlmaWVyXG4gIFxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBFTkVNWSBDTEFTU1xuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuRW5lbXkgPSAoZ2FtZSwgeCwgeSwgc3ByaXRlKS0+XG4gIFBoYXNlci5TcHJpdGUuY2FsbCBALCBnYW1lLCB4LCB5LCBzcHJpdGVcbiAgZ2FtZS5waHlzaWNzLmFyY2FkZS5lbmFibGUgQFxuICBAZ2FtZSA9IGdhbWVcbiAgQGFuY2hvci5zZXQgMC41XG4gIEBjaGVja1dvcmxkQm91bmRzID0gdHJ1ZVxuICBAZXZlbnRzLm9uT3V0T2ZCb3VuZHMuYWRkIEByZXBvc2l0aW9uLCBAXG4gIEBib2R5LmJvdW5jZS54ID0gMVxuICBAYm9keS5ib3VuY2UueSA9IDFcbiAgQGJvZHkuZHJhZy54ID0gMVxuICBAYm9keS5kcmFnLnkgPSAxXG4gIEB0eXBlID0gXy5zYW1wbGUoWzEuLi42XSkgIyByYW5kb20uIHNvbWUgZW5lbWllcyB3aWxsIGZvbGxvdyB0aGUgcGxheWVycywgb3RoZXJzIGp1c3QgbW92ZSBhcm91bmRcbiAgQGNhbl9raWxsID0gdHJ1ZVxuICBAY2FuX3Nob290ID0gdHJ1ZVxuXG4jRVhURU5EUyBTUFJJVEUgQ0xBU1NcbkVuZW15LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpXG5FbmVteTo6Y29uc3RydWN0b3IgPSBFbmVteVxuXG4jRU5FTVkgTU9USU9OIFVQREFURSBMT09QXG5FbmVteTo6bW90aW9uVXBkYXRlID0gLT5cbiAgXG4gICMgbW92ZSBlbmVteSBiYXNlZCBvbiB0eXBlXG4gIHN3aXRjaCBAdHlwZVxuICAgIHdoZW4gMVxuICAgICAgIyBqdXN0IG1vdmUgZG93blxuICAgICAgQGJvZHkudmVsb2NpdHkueSA9IG1vdGlvblxuICAgIHdoZW4gMlxuICAgICAgIyBqdXN0IG1vdmUgbGVmdFxuICAgICAgQGJvZHkudmVsb2NpdHkueCA9IC1tb3Rpb25cbiAgICB3aGVuIDNcbiAgICAgICMganVzdCBtb3ZlIHJpZ2h0XG4gICAgICBAYm9keS52ZWxvY2l0eS54ID0gbW90aW9uXG4gICAgZWxzZVxuICAgICAgI2ZvbGxvdyB0aGUgcGxheWVyXG4gICAgICBAZ2FtZS5waHlzaWNzLmFyY2FkZS5tb3ZlVG9PYmplY3QoQCwgcGxheWVyLCBtb3Rpb24pXG4gICAgICBcbiAgIyBzaG9vdCB0byBraWxsIVxuICBpZiBAY2FuX3Nob290IFxuICAgIEBmaXJlQnVsbGV0KClcbiAgICBAY2FuX3Nob290ID0gZmFsc2VcbiAgICBcbiAgICAjIHJhbmRvbWx5IHRocm90dGxlIGZpcmluZ1xuICAgIEBnYW1lLnRpbWUuZXZlbnRzLmFkZChQaGFzZXIuVGltZXIuU0VDT05EICogQGdhbWUucm5kLmludGVnZXJJblJhbmdlKDMsIDEwKSwgLT5cbiAgICAgIEBjYW5fc2hvb3QgPSB0cnVlXG4gICAgLCB0aGlzKVxuICAgIFxuRW5lbXk6OnJlcG9zaXRpb24gPSAtPlxuICBpZiBAeCA8IDAgdGhlbiBAeCA9IGdhbWUud29ybGQud2lkdGhcbiAgZWxzZSBpZiBAeCA+IGdhbWUud29ybGQud2lkdGggdGhlbiBAeCA9IDBcbiAgZWxzZSBpZiBAeSA8IDAgdGhlbiBAeSA9IGdhbWUud29ybGQuaGVpZ2h0XG4gIGVsc2UgaWYgQHkgPiBnYW1lLndvcmxkLmhlaWdodCB0aGVuIEB5ID0gMFxuXG5FbmVteTo6ZmlyZUJ1bGxldCA9IC0+XG4gIGJ1bGxldCA9IG5ldyBCdWxsZXQgZ2FtZSwgMCwgMCwgZHJhd1NoYXBlKDEwLCAxMCwgJyNmZjAwMDAnKVxuICBlbmVtaWVzX2J1bGxldHMuYWRkIGJ1bGxldFxuICBidWxsZXQucmVzZXQgQHgsIEB5XG4gICMgc2hvb3QgdG93YXJkcyB0aGUgcGxheWVyXG4gIGJ1ZmZlciA9IDEwMFxuICBpZiBwbGF5ZXIueCA8IEB4IC0gYnVmZmVyICB0aGVuIGggPSBcImxlZnRcIlxuICBlbHNlIGlmIHBsYXllci54ID4gQHggKyBidWZmZXIgdGhlbiBoID0gXCJyaWdodFwiXG4gIGVsc2UgaCA9IGZhbHNlXG4gIGlmIHBsYXllci55IDwgQHkgLSBidWZmZXIgdGhlbiB2ID0gXCJ1cFwiXG4gIGVsc2UgaWYgcGxheWVyLnkgPiBAeSArIGJ1ZmZlciB0aGVuIHYgPSBcImRvd25cIlxuICBlbHNlIHYgPSBmYWxzZSBcbiAgYnVsbGV0LmggPSBoXG4gIGJ1bGxldC52ID0gdlxuICBcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgSU5JVFxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg5MDAsIDYwMCwgUGhhc2VyLkFVVE8sIFwiZ2FtZVwiLFxuICBwcmVsb2FkOiBwcmVsb2FkXG4gIGNyZWF0ZTogY3JlYXRlXG4gIHVwZGF0ZTogdXBkYXRlXG4gIHJlbmRlcjogcmVuZGVyXG4pIl19
//# sourceURL=coffeescript