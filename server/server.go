package server

import (
	ws "github.com/gorilla/websocket"
	l "github.com/mkrs/elf/log"
	"net/http"
)

func ListenAndServe(rootpath string) error {
	// Static File Handler
	l.Logln(rootpath)
	http.Handle("/", http.FileServer(http.Dir(rootpath)))
	// Websocket Handler
	http.Handle("/ws", newWsHandler())
	// Start Serving
	return http.ListenAndServe("localhost:1122", nil)
}

func newWsHandler() http.Handler {
	s := new(ElfServer)
	s.conns = make(map[*ws.Conn]bool)
	return s
}
