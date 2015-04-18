package server

import (
	"github.com/gorilla/websocket"
)

type Connection struct {
	Sock *websocket.Conn
	Send chan []byte
	Hub  *Hub
}

func (c *Connection) Reader() {
	for {
		typ, msg, err := c.Sock.ReadMessage()
		if err != nil {
			break
		}
		// Nachricht verarbeiten
	}
	c.Sock.Close()
}

func (c *Connection) Writer() {
	for msg := range c.Send {
		if err := c.Sock.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
	c.Sock.Close()
}
