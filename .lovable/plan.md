

# Unidades nao aparecem no dropdown

## Problema

A tabela `units` esta **vazia** no banco de dados. Os dados de seed (`Remoto`, `Sao Paulo - Sede`) do arquivo `migration-dump/02-units.sql` nunca foram executados no banco. Por isso o dropdown nao mostra nenhuma opcao.

O codigo do hook `useUnits` e do componente estao corretos -- o problema e apenas falta de dados.

## Solucao

Executar uma migracao SQL para inserir as unidades vinculadas a organizacao "AXholding" (`23d91189-f511-46a0-94e3-2c0e368e43a6`):

```sql
INSERT INTO public.units (name, city, state, country, is_active, organization_id) VALUES
  ('Remoto', 'N/A', 'N/A', 'BR', true, '23d91189-f511-46a0-94e3-2c0e368e43a6'),
  ('São Paulo - Sede', 'São Paulo', 'SP', 'BR', true, '23d91189-f511-46a0-94e3-2c0e368e43a6');
```

## Complemento

Tambem seria util adicionar uma pagina ou secao em **Configuracoes da Empresa** (`/company-settings`) para gerenciar unidades (CRUD), para que no futuro o usuario possa adicionar/editar unidades sem precisar de migracao.

## Arquivos impactados

- **Migracao SQL**: Inserir as 2 unidades
- Nenhuma alteracao de codigo necessaria (o dropdown ja funciona, so faltavam dados)

