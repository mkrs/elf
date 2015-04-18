package server

type Hub struct {
	Connections map[*Connection]bool
	Broadcast   chan *Message
	Register    chan *Connection
	Unregister  chan *Connection
}

func NewHub() *Hub {
	return &Hub{
		Connections: make(map[*Connection]bool),
		Broadcast:   make(chan *Message),
		Register:    make(chan *Connection),
		Unregister:  make(chan *Connection),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case c := <-h.Register:
			h.Connections[c] = true
		case c := <-h.Unregister:
			if _, ok := h.Connections[c]; ok {
				delete(h.Connections, c)
				close(c.Send)
			}
		case m := <-h.Broadcast:
			for c := range h.Connections {
				select {
				case c.Send <- m:
				default:
					delete(h.Connections, c)
					close(c.Send)
				}
			}
		}
	}
}
