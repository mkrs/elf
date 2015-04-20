package main

import (
	l "github.com/mkrs/elf/log"
	"github.com/mkrs/elf/server"
)

func main() {
	if err := server.ListenAndServe("."); err != nil {
		l.Logln("Error serving.", err)
	}
	l.Logln("Finished.")
}
