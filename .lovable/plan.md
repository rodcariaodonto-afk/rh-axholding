

# Gap Analysis: Documento CRM v2 vs Estado Atual

Comparei as 19 paginas do documento com o que ja foi implementado nas 3 fases anteriores. Segue o que **ainda falta ou esta incompleto**.

---

## JA IMPLEMENTADO (OK)

- Menu lateral reorganizado nos 9 blocos
- Tipo de Perfil, Salarios, Documentos da Empresa
- Dados Trabalhistas (3 abas), Absenteismo (4 abas)
- Gestao de Ferias expandida (Saldo + Periodo Aquisitivo)
- Rescisao Contratual (tabela + calculo)
- PDI com aba Competencias (gap analise)
- Matriz SWOT (CRUD 4 quadrantes)
- Programacao de Pagamento (CRUD + status)
- Renomeacoes e movimentacoes de menu

---

## O QUE AINDA FALTA

### 1. Gestao de Ferias -- 2 abas ausentes
- **Programacao de Ferias**: Calendario visual com ferias agendadas, filtro por departamento/periodo, deteccao de conflitos (muitos ausentes ao mesmo tempo)
- **Conclusao de Ferias**: Registrar retorno, confirmar conclusao, gerar comprovante/recibo

### 2. PDI -- 3 secoes ausentes
- **Metas e OKRs dentro do PDI**: Objetivo + 3 Resultados-Chave, meta quantitativa, progresso %, status
- **Plano de Acao**: Acao, responsavel, data inicio/fim, status
- **Historico de versoes**: Mostrar versoes anteriores do PDI com quem alterou e quando
- **Botao "Enviar para Aprovacao"**: Workflow de aprovacao do PDI

### 3. Documentos da Empresa -- campos faltantes
- **Visibilidade** (Publico, Restrito, Privado)
- **Perfis com Acesso** (multi-select de roles com permissao)
- **Data Vigencia** e **Data Termino**
- **Acao "Ver Historico de Versoes"**

### 4. Organograma -- melhorias
- Filtro por departamento
- Exportar como imagem

### 5. Politicas de Trabalho -- melhoria
- Visualizacao de colaboradores vinculados por politica

### 6. Matriz SWOT -- funcionalidades faltantes
- Exportar analise em PDF
- Resumo executivo automatico
- Grafico de distribuicao por impacto (Alto/Medio/Baixo)

### 7. Programacao de Pagamento -- visualizacao
- Calendario visual com pagamentos agendados (hoje e apenas lista/tabela)

### 8. Relatorio de Ponto Consolidado
- Relatorio unificado integrando: horas, faltas, atrasos, atestados, licencas INSS, banco de horas
- Tabela consolidada com todas as colunas do documento
- Exportar CSV e PDF
- Filtros: periodo, departamento, colaborador, status

### 9. Salarios -- acoes faltantes
- **Duplicar** faixa salarial (criar nova baseada em existente)
- **Visualizar Historico** de alteracoes

### 10. Dados Trabalhistas -- funcionalidades faltantes
- **Historico de alteracoes** para cada aba (escalas, salarios, beneficios)
- **Integracao com Folha de Pagamento**
- Detalhamento completo de beneficios: VT (sim/nao + valor), VR, Plano de Saude (tipo + cobertura), Odontologico

---

## Plano de Implementacao

### Lote A -- Ferias + PDI (maior impacto)
1. Adicionar abas "Programacao de Ferias" (calendario) e "Conclusao de Ferias" no TimeOff
2. Adicionar abas "Metas/OKRs" e "Plano de Acao" no PdiDialog
3. Adicionar historico de versoes e botao "Enviar para Aprovacao" no PDI

### Lote B -- Documentos + SWOT + Pagamentos
4. Adicionar campos de visibilidade, perfis de acesso, vigencia nos Documentos da Empresa
5. Adicionar exportacao PDF, resumo executivo e grafico no SWOT
6. Adicionar visualizacao calendario no Programacao de Pagamento

### Lote C -- Relatorios + Melhorias menores
7. Criar relatorio de ponto consolidado (integrar dados de absenteismo + ponto + banco de horas)
8. Adicionar duplicar/historico em Salarios
9. Adicionar historico de alteracoes em Dados Trabalhistas
10. Melhorias no Organograma (filtro + export) e Politicas (colaboradores por politica)

### Estimativa
- ~12 componentes novos/alterados
- ~3 hooks novos
- Possivelmente 1-2 migracoes para campos adicionais (visibilidade em company_documents, etc.)
- Nenhuma tabela nova necessaria

