<template>
  <svg class="squircle-clip" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <clipPath :id="clipId" clipPathUnits="objectBoundingBox">
        <path
          d="M 0.053,0
             C 0.029,0 0.012,0.008 0.005,0.02
             C 0.002,0.028 0,0.038 0,0.053
             L 0,0.947
             C 0,0.962 0.002,0.972 0.005,0.98
             C 0.012,0.992 0.029,1 0.053,1
             L 0.947,1
             C 0.971,1 0.988,0.992 0.995,0.98
             C 0.998,0.972 1,0.962 1,0.947
             L 1,0.053
             C 1,0.038 0.998,0.028 0.995,0.02
             C 0.988,0.008 0.971,0 0.947,0
             Z"
        />
      </clipPath>
      <clipPath :id="clipTrackId" clipPathUnits="objectBoundingBox">
        <path
          d="M 0.033,0
             C 0.018,0 0.007,0.012 0.003,0.035
             C 0.001,0.055 0,0.1 0,0.15
             L 0,0.85
             C 0,0.9 0.001,0.945 0.003,0.965
             C 0.007,0.988 0.018,1 0.033,1
             L 0.967,1
             C 0.982,1 0.993,0.988 0.997,0.965
             C 0.999,0.945 1,0.9 1,0.85
             L 1,0.15
             C 1,0.1 0.999,0.055 0.997,0.035
             C 0.993,0.012 0.982,0 0.967,0
             Z"
        />
      </clipPath>
    </defs>
  </svg>

  <div class="card-shadow" :style="shadowStyle">
    <div class="card" :style="cardStyle">
      <div class="header">
        <div class="header-left">
          <span class="label-text" :style="{ color: labelColor }">{{ label }}</span>
          <span
            class="status-text"
            :class="{ glowing: isActive, 'animate-up': isAnimating }"
            :style="statusTextStyle"
          >
            {{ statusLabel }}
          </span>
        </div>
        <div v-if="showHelp" ref="helpBtnRef" class="help-btn" :style="{ color: helpIconColor }" @click="toggleHelp">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
      </div>

      <div class="scale-labels" :style="{ color: scaleLabelColor }">
        <span>{{ scaleLabels[0] }}</span>
        <span>{{ scaleLabels[1] }}</span>
      </div>

      <div class="track-wrapper"
           :class="{ active: isActive, full: isFull }"
           :style="trackClip">
        <div class="track-bg"></div>
        <div class="dots-layer">
          <span class="dot" v-for="i in 5" :key="i"></span>
        </div>
        <canvas ref="canvasRef" :style="canvasMask"></canvas>
        <input
          type="range" min="0" max="100" step="1"
          :value="displayValue"
          :class="{ glowing: isActive }"
          @input="handleInput"
          @change="handleChange"
        />
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showTooltip && helpBtnRef" class="help-tooltip" :style="tooltipStyle">
      <span>{{ helpText }}</span>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSliderState } from './composables/useSliderState'
import { useWebglFire } from './composables/useWebglFire'

/* ── props ────────────────────────────────── */
const props = defineProps({
  modelValue:     { type: Number,  default: 75 },
  width:          { type: [String, Number], default: 376 },
  label:          { type: String,  default: 'Slider' },
  threshold:      { type: Number,  default: 100 },
  scaleLabels:    { type: Array,   default: () => ['Faster', 'Smarter'] },
  statusLabels:   { type: Object,  default: () => ({ level1: 'Minimal', level2: 'Low', level3: 'Medium', level4: 'High', level5: 'Max' }) },
  background:     { type: String,  default: '#000000' },
  borderRadius:   { type: [String, Number], default: 20 },
  showHelp:       { type: Boolean, default: true },
  helpText:       { type: String,  default: '这是一个 Effort 滑块组件' },
  labelColor:     { type: String,  default: '#b0b0c7' },
  statusColor:    { type: String,  default: '#a1a1aa' },
  activeColor:    { type: String,  default: '#c084fc' },
  highlightColor: { type: String,  default: '#c084fc' },
  scaleLabelColor:{ type: String,  default: '#b0b0b8' },
  helpIconColor:  { type: String,  default: '#a1a1aa' },
  trailColor:     { type: String,  default: '#a857f7' },
  thumbColor:     { type: String,  default: '#ffffff' },
  trackColor:     { type: String,  default: '#0c0c0c' },
  dotColor:       { type: String,  default: '#494950' },
})

const emit = defineEmits(['update:modelValue', 'change', 'help'])

/* ── help tooltip ─────────────────────────── */
const showTooltip = ref(false)
const helpBtnRef = ref(null)

function toggleHelp(e) {
  e.stopPropagation()
  showTooltip.value = !showTooltip.value
  emit('help')
}

function closeHelp(e) {
  if (showTooltip.value && helpBtnRef.value && !helpBtnRef.value.contains(e.target) && !isTooltipElement(e.target)) {
    showTooltip.value = false
  }
}

const tooltipStyle = computed(() => {
  if (!helpBtnRef.value) return {}
  const rect = helpBtnRef.value.getBoundingClientRect()
  return {
    position: 'fixed',
    left: `${rect.right}px`,
    top: `${rect.top - 8}px`,
    transform: 'translate(-100%, -100%)',
  }
})

function isTooltipElement(el) {
  return el && el.closest && el.closest('.help-tooltip')
}

/* ── slider state ─────────────────────────── */
const { sliderValue, isActive, isFull, isAnimating, statusLabel, onInput, setValue } =
  useSliderState({
    initialValue: props.modelValue,
    threshold: props.threshold,
    labels: props.statusLabels,
  })

/* ── snap-to-step animation ───────────────── */
const displayValue = ref(sliderValue.value)
let snapId = null

function cancelSnap() {
  if (snapId != null) { cancelAnimationFrame(snapId); snapId = null }
}

function snapToNearest() {
  cancelSnap()
  const target = Math.round(displayValue.value / 25) * 25
  const start = displayValue.value
  if (target === start) return
  const t0 = performance.now()
  const duration = 220

  function tick(now) {
    const p = Math.min((now - t0) / duration, 1)
    const ease = 1 - Math.pow(1 - p, 3)          // ease-out cubic
    const v = Math.round(start + (target - start) * ease)
    displayValue.value = v
    sliderValue.value = v
    if (p < 1) {
      snapId = requestAnimationFrame(tick)
    } else {
      snapId = null
      emit('update:modelValue', target)
      emit('change', target)
    }
  }
  snapId = requestAnimationFrame(tick)
}

onBeforeUnmount(cancelSnap)

/* ── v-model sync ─────────────────────────── */
watch(() => props.modelValue, (v) => {
  if (v !== sliderValue.value) {
    cancelSnap()
    setValue(v)
    displayValue.value = Math.max(0, Math.min(100, parseInt(v, 10)))
  }
})

function handleInput(e) {
  cancelSnap()
  onInput(e)
  displayValue.value = sliderValue.value
  emit('update:modelValue', sliderValue.value)
}

function handleChange() {
  snapToNearest()
}

/* ── clip-path IDs ────────────────────────── */
const uid = Math.random().toString(36).slice(2, 8)
const clipId = `squircle-${uid}`
const clipTrackId = `squircle-track-${uid}`

const cardClip = computed(() => ({ clipPath: `url(#${clipId})` }))
const trackClip = computed(() => ({ clipPath: `url(#${clipTrackId})` }))

/* ── dynamic styles from props ────────────── */
const widthPx = computed(() =>
  typeof props.width === 'number' ? `${props.width}px` : props.width
)
const radiusPx = computed(() =>
  typeof props.borderRadius === 'number' ? `${props.borderRadius}px` : props.borderRadius
)

const shadowStyle = computed(() => ({
  filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.2)) drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
  transition: 'filter 0.2s ease',
}))

const cardStyle = computed(() => ({
  ...cardClip.value,
  background: props.background,
  width: widthPx.value,
  borderRadius: radiusPx.value,
  '--active-color': props.highlightColor,
  '--thumb-color': props.thumbColor,
  '--track-color': props.trackColor,
  '--dot-color': props.dotColor,
}))

const statusTextStyle = computed(() => {
  if (isActive.value) {
    return {
      color: props.activeColor,
      textShadow: `0 0 12px ${props.activeColor}99`,
    }
  }
  return { color: props.statusColor }
})

const canvasMask = computed(() => {
  const p = Math.min(displayValue.value + 2, 100)
  return {
    maskImage: `linear-gradient(to right, black 0%, black ${p}%, transparent ${p}%)`,
    WebkitMaskImage: `linear-gradient(to right, black 0%, black ${p}%, transparent ${p}%)`,
  }
})

/* ── close help on outside click ───────────── */
onMounted(() => {
  document.addEventListener('click', closeHelp)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeHelp)
})

/* ── webgl engine ─────────────────────────── */
const canvasRef = ref(null)
useWebglFire(canvasRef, sliderValue, isActive, () => props.trailColor)
</script>

<style scoped>
.squircle-clip {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

.card-shadow {
  transition: filter 0.2s ease;
}

.card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px 20px 16px;
  user-select: none;
  font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 16px;
  font-weight: 500;
  perspective: 280px;
  perspective-origin: center 120%;
}

.label-text {
  font-weight: 700;
  line-height: 1.3;
}

.status-text {
  display: inline-block;
  transition: color 0.3s, text-shadow 0.3s;
  will-change: transform, opacity, filter;
  vertical-align: middle;
  transform-origin: center bottom;
  transform: rotateX(0deg) translateY(0);
}

.status-text.glowing {
  font-weight: 600;
}

@keyframes flipUpFromBottom {
  0% {
    opacity: 0;
    transform: translateY(18px) rotateX(-80deg);
    filter: blur(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateX(0deg);
    filter: blur(0);
  }
}

.status-text.animate-up {
  animation: flipUpFromBottom 0.42s cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

.help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1;
  padding: 0;
  position: relative;
}

.help-btn:hover { color: #d4d4d8; }

.help-btn svg {
  height: 18px;
  width: auto;
  display: block;
  flex-shrink: 0;
  shape-rendering: geometricPrecision;
}

.help-tooltip {
  position: fixed;
  background: #1a1a1e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #d4d4d8;
  white-space: nowrap;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.scale-labels {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 7px;
  letter-spacing: 0.04em;
}

/* ── track ─────────────────────────────────── */
.track-wrapper {
  position: relative;
  height: 30px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #1a1a1e;
  background: var(--track-color);
  isolation: isolate;
}

.track-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--track-color) 85%, #fff), var(--track-color));
  z-index: 0;
}

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: screen;
  z-index: 2;
  transition: opacity 0.3s;
}

.track-wrapper.active canvas {
  opacity: 1;
  z-index: 4;
}

.dots-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--dot-color);
  top: 50%;
  transform: translateY(-50%);
  transition: opacity 0.6s;
}

.track-wrapper.active .dot { opacity: 0.25; }
.track-wrapper.full .dot { opacity: 0; }

.dot:nth-child(1) { left: calc(0% + 14.5px); }
.dot:nth-child(2) { left: calc(25% + 7.25px); }
.dot:nth-child(3) { left: 50%; }
.dot:nth-child(4) { left: calc(75% - 7.25px); }
.dot:nth-child(5) { left: calc(100% - 14.5px); }

/* ── range input ───────────────────────────── */
input[type='range'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  z-index: 5;
  outline: none;
  margin: 0;
  padding: 0;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 29px;
  height: 29px;
  border-radius: 10px;
  background: linear-gradient(170deg, var(--thumb-color) 0%, color-mix(in srgb, var(--thumb-color) 88%, #000) 40%, color-mix(in srgb, var(--thumb-color) 78%, #000) 100%);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.12),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.85),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.06);
  cursor: grab;
  transition: box-shadow 0.4s ease, transform 0.15s ease;
}

input[type='range']::-webkit-slider-thumb:active {
  cursor: grabbing;
  transform: scale(0.95);
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.3), 0 3px 8px rgba(0, 0, 0, 0.15),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

input[type='range'].glowing::-webkit-slider-thumb {
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.12),
    0 0 28px color-mix(in srgb, var(--active-color) 50%, transparent),
    0 0 50px color-mix(in srgb, var(--active-color) 25%, transparent),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.85),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.06);
}

input[type='range'].glowing::-webkit-slider-thumb:active {
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.3), 0 3px 8px rgba(0, 0, 0, 0.15),
    0 0 32px color-mix(in srgb, var(--active-color) 55%, transparent),
    0 0 56px color-mix(in srgb, var(--active-color) 30%, transparent),
    inset 0 0.5px 0 rgba(255, 255, 255, 0.7),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

input[type='range']::-moz-range-thumb {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: linear-gradient(170deg, var(--thumb-color) 0%, color-mix(in srgb, var(--thumb-color) 88%, #000) 40%, color-mix(in srgb, var(--thumb-color) 78%, #000) 100%);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.12);
  cursor: grab;
  transition: box-shadow 0.4s ease;
}

input[type='range']::-moz-range-thumb:active {
  cursor: grabbing;
  transform: scale(0.95);
}

input[type='range'].glowing::-moz-range-thumb {
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.25), 0 6px 16px rgba(0, 0, 0, 0.12),
    0 0 28px color-mix(in srgb, var(--active-color) 50%, transparent),
    0 0 50px color-mix(in srgb, var(--active-color) 25%, transparent);
}

input[type='range'].glowing::-moz-range-thumb:active {
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.2),
    0 1px 3px rgba(0, 0, 0, 0.3), 0 3px 8px rgba(0, 0, 0, 0.15),
    0 0 32px color-mix(in srgb, var(--active-color) 55%, transparent),
    0 0 56px color-mix(in srgb, var(--active-color) 30%, transparent);
}

input[type='range']::-moz-range-track {
  background: transparent;
  border: none;
  height: 30px;
}
</style>
