/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['../src'],
  excludeExternals: true,
  excludePrivate: true,
  excludeProtected: true,
  excludeInternal: true,
  out: '../build/typedocs',
  entryPointStrategy: 'expand',
}
