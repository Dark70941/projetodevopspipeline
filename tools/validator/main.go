package main

import (
	"encoding/json"
	"fmt"
	"os"
)

type AppConfig struct {
	App struct {
		Nome         string `json:"nome"`
		Versao       string `json:"versao"`
		MaxHistorico int    `json:"max_historico"`
	} `json:"app"`
	Frases []struct {
		Texto     string `json:"texto"`
		Categoria string `json:"categoria"`
	} `json:"frases"`
}

func validarConfig(config *AppConfig) error {
	if config.App.Nome == "" {
		return fmt.Errorf("campo app.nome é obrigatório")
	}

	if config.App.Versao == "" {
		return fmt.Errorf("campo app.versao é obrigatório")
	}

	if config.App.MaxHistorico < 1 {
		return fmt.Errorf("app.max_historico deve ser maior que zero")
	}

	if len(config.Frases) == 0 {
		return fmt.Errorf("lista de frases não pode estar vazia")
	}

	for i, frase := range config.Frases {
		if frase.Texto == "" {
			return fmt.Errorf("frase %d: texto é obrigatório", i+1)
		}
		if frase.Categoria == "" {
			return fmt.Errorf("frase %d: categoria é obrigatória", i+1)
		}
	}

	return nil
}

func main() {
	caminho := "config/app.json"
	if len(os.Args) > 1 {
		caminho = os.Args[1]
	}

	conteudo, err := os.ReadFile(caminho)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Validação falhou: %v\n", err)
		os.Exit(1)
	}

	var config AppConfig
	if err := json.Unmarshal(conteudo, &config); err != nil {
		fmt.Fprintf(os.Stderr, "Validação falhou: %v\n", err)
		os.Exit(1)
	}

	if err := validarConfig(&config); err != nil {
		fmt.Fprintf(os.Stderr, "Validação falhou: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Configuração válida: %s v%s (%d frases)\n",
		config.App.Nome, config.App.Versao, len(config.Frases))
}
