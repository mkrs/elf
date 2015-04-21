package data

import (
	"errors"
	"sync"
	"time"
)

type Project struct {
	id    int
	name  string
	maxId int
	etb   map[int]TagebuchEintrag
	ek    map[int]Einheit
	mutex *sync.Mutex
}

func NewProject(name string) *Project {
	p := &Project{
		id:    NewProjectId(),
		name:  name,
		maxId: 0,
		etb:   make(map[int]TagebuchEintrag),
		ek:    make(map[int]Einheit),
		mutex: new(sync.Mutex),
	}

	addProject(p)

	return p
}

func NewDemoProject(name string) *Project {
	p := NewProject(name)
	tb := NewTagebuchEintrag("EL", "Pumpe Zellerndorf", "Zubringleitung fertig!", "LM Schwayer")
	tb.Timestamp = tb.Timestamp.Add(-5 * time.Minute)
	p.AddTagebuchEintrag(tb)
	tb1 := NewTagebuchEintrag("Pumpe Zellerndorf", "EL", "Wasser Marsch!", "LM Schwayer")
	tb1.Timestamp = tb1.Timestamp.Add(-2 * time.Minute)
	p.AddTagebuchEintrag(tb1)
	n := time.Now()
	now := &n
	t1 := now.Add(-10 * time.Minute)
	t2 := now.Add(-10 * time.Minute)
	t3 := now.Add(-10 * time.Minute)
	p.AddEinheit(NewEinheit(&t1, nil, "Zellerndorf", "Pumpe", 9, 0, 2))
	p.AddEinheit(NewEinheit(&t2, nil, "Zellerndorf", "Kommando", 4, 0, 0))
	p.AddEinheit(NewEinheit(&t3, nil, "Zellerndorf", "Tank", 9, 3, 5))
	return p
}

func (p *Project) NewId() int {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	return p.newIdNoLock()
}

func (p *Project) newIdNoLock() int {
	p.maxId++
	return p.maxId
}

func (p *Project) AddTagebuchEintrag(tb *TagebuchEintrag) error {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	if tb.Id != 0 {
		return errors.New("Entry must not have id.")
	}

	tb.Id = p.newIdNoLock()

	if _, ok := p.etb[tb.Id]; ok {
		return errors.New("Entry with id already exists.")
	}
	p.etb[tb.Id] = *tb
	return nil
}

func (p *Project) AddEinheit(eh *Einheit) error {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	if eh.Id != 0 {
		return errors.New("Einheit must not have id.")
	}

	eh.Id = p.newIdNoLock()

	if _, ok := p.ek[eh.Id]; ok {
		return errors.New("Einheit with id already exists.")
	}
	p.ek[eh.Id] = *eh
	return nil
}

func (p Project) GetTagebuch() []TagebuchEintrag {
	list := []TagebuchEintrag{}
	for k := range p.etb {
		list = append(list, p.etb[k])
	}
	return list
}

func (p Project) GetEinheiten() []Einheit {
	list := []Einheit{}
	for k := range p.ek {
		list = append(list, p.ek[k])
	}
	return list
}

func (p *Project) UpdateTagebuchEintrag(tb TagebuchEintrag) error {
	if _, present := p.etb[tb.Id]; !present {
		return errors.New("UpdateTagebuchEintrag: TagebuchEintrag with id not found.")
	}

	p.etb[tb.Id] = tb
	return nil
}

func (p *Project) UpdateEinheit(e Einheit) error {
	if _, present := p.ek[e.Id]; !present {
		return errors.New("UpdateEinheit: Einheit with id not found.")
	}

	p.ek[e.Id] = e
	return nil
}
