package data

import (
	"errors"
)

type datamodel struct {
	maxId    int
	projects map[int]*Project
}

var model datamodel = datamodel{maxId: 0, projects: make(map[int]*Project)}

func NewProjectId() int {
	model.maxId++
	return model.maxId
}

func GetProjectById(id int) *Project {
	if p, ok := model.projects[id]; ok {
		return p
	}
	return nil
}

func addProject(p *Project) error {
	if _, ok := model.projects[p.id]; ok {
		return errors.New("Project with id already exists.")
	}
	model.projects[p.id] = p
	return nil
}
