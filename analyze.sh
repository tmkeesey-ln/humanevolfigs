#!/bin/sh

cat ./bower_components/haeckel/bin/haeckel.js src/$1.sh.js | node > bin/$1.json