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
		Id   int       `json:"id"`
		Ts   time.Time `json:"ts"`
		To   string    `json:"to"`
		From string    `json:"from"`
		Msg  string    `json:"msg"`
		Usr  string    `json:"usr"`
		Edit bool      `json:"edit"`
	} `json:"data"`
}

type UpdateMessage struct {
	c   *Connection
	msg *Message
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

	c := &Connection{
		Sock: conn,
		Send: make(chan *Message),
		Hub:  h,
	}

	return c, nil
}

func (c *Connection) Reader() {
	for {
		_, msgBytes, err := c.Sock.ReadMessage()
		if err != nil {
			break
		}
		// Nachricht verarbeiten
		//l.Logln(string(msgBytes))
		c.handleMessage(msgBytes)
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

func (c *Connection) handleMessage(bs []byte) {
	msg := &Message{}
	//var v interface{}
	if err := json.Unmarshal(bs, &msg); err != nil {
		l.Logln("Error unmarshalling", err)
		return
	}
	l.Logln(msg)

	switch msg.Typ {
	case "dump-etb":
		// TODO
	case "dump-ek":
		// TODO
	case "new-etb":
		// TODO: save data
		c.Broadcast <- msg
	case "update-etb":
		// TODO: save data
		c.Update <- &UpdateMessage{c: c, msg: msg}
	}

}
