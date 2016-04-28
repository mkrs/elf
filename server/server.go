package server

import (
	"fmt"
	"github.com/gorilla/websocket"
	d "github.com/mkrs/elf/data"
	l "github.com/mkrs/elf/log"
	"net/http"
)

var demoProject *d.Project

// ListenAndServe starts the ELF server
func ListenAndServe(rootpath string) error {
	// Demo Project
	demoProject = d.NewProject("Demo")
	// Messaging Hub
	hub := NewHub()
	go hub.Run()
	// Static File Handler
	http.Handle("/", http.FileServer(http.Dir(rootpath)))
	// Websocket Handler
	http.Handle("/ws", newWsHandler(hub))
	// Start Serving
	l.Logln(fmt.Sprintf("Start serving path '%s' ...", rootpath))
	return http.ListenAndServe(":1122", nil)
}

type wsHandler struct {
	*Hub
}

func newWsHandler(hub *Hub) *wsHandler {
	return &wsHandler{Hub: hub}
}

func (h *wsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	//l.Logln("Got request", *r)
	c, err := NewConnection(w, r, h.Hub)
	if _, ok := err.(websocket.HandshakeError); ok {
		http.Error(w, "Not a websocket handshake", 400)
		l.Logln("Not a websocket handshake 400")
		return
	} else if err != nil {
		l.Logln("Could not create connection:", err)
		return
	}

	h.Register <- c
	go c.Writer()
	c.Reader()
}
