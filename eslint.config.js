import neostandard from 'neostandard'

export default [
  ...neostandard({
    env: [
      'browser',
      'node'
    ]
  }),

  {
    rules: {
      'no-console': process.env.NODE_ENV === 'production'
        ? 'warn'
        : 'off',

      'no-debugger': process.env.NODE_ENV === 'production'
        ? 'warn'
        : 'off'
    }
  }
]
