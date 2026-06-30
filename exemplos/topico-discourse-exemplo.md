# Form Template do ParticiPEN — referência do parser

A demanda é um **tópico** do fórum criado pelo **Form Template** do Discourse
(em produção no ParticiPEN). O corpo do primeiro post vem em **cabeçalhos H3**
(`### Pergunta`) com o texto literal de cada pergunta, e a resposta na(s)
linha(s) seguinte(s). As respostas de múltipla escolha vêm em **linguagem
natural** — o parser da calculadora traduz para os valores canônicos do modelo.

Tópicos antigos ou fora deste formato entram pelo preenchimento manual.

## Mapeamento dos cabeçalhos

| Cabeçalho no corpo do tópico | Campo na calculadora |
|---|---|
| `### Título da demanda` | Título (texto livre) |
| `### O que você está trazendo?` | Natureza (traduzida) |
| `### O que você gostaria que mudasse?` | Trilha (traduzida) |
| `### Descreva a demanda apresentada` | Descrição (texto livre) |
| `### Quem se beneficia da sua demanda?` | Camada proposta (traduzida) |
| `### Evidências` | Evidência (texto livre) |
| `### Anexos` | não importado — "ver anexos no tópico original" |

> O parser captura tudo entre um cabeçalho e o próximo. Correspondência
> *case-insensitive* e tolerante a espaços; o texto da pergunta tem que
> aparecer integralmente. Dependências **não** é importado (a GPSEI coleta na
> curadoria).

## Tradução das respostas (linguagem natural → valor canônico)

**Natureza**

| Resposta no corpo | Valor |
|---|---|
| Um problema a resolver | `problema` |
| Uma prática em uso, a difundir | `pratica` |

**Trilha**

| Resposta no corpo | Valor |
|---|---|
| Quero melhorar algo que já existe, mas pode ficar melhor | `Melhoria` |
| Quero acrescentar uma funcionalidade que ainda não existe no SEI | `Evolutiva` |
| Quero mudar uma regra, um padrão ou uma orientação de como o SEI deve ser usado | `Normativa` |

**Camada proposta** (sugestão pré-preenchida; a GPSEI pode redirecionar na curadoria)

| Resposta no corpo | Valor |
|---|---|
| Só o meu órgão, nas rotinas de trabalho daqui | `Uso local` |
| Alguns poucos órgãos que vivem contexto parecido com o meu | `Grupo` |
| Muitos órgãos que usam o SEI | `Vitrine` |
| Praticamente todos os órgãos da Administração Pública Federal | `Módulo PEN` |
| Isso deveria ser parte do SEI | `Core SEI` |

Se uma resposta não bate com nenhuma opção, o campo fica em branco com aviso
"Resposta não reconhecida — preencha manualmente".

## Exemplo de corpo de tópico

```markdown
### Título da demanda
Sincronização automática da hierarquia de unidades com SIORG

### O que você está trazendo?
Um problema a resolver

### O que você gostaria que mudasse?
Quero acrescentar uma funcionalidade que ainda não existe no SEI

### Descreva a demanda apresentada
A manutenção manual da hierarquia gera divergências recorrentes...

### Quem se beneficia da sua demanda?
Praticamente todos os órgãos da Administração Pública Federal

### Evidências
Atualmente, há 14 chamados/mês por divergência de hierarquia.

### Anexos
(arquivos no tópico original)
```

Ao carregar a URL desse tópico, a calculadora popula o Passo 1 com:

- **Título:** Sincronização automática da hierarquia de unidades com SIORG
- **Natureza:** Problema a resolver (`problema`)
- **Trilha:** Evolutiva
- **Descrição:** A manutenção manual da hierarquia gera divergências…
- **Camada proposta:** Módulo PEN (de "Praticamente todos os órgãos da APF")
- **Evidência:** Atualmente, há 14 chamados/mês por divergência de hierarquia.
- **Anexos:** aviso "ver no tópico original" (não importados)

A pontuação dos cinco critérios continua sendo da GPSEI. A memória resultante
está em [`caso-4-via-url.json`](caso-4-via-url.json).
