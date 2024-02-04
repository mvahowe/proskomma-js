# proskomma

A Javascript Implementation of the Proskomma Scripture Processing Model.

# Installing and testing the code
```
npm install
npm run build
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
