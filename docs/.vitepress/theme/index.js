import DefaultTheme from 'vitepress/theme'
import GiscusComment from './GiscusComment.vue'
import { h } from 'vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(GiscusComment)
    })
  }
}
