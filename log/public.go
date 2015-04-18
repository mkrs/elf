package log

import (
	"fmt"
	"log"
	"runtime"
)

func Logln(args ...interface{}) {
	if pc, file, line, ok := runtime.Caller(1); ok {
		f := runtime.FuncForPC(pc)
		log.Printf("%s:%d (%s) - %s", file, line, f.Name(), fmt.Sprintln(args...))
		return
	}
	log.Println(args...)
}
