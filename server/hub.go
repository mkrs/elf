package server

type Hub struct {
	Connections map[*connection]bool
	Broadcast   chan []byte
	Register    chan *connection
	Unregister  chan *connection
}

func NewHub() *Hub {
	return &Hub{
		Connections: make(map[*connection]boot),
		Broadcast:   make(chan []byte),
		Register:    make(chan *connection),
		Unregister:  make(chan *connection),
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
