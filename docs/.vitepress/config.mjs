import { defineConfig } from 'vitepress'
import { withSidebar } from 'vitepress-sidebar'
import { withMermaid } from 'vitepress-plugin-mermaid'

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
      { text: '科学上网', link: '/notes/科学上网/index', activeMatch: '/notes/科学上网/' },
      { text: 'Vibe Coding', link: '/notes/vibe-coding/index', activeMatch: '/notes/vibe-coding/' },
      { text: 'Claude 源码', link: '/notes/claude源码资源/index', activeMatch: '/notes/claude源码资源/' },
      { text: '智能体学习', link: '/notes/智能体学习/index', activeMatch: '/notes/智能体学习/' }
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

const commonSidebarOptions = {
  documentRootPath: '/docs',
  useTitleFromFrontmatter: true,
  useFolderTitleFromIndexFile: true,
  useFolderLinkFromIndexFile: true,
  collapsed: false,
  excludeFiles: ['index.md'],
  sortMenusByFrontmatterOrder: true,
  frontmatterOrderDefaultValue: 999,
  excludeFilesByFrontmatterFieldName: 'draft',
}

export default withMermaid(defineConfig(
  withSidebar(vitepressConfig, [
    {
      ...commonSidebarOptions,
      scanStartPath: 'notes/科学上网',
      resolvePath: '/notes/科学上网/',
    },
    {
      ...commonSidebarOptions,
      scanStartPath: 'notes/vibe-coding',
      resolvePath: '/notes/vibe-coding/',
    },
    {
      ...commonSidebarOptions,
      scanStartPath: 'notes/claude源码资源',
      resolvePath: '/notes/claude源码资源/',
    },
    {
      ...commonSidebarOptions,
      scanStartPath: 'notes/智能体学习',
      resolvePath: '/notes/智能体学习/',
    },
  ])
))
