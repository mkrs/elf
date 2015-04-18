package server

import (
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

type wsHandler struct {
}

func newWsHandler() *wsHandler {
	return &wsHandler{}
}

func (h *wsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

}
