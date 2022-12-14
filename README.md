# EXPERIMENTAL

DISCLAIMER : if you want the production version please [click on this link](https://github.com/mvahowe/proskomma-js)

# proskomma-core

A Javascript Implementation of the Proskomma Scripture Processing Model.

# Installing and testing the code
```
npm install
npm test
npm run rawTest
TESTSCRIPT=cp_vp npm run oneTest
npm run coverage
```

# Running the code
```
cd scripts
npm run build # Running Proskomma from within the Proskomma repo so need the babel version of files
node do_graph.js ../test/test_data/usx/web_rut_1.usx example_query.txt
node do_graph.js ../test/test_data/usfm/hello.usfm example_query.txt
```

# Documentation
See the project's [ReadtheDocs](https://doc.proskomma.bible)

___

## Using this package with ReactJS or anything that uses a browser

### "Module not found: Error: Can't resolve 'crypto'" (or any modules)

If you run into this problem it's because you're using Webpack 5.  

Know that for the v5 of this package, you'll **need to** explicitly tell it were to find this `crypto` package and many other packages.  
Please see this for more details : https://webpack.js.org/configuration/resolve/#resolvefallback  

tldr : packages like `buffer` or `crypto` (for e.g.) are no longer automatically handled when you're using your app in a browser (that's what we call `polyfill`), so you have to load them yourself in your package.  

Method to solve this problem :
* check in your `webpack.js`
* find the section `resolve { fallback ...`
  * if it's not there, create it like in [this webpack.prod.js](./webpack.prod.js)
* add the line `theNameOfTheNeededPackage: false`
* try to run you app
* if you have the same error
* try to find the right package in npm and install it (e.g. : for `crypto` you'll need `crypto-browserify`)
  * normally it's listed in the link above
* then replace `false` by `require.resolve('theNameOfTheNeededPackage')`

If it doesn't work, I'm afraid you'll have to dig in the webpack documentation for `resolve` : https://webpack.js.org/configuration/resolve/ (or try to find a solution on StackOverflow !)