<template>
  <div class="giscus-wrapper">
    <div id="giscus-container" ref="giscusContainer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const giscusContainer = ref(null)
const route = useRoute()
const { isDark } = useData()

function loadGiscus() {
  if (!giscusContainer.value) return

  // 清除旧的 giscus 实例
  giscusContainer.value.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', 'AttackingXiang/xiangzi-blog')
  script.setAttribute('data-repo-id', 'R_kgDORzsxZQ')
  script.setAttribute('data-category', 'Announcements')
  script.setAttribute('data-category-id', 'DIC_kwDORzsxZc4C5lgO')  // ← 替换这里
  script.setAttribute('data-mapping', 'pathname')   // 每个页面对应独立评论区
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  script.crossOrigin = 'anonymous'
  script.async = true

  giscusContainer.value.appendChild(script)
}

// 切换亮/暗色主题时同步 giscus
function updateGiscusTheme(dark) {
  const iframe = document.querySelector('iframe.giscus-frame')
  if (!iframe) return
  iframe.contentWindow.postMessage(
    { giscus: { setConfig: { theme: dark ? 'dark' : 'light' } } },
    'https://giscus.app'
  )
}

onMounted(() => {
  loadGiscus()
})

// 切换页面时重新加载评论区
watch(() => route.path, () => {
  loadGiscus()
})

// 跟随站点深色/浅色模式
watch(isDark, (dark) => {
  updateGiscusTheme(dark)
})
</script>

<style scoped>
.giscus-wrapper {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
