import postcss from 'postcss'
import * as tailwindCss from 'tailwindcss'
import tailwindCssDefault from 'tailwindcss'

const createTailwindPostcssPlugin = (options = {}) => {
  const compile =
    tailwindCss.compile ??
    tailwindCssDefault.compile ??
    tailwindCssDefault.default?.compile

  // Tailwind v3 fallback: use its built-in PostCSS plugin directly.
  if (typeof compile !== 'function') {
    if (typeof tailwindCssDefault === 'function') {
      return tailwindCssDefault(options)
    }
    if (typeof tailwindCssDefault?.default === 'function') {
      return tailwindCssDefault.default(options)
    }
    throw new Error('Unable to resolve Tailwind PostCSS plugin for this runtime')
  }

  const compiledCache = new Map()

  return {
    postcssPlugin: 'tailwindcss',
    async Once(root, { result }) {
      const sourceCss = root.source?.input.css ?? root.toString()
      const cacheKey = `${result.opts.from ?? 'unknown'}:${sourceCss}`

      if (compiledCache.has(cacheKey)) {
        root.removeAll()
        root.append(
          postcss.parse(compiledCache.get(cacheKey), {
            from: result.opts.from ?? root.source?.input.file,
          })
        )
        return
      }

      const compileResult = await compile(sourceCss, {
        ...options,
        from: result.opts.from ?? root.source?.input.file ?? undefined,
      })
      const compiledCss = compileResult.build([])
      const parsedCss = postcss.parse(compiledCss, {
        from: result.opts.from ?? root.source?.input.file,
      })

      compiledCache.set(cacheKey, compiledCss)

      root.removeAll()
      root.append(parsedCss)
    },
  }
}

createTailwindPostcssPlugin.postcss = true

export default createTailwindPostcssPlugin
