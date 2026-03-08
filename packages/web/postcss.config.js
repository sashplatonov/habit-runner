import tailwindPostcssPlugin from './postcss/plugins/tailwind-postcss.mjs'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [
    tailwindPostcssPlugin(),
    autoprefixer(),
  ],
};
