import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'

const vitepressConfig = {
  base: '/xiangzi-blog/',
  title: '我的笔记',
  description: '个人学习笔记与备忘录',
  lang: 'zh-CN',

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: '我的笔记',

    nav: [
      { text: '首页', link: '/' },
      { text: '科学上网', link: '/notes/科学上网/index', activeMatch: '/notes/科学上网/' }
    ],

    socialLinks: [],

    outline: {
      label: '本页目录',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换浅色',
    darkModeSwitchTitle: '切换深色',

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索笔记', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '未找到相关结果',
                resetButtonTitle: '清除',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    }
  }
}

export default defineConfig(
  withSidebar(vitepressConfig, [
    {
      // 扫描 docs/notes 下的所有目录，每个子目录作为一个侧边栏分组
      documentRootPath: '/docs',
      scanStartPath: 'notes',
      resolvePath: '/notes/',
      useTitleFromFrontmatter: true,          // 用 frontmatter 的 title 作为菜单名
      useFolderTitleFromIndexFile: true,      // 用 index.md 的 title 作为分组名
      collapsed: false,
      excludeFiles: ['index.md'],             // 目录首页不出现在侧边栏列表里
      sortMenusByFrontmatterOrder: true,      // 按 frontmatter 的 order 字段排序
      frontmatterOrderDefaultValue: 999,      // 没写 order 的文件排到最后
    }
  ])
)
