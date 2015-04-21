package server

import (
	d "github.com/mkrs/elf/data"
)

type Message struct {
	Typ  string                 `json:"typ"`
	Data map[string]interface{} `json:"data"`
}

type UpdateMessage struct {
	c   *Connection
	msg *Message
}

func NewTagebuchMessage(tb d.TagebuchEintrag) *Message {
	m := new(Message)
	m.Typ = "init-etb"
	m.Data = make(map[string]interface{})
	m.Data["id"] = tb.Id
	m.Data["ts"] = tb.Timestamp
	m.Data["to"] = tb.An
	m.Data["from"] = tb.Von
	m.Data["msg"] = tb.Inhalt
	m.Data["usr"] = tb.Bearbeiter
	m.Data["edit"] = false
	return m
}

func NewEinheitMessage(e d.Einheit) *Message {
	m := new(Message)
	m.Typ = "init-ek"
	m.Data = make(map[string]interface{})
	m.Data["id"] = e.Id
	m.Data["from"] = e.From
	m.Data["to"] = e.To
	m.Data["fw"] = e.Feuerwehr
	m.Data["fzg"] = e.Fahrzeug
	m.Data["ppl"] = e.Mitglieder
	m.Data["atsg"] = e.AtsGeraete
	m.Data["atst"] = e.AtsTraeger
	return m
}
