export class InputController {
  constructor() {
    this.keys = new Set();
    this.attackQueued = false;
    this.mouseBlock = false;
    this.pointerLocked = false;
    this.mouseDelta = { x: 0, y: 0 };
    this.onPauseRequested = () => {};

    this.handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === "escape") {
        this.onPauseRequested();
        return;
      }
      this.keys.add(key);
    };

    this.handleKeyUp = (event) => {
      this.keys.delete(event.key.toLowerCase());
    };

    this.handleMouseDown = (event) => {
      if (!this.acceptsMouseInput(event)) {
        return;
      }
      if (event.button === 0) {
        this.attackQueued = true;
      }
      if (event.button === 2) {
        this.mouseBlock = true;
      }
    };

    this.handleMouseUp = (event) => {
      if (event.button === 2) {
        this.mouseBlock = false;
      }
    };

    this.handleMouseMove = (event) => {
      if (!this.pointerLocked) {
        return;
      }
      this.mouseDelta.x += event.movementX;
      this.mouseDelta.y += event.movementY;
    };

    this.handlePointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    };

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("pointerlockchange", this.handlePointerLockChange);
    window.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.canvas.addEventListener("click", () => this.requestPointerLock());
  }

  acceptsMouseInput(event) {
    return this.pointerLocked || event.target === this.canvas;
  }

  requestPointerLock() {
    if (this.canvas && document.pointerLockElement !== this.canvas) {
      const lockRequest = this.canvas.requestPointerLock?.();
      lockRequest?.catch?.(() => {
        this.pointerLocked = false;
      });
    }
  }

  releasePointerLock() {
    if (document.pointerLockElement) {
      const exitRequest = document.exitPointerLock?.();
      exitRequest?.catch?.(() => {
        this.pointerLocked = false;
      });
    }
  }

  isDown(key) {
    return this.keys.has(key.toLowerCase());
  }

  isBlocking() {
    return this.mouseBlock || this.isDown("shift");
  }

  consumeAttack() {
    const queued = this.attackQueued;
    this.attackQueued = false;
    return queued;
  }

  consumeMouseDelta() {
    const delta = { ...this.mouseDelta };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  getMoveVector() {
    const forward = (this.isDown("w") ? 1 : 0) - (this.isDown("s") ? 1 : 0);
    const strafe = (this.isDown("d") ? 1 : 0) - (this.isDown("a") ? 1 : 0);
    return { forward, strafe };
  }
}
