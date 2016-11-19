package main

import (
	"encoding/base64"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func main() {
	if len(os.Args) != 2 {
		log.Fatal("Not supplied a filename")
	}

	// read input notebook
	fn := os.Args[1]
	cn, err := ioutil.ReadFile(fn)
	if err != nil {
		log.Fatal(err)
	}

	tdir, err := ioutil.TempDir("", "nb_")
	if err != nil {
		log.Fatal(err)
	}

	dt := map[string][]byte{
		"index.html": []byte(`%html%`),
		"nbv.js":     []byte(`%js%`),
	}

	for fn, vl := range dt {
		pt, _ := base64.StdEncoding.DecodeString(string(vl))
		if err := ioutil.WriteFile(filepath.Join(tdir, fn), pt, 0666); err != nil {
			log.Fatal(err)
		}
	}
	if err := ioutil.WriteFile(filepath.Join(tdir, "notebook.js"), append([]byte("var nb = "), cn...), 0666); err != nil {
		log.Fatal(err)
	}

	// launch browser
	tfn := filepath.Join(tdir, "index.html")

	var eerr error
	switch runtime.GOOS {
	case "windows":
		eerr = exec.Command("cmd", "/c", "start", tfn).Start()
	case "darwin":
		eerr = exec.Command("open", tfn).Start()
	case "linux", "freebsd", "netbsd", "openbsd":
		eerr = exec.Command("xdg-open", tfn).Start()
	default:
		log.Fatalf("%s not supported", runtime.GOOS)
	}
	if eerr != nil {
		log.Fatal(eerr)
	}

}
