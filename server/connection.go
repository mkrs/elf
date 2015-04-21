package server

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	d "github.com/mkrs/elf/data"
	l "github.com/mkrs/elf/log"
	"net/http"
)

type Connection struct {
	Sock *websocket.Conn
	Send chan *Message
	*Hub
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
	if err := json.Unmarshal(bs, &msg); err != nil {
		l.Logln("Error unmarshalling", err)
		return
	}
	l.Logln(msg, string(bs))

	switch msg.Typ {
	case "dump-etb":
		// TODO
	case "dump-ek":
		// TODO
	case "new-etb":
		if tb, err := d.NewTagebuchEintragFromMap(msg.Data); err == nil {
			if err := demoProject.AddTagebuchEintrag(tb); err != nil {
				l.Logln(err)
				return
			}
			c.Broadcast <- NewTagebuchMessage(*tb)
		} else {
			l.Logln(err)
		}
	case "update-etb":
		if tb, err := d.NewTagebuchEintragFromMap(msg.Data); err == nil {
			if err := demoProject.UpdateTagebuchEintrag(*tb); err != nil {
				l.Logln(err)
				return
			}
			c.Broadcast <- NewTagebuchMessage(*tb)
		} else {
			l.Logln(err)
		}
	case "update-ek":
		if e, err := d.NewEinheitFromMap(msg.Data); err == nil {
			if err := demoProject.UpdateEinheit(*e); err != nil {
				l.Logln(err)
				return
			}
			c.Broadcast <- NewEinheitMessage(*e)
		} else {
			l.Logln(err)
		}
	}

}
