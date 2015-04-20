package server

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	l "github.com/mkrs/elf/log"
	"net/http"
	"time"
)

type Connection struct {
	Sock *websocket.Conn
	Send chan *Message
	*Hub
}

type Message struct {
	Typ  string `json:"typ"`
	Data struct {
		Ts   time.Time `json:"ts"`
		To   string    `json:"to"`
		From string    `json:"from"`
		Msg  string    `json:"msg"`
		Usr  string    `json:"usr"`
		Edit bool      `json:"edit"`
	} `json:"data"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func NewConnection(w http.ResponseWriter, r *http.Request, h *Hub) (*Connection, error) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return nil, err
	}

	return &Connection{
		Sock: conn,
		Send: make(chan *Message),
		Hub:  h,
	}, nil
}

func (c *Connection) Reader() {
	for {
		_, msgBytes, err := c.Sock.ReadMessage()
		if err != nil {
			break
		}
		// Nachricht verarbeiten
		l.Logln(string(msgBytes))
		msg := new(Message)
		//var v interface{}
		if err := json.Unmarshal(msgBytes, msg); err != nil {
			l.Logln("Error unmarshalling", err)
			continue
		}
		l.Logln(*msg)
		c.Broadcast <- msg
	}
	c.Sock.Close()
}

func (c *Connection) Writer() {
	for m := range c.Send {
		v, err := json.Marshal(m)
		if err != nil {
			break
		}
		if err := c.Sock.WriteMessage(websocket.TextMessage, v); err != nil {
			break
		}
	}
	c.Sock.Close()
}
