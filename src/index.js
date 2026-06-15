import EffortSlider from './components/EffortSlider.vue'

export { EffortSlider }

export default {
  install(app) {
    app.component('EffortSlider', EffortSlider)
  }
}
