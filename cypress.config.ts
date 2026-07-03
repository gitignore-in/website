import createBundler from '@bahmutov/cypress-esbuild-preprocessor'
import codeCoverageTask from '@cypress/code-coverage/task'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    setupNodeEvents(on, config) {
      on('file:preprocessor', createBundler())
      codeCoverageTask(on, config)
      return config
    },
  },
})
