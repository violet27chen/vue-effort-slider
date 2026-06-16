import EffortSlider from './components/EffortSlider.vue'
import { useSliderState } from './components/composables/useSliderState'
import { useWebglFire } from './components/composables/useWebglFire'
import * as shaders from './components/shaders/index'

export { EffortSlider, useSliderState, useWebglFire, shaders }

export default {
  install(app) {
    app.component('EffortSlider', EffortSlider)
  }
}
