package main

import (
	l "github.com/mkrs/elf/log"
	"github.com/mkrs/elf/server"
)

func main() {
	if err := server.ListenAndServe("/Users/mkrs/go/src/github.com/mkrs/elf/content"); err != nil {
		l.Logln("Error serving.", err)
	}
	l.Logln("Finished.")
}
