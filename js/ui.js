import { DIFFICULTIES, QUALITY_SETTINGS, STORAGE_KEYS } from "./config.js";
import { formatHealth } from "./utils.js";

export class UIController {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.nodes = {
      startScreen: document.querySelector("#startScreen"),
      hud: document.querySelector("#hud"),
      startButton: document.querySelector("#startButton"),
      guideButton: document.querySelector("#guideButton"),
      settingsButton: document.querySelector("#settingsButton"),
      guidePanel: document.querySelector("#guidePanel"),
      settingsPanel: document.querySelector("#settingsPanel"),
      volumeSlider: document.querySelector("#volumeSlider"),
      qualitySelect: document.querySelector("#qualitySelect"),
      bestLevelLabel: document.querySelector("#bestLevelLabel"),
      healthFill: document.querySelector("#healthFill"),
      staminaFill: document.querySelector("#staminaFill"),
      healthText: document.querySelector("#healthText"),
      staminaText: document.querySelector("#staminaText"),
      levelLabel: document.querySelector("#levelLabel"),
      arenaLabel: document.querySelector("#arenaLabel"),
      difficultyLabel: document.querySelector("#difficultyLabel"),
      enemyName: document.querySelector("#enemyName"),
      enemyFill: document.querySelector("#enemyFill"),
      enemyCount: document.querySelector("#enemyCount"),
      weaponName: document.querySelector("#weaponName"),
      comboLabel: document.querySelector("#comboLabel"),
      blockLabel: document.querySelector("#blockLabel"),
      fpsLabel: document.querySelector("#fpsLabel"),
      messageToast: document.querySelector("#messageToast"),
      levelOverlay: document.querySelector("#levelOverlay"),
      levelOverline: document.querySelector("#levelOverline"),
      levelTitle: document.querySelector("#levelTitle"),
      levelStory: document.querySelector("#levelStory"),
      nextLevelButton: document.querySelector("#nextLevelButton"),
      pauseOverlay: document.querySelector("#pauseOverlay"),
      resumeButton: document.querySelector("#resumeButton"),
      restartPauseButton: document.querySelector("#restartPauseButton"),
      backToMenuButton: document.querySelector("#backToMenuButton"),
      gameOverOverlay: document.querySelector("#gameOverOverlay"),
      gameOverText: document.querySelector("#gameOverText"),
      restartButton: document.querySelector("#restartButton"),
      gameOverMenuButton: document.querySelector("#gameOverMenuButton"),
      victoryOverlay: document.querySelector("#victoryOverlay"),
      victoryRestartButton: document.querySelector("#victoryRestartButton"),
      victoryMenuButton: document.querySelector("#victoryMenuButton")
    };

    this.hudCache = new Map();
    this.bindEvents();
  }

  bindEvents() {
    this.nodes.startButton.addEventListener("click", () => this.callbacks.onStart());
    this.nodes.guideButton.addEventListener("click", () => this.togglePanel("guidePanel"));
    this.nodes.settingsButton.addEventListener("click", () => this.togglePanel("settingsPanel"));
    this.nodes.nextLevelButton.addEventListener("click", () => this.callbacks.onNextLevel());
    this.nodes.resumeButton.addEventListener("click", () => this.callbacks.onResume());
    this.nodes.restartPauseButton.addEventListener("click", () => this.callbacks.onRestart());
    this.nodes.backToMenuButton.addEventListener("click", () => this.callbacks.onMenu());
    this.nodes.restartButton.addEventListener("click", () => this.callbacks.onRestart());
    this.nodes.gameOverMenuButton.addEventListener("click", () => this.callbacks.onMenu());
    this.nodes.victoryRestartButton.addEventListener("click", () => this.callbacks.onRestart());
    this.nodes.victoryMenuButton.addEventListener("click", () => this.callbacks.onMenu());

    document.querySelectorAll(".close-panel").forEach((button) => {
      button.addEventListener("click", () => this.hidePanel(button.dataset.close));
    });

    document.querySelectorAll("input[name='difficulty']").forEach((input) => {
      input.addEventListener("change", () => this.callbacks.onDifficultyChanged(this.getDifficulty()));
    });

    this.nodes.volumeSlider.addEventListener("input", () => {
      this.callbacks.onSettingsChanged(this.getSettings());
    });
    this.nodes.qualitySelect.addEventListener("change", () => {
      this.callbacks.onSettingsChanged(this.getSettings());
    });
  }

  togglePanel(panelName) {
    const panel = this.nodes[panelName];
    const isHidden = panel.classList.contains("hidden");
    this.hidePanel("guidePanel");
    this.hidePanel("settingsPanel");
    panel.classList.toggle("hidden", !isHidden);
  }

  hidePanel(panelName) {
    this.nodes[panelName].classList.add("hidden");
  }

  getDifficulty() {
    return document.querySelector("input[name='difficulty']:checked")?.value ?? "normal";
  }

  setDifficulty(value) {
    const fallback = DIFFICULTIES[value] ? value : "normal";
    const input = document.querySelector(`input[name='difficulty'][value='${fallback}']`);
    input.checked = true;
  }

  getSettings() {
    return {
      volume: Number(this.nodes.volumeSlider.value),
      quality: QUALITY_SETTINGS[this.nodes.qualitySelect.value] ? this.nodes.qualitySelect.value : "low"
    };
  }

  setSettings(settings) {
    this.nodes.volumeSlider.value = settings.volume ?? 0.65;
    this.nodes.qualitySelect.value = settings.quality ?? "low";
  }

  loadStoredPreferences() {
    const difficulty = localStorage.getItem(STORAGE_KEYS.difficulty) ?? "normal";
    this.setDifficulty(difficulty);

    try {
      const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) ?? "{}");
      this.setSettings(settings);
    } catch {
      this.setSettings({ volume: 0.65, quality: "low" });
    }
  }

  updateBestLevel(totalLevels) {
    const best = Number(localStorage.getItem(STORAGE_KEYS.bestLevel) ?? 0);
    this.nodes.bestLevelLabel.textContent =
      best > 0 ? `Level ${Math.min(best, totalLevels)} von ${totalLevels}` : "Noch kein Fortschritt";
  }

  showStart() {
    this.hideAllOverlays();
    this.nodes.hud.classList.add("hidden");
    this.nodes.startScreen.classList.add("active");
  }

  showGame() {
    this.nodes.startScreen.classList.remove("active");
    this.nodes.hud.classList.remove("hidden");
  }

  hideAllOverlays() {
    this.nodes.levelOverlay.classList.add("hidden");
    this.nodes.pauseOverlay.classList.add("hidden");
    this.nodes.gameOverOverlay.classList.add("hidden");
    this.nodes.victoryOverlay.classList.add("hidden");
  }

  updateHUD({ player, level, levelIndex, difficultyId, targetEnemy, enemiesAlive, weaponName, comboText }) {
    const healthPercent = (player.health / player.maxHealth) * 100;
    const staminaPercent = (player.stamina / player.maxStamina) * 100;
    this.setStyleWidth(this.nodes.healthFill, "healthFill", `${Math.max(0, healthPercent)}%`);
    this.setStyleWidth(this.nodes.staminaFill, "staminaFill", `${Math.max(0, staminaPercent)}%`);
    this.setText(this.nodes.healthText, "healthText", formatHealth(player.health, player.maxHealth));
    this.setText(this.nodes.staminaText, "staminaText", formatHealth(player.stamina, player.maxStamina));
    this.setText(this.nodes.levelLabel, "levelLabel", `Level ${levelIndex + 1}`);
    this.setText(this.nodes.arenaLabel, "arenaLabel", level.name);
    this.setText(this.nodes.difficultyLabel, "difficultyLabel", DIFFICULTIES[difficultyId].label);
    this.setText(this.nodes.weaponName, "weaponName", weaponName);
    this.setText(this.nodes.comboLabel, "comboLabel", comboText);
    this.setText(this.nodes.blockLabel, "blockLabel", player.isBlocking ? "Block aktiv" : "Block frei");

    if (targetEnemy) {
      this.setText(this.nodes.enemyName, "enemyName", targetEnemy.name);
      this.setStyleWidth(
        this.nodes.enemyFill,
        "enemyFill",
        `${Math.max(0, (targetEnemy.health / targetEnemy.maxHealth) * 100)}%`
      );
    } else {
      this.setText(this.nodes.enemyName, "enemyName", "Kein Gegner");
      this.setStyleWidth(this.nodes.enemyFill, "enemyFill", "0%");
    }
    this.setText(this.nodes.enemyCount, "enemyCount", `${enemiesAlive} Gegner`);
  }

  updateFPS(fps) {
    this.setText(this.nodes.fpsLabel, "fpsLabel", `FPS ${fps}`);
  }

  setText(node, key, value) {
    if (this.hudCache.get(key) === value) {
      return;
    }
    this.hudCache.set(key, value);
    node.textContent = value;
  }

  setStyleWidth(node, key, value) {
    if (this.hudCache.get(key) === value) {
      return;
    }
    this.hudCache.set(key, value);
    node.style.width = value;
  }

  showLevelComplete(level, isFinalLevel) {
    this.hideAllOverlays();
    this.nodes.levelOverline.textContent = isFinalLevel ? "Letzter Schwur erfuellt" : "Eidfeuer entfacht";
    this.nodes.levelTitle.textContent = level.name + " gemeistert";
    this.nodes.levelStory.textContent = level.victory;
    this.nodes.nextLevelButton.textContent = isFinalLevel ? "Sieg ansehen" : "Naechstes Level";
    this.nodes.levelOverlay.classList.remove("hidden");
  }

  showPause() {
    this.hideAllOverlays();
    this.nodes.pauseOverlay.classList.remove("hidden");
  }

  showGameOver(levelName) {
    this.hideAllOverlays();
    this.nodes.gameOverText.textContent = `Du bist in der Arena "${levelName}" gefallen.`;
    this.nodes.gameOverOverlay.classList.remove("hidden");
  }

  showVictory() {
    this.hideAllOverlays();
    this.nodes.victoryOverlay.classList.remove("hidden");
  }

  toast(message, duration = 2200) {
    clearTimeout(this.toastTimer);
    this.nodes.messageToast.textContent = message;
    this.nodes.messageToast.classList.remove("hidden");
    this.toastTimer = window.setTimeout(() => {
      this.nodes.messageToast.classList.add("hidden");
    }, duration);
  }
}
