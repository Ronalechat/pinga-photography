import type { StorybookConfig } from '@storybook/react-webpack5'
import path from 'path'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  staticDirs: ['../public'],
  // Resolve the @tokens alias so stories can import from it the same
  // way the components do. (tsconfig paths are not forwarded to webpack
  // automatically when using react-webpack5.)
  webpackFinal: async (webpackConfig) => {
    webpackConfig.resolve = webpackConfig.resolve ?? {}
    webpackConfig.resolve.alias = {
      ...(webpackConfig.resolve.alias ?? {}),
      '@tokens': path.resolve(__dirname, '../tokens'),
      'next/navigation': path.resolve(__dirname, './mocks/next-navigation'),
    }
    return webpackConfig
  },
}

export default config
