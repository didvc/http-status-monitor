import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'http-status-monitor',
  description: 'CLI that runs lychee against a URL list and tracks HTTP status/asset changes over time',
  base: '/http-status-monitor/',

  themeConfig: {
    logo: undefined,

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Recipes', link: '/recipes/automation' },
      { text: 'Reference', link: '/reference/comparison' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'CLI Reference', link: '/guide/cli-reference' },
          { text: 'Key Concept', link: '/guide/key-concept' },
        ],
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/architecture/overview' },
          { text: 'Normalization', link: '/architecture/normalization' },
        ],
      },
      {
        text: 'Recipes',
        items: [
          { text: 'Automation', link: '/recipes/automation' },
          { text: 'VictoriaMetrics', link: '/recipes/victoriametrics' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Comparison', link: '/reference/comparison' },
          { text: 'FAQ', link: '/reference/faq' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/didvc/http-status-monitor/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/didvc/http-status-monitor' },
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2026 didvc',
    },
  },
})
