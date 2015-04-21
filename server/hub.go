package server

type Hub struct {
	Connections map[*Connection]bool
	Broadcast   chan *Message
	Update      chan *UpdateMessage
	Register    chan *Connection
	Unregister  chan *Connection
}

func NewHub() *Hub {
	return &Hub{
		Connections: make(map[*Connection]bool),
		Broadcast:   make(chan *Message),
		Update:      make(chan *UpdateMessage),
		Register:    make(chan *Connection),
		Unregister:  make(chan *Connection),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.Register:
			h.Connections[c] = true
			h.initConnectionWithData(c)
		case c := <-h.Unregister:
			if _, ok := h.Connections[c]; ok {
				h.endConnection(c)
			}
		case m := <-h.Broadcast:
			h.broadcast(m, nil)
		case u := <-h.Update:
			h.broadcast(u.msg, u.c)
		}
	}
}

func (h *Hub) endConnection(c *Connection) {
	delete(h.Connections, c)
	close(c.Send)
}

func (h *Hub) broadcast(m *Message, conn *Connection) {
	for c := range h.Connections {
		if c == conn {
			continue
		}
		select {
		case c.Send <- m:
		default:
			h.endConnection(c)
		}
	}
}

func (h *Hub) initConnectionWithData(c *Connection) {
	etb := demoProject.GetTagebuch()
	for _, tb := range etb {
		c.Send <- NewTagebuchMessage(tb)
	}
	ek := demoProject.GetEinheiten()
	for _, k := range ek {
		c.Send <- NewEinheitMessage(k)
	}
}
