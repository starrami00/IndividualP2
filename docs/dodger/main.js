title = "Flash Dodge";

description = `
    [TAP] 
  Dodge Lasers 
`;

characters = [
  `
 l
lll
l l
`,
  `
llllll
ll l l
ll l l
llllll
 l  l
 l  l
  `,
  `
llllll
ll l l
ll l l
llllll
ll  ll
  `,
];

options = {
  theme: "crt",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 3,
};

/**
 * @type {{
 * from: Vector, to: Vector, vel: Vector,
 * ticks: number, prevLine: any, isActive: boolean
 * }[]}
 */
let lines;
let activeTicks;
/** @type {{pos: Vector, vel: Vector}[]} */
let stars;
/** @type {{x: number, vx: number}} */
let player;
let multiplier;
// 2 Second delay
let nextLaserTime = 120;
// Warning time in frames before the laser shoots down
let warningTime = 30;
// Flag to track if a warning is currently active 
let isWarning = false; 
// Track if the player moved
let dodgeState = "none"; 
let playerStartPosition;
// Flag to track whether the player can move
let canMove = false; 

function update() {
  if (!ticks) {
    lines = [];
    activeTicks = -1;
    stars = [];
    player = { x: 40, vx: 1 };
    multiplier = 1;
  }
  // Set The Score Tracker
  score = ticks/60;
  // Check if a button is pressed to allow movement
  if (input.isJustPressed) {
    canMove = true;
    // Set the initial movement direction randomly
    dodgeState = rnd() < 0.5 ? "left" : "right";
  }

  if (canMove) {
    // Determine the direction of movement based on dodgeState
    if (dodgeState === "left") {
      // Move left
      player.x -= 2; 
      // Check if the player is at the left edge (Prevents player from moving left if at the end of screen)
      if (player.x < 0) {
        // Set player's position to the left edge
        player.x = 0; 
        // Change chosen direction to right
        dodgeState = "right"; 
      }
    } else if (dodgeState === "right") {
      // Move right
      player.x += 2; 
      // Check if the player is at the right edge (Prevents player from moving right if at the end of screen)
      if (player.x > 99) {
        // Set player's position to the right edge
        player.x = 99; 
        // Change chosen direction to left
        dodgeState = "left"; 
      }
    }

    // Check if the button is released
    if (input.isJustReleased) {
      // Stop the player's movement
      canMove = false; 
    }
  }

  if (nextLaserTime <= 0) {
    // Check if it's time to display a warning
    if (warningTime > 0 && warningTime % 10 === 0) {
      // Toggle warning status every 10 frames
      isWarning = !isWarning; 
      if (isWarning) {
        // Store the player's position
        playerStartPosition = vec(player.x, 87); 
      }
    }  
    // Display warning background
    if (isWarning) {
      color("red");
      rect(0, 0, 100, 90);
    }
    
    if (warningTime === 0) {
      isWarning = false;
      // Use the stored player position
      const startX = playerStartPosition.x; 
      const startY = 0;
      const endY = 90;
      // Create laser line
      lines.push({
        from: vec(startX, startY),
        to: vec(startX, endY),
        vel: vec(0, 1),
        ticks: ceil(30 / difficulty),
        prevLine: undefined,
        isActive: false,
      });
      // Reset dodgeState after creating the laser line
      dodgeState = "none";
      // Reset laser time 
      nextLaserTime = 120;
      // Reset the warning time
      warningTime = 30; 
    } else {
      warningTime--;
    }
  } else {
    nextLaserTime--;
  }
  // Create ground
  color("light_blue");
  rect(0, 90, 100, 10);
  activeTicks--;
  remove(lines, (l) => {
    // Draw laser
    if (l.isActive) {
      color("yellow");
      line(l.from, l.to, 4);
      return activeTicks < 0;
    }
    l.ticks--;
    if (activeTicks > 0) {
      if (l.ticks > 0) {
        stars.push({ pos: vec(l.to), vel: vec(0, -l.to.y * 0.02) });
      }
      return true;
    }
    if (l.ticks > 0) {
      l.to.add(l.vel);
      // Create particles from laser beam
      if (activeTicks < 0 && (l.to.y > 90 || lines.length > 160)) {
        play("laser");
        let al = l;
        color("yellow");
        for (let i = 0; i < 99; i++) {
          particle(al.to, 30, 2);
          al.isActive = true;
          al = al.prevLine;
          if (al == null) {
            break;
          }
        }
        activeTicks = ceil(20 / sqrt(difficulty));
        multiplier = 1;
      }
    } else if (l.ticks === 0) {
      play("hit");
      color("black");
      particle(l.to, 9, 1);
      for (let i = 0; i < rndi(1, 4); i++) {
        lines.push({
          from: vec(l.to),
          to: vec(l.to),
          vel: vec(l.vel)
            .normalize()
            .rotate(rnds(0.7))
            .mul(rnd(0.3, 1) * sqrt(difficulty)),
          ticks: ceil(rnd(20, 40) / difficulty),
          prevLine: l,
          isActive: false,
        });
      }
    }
    color("light_black");
    line(l.from, l.to, 2);
  });
  // Create character
  color("black");
  if (
    char(addWithCharCode("b", floor(ticks / 10) % 2), player.x, 87, {
      mirror: { x: player.vx > 0 ? 1 : -1 },
      // Check if player is hit by laser
    }).isColliding.rect.yellow
  ) {
    play("explosion");
    end();
  }
}