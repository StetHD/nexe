import { BindingsRewrite } from './bindings-rewrite'

interface FuseBoxFile {
  info: { absPath: string }
  analysis: {
    dependencies: string[]
    requiresRegeneration: boolean
  }
  loadContents(): void
  makeAnalysis(parsingOptions: any, traversalPlugin: {
    plugins: Array<{
      onNode(file: FuseBoxFile, node: any, parent: any): void
      onEnd(file: FuseBoxFile): void
    }>
  }): void
}


export class NativeModulePlugin {
  public test: RegExp
  public limit2Progject = false

  constructor (...moduleNames: string[]) {
    this.test = new RegExp(`node_modules\/(${moduleNames.join('|')}).*\.js`)
  }

  transform (file: FuseBoxFile) {
    const bindingsRewrite = new BindingsRewrite()
    file.loadContents()
    file.makeAnalysis(null, {
      plugins: [{
        onNode(file, node, parent) {
          bindingsRewrite.onNode(file.info.absPath, node, parent)
        },
        onEnd(file) {
          if (bindingsRewrite.rewrite) {
            const index = file.analysis.dependencies.indexOf('bindings')
            if (~index) {
              file.analysis.dependencies.splice(index, 1)
            }
            file.analysis.dependencies.push(...bindingsRewrite.nativeModulePaths)
            file.analysis.requiresRegeneration = true
          }
        }
      }]
    })
  }
}
