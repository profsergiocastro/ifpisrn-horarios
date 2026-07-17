# Roteiro operacional para publicar horários do IFPI SRN

Copie todo este texto para a outra IA e substitua os campos entre `<...>` antes de executar.

---

Você é responsável por atualizar e publicar o site de horários do **IFPI - Campus São Raimundo Nonato** a partir de um CSV exportado pelo FET Timetables.

## Contexto fixo

- Projeto local: `C:\Users\sergi\Desktop\MEGA Note\PYTHON\ifpisrn-horarios`
- Repositório remoto: `https://github.com/profsergiocastro/ifpisrn-horarios.git`
- Site publicado: `https://profsergiocastro.github.io/ifpisrn-horarios/`
- Branch de publicação: `main`
- Deploy: GitHub Pages automático após push em `main`.
- O projeto usa Node.js, npm, Docusaurus e Git.
- O CSV de entrada será: `<CAMINHO_ABSOLUTO_DO_CSV>`
- A operação será: `<NOVA_VERSAO_RELEVANTE|ATUALIZACAO_PONTUAL>`
- Para nova versão relevante, nome: `<VERSAO_NOVA>`, início: `<AAAA-MM-DD>`.
- Se o solicitante pedir estabilidade após testar, marque a versão conforme a etapa 10. Não marque como estável sem pedido explícito.

## Regras obrigatórias

1. Trabalhe no repositório indicado e não crie um repositório novo.
2. Nunca apague, edite, faça commit ou adicione arquivos não relacionados que já estejam no `git status`.
3. Não use `git add -A` nem `git add .` quando houver arquivos pessoais ou temporários. Adicione apenas caminhos conhecidos.
4. O CSV deve conter as colunas `Day`, `Hour`, `Students Sets`, `Subject`, `Teachers` e `Room`. Interrompa e informe o problema se alguma faltar.
5. `docs/professor`, `docs/turma` e `docs/sala` são conteúdos gerados pelo CSV e podem ser substituídos pelo gerador.
6. Nunca remova nem gere por CSV `docs/campus`, `docs/cursos`, `attachments`, `static`, configurações de busca ou componentes visuais. Esses conteúdos são independentes do horário e devem permanecer iguais em todas as versões.
7. Para uma versão relevante, **primeiro** crie o snapshot da versão atual e **só depois** gere o CSV novo. Inverter a ordem destrói a fidelidade do histórico.
8. Para atualização pontual, não crie snapshot e não altere `src/data/siteVersions.json`: apenas regenere os horários atuais.
9. A versão atual precisa ficar em `docs/`; versões antigas ficam em `versioned_docs/`. Links e busca padrão devem levar para a versão atual.
10. Não faça força no push de `main`. Só use força para atualizar o branch `stable` após autorização explícita.

## Etapa 1 - Preparação e auditoria

No PowerShell, execute:

```powershell
Set-Location 'C:\Users\sergi\Desktop\MEGA Note\PYTHON\ifpisrn-horarios'
git switch main
git pull --ff-only origin main
npm ci
git status --short
git log --oneline -5
Get-Content src\data\siteVersions.json
```

Informe os arquivos já modificados ou não rastreados e preserve-os. Confirme que o CSV existe:

```powershell
Test-Path '<CAMINHO_ABSOLUTO_DO_CSV>'
Get-Content '<CAMINHO_ABSOLUTO_DO_CSV>' -TotalCount 2
```

Valide que o cabeçalho contém exatamente as colunas exigidas. O campo `Hour` normalmente usa o formato `7h30 - 8h00`; o gerador normaliza os horários. Não altere o CSV original.

## Etapa 2 - Escolher o fluxo correto

### Fluxo A: nova versão relevante

Use quando a grade deve entrar no histórico, como uma troca de semestre. Exemplo: fechar `2026.1.v3` e abrir `2026.2.1` em `2026-08-06`.

```powershell
npm run bump:timetable:version -- --new <VERSAO_NOVA> --start <AAAA-MM-DD>
```

Esse comando chama `scripts/bump-timetable-version.mjs`. Ele cria a cópia histórica da versão atual, atualiza `versions.json` e `src/data/siteVersions.json`, e calcula o fim da versão anterior como o dia anterior ao início novo. Confira a saída e o arquivo:

```powershell
Get-Content src\data\siteVersions.json
Get-ChildItem versioned_docs -Directory | Select-Object Name
Get-ChildItem versioned_sidebars -File | Select-Object Name
```

O seletor no topo agrupa versões pelo prefixo `AAAA.S`. Assim, nomes como `2026.2.1` aparecem dentro de `2026.2`, acima de `2026.1`. Não edite o agrupamento manualmente sem necessidade.

### Fluxo B: atualização pontual da versão atual

Use quando o solicitante disser que são correções menores e não quer novo histórico. **Não execute** `bump:timetable:version`. Confirme que `siteVersions.json` permanece inalterado após a geração.

## Etapa 3 - Gerar horários do CSV

Execute em ambos os fluxos, sempre depois do snapshot no fluxo A:

```powershell
npm run generate:fet:csv -- '<CAMINHO_ABSOLUTO_DO_CSV>'
```

O script `scripts/fet-csv-to-mdx.mjs`:

- Recria `docs/professor`, `docs/turma` e `docs/sala`.
- Gera um MDX para cada professor, turma e sala com aulas.
- Ignora a sala `Indefinido` no menu e nas páginas de sala.
- Separa turmas pelo texto antes de ` - ` e cria o menu de curso.
- Une blocos consecutivos de 30 minutos quando a disciplina, professores, turma e sala são iguais.
- Aceita múltiplos professores/turmas separados por `+`.

Após a geração, confira as quantidades e a estrutura:

```powershell
Get-ChildItem docs\professor -Filter *.mdx | Measure-Object
Get-ChildItem docs\turma -Directory | Select-Object Name
Get-ChildItem docs\sala -Filter *.mdx | Measure-Object
git status --short
git diff --stat
```

Se um curso novo ou uma nova grafia aparecer em ordem errada no menu Turma, ajuste apenas o mapa `COURSE_POSITIONS` em `scripts/fet-csv-to-mdx.mjs`, incluindo a forma normalizada do novo nome. Não faça mudanças não solicitadas na interface.

## Etapa 4 - Validação técnica e visual

Rode primeiro a verificação de tipos e uma build em pasta temporária:

```powershell
npm run typecheck
npm run docusaurus -- build --out-dir build-validation
```

Se o Windows bloquear a pasta padrão `build` com erro `EBUSY`, continue usando `--out-dir build-validation`. Não faça commit dessa pasta.

Se possível, faça teste visual:

```powershell
npm run docusaurus -- serve --dir build-validation
```

Teste pelo menos:

1. Página inicial e o menu Versão.
2. Uma turma de cada curso existente.
3. Um professor e uma sala.
4. Blocos de aula consecutivos, que devem ficar unidos.
5. Busca, que deve levar à versão atual.
6. Uma versão antiga no seletor, confirmando que mantém campus/cursos e mostra o horário antigo.

Interrompa o servidor ao terminar. Verifique novamente que `docs/campus` e `docs/cursos` não foram removidos.

## Etapa 5 - Commit e publicação

Revise antes de adicionar. Para uma nova versão relevante, os caminhos típicos são:

```powershell
git add docs/professor docs/turma docs/sala
git add versioned_docs versioned_sidebars versions.json src/data/siteVersions.json
git add scripts/fet-csv-to-mdx.mjs
```

Para atualização pontual, normalmente basta:

```powershell
git add docs/professor docs/turma docs/sala
```

Só inclua o gerador se ele realmente foi ajustado. Depois:

```powershell
git diff --cached --check
git diff --cached --stat
git commit -m 'Publish <VERSAO_NOVA> timetable'
git push origin main
```

Monitore a publicação até o fim:

```powershell
gh run list -R profsergiocastro/ifpisrn-horarios -w 'Deploy to GitHub Pages' -L 1
gh run watch <ID_DA_EXECUCAO> -R profsergiocastro/ifpisrn-horarios --interval 10 --exit-status
```

Só declare sucesso se a execução `Deploy to GitHub Pages` concluir sem falhas. Depois, abra `https://profsergiocastro.github.io/ifpisrn-horarios/` e confirme a versão atual no site.

## Etapa 6 - Marcar como estável (somente se autorizado)

Depois de a publicação ser testada e aprovada, use uma tag nova baseada na data:

```powershell
git switch main
git pull --ff-only origin main
git branch -f stable main
git tag -a stable-<AAAA-MM-DD> -m 'Stable release <AAAA-MM-DD>' main
git push --force-with-lease origin stable
git push origin stable-<AAAA-MM-DD>
```

Confirme:

```powershell
git log -1 --oneline refs/heads/stable
git tag --list 'stable*'
```

## Entrega obrigatória

Ao final, informe em português, de maneira objetiva:

- versão atual e data de início;
- se uma versão antiga foi preservada, com data final;
- quantidade de professores, turmas e salas geradas;
- commit enviado e URL do site;
- resultado do deploy do GitHub Pages;
- se foi marcada como estável ou se aguarda teste;
- quaisquer arquivos não relacionados que tenham sido preservados sem commit.

Não invente resultados: consulte o terminal e o GitHub Actions antes de responder.
