package main

import (
	"os/exec"
	"runtime"
	"time"
	
	l "github.com/mkrs/elf/log"
	"github.com/mkrs/elf/server"
)

func main() {
	go func() {
		chrome := ""
		switch (runtime.GOOS) {
			case "windows":
				chrome = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
			case "darwin":
				chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
		}
		cmd := exec.Command(chrome, /*"--chrome-frame", "--kiosk",*/ "http://localhost:1122")
		select {
			case <-time.After(500 * time.Millisecond):
				err := cmd.Start()
				if err != nil {
					l.Logln("Failed to start chrome:", err)
					l.Logln("Browse to http://localhost:1122")
				}
		}
	}()
	if err := server.ListenAndServe("content"); err != nil {
		l.Logln("Error serving.", err)
	}
	l.Logln("Finished.")
}
