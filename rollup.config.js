// Pkg Information
const pkg = require('./package.json');

// Plugins
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const srcScript = pkg.main;

const banner = '/**\n\
* Easy TOC\n\
* Author: ' + pkg.author + '\n\
* Version: ' + pkg.version + '\n\
*/';

// Default
export default [{
  input: srcScript,
  output: {
    file: 'dist/easy-toc.min.js',
    format: 'umd',
    name: 'easy_toc',
    banner: banner
  },
  plugins: [
		resolve(),
		commonjs(),
  	typescript(),
		babel(),
    terser({
			compress: {
				drop_console: true,
				keep_fargs: false,
				typeofs: false
			},
      output: {
        comments: function (node, comment) {
          if (comment.type === "comment2") {
            // multiline comment
            return /\*\sScrollToSmooth/i.test(comment.value);
          }
          return false;
        }
      }
		})
  ]
}];
