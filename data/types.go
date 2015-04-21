package data

import (
	"errors"
	"fmt"
	"time"
)

/*type Mitglied struct {
	Dienstgrad string `json:"dienstgrad"`
	Name       string `json:"name"`
	Vorname    string `json:"vorname"`
}

func NewMitglied(dgr, name, first string) *Mitglied {
	m := new(Mitglied)
	m.Dienstgrad = dgr
	m.Name = name
	m.Vorname = first
	return m
}*/

type TagebuchEintrag struct {
	Id         int       `json:"id"`
	Timestamp  time.Time `json:"ts"`
	An         string    `json:"to"`
	Von        string    `json:"from"`
	Inhalt     string    `json:"msg"`
	Bearbeiter string    `json:"usr"`
}

func NewTagebuchEintrag(an, von, inhalt, bearbeiter string) *TagebuchEintrag {
	e := new(TagebuchEintrag)
	e.Timestamp = time.Now()
	e.An = an
	e.Von = von
	e.Inhalt = inhalt
	e.Bearbeiter = bearbeiter
	return e
}

func NewTagebuchEintragFromMap(data map[string]interface{}) (*TagebuchEintrag, error) {
	e := new(TagebuchEintrag)
	// id is allowed to be absent for new element
	if d, present := data["id"]; present {
		if x, ok := d.(float64); ok {
			e.Id = int(x)
		} else {
			return nil, errors.New("Error in type conversion of field 'id'.")
		}
	}
	if x, ok := data["ts"].(string); ok {
		if err := e.Timestamp.UnmarshalJSON([]byte(fmt.Sprintf("\"%s\"", x))); err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("Error in type conversion of field 'ts'.")
	}
	if x, ok := data["to"].(string); ok {
		e.An = x
	} else {
		return nil, errors.New("Error in type conversion of field 'to'.")
	}
	if x, ok := data["from"].(string); ok {
		e.Von = x
	} else {
		return nil, errors.New("Error in type conversion of field 'from'.")
	}
	if x, ok := data["msg"].(string); ok {
		e.Inhalt = x
	} else {
		return nil, errors.New("Error in type conversion of field 'msg'.")
	}
	if x, ok := data["usr"].(string); ok {
		e.Bearbeiter = x
	} else {
		return nil, errors.New("Error in type conversion of field 'usr'.")
	}
	return e, nil
}

type Einheit struct {
	Id         int        `json:"id"`
	From       *time.Time `json:"from"`
	To         *time.Time `json:"to"`
	Feuerwehr  string     `json:"fw"`
	Fahrzeug   string     `json:"fzg"`
	Mitglieder int        `json:"ppl"`
	AtsGeraete int        `json:"atsg"`
	AtsTraeger int        `json:"atst"`
}

func NewEinheit(from, to *time.Time, feuerwehr, fahrzeug string, mitglieder, atsgeraete, atstraeger int) *Einheit {
	return &Einheit{
		From:       from,
		To:         to,
		Feuerwehr:  feuerwehr,
		Fahrzeug:   fahrzeug,
		Mitglieder: mitglieder,
		AtsGeraete: atsgeraete,
		AtsTraeger: atstraeger,
	}
}

func NewEinheitFromMap(data map[string]interface{}) (*Einheit, error) {
	e := new(Einheit)
	// id is allowed to be absent for new element
	if d, present := data["id"]; present {
		if x, ok := d.(float64); ok {
			e.Id = int(x)
		} else {
			return nil, errors.New("Error in type conversion of field 'id'.")
		}
	}
	if x, ok := data["from"].(string); ok {
		e.From = new(time.Time)
		if err := e.From.UnmarshalJSON([]byte(fmt.Sprintf("\"%s\"", x))); err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("Error in type conversion of field 'from'.")
	}
	if x, ok := data["to"].(string); ok {
		e.To = new(time.Time)
		if err := e.To.UnmarshalJSON([]byte(fmt.Sprintf("\"%s\"", x))); err != nil {
			return nil, err
		}
	} else {
		return nil, errors.New("Error in type conversion of field 'to'.")
	}
	if x, ok := data["fw"].(string); ok {
		e.Feuerwehr = x
	} else {
		return nil, errors.New("Error in type conversion of field 'fw'.")
	}
	if x, ok := data["fzg"].(string); ok {
		e.Fahrzeug = x
	} else {
		return nil, errors.New("Error in type conversion of field 'fzg'.")
	}
	if x, ok := data["ppl"].(float64); ok {
		e.Mitglieder = int(x)
	} else {
		return nil, errors.New("Error in type conversion of field 'ppl'.")
	}
	if x, ok := data["atsg"].(float64); ok {
		e.AtsGeraete = int(x)
	} else {
		return nil, errors.New("Error in type conversion of field 'atsg'.")
	}
	if x, ok := data["atst"].(float64); ok {
		e.AtsTraeger = int(x)
	} else {
		return nil, errors.New("Error in type conversion of field 'atst'.")
	}
	return e, nil
}
