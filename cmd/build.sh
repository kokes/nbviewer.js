#!/bin/bash
js=`cat ../lib/nbv.js | base64 -w 0`
html=`cat ../lib/scaffold.html | base64 -w 0`

cat stub.go | sed "s|%js%|$js|g" | sed "s|%html%|$html|g" > nbview.go

mkdir ../dist

GOOS=windows GOARCH=amd64 go build -ldflags -w -o ../dist/nbview.exe nbview.go
GOOS=darwin GOARCH=amd64 go build -ldflags -w -o ../dist/nbview_darwin nbview.go
GOOS=linux GOARCH=amd64 go build -ldflags -w -o ../dist/nbview_linux nbview.go

rm nbview.go
