package data

import (
	"time"
)

type Mitglied struct {
	Dienstgrad string `json:dienstgrad`
	Name       string `json:name`
	Vorname    string `json:vorname`
}

func NewMitglied(dgr, name, first string) *Mitglied {
	m := new(Mitglied)
	m.Dienstgrad = dgr
	m.Name = name
	m.Vorname = first
	return m
}

type TagebuchEintrag struct {
	Timestamp  time.Time `json:timestamp`
	An         string    `json:an`
	Von        string    `json:von`
	Inhalt     string    `json:inhalt`
	Bearbeiter *Mitglied `json:bearbeiter`
}

func NewTagebuchEintrag(an, von, inhalt string, bearbeiter *Mitglied) *TagebuchEintrag {
	e := new(TagebuchEintrag)
	e.Timestamp = time.Now()
	e.An = an
	e.Von = von
	e.Inhalt = inhalt
	e.Bearbeiter = bearbeiter
	return e
}
