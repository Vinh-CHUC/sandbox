import { Application, Assets, Sprite } from "pixi.js";
import { Queue } from "./queue/model";
import { createQueueView } from "./queue/view";

const QUEUE_LENGTH = 8;
const POP_INTERVAL_MS = 1500;

const randomColor = () => Math.floor(Math.random() * 0xffffff);

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Conveyor-belt queue: head on the left, popped into the processor
  const queue = new Queue();
  for (let i = 0; i < QUEUE_LENGTH; i++) queue.push(randomColor());
  let lastPopAt = performance.now();
  const queueView = createQueueView({ boxSize: 48, gap: 12 });
  queueView.root.position.set(120, 80);
  app.stage.addChild(queueView.root);

  app.ticker.add(() => {
    const now = performance.now();
    if (now - lastPopAt >= POP_INTERVAL_MS) {
      if (queue.pop(now) !== undefined) queue.push(randomColor());
      lastPopAt = now;
    }
    queueView.render(queue, now);
  });

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });
})();
