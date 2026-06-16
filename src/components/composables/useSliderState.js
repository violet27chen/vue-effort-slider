import { ref, computed, watch, onBeforeUnmount } from 'vue'

export function useSliderState(options = {}) {
  const {
    initialValue = 70,
    threshold = 100,
    labels = { level1: 'Minimal', level2: 'Low', level3: 'Medium', level4: 'High', level5: 'Max' },
  } = options

  const sliderValue = ref(initialValue)
  const isAnimating = ref(false)
  let timer = null

  /* ── derived state ────────────────────────── */
  const isActive = computed(() => sliderValue.value >= threshold)
  const isFull = computed(() => sliderValue.value === 100)

  const statusLabel = computed(() => {
    const v = sliderValue.value
    if (v < 12.5) return labels.level1
    if (v < 37.5) return labels.level2
    if (v < 62.5) return labels.level3
    if (v < 87.5) return labels.level4
    return labels.level5
  })

  /* ── flip-up animation ────────────────────── */
  function clearAnimation() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
    isAnimating.value = false
  }

  function playFlipUp() {
    clearAnimation()
    isAnimating.value = true
    timer = setTimeout(() => {
      isAnimating.value = false
      timer = null
    }, 460)
  }

  watch(statusLabel, (n, o) => {
    if (n === labels.level5 && o !== labels.level5) playFlipUp()
    else if (n !== labels.level5 && o === labels.level5) clearAnimation()
  })

  /* ── input handler ────────────────────────── */
  function onInput(e) {
    sliderValue.value = parseInt(e.target.value, 10)
  }

  /* ── external sync ────────────────────────── */
  function setValue(v) {
    sliderValue.value = Math.max(0, Math.min(100, parseInt(v, 10)))
  }

  onBeforeUnmount(clearAnimation)

  return {
    sliderValue,
    isActive,
    isFull,
    isAnimating,
    statusLabel,
    onInput,
    setValue,
  }
}
