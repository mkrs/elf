package server

import (
	"github.com/gorilla/websocket"
)

type Connection struct {
	Sock *websocket.Conn
	Send chan *Message
	Hub  *Hub
}

type Message struct {
	Incoming *Connection
	Content  []byte
}

func NewMessage(c *Connection, msg []byte) *Message {
	return &Message{
		Incoming: c,
		Content:  msg,
	}
}

func (c *Connection) Reader() {
	for {
		_, _, err := c.Sock.ReadMessage()
		if err != nil {
			break
		}
		// Nachricht verarbeiten
	}
	c.Sock.Close()
}

func (c *Connection) Writer() {
	for m := range c.Send {
		if err := c.Sock.WriteMessage(websocket.TextMessage, m.Content); err != nil {
			break
		}
	}
	c.Sock.Close()
}
